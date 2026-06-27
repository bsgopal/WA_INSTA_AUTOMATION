// renic-automation-backend/services/aiChatHandler.js
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ResponseRule = require('../models/ResponseRule');
const aiMessageAnalyzer = require('./aiMessageAnalyzer');
const leadScoringService = require('./leadScoringService');
const ownerNotificationService = require('./ownerNotificationService');
const WhatsAppService = require('./WhatsAppService');
const VariableInterpolationService = require('./VariableInterpolationService');

class AIChatHandler {
  isPlaceholderName(name, phoneNumber) {
    const normalizedName = String(name || '').trim().toLowerCase();
    const normalizedPhone = String(phoneNumber || '').replace(/\D/g, '');

    return (
      !normalizedName ||
      normalizedName === 'customer' ||
      normalizedName === normalizedPhone ||
      normalizedName === `+${normalizedPhone}`
    );
  }

  cleanReplyValue(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  buildRuleResponsePayload(rule) {
    const responseImages = [];
    const buttons = [];
    const listSections = [];
    const textParts = [];
    const messageBlocks = Array.isArray(rule?.messageBlocks) ? rule.messageBlocks : [];

    const addTextPart = value => {
      const cleanValue = this.cleanReplyValue(value);
      if (cleanValue) {
        textParts.push(cleanValue);
      }
    };

    for (const block of messageBlocks) {
      const blockType = String(block?.type || '').toUpperCase();
      const config = block?.config || {};

      if (blockType === 'TEXT') {
        addTextPart(config.text || config.content || config.answer || config.message);
        continue;
      }

      if (blockType === 'CARD') {
        addTextPart(config.title);
        addTextPart(config.description);

        if (config.imageUrl) {
          responseImages.push(config.imageUrl);
        }

        if (Array.isArray(config.buttons) && config.buttons.length > 0) {
          for (const button of config.buttons) {
            const label = this.cleanReplyValue(button?.label);
            const value = this.cleanReplyValue(button?.value || button?.actionValue || button?.id || label);
            if (label && value) {
              buttons.push({
                label,
                value,
                type: button?.type || button?.actionType || 'QUICK_REPLY',
                actionType: button?.actionType || 'QUICK_REPLY',
                quickReplyId: button?.quickReplyId || '',
                templateId: button?.templateId || '',
                ruleId: button?.ruleId || '',
                workflowId: button?.workflowId || ''
              });
            }
          }
        }

        continue;
      }

      if (blockType === 'BUTTONS') {
        if (Array.isArray(config.buttons) && config.buttons.length > 0) {
          for (const button of config.buttons) {
            const label = this.cleanReplyValue(button?.label);
            const value = this.cleanReplyValue(button?.value || button?.actionValue || button?.id || label);
            if (label && value) {
              buttons.push({
                label,
                value,
                type: button?.type || button?.actionType || 'QUICK_REPLY',
                actionType: button?.actionType || 'QUICK_REPLY',
                quickReplyId: button?.quickReplyId || '',
                templateId: button?.templateId || '',
                ruleId: button?.ruleId || '',
                workflowId: button?.workflowId || ''
              });
            }
          }
        }
        continue;
      }

      if (blockType === 'LIST') {
        const listTitle = this.cleanReplyValue(config.title || 'Options');
        const buttonText = this.cleanReplyValue(config.buttonText || 'Select');
        const sections = [];

        for (const section of (config.sections || [])) {
          const sectionTitle = this.cleanReplyValue(section?.title);
          const rows = [];

          for (const row of (section?.rows || [])) {
            const rowTitle = this.cleanReplyValue(row?.title || row?.label);
            const rowDescription = this.cleanReplyValue(row?.description);
            const rowId = this.cleanReplyValue(row?.rowId || row?.id || row?.value || rowTitle);
            const rowActionType = String(row?.actionType || 'CUSTOM').toUpperCase();
            const rowActionValue = this.cleanReplyValue(row?.actionValue || row?.quickReplyId || row?.templateId || row?.url || rowId);

            if (!rowTitle || !rowId) {
              continue;
            }

            rows.push({
              id: rowId,
              title: rowTitle,
              description: rowDescription,
              actionType: rowActionType,
              actionValue: rowActionValue,
              actionUrl: row?.actionUrl || '',
              image: row?.image || row?.imageUrl || '',
              quickReplyId: row?.quickReplyId || '',
              templateId: row?.templateId || '',
              ruleId: row?.ruleId || '',
              workflowId: row?.workflowId || ''
            });
          }

          if (rows.length > 0) {
            sections.push({
              title: sectionTitle || 'Options',
              rows
            });
          }
        }

        if (sections.length > 0) {
          listSections.push({
            title: listTitle || 'Options',
            buttonText,
            sections
          });
        }

        continue;
      }

      if (blockType === 'RELATED_QUESTIONS') {
        const questions = Array.isArray(config.questions) ? config.questions : [];
        if (questions.length > 0) {
          addTextPart('Related questions:');
          for (const question of questions) {
            addTextPart(`- ${question}`);
          }
        }
      }
    }

    let responseText = [...new Set(textParts)].join('\n\n').trim();

    if (!responseText) {
      if (buttons.length > 0) {
        responseText = 'Please choose one of the options below.';
      } else if (listSections.length > 0) {
        responseText = 'Please select one of the options below.';
      } else {
        responseText = this.cleanReplyValue(rule?.name || rule?.triggerValue || 'How can I help you today?');
      }
    }

    return {
      responseText,
      responseImages: responseImages.length > 0 ? responseImages : null,
      buttons: buttons.length > 0 ? buttons : null,
      list: listSections.length > 0
        ? {
            title: listSections[0].title,
            buttonText: listSections[0].buttonText,
            sections: listSections.flatMap(item => item.sections)
          }
        : null
    };
  }

  /**
   * Find action for interactive button selection or list row selection
   */
  async findActionForInteractiveSelection(selectedId, messageText, userId, customer) {
    try {
      const Message = require('../models/Message');
      const QuickReply = require('../models/QuickReply');
      const Template = require('../models/Template');
      const ResponseRule = require('../models/ResponseRule');
      const workflowEngine = require('./workflowEngine');

      // Find last outbound message containing list/buttons for this customer
      const lastOutbound = await Message.findOne({
        customerId: customer._id,
        userId,
        $or: [
          { 'widgetData.list': { $ne: null } },
          { 'widgetData.buttons': { $ne: null } }
        ]
      }).sort({ createdAt: -1 });

      if (!lastOutbound || !lastOutbound.widgetData) {
        return null;
      }

      const widget = lastOutbound.widgetData;
      let matchedItem = null;

      if (selectedId) {
        // Match by ID
        if (widget.list && widget.list.sections) {
          for (const section of widget.list.sections) {
            const foundRow = section.rows?.find(r => r.id === selectedId || r.rowId === selectedId);
            if (foundRow) {
              matchedItem = foundRow;
              break;
            }
          }
        }
        if (!matchedItem && widget.buttons) {
          matchedItem = widget.buttons.find(b => b.value === selectedId || b.id === selectedId);
        }
      }

      if (!matchedItem && messageText) {
        const cleanMsg = messageText.trim().toLowerCase();
        
        // 1. Check if it's a number match (e.g. "1")
        const matchNum = parseInt(cleanMsg, 10);
        if (!isNaN(matchNum) && matchNum > 0) {
          if (widget.list && widget.list.sections) {
            const allRows = widget.list.sections.flatMap(s => s.rows || []);
            if (matchNum <= allRows.length) {
              matchedItem = allRows[matchNum - 1];
            }
          }
          if (!matchedItem && widget.buttons) {
            if (matchNum <= widget.buttons.length) {
              matchedItem = widget.buttons[matchNum - 1];
            }
          }
        }

        // 2. Check if it's a text match
        if (!matchedItem) {
          if (widget.list && widget.list.sections) {
            for (const section of widget.list.sections) {
              const foundRow = section.rows?.find(r => r.title?.toLowerCase().trim() === cleanMsg);
              if (foundRow) {
                matchedItem = foundRow;
                break;
              }
            }
          }
          if (!matchedItem && widget.buttons) {
            matchedItem = widget.buttons.find(b => b.label?.toLowerCase().trim() === cleanMsg);
          }
        }
      }

      if (!matchedItem) {
        return null;
      }

      console.log(`🎯 Matched list/button item:`, matchedItem);

      // Trigger RESPONSE_RULE_SELECTION workflows if there is a ruleId stored in widgetData
      const sourceRuleId = widget.ruleId;
      if (sourceRuleId) {
        const itemId = matchedItem.id || matchedItem.rowId || matchedItem.value;
        const itemTitle = matchedItem.title || matchedItem.label;
        const itemDesc = matchedItem.description || '';
        
        // Check if there is an active workflow for this response rule trigger
        const Workflow = require('../models/Workflow');
        const activeWorkflowsCount = await Workflow.countDocuments({
          status: 'ACTIVE',
          'trigger.type': 'RESPONSE_RULE_SELECTION',
          'trigger.responseRuleId': sourceRuleId
        });

        if (activeWorkflowsCount > 0) {
          console.log(`⚡ Triggering active RESPONSE_RULE_SELECTION workflows for rule: ${sourceRuleId}, item: ${itemId}`);
          
          await workflowEngine.triggerResponseRuleWorkflows(sourceRuleId, {
            customerId: customer._id,
            selectedItemId: itemId,
            selectedItemTitle: itemTitle,
            selectedItemDescription: itemDesc,
            responseRuleId: sourceRuleId
          });

          return {
            success: true,
            bypassResponse: true,
            ruleName: 'Workflow Triggered'
          };
        }
      }

      const actionType = String(matchedItem.actionType || '').toUpperCase();

      if (actionType === 'QUICK_REPLY' && (matchedItem.quickReplyId || matchedItem.linkedQuickReplyId)) {
        const qrId = matchedItem.quickReplyId || matchedItem.linkedQuickReplyId;
        const qr = await QuickReply.findById(qrId);
        if (qr && qr.content) {
          return {
            success: true,
            source: 'INTERACTIVE_ACTION',
            responseText: qr.content,
            actionType: 'QUICK_REPLY'
          };
        }
      }

      if (actionType === 'TEMPLATE' && matchedItem.templateId) {
        const tpl = await Template.findById(matchedItem.templateId);
        if (tpl && tpl.content) {
          return {
            success: true,
            source: 'INTERACTIVE_ACTION',
            responseText: tpl.content,
            actionType: 'TEMPLATE'
          };
        }
      }

      if (actionType === 'RESPONSE_RULE' && matchedItem.ruleId) {
        const linkedRule = await ResponseRule.findById(matchedItem.ruleId);
        if (linkedRule) {
          const payload = this.buildRuleResponsePayload(linkedRule);
          return {
            success: true,
            source: 'INTERACTIVE_ACTION',
            responseText: payload.responseText,
            responseImages: payload.responseImages,
            buttons: payload.buttons,
            list: payload.list,
            actionType: 'RESPONSE_RULE',
            ruleName: linkedRule.name,
            ruleId: linkedRule._id
          };
        }
      }

      if (actionType === 'WORKFLOW' && matchedItem.workflowId) {
        console.log(`⚡ Triggering workflow directly linked to interactive selection: ${matchedItem.workflowId}`);
        workflowEngine.executeWorkflow(matchedItem.workflowId, customer._id, {
          selectedItemId: matchedItem.id || matchedItem.rowId || matchedItem.value,
          selectedItemTitle: matchedItem.title || matchedItem.label,
          selectedItemDescription: matchedItem.description || ''
        }).catch(err => console.error('Workflow Execution Error in direct interactive reply:', err.message));

        return {
          success: true,
          source: 'INTERACTIVE_ACTION',
          responseText: `Executing request for: ${matchedItem.title || matchedItem.label}...`,
          actionType: 'WORKFLOW'
        };
      }

      if (actionType === 'URL' && matchedItem.actionValue) {
        return {
          success: true,
          source: 'INTERACTIVE_ACTION',
          responseText: `Here is the link: ${matchedItem.actionValue}`,
          actionType: 'URL'
        };
      }

      if (actionType === 'CATALOG' && matchedItem.actionValue) {
        return {
          success: true,
          source: 'INTERACTIVE_ACTION',
          responseText: `Here is our catalog link: ${matchedItem.actionValue}`,
          actionType: 'CATALOG'
        };
      }

      return null;
    } catch (error) {
      console.error('Error in findActionForInteractiveSelection:', error.message);
      return null;
    }
  }

  /**
   * Check if a message matches any active Response Rules
   * Priority: EXACT_MATCH > KEYWORD > INTENT
   */
  async checkResponseRules(messageText, analysis, userId) {
    try {
      console.log(`🔍 Checking Response Rules for message: "${messageText.substring(0, 50)}..."`);
      
      // Fetch all active rules for this user
      const activeRules = await ResponseRule.find({
        userId,
        isActive: true
      }).sort({ triggerType: 1 }); // EXACT_MATCH comes first alphabetically
      
      if (!activeRules || activeRules.length === 0) {
        console.log('  ❌ No active Response Rules found');
        return null;
      }
      
      console.log(`  Found ${activeRules.length} active rules`);
      
      const messageTextLower = messageText.toLowerCase().trim();
      let matchedRule = null;
      let matchType = null;
      
      // 1. Try EXACT_MATCH first (highest priority)
      for (const rule of activeRules.filter(r => r.triggerType === 'EXACT_MATCH')) {
        const triggerLower = rule.triggerValue.toLowerCase().trim();
        if (messageTextLower === triggerLower) {
          matchedRule = rule;
          matchType = 'EXACT_MATCH';
          console.log(`  ✅ EXACT_MATCH rule found: "${rule.name}"`);
          break;
        }
      }
      
      // 2. Try KEYWORD matching if no exact match (medium priority)
      if (!matchedRule) {
        for (const rule of activeRules.filter(r => r.triggerType === 'KEYWORD')) {
          const keywords = rule.triggerValue.split(',').map(kw => kw.toLowerCase().trim());
          const messageWords = messageTextLower.split(/\s+/);
          
          // Check if any keyword is in the message
          const hasKeyword = keywords.some(keyword => {
            // Match whole words or partial keywords
            return messageWords.some(word => 
              word.includes(keyword) || keyword.includes(word)
            ) || messageTextLower.includes(keyword);
          });
          
          if (hasKeyword) {
            matchedRule = rule;
            matchType = 'KEYWORD';
            console.log(`  ✅ KEYWORD rule found: "${rule.name}" (keyword match)`);
            break;
          }
        }
      }
      
      // 3. Try INTENT matching if no keyword match (lowest priority)
      if (!matchedRule && analysis && analysis.intent) {
        for (const rule of activeRules.filter(r => r.triggerType === 'INTENT')) {
          const intentLower = rule.triggerValue.toLowerCase().trim();
          const detectedIntentLower = analysis.intent.toLowerCase().trim();
          
          if (intentLower === detectedIntentLower) {
            matchedRule = rule;
            matchType = 'INTENT';
            console.log(`  ✅ INTENT rule found: "${rule.name}" (intent: ${analysis.intent})`);
            break;
          }
        }
      }
      
      if (matchedRule) {
        console.log(`  ✅ Rule matched via ${matchType}: "${matchedRule.name}"`);
        
        // Format messageBlocks into response text
        const responsePayload = this.buildRuleResponsePayload(matchedRule);
        let responseText = responsePayload.responseText || '';
        let responseImages = [...(responsePayload.responseImages || [])];
        const responseButtons = responsePayload.buttons;
        const responseList = responsePayload.list;
        
        if (false && matchedRule.messageBlocks && matchedRule.messageBlocks.length > 0) {
          for (const block of matchedRule.messageBlocks) {
            if (block.type === 'TEXT') {
              responseText += (block.config?.text || '') + '\n';
            } else if (block.type === 'CARD') {
              responseText += `${block.config?.title || ''}\n${block.config?.description || ''}\n`;
              if (block.config?.imageUrl) {
                responseImages.push(block.config.imageUrl);
              }
            } else if (block.type === 'BUTTONS') {
              if (block.config?.buttons) {
                const buttonTexts = block.config.buttons.map((b, idx) => `${idx + 1}. ${b.label}`).join('\n');
                responseText += buttonTexts + '\n';
              }
            } else if (block.type === 'RELATED_QUESTIONS') {
              if (block.config?.questions) {
                responseText += 'Related questions:\n' + block.config.questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n') + '\n';
              }
            }
          }
        }
        
        console.log(`  📝 Response prepared from rule: ${responseText.substring(0, 80)}...`);
        
        return {
          success: true,
          source: 'RESPONSE_RULE',
          ruleName: matchedRule.name,
          ruleId: matchedRule._id,
          matchType: matchType,
          responseText: responseText.trim(),
          responseImages: responseImages.length > 0 ? responseImages : null,
          buttons: responseButtons,
          list: responseList,
          messageBlocks: matchedRule.messageBlocks
        };
      }
      
      console.log('  ❌ No matching Response Rule found, will use AI generation');
      return null;
    } catch (error) {
      console.error('❌ Error checking Response Rules:', error);
      return null; // Fall back to AI on error
    }
  }

  /**
   * Main entry point: Handle incoming customer message
   */
  async handleCustomerMessage(phoneNumber, messageBody, channel, userId, mediaUrl = null, options = {}) {
    try {
      let outboundMessage = null;
      const normalizedMessageBody = typeof messageBody === 'string' ? messageBody.trim() : '';
      
      const displayContent = (options.interactiveReply && options.interactiveReply.text)
        ? options.interactiveReply.text
        : (normalizedMessageBody || (mediaUrl ? '[Image]' : ''));

      const triggerText = (options.interactiveReply && (options.interactiveReply.triggerText || options.interactiveReply.actionValue || options.interactiveReply.id))
        ? (options.interactiveReply.triggerText || options.interactiveReply.actionValue || options.interactiveReply.id)
        : normalizedMessageBody;

      const inboundContent = displayContent;
      const inboundConversationMessageType = mediaUrl ? 'IMAGE' : 'TEXT';

      // Step 1: Find or create customer
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const last10Digits = digitsOnly.slice(-10);
      
      // Construct regex that allows optional non-digits (spaces, dashes, etc.) between numbers, and optional suffix at the end
      const regexPattern = last10Digits.split('').join('[^0-9]*') + '(?:@[a-z.]+)?$';

      let customer = await Customer.findOne({
        userId,
        $or: [
          { whatsappNumber: phoneNumber },
          { whatsappNumber: digitsOnly },
          { phone: phoneNumber },
          { phone: digitsOnly },
          { instagramHandle: phoneNumber },
          { whatsappNumber: { $regex: regexPattern } },
          { phone: { $regex: regexPattern } }
        ]
      });

      if (customer) {
        if (options.whatsappLid || options.pushName) {
          customer.customFields = {
            ...(customer.customFields || {}),
            ...(options.whatsappLid ? { whatsappLid: options.whatsappLid } : {}),
            ...(options.pushName ? { pushName: options.pushName, displayName: options.pushName } : {})
          };

          if (options.pushName && this.isPlaceholderName(customer.firstName, phoneNumber)) {
            const parts = options.pushName.trim().split(/\s+/);
            customer.firstName = parts[0] || customer.firstName;
            customer.lastName = parts.slice(1).join(' ') || customer.lastName;
          }

          await customer.save();
        }
      }

      let initialName = null;
      if (!customer) {
        if (options.pushName) {
          const parts = options.pushName.trim().split(/\s+/);
          initialName = {
            firstName: parts[0] || phoneNumber,
            lastName: parts.slice(1).join(' ') || ''
          };
        } else {
          try {
            const initialAnalysis = await aiMessageAnalyzer.analyzeMessage(inboundContent, [], null, mediaUrl);
            if (initialAnalysis && initialAnalysis.extractedName) {
              initialName = aiMessageAnalyzer.extractExplicitName(inboundContent);
            }
          } catch (e) {
            console.error('Initial name extraction failed:', e.message);
          }
        }
        customer = await this.createNewCustomer(phoneNumber, userId, initialName, { ...options, channel });
      }

      // Step 2: Save inbound message immediately
      const language = aiMessageAnalyzer.detectLanguage(messageBody);
      const inboundMessage = await Message.create({
        userId,
        customerId: customer._id,
        content: inboundContent,
        channel,
        messageType: 'MANUAL',
        language,
        status: 'PENDING',
        mediaUrl,
        mediaType: mediaUrl ? 'image' : null,
        tags: ['incoming', 'customer']
      });

      // Step 3: Find or create conversation immediately
      let conversation = await Conversation.findOne({
        customerId: customer._id,
        userId,
        status: 'ACTIVE'
      });

      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          customerId: customer._id,
          title: `Chat with ${customer.firstName} ${customer.lastName}`.trim(),
          primaryPlatform: channel.toUpperCase(),
          platforms: [{
            type: channel.toUpperCase(),
            platformId: phoneNumber,
            isLinked: true,
            linkedAt: new Date()
          }],
          status: 'ACTIVE',
          messageCount: 1,
          lastMessage: {
            content: inboundContent.substring(0, 100),
            sender: 'CUSTOMER',
            timestamp: new Date(),
            platform: channel
          }
        });
      } else {
        conversation.messageCount += 1;
        conversation.lastMessage = {
          content: inboundContent.substring(0, 100),
          sender: 'CUSTOMER',
          timestamp: new Date(),
          platform: channel
        };
        conversation.lastActivityAt = new Date();
        await conversation.save();
      }

      // Step 4: Sync inbound customer message to ConversationMessage immediately for Unified Inbox
      const ConversationMessage = require('../models/ConversationMessage');
      await ConversationMessage.create({
        conversationId: conversation._id,
        customerId: customer._id,
        content: inboundContent,
        messageType: inboundConversationMessageType,
        media: mediaUrl ? {
          url: mediaUrl,
          type: 'image'
        } : undefined,
        platform: channel.toUpperCase(),
        sender: {
          type: 'CUSTOMER',
          name: `${customer.firstName} ${customer.lastName}`.trim()
        },
        status: 'READ',
        platformMessageId: inboundMessage.externalMessageId
      });

      // Check if conversation auto-reply (autopilot) is disabled
      if (conversation && conversation.autoReplyEnabled === false) {
        return {
          success: true,
          customerId: customer._id,
          inboundMessageId: inboundMessage._id,
          skippedAI: true,
          reason: 'Autopilot disabled for this conversation',
          conversationId: conversation._id,
          processingTime: new Date()
        };
      }

      // Step 5: Load conversation history (last 10 messages)
      const history = await Message.find({
        customerId: customer._id,
        channel
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Step 6: Analyze message with AI
      const analysis = await aiMessageAnalyzer.analyzeMessage(
        triggerText,
        history.reverse(),
        customer,
        mediaUrl
      );

      // Conversational Name Capture: Update name in DB if extracted
      if (analysis.extractedName && analysis.extractedName.firstName) {
        const validatedName = aiMessageAnalyzer.extractExplicitName(inboundContent);
        if (validatedName) {
          customer.firstName = validatedName.firstName;
          if (validatedName.lastName) {
            customer.lastName = validatedName.lastName;
          }
          await customer.save();

          // Update conversation title as well
          conversation.title = `Chat with ${customer.firstName} ${customer.lastName}`.trim();
          await conversation.save();
        }
      }

      // Step 7: Calculate lead score
      const leadScore = leadScoringService.calculateScore(
        analysis,
        customer,
        history.length
      );

      // Force escalation if customer asks for human/admin explicitly or if intent is complaint
      const humanKeywords = ['human', 'agent', 'admin', 'manager', 'support', 'owner', 'talk to', 'speak to', 'call me', 'connect', 'complaint'];
      const msgLower = inboundContent.toLowerCase();
      const hasHumanRequest = humanKeywords.some(kw => msgLower.includes(kw)) || analysis.intent === 'complaint';
      if (hasHumanRequest) {
        leadScore.shouldEscalate = true;
        leadScore.score = Math.max(leadScore.score, 9.5);
      }

      // Step 8: CHECK RESPONSE RULES FIRST before AI generation
      console.log('\n🚀 Step 8: Checking Response Rules...');
      
      const selectedId = options.interactiveReply?.id || null;
      let ruleMatch = await this.findActionForInteractiveSelection(selectedId, triggerText, userId, customer);
      
      if (!ruleMatch) {
        ruleMatch = await this.checkResponseRules(triggerText, analysis, userId);
      }
      
      if (ruleMatch && ruleMatch.bypassResponse) {
        console.log('✅ Workflow was triggered successfully, bypassing default response rule action.');
        return {
          success: true,
          customerId: customer._id,
          inboundMessageId: inboundMessage._id,
          conversationId: conversation._id,
          messageType: 'WORKFLOW_TRIGGERED',
          processingTime: new Date()
        };
      }
      
      let aiResponse;
      
      if (ruleMatch && ruleMatch.success) {
        // Use Response Rule response instead of AI
        console.log(`✅ Using Response Rule: "${ruleMatch.ruleName}"`);
        
        aiResponse = {
          text: ruleMatch.responseText,
          mediaUrl: ruleMatch.responseImages && ruleMatch.responseImages.length > 0 ? ruleMatch.responseImages[0] : null,
          buttons: ruleMatch.buttons || null,
          list: ruleMatch.list || null,
          scrapedProducts: [],
          isCatalogPrompt: false,
          source: 'RESPONSE_RULE',
          ruleName: ruleMatch.ruleName,
          ruleId: ruleMatch.ruleId,
          matchType: ruleMatch.matchType
        };
      } else {
        // Fall back to AI generation
        console.log('✓ No matching rule, proceeding with AI generation...');
        
        // Step 9: Generate AI response (only if no rule matched)
        // Use smart Gemini language detection from analysis if available
        const detectedLang = analysis.language || language;
        if (detectedLang && (!customer.customFields || !customer.customFields.languageSelected)) {
          if (customer.language !== detectedLang) {
            customer.language = detectedLang;
            await customer.save();
          }
        }

        const customerLanguage = (customer.customFields && customer.customFields.languageSelected) ? customer.language : detectedLang;
        aiResponse = await aiMessageAnalyzer.generateResponse(
          analysis,
          customer,
          customerLanguage,
          triggerText,
          mediaUrl
        );
      }

      // Save scraped products to customer profile if they exist in the response
      const scrapedProducts = aiResponse.scrapedProducts || [];
      if (scrapedProducts.length > 0) {
        customer.customFields = {
          ...(customer.customFields || {}),
          lastScrapedProducts: scrapedProducts.slice(0, 3),
          selectedProduct: null
        };
        customer.markModified('customFields');
        await customer.save();
      }

      if (aiResponse?.text) {
        aiResponse.text = await VariableInterpolationService.interpolateVariables(aiResponse.text, userId, {
          customer
        });
      }

      // Helper to send and log a single message to keep the unified inbox synced
      const sendAndLog = async (text, media = null, type = 'WELCOME', extraOptions = {}) => {
        const outboundContent = (typeof text === 'string' && text.trim()) ? text.trim() : (media ? '[Image]' : '');
        let result;
        if (channel === 'instagram') {
          const InstagramService = require('./InstagramService');
          result = await InstagramService.sendDirectMessage(
            phoneNumber,
            outboundContent,
            {
              ...(media ? { mediaUrl: media } : {}),
              ...extraOptions
            }
          );
        } else {
          result = await WhatsAppService.sendMessage(
            phoneNumber,
            outboundContent,
            {
              ...(media ? { mediaUrl: media } : {}),
              ...extraOptions
            }
          );
        }
        
        const msg = await Message.create({
          userId,
          customerId: customer._id,
          content: outboundContent,
          channel,
          messageType: type,
          language,
          status: result.success ? 'SENT' : 'FAILED',
          externalMessageId: result.externalMessageId,
          aiGenerated: true,
          aiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
          tags: ['outbound', 'ai_generated'],
          mediaUrl: media,
          mediaType: media ? 'image' : null,
          widgetData: extraOptions
        });
        
        outboundMessage = msg;

        const ConversationMessage = require('../models/ConversationMessage');
        await ConversationMessage.create({
          conversationId: conversation._id,
          customerId: customer._id,
          content: outboundContent,
          messageType: media ? 'IMAGE' : 'TEXT',
          media: media ? {
            url: media,
            type: 'image'
          } : undefined,
          platform: channel.toUpperCase(),
          sender: {
            type: 'SYSTEM',
            name: 'AI Assistant'
          },
          status: msg.status === 'SENT' ? 'SENT' : 'FAILED',
          platformMessageId: result.externalMessageId,
          isAutoResponse: true,
          widgetData: extraOptions
        });

          return result;
      };

      let sentResult;
      let totalMessagesSent = 0;

      // Step 9: Artificial human-like delay (2-4 seconds)
      await this.delay(2000 + Math.random() * 2000);

      sentResult = await sendAndLog(aiResponse.text, aiResponse.mediaUrl, 'WELCOME', {
        buttons: aiResponse.buttons,
        list: aiResponse.list,
        ruleId: aiResponse.ruleId
      });
      totalMessagesSent = 1;

      // Step 12: Update customer profile and conversation message count
      await Customer.findByIdAndUpdate(customer._id, {
        preferredLanguage: language,
        lastMessageSentDate: new Date(),
        $inc: { messagesSentCount: totalMessagesSent }
      });

      conversation.messageCount += totalMessagesSent;
      conversation.lastMessage = {
        content: (aiResponse.text || '').substring(0, 100),
        sender: 'TEAM',
        timestamp: new Date(),
        platform: channel
      };
      conversation.lastActivityAt = new Date();
      await conversation.save();

      // Step 14: Escalation decision
      if (leadScore.shouldEscalate || (aiResponse && aiResponse.escalated)) {
        await ownerNotificationService.sendLeadAlert({
          customer,
          message: inboundContent,
          analysis,
          leadScore,
          language,
          userId
        });

        // Pause AI Autopilot and assign to human review
        conversation.autoReplyEnabled = false;
        conversation.status = 'WAITING_FOR_TEAM';
        conversation.priority = leadScore.score >= 9 ? 'URGENT' : 'HIGH';
        if (!conversation.tags.includes('escalated')) {
          conversation.tags.push('escalated');
        }
        await conversation.save();
        console.log(`[ESCALATION] Conversation ${conversation._id} updated: Autopilot paused, status WAITING_FOR_TEAM.`);
      }

      // Step 15: Log conversation event
      await this.logConversationEvent(customer._id, userId, {
        type: 'MESSAGE_PROCESSED',
        leadScore: leadScore.score,
        intent: analysis.intent,
        escalated: leadScore.shouldEscalate
      });

      return {
        success: true,
        customerId: customer._id,
        inboundMessageId: inboundMessage._id,
        outboundMessageId: outboundMessage._id,
        analysis,
        leadScore,
        aiResponse: aiResponse.text,
        language,
        escalated: leadScore.shouldEscalate,
        conversationId: conversation._id,
        processingTime: new Date()
      };
    } catch (error) {
      console.error('AI Chat Handler Error:', error.message);
      return {
        success: false,
        error: error.message,
        phoneNumber
      };
    }
  }

  /**
   * Create new customer record
   */
  async createNewCustomer(phoneNumber, userId, initialName = null, options = {}) {
    const firstName = initialName?.firstName || phoneNumber;
    const lastName = initialName?.lastName || '';
    const isInstagram = options.channel === 'instagram';

    const customer = new Customer({
      userId,
      firstName,
      lastName,
      phone: phoneNumber,
      whatsappNumber: isInstagram ? '' : phoneNumber,
      instagramHandle: isInstagram ? phoneNumber : '',
      language: 'en',
      rfmSegment: 'NEW',
      loyaltyTier: 'BRONZE',
      totalSpent: 0,
      totalPurchases: 0,
      optedIn: {
        whatsapp: !isInstagram,
        instagram: isInstagram,
        sms: false,
        email: false
      },
      preferredChannel: isInstagram ? 'instagram' : 'whatsapp',
      customFields: options.whatsappLid ? { whatsappLid: options.whatsappLid } : {}
    });

    await customer.save();
    return customer;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log conversation event
   */
  async logConversationEvent(customerId, userId, eventData) {
    try {
      // This can be extended to log to a separate ConversationLog collection
      console.log(`[CONVERSATION EVENT] Customer: ${customerId}, Event:`, eventData);
    } catch (error) {
      console.error('Event Logging Error:', error.message);
    }
  }

  /**
   * Get conversation summary for dashboard
   */
  async getConversationSummary(customerId, userId) {
    try {
      const customer = await Customer.findById(customerId);
      const messages = await Message.find({
        customerId,
        userId
      }).sort({ createdAt: -1 }).limit(20);

      const conversation = await Conversation.findOne({
        customerId,
        userId,
        status: 'ACTIVE'
      });

      return {
        customer: {
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          phone: customer.whatsappNumber,
          language: customer.language,
          totalPurchases: customer.totalPurchases,
          totalSpent: customer.totalSpent,
          rfmSegment: customer.rfmSegment
        },
        conversation: {
          id: conversation?._id,
          messageCount: conversation?.messageCount || 0,
          lastMessage: conversation?.lastMessage,
          status: conversation?.status
        },
        recentMessages: messages.map(m => ({
          content: m.content,
          direction: m.aiGenerated ? 'outbound' : 'inbound',
          timestamp: m.createdAt,
          sentiment: m.sentiment
        }))
      };
    } catch (error) {
      console.error('Summary Error:', error.message);
      return null;
    }
  }

  /**
   * Get hot leads for owner dashboard
   */
  async getHotLeads(userId, limit = 10) {
    try {
      const conversations = await Conversation.find({
        userId,
        status: 'ACTIVE'
      })
        .populate('customerId')
        .sort({ lastActivityAt: -1 })
        .limit(limit);

      const leads = [];

      for (const conv of conversations) {
        const lastMessage = await Message.findOne({
          customerId: conv.customerId._id,
          userId
        }).sort({ createdAt: -1 });

        if (lastMessage && lastMessage.sentiment === 'POSITIVE') {
          leads.push({
            customerId: conv.customerId._id,
            name: `${conv.customerId.firstName} ${conv.customerId.lastName}`.trim(),
            phone: conv.customerId.whatsappNumber,
            lastMessage: lastMessage.content,
            timestamp: lastMessage.createdAt,
            totalSpent: conv.customerId.totalSpent,
            segment: conv.customerId.rfmSegment
          });
        }
      }

      return leads;
    } catch (error) {
      console.error('Hot Leads Error:', error.message);
      return [];
    }
  }
}

module.exports = new AIChatHandler();

