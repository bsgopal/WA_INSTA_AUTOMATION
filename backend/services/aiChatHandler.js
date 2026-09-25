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

function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Universal text normalizer for keyword and rule matching
 * Handles all formats: uppercase (TEXT), lowercase (text), titlecase (Text),
 * mixed case (tExT), WhatsApp markdown (*TEXT*, _text_, ~text~), punctuation, and accents.
 */
function normalizeTextForMatching(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[*_~`]/g, ' ') // strip WhatsApp markdown (*bold*, _italic_, ~strike~, `code`)
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ') // replace newlines/tabs with spaces
    .replace(/[^\w\s\u0900-\u0D7F]/g, ' ') // replace punctuation/symbols with spaces while preserving Indic/Unicode characters
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

function fuzzyMatch(text, keyword, threshold = 0.75) {
  if (!text || !keyword) return false;
  
  const cleanText = normalizeTextForMatching(text);
  const cleanKeyword = normalizeTextForMatching(keyword);

  if (!cleanText || !cleanKeyword) return false;

  // 1. Exact match after normalization (e.g. 'TEXT' === 'text', 'Text' === 'TEXT', '*text*' === 'text')
  if (cleanText === cleanKeyword) return true;

  // 2. Substring match (e.g. 'what is the TEXT format' contains 'text')
  if (cleanText.includes(cleanKeyword)) return true;

  // 3. Word-level boundary match (e.g. ['hello', 'text', 'please'] has 'text')
  const textWords = cleanText.split(' ').filter(Boolean);
  const keywordWords = cleanKeyword.split(' ').filter(Boolean);

  if (textWords.includes(cleanKeyword)) return true;

  for (const tw of textWords) {
    for (const kw of keywordWords) {
      if (tw === kw) return true;
      // Stemming checks: 'pricing' vs 'price', 'prices' vs 'price', 'rates' vs 'rate'
      if (tw.startsWith(kw) || kw.startsWith(tw)) {
        if (Math.min(tw.length, kw.length) >= 3) return true;
      }
      // Levenshtein distance for typos (e.g. 'prce', 'pirce')
      const dist = getLevenshteinDistance(tw, kw);
      const maxLen = Math.max(tw.length, kw.length);
      if (maxLen > 0 && (1 - (dist / maxLen)) >= threshold) return true;
    }
  }

  // Entire phrase similarity comparison
  const fullDist = getLevenshteinDistance(cleanText, cleanKeyword);
  const fullMaxLen = Math.max(cleanText.length, cleanKeyword.length);
  if (fullMaxLen > 0 && (1 - (fullDist / fullMaxLen)) >= threshold) return true;

  return false;
}

function detectEmotionAndEnrichText(text) {
  if (!text) return '';
  const lower = text.toLowerCase();
  let enriched = text;
  
  const mappings = [
    { keywords: ['bridal', 'wedding', 'engagement', 'marriage', 'couple'], emojis: ' 💍❤️👰' },
    { keywords: ['gold', 'rate', 'price', 'rates', 'certified'], emojis: ' 🟡✨' },
    { keywords: ['diamond', 'luxury', 'premium', 'solitaire', 'gem'], emojis: ' 💎✨👑' },
    { keywords: ['discount', 'offer', 'sale', 'save', 'percent', 'promo'], emojis: ' 🏷️🎁💥' },
    { keywords: ['collection', 'gallery', 'showcase', 'catalog', 'design'], emojis: ' 🛍️✨' },
    { keywords: ['love', 'gift', 'anniversary', 'special', 'heart'], emojis: ' ❤️💝' },
    { keywords: ['new', 'arrival', 'launched', 'fresh', 'latest'], emojis: ' 🌟🆕' },
    { keywords: ['apology', 'sorry', 'inconvenience', 'complaint'], emojis: ' 🙏' },
    { keywords: ['support', 'help', 'contact', 'call', 'direct'], emojis: ' 📞💬' }
  ];

  for (const map of mappings) {
    if (map.keywords.some(kw => lower.includes(kw))) {
      const alreadyHas = map.emojis.trim().split('').some(emoji => text.includes(emoji));
      if (!alreadyHas) {
        enriched = enriched.trim() + map.emojis;
      }
      break;
    }
  }
  return enriched;
}

/**
 * Automatically detects customer emotional state and intent tone
 */
function detectCustomerEmotion(messageText, analysis = {}) {
  const textLower = String(messageText || '').toLowerCase();
  
  // 1. Frustrated / Upset / Complaint
  const angerKeywords = ['bad', 'worst', 'fraud', 'cheated', 'fake', 'horrible', 'disappointed', 'annoying', 'useless', 'waste', 'delay', 'irritated', 'scam', 'terrible', 'pathetic', 'broken', 'angry', 'hate', 'refund', 'complaint', 'why no reply', 'poor service', 'not working'];
  if (analysis.sentiment === 'NEGATIVE' || angerKeywords.some(kw => textLower.includes(kw)) || analysis.intent === 'complaint') {
    return {
      type: 'FRUSTRATED',
      tone: 'Empathic, Apologetic & Solution-Focused',
      prefix: '🙏 Namaste. We sincerely apologize for any inconvenience caused.',
      emojis: '🙏'
    };
  }

  // 2. Joyful / Excited / Celebratory (Weddings, Gifts, Anniversaries)
  const joyKeywords = ['wow', 'awesome', 'beautiful', 'love it', 'super', 'amazing', 'great', 'happy', 'wedding', 'marriage', 'birthday', 'anniversary', 'surprise', 'party', 'festival', 'congrats', 'congratulations', 'yay', 'gorgeous', 'excellent', 'fantastic', 'wonderful', 'loved'];
  if (analysis.sentiment === 'POSITIVE' || joyKeywords.some(kw => textLower.includes(kw))) {
    return {
      type: 'JOYFUL',
      tone: 'Celebratory, Enthusiastic & Warm',
      prefix: '🎉 Congratulations & Warmest Wishes! ✨',
      emojis: '🎉✨💍❤️'
    };
  }

  // 3. Urgent / Fast-paced
  const urgentKeywords = ['urgent', 'asap', 'fast', 'quickly', 'immediately', 'today itself', 'emergency', 'now itself', 'hurry', 'rush', 'express'];
  if (analysis.urgency === 'high' || urgentKeywords.some(kw => textLower.includes(kw))) {
    return {
      type: 'URGENT',
      tone: 'Direct, Fast & Action-Oriented',
      prefix: '⚡ Fast Priority Assistance:',
      emojis: '⚡'
    };
  }

  // 4. Confused / Hesitant / Step-by-Step Guidance
  const confusedKeywords = ['confused', 'dont know', 'how to', 'explain', 'help me', 'guide me', 'which is better', 'not sure', 'suggest', 'recommend', 'difference', 'what should i do'];
  if (confusedKeywords.some(kw => textLower.includes(kw))) {
    return {
      type: 'CONFUSED',
      tone: 'Reassuring, Clear & Step-by-Step',
      prefix: '💡 Happy to guide you step-by-step!',
      emojis: '💡'
    };
  }

  // 5. Grateful / Thankful
  const gratefulKeywords = ['thank you', 'thanks', 'thank u', 'thanks a lot', 'grateful', 'appreciate', 'thankyou'];
  if (gratefulKeywords.some(kw => textLower.includes(kw))) {
    return {
      type: 'GRATEFUL',
      tone: 'Warm, Courteous & Delightful',
      prefix: "You're most welcome! 🌸",
      emojis: '🌸✨'
    };
  }

  return {
    type: 'NEUTRAL_FRIENDLY',
    tone: 'Helpful, Polite & Professional',
    prefix: '',
    emojis: '✨'
  };
}

/**
 * Dynamically calibrates AI response text based on detected emotion
 */
function adaptResponseToEmotion(rawResponseText, emotion, customer = {}) {
  if (!rawResponseText) return '';
  let text = String(rawResponseText).trim();

  if (emotion.prefix && !text.includes(emotion.prefix)) {
    if (emotion.type === 'FRUSTRATED') {
      if (!text.toLowerCase().includes('apologize') && !text.toLowerCase().includes('sorry')) {
        text = `${emotion.prefix}\n\n${text}`;
      }
    } else if (emotion.type === 'JOYFUL') {
      if (!text.includes('🎉') && !text.includes('✨') && !text.toLowerCase().includes('congratulations')) {
        text = `${emotion.prefix}\n\n${text}`;
      }
    } else if (emotion.type === 'CONFUSED') {
      if (!text.includes('💡') && !text.toLowerCase().includes('guide')) {
        text = `${emotion.prefix}\n\n${text}`;
      }
    } else if (emotion.type === 'URGENT') {
      if (!text.includes('⚡') && !text.toLowerCase().includes('priority')) {
        text = `${emotion.prefix}\n\n${text}`;
      }
    }
  }

  return detectEmotionAndEnrichText(text);
}

class AIChatHandler {
  isPlaceholderName(name, phoneNumber) {
    const normalizedName = String(name || '').trim().toLowerCase();
    const normalizedPhone = String(phoneNumber || '').replace(/\D/g, '');

    return (
      !normalizedName ||
      normalizedName === 'customer' ||
      normalizedName.startsWith('customer') ||
      normalizedName.includes('@lid') ||
      normalizedName.includes('@c.us') ||
      normalizedName.includes('@s.whatsapp.net') ||
      normalizedName === normalizedPhone ||
      normalizedName === `+${normalizedPhone}` ||
      normalizedName.startsWith('+')
    );
  }

  cleanReplyValue(value, customer = {}) {
    if (!value) return '';
    let text = String(value);
    
    // Extract customer name
    const rawFirstName = customer.firstName || customer.name || customer.displayName || customer.customFields?.displayName || customer.customFields?.pushName || '';
    const rawLastName = customer.lastName || '';
    const fullName = `${rawFirstName} ${rawLastName}`.trim();
    const displayName = rawFirstName || fullName || '';

    const placeholders = {
      '[Customer Name]': displayName,
      '[customer_name]': displayName,
      '[Customer name]': displayName,
      '[CustomerName]': displayName,
      '[customer name]': displayName,
      '[Name]': displayName,
      '[name]': displayName,
      '[First Name]': rawFirstName,
      '[first_name]': rawFirstName,
      '{Customer Name}': displayName,
      '{customer_name}': displayName,
      '{name}': displayName,
      '{firstName}': rawFirstName,
      '{{firstName}}': rawFirstName,
      '{{lastName}}': rawLastName,
      '{{fullName}}': fullName,
      '{{customer_name}}': displayName,
      '{{Customer Name}}': displayName,
      '{{name}}': displayName,
      '{{Name}}': displayName,
      '{{customer_phone}}': customer.whatsappNumber || customer.phone || '',
      '{{shop_name}}': process.env.SHOP_NAME || 'Renic'
    };

    Object.entries(placeholders).forEach(([key, val]) => {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      text = text.replace(new RegExp(escapedKey, 'gi'), val);
    });

    return text
      .replace(/\s+([!?,.:])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  buildRuleResponsePayload(rule, customer = {}) {
    const responseImages = [];
    const buttons = [];
    const listSections = [];
    const textParts = [];
    const messageBlocks = Array.isArray(rule?.messageBlocks) ? rule.messageBlocks : [];

    const addTextPart = value => {
      const cleanValue = this.cleanReplyValue(value, customer);
      if (cleanValue) {
        textParts.push(detectEmotionAndEnrichText(cleanValue));
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
   * Check if an incoming message matches any active Workflows (Keywords, Exact Match, Intent)
   * Highest Priority for Multi-Step Automated Flows
   */
  async checkWorkflowTriggers(messageText, analysis, userId, customer = {}) {
    try {
      const Workflow = require('../models/Workflow');
      const workflowEngine = require('./workflowEngine');

      const activeWorkflows = await Workflow.find({
        userId,
        status: 'ACTIVE'
      });

      if (!activeWorkflows || activeWorkflows.length === 0) {
        return null;
      }

      const messageTextNorm = normalizeTextForMatching(messageText);

      for (const workflow of activeWorkflows) {
        let isMatched = false;
        let matchReason = '';

        const trigger = workflow.trigger || {};
        let keywords = [];

        // Check trigger.keywords array or string
        if (Array.isArray(trigger.keywords)) {
          keywords.push(...trigger.keywords);
        } else if (typeof trigger.keywords === 'string') {
          keywords.push(...trigger.keywords.split(',').map(s => s.trim()));
        }

        // Check trigger.conditions (visual builder & conditional builder)
        if (trigger.conditions && Array.isArray(trigger.conditions)) {
          for (const cond of trigger.conditions) {
            if (cond.field === 'keywords' || cond.field === 'keyword' || cond.field === 'triggerValue' || cond.field === 'intent') {
              if (typeof cond.value === 'string') {
                keywords.push(...cond.value.split(',').map(s => s.trim()));
              }
            }
          }
        }

        // Check trigger.value
        if (trigger.value && typeof trigger.value === 'string') {
          keywords.push(...trigger.value.split(',').map(s => s.trim()));
        }

        // Check visual node triggers (START node or first step)
        if (workflow.nodes && Array.isArray(workflow.nodes)) {
          const startNode = workflow.nodes.find(n => n.type === 'START' || n.type === 'KEYWORD');
          if (startNode?.config?.keywords) {
            if (Array.isArray(startNode.config.keywords)) {
              keywords.push(...startNode.config.keywords);
            } else if (typeof startNode.config.keywords === 'string') {
              keywords.push(...startNode.config.keywords.split(',').map(s => s.trim()));
            }
          }
        }

        if (workflow.steps && workflow.steps.length > 0) {
          const firstStep = workflow.steps[0];
          if (firstStep.config?.keywords) {
            if (Array.isArray(firstStep.config.keywords)) {
              keywords.push(...firstStep.config.keywords);
            } else if (typeof firstStep.config.keywords === 'string') {
              keywords.push(...firstStep.config.keywords.split(',').map(s => s.trim()));
            }
          }
        }

        // Normalize all keywords for robust case/format insensitivity
        keywords = keywords.map(kw => normalizeTextForMatching(kw)).filter(Boolean);

        // Keyword Match Check (handles TEXT, text, Text, *text*, etc.)
        if (keywords.length > 0) {
          if (keywords.some(kw => messageTextNorm === kw)) {
            isMatched = true;
            matchReason = 'EXACT_KEYWORD';
          } else if (keywords.some(kw => fuzzyMatch(messageText, kw))) {
            isMatched = true;
            matchReason = 'FUZZY_KEYWORD';
          }
        }

        // Intent Match Check
        if (!isMatched && analysis && analysis.intent) {
          const targetIntent = (trigger.event || trigger.intent || '').toLowerCase();
          if (targetIntent && targetIntent === analysis.intent.toLowerCase()) {
            isMatched = true;
            matchReason = 'INTENT_MATCH';
          }
        }

        if (isMatched) {
          console.log(`⚡ Active Workflow matched: "${workflow.name}" (${matchReason}) for message: "${messageText}"`);

          const executionResult = await workflowEngine.executeWorkflow(workflow._id, customer._id, {
            incomingMessage: messageText,
            analysis,
            userId
          });

          return {
            success: true,
            source: 'WORKFLOW',
            workflowId: workflow._id,
            workflowName: workflow.name,
            matchReason,
            executionResult,
            bypassResponse: true
          };
        }
      }

      return null;
    } catch (err) {
      console.error('Error checking Workflow Triggers in aiChatHandler:', err.message);
      return null;
    }
  }

  /**
   * Check if a message matches any active Response Rules
   * Priority: EXACT_MATCH > KEYWORD > INTENT
   * Supports all casing and text formats: TEXT, text, Text, *text*, etc.
   */
  async checkResponseRules(messageText, analysis, userId, customer = {}) {
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
      
      const messageTextNorm = normalizeTextForMatching(messageText);
      let matchedRule = null;
      let matchType = null;
      
      // 1. Try EXACT_MATCH first (highest priority) - handles TEXT, text, Text, *text*, etc.
      for (const rule of activeRules.filter(r => r.triggerType === 'EXACT_MATCH')) {
        const triggerNorm = normalizeTextForMatching(rule.triggerValue);
        if (messageTextNorm === triggerNorm) {
          matchedRule = rule;
          matchType = 'EXACT_MATCH';
          console.log(`  ✅ EXACT_MATCH rule found: "${rule.name}"`);
          break;
        }
      }
      
      // 2. Try KEYWORD matching if no exact match (medium priority)
      if (!matchedRule) {
        for (const rule of activeRules.filter(r => r.triggerType === 'KEYWORD')) {
          const keywords = rule.triggerValue.split(',').map(kw => normalizeTextForMatching(kw)).filter(Boolean);
          
          // Check if any keyword matches fuzzily in the message
          const hasKeyword = keywords.some(keyword => {
            return messageTextNorm === keyword || fuzzyMatch(messageText, keyword);
          });
          
          if (hasKeyword) {
            matchedRule = rule;
            matchType = 'KEYWORD';
            console.log(`  ✅ KEYWORD rule found: "${rule.name}" (case/format-insensitive match)`);
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
        
        // Format messageBlocks into response text with customer name personalization
        const responsePayload = this.buildRuleResponsePayload(matchedRule, customer);
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

      const orConditions = [
        { whatsappNumber: phoneNumber },
        { whatsappNumber: digitsOnly },
        { phone: phoneNumber },
        { phone: digitsOnly },
        { instagramHandle: phoneNumber },
        { whatsappNumber: { $regex: regexPattern } },
        { phone: { $regex: regexPattern } }
      ];

      if (options.whatsappLid) {
        orConditions.push({ 'customFields.whatsappLid': options.whatsappLid });
        orConditions.push({ phone: options.whatsappLid });
        orConditions.push({ whatsappNumber: options.whatsappLid });
      }

      let customer = await Customer.findOne({
        userId,
        $or: orConditions
      });

      if (customer) {
        const resolvedName = options.contactName || options.pushName;
        if (resolvedName && this.isPlaceholderName(customer.firstName, customer.phone)) {
          const parts = resolvedName.trim().split(/\s+/);
          customer.firstName = parts[0] || customer.firstName;
          customer.lastName = parts.slice(1).join(' ') || customer.lastName;
        }

        // Upgrade phone from @lid to real phone number if available
        if (customer.phone.includes('@lid') && phoneNumber && !phoneNumber.includes('@lid')) {
          customer.phone = phoneNumber;
          customer.whatsappNumber = phoneNumber;
        }

        if (options.whatsappLid || options.pushName || options.contactName) {
          customer.customFields = {
            ...(customer.customFields || {}),
            ...(options.whatsappLid ? { whatsappLid: options.whatsappLid } : {}),
            ...(options.pushName ? { pushName: options.pushName } : {}),
            ...(resolvedName ? { displayName: resolvedName } : {})
          };
        }

        await customer.save();
      }

      let initialName = null;
      if (!customer) {
        const resolvedName = options.contactName || options.pushName;
        if (resolvedName) {
          const parts = resolvedName.trim().split(/\s+/);
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

      // Helper to compute clean display title
      const getCleanDisplayName = (cust) => {
        const fn = (cust?.firstName || '').trim();
        const ln = (cust?.lastName || '').trim();
        const dn = (cust?.customFields?.displayName || cust?.customFields?.pushName || '').trim();
        if (fn && !fn.includes('@lid') && !fn.startsWith('+') && !fn.toLowerCase().startsWith('customer')) {
          return `${fn} ${ln}`.trim();
        }
        if (dn && !dn.includes('@lid') && !dn.startsWith('+')) {
          return dn;
        }
        const ph = (cust?.phone || '').trim();
        if (ph && !ph.includes('@lid')) {
          return ph;
        }
        return 'Customer';
      };

      // Step 3: Find or create conversation immediately (single continuous thread per customer)
      let conversation = await Conversation.findOne({
        customerId: customer._id,
        userId
      }).sort({ updatedAt: -1 });

      if (!conversation) {
        const convDisplayName = getCleanDisplayName(customer);
        conversation = await Conversation.create({
          userId,
          customerId: customer._id,
          title: `Chat with ${convDisplayName}`.trim(),
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
        if (conversation.title.includes('@lid') || conversation.title.includes('Chat with Customer') || conversation.title.includes('Chat with +')) {
          const convDisplayName = getCleanDisplayName(customer);
          if (convDisplayName && convDisplayName !== 'Customer') {
            conversation.title = `Chat with ${convDisplayName}`.trim();
          }
        }
        if (conversation.status === 'RESOLVED') {
          conversation.status = 'ACTIVE';
        }
        conversation.messageCount = (conversation.messageCount || 0) + 1;
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

      // Step 8: PRIORITY TRIGGER EVALUATION (Workflows -> Response Rules -> AI)
      console.log('\n🚀 Step 8: Evaluating Automated Flow & Rule Triggers...');
      
      // 8.1: Check Interactive Button / List selections
      const selectedId = options.interactiveReply?.id || null;
      let ruleMatch = await this.findActionForInteractiveSelection(selectedId, triggerText, userId, customer);

      // 8.2: Check Active Workflows (Workflow Studio Flows)
      if (!ruleMatch) {
        const workflowMatch = await this.checkWorkflowTriggers(triggerText, analysis, userId, customer);
        if (workflowMatch) {
          console.log(`✅ Automated Workflow "${workflowMatch.workflowName}" executed for incoming message. Bypassing other rules.`);
          return {
            success: true,
            customerId: customer._id,
            inboundMessageId: inboundMessage._id,
            conversationId: conversation._id,
            messageType: 'WORKFLOW_TRIGGERED',
            workflowName: workflowMatch.workflowName,
            processingTime: new Date()
          };
        }
      }
      
      // 8.3: Check Active Response Rules (Response Rule Studio)
      if (!ruleMatch) {
        ruleMatch = await this.checkResponseRules(triggerText, analysis, userId, customer);
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

        // ── Client Feature 1: Automated Tax Invoice / Bill PDF Request ──
        const billKeywords = ['invoice', 'bill', 'receipt', 'tax invoice', 'send bill', 'bill copy', 'payment receipt', 'my bill', 'send invoice'];
        const isInvoiceRequest = billKeywords.some(kw => msgLower.includes(kw)) || analysis.intent === 'INVOICE_REQUEST';

        if (isInvoiceRequest) {
          try {
            console.log('📄 AI Invoice Request detected from client:', phoneNumber);
            const { generateInvoicePDF } = require('./pdfInvoiceService');
            const pdfData = await generateInvoicePDF({
              customer: {
                name: `${customer.firstName} ${customer.lastName}`.trim() || 'Valued Client',
                phone: customer.whatsappNumber || customer.phone || phoneNumber
              },
              grandTotal: customer.totalSpent > 0 ? customer.totalSpent : 2950,
              subtotal: customer.totalSpent > 0 ? Math.round(customer.totalSpent * 0.82) : 2500,
              taxAmount: customer.totalSpent > 0 ? Math.round(customer.totalSpent * 0.18) : 450
            });

            aiResponse = {
              text: `📄 *Tax Invoice / Bill Receipt*\n\nDear ${customer.firstName || 'Client'}, here is your official Tax Invoice (*#${pdfData.billNumber}*).\n💰 Total: *₹${pdfData.grandTotal.toLocaleString('en-IN')}*\n\nThank you for choosing us! Let us know if you have any questions. ✨`,
              mediaUrl: pdfData.fileUrl,
              mediaType: 'document',
              mediaFileName: pdfData.fileName,
              source: 'AI_INVOICE_ENGINE'
            };
          } catch (invErr) {
            console.error('Invoice generation failed, falling back to standard AI:', invErr.message);
          }
        }

        // ── Client Feature 2: Negative Sentiment & Frustration Shield ──
        if (!aiResponse && (analysis.sentiment === 'NEGATIVE' || leadScore.shouldEscalate)) {
          if (analysis.urgency === 'high' || analysis.intent === 'complaint' || hasHumanRequest) {
            console.log('🛡️ Frustration / Escalation Shield triggered for customer:', phoneNumber);
            conversation.status = 'WAITING_FOR_TEAM';
            conversation.tags = Array.from(new Set([...(conversation.tags || []), 'escalated', 'negative_sentiment', 'priority_support']));
            await conversation.save();

            aiResponse = {
              text: `Namaste ${customer.firstName || ''}! 🙏 We truly apologize for any inconvenience caused. We have marked your request as *HIGH PRIORITY* and escalated this conversation directly to our Senior Support Team. A manager will connect with you right away!`,
              source: 'AI_ESCALATION_SHIELD',
              escalated: true
            };
          }
        }

        // ── Client Feature 3: Standard Intelligent Natural Language Assistant ──
        if (!aiResponse) {
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

          // ── Dynamic Customer Emotion & Sentiment Calibration ──
          const detectedEmotion = detectCustomerEmotion(triggerText, analysis);
          console.log(`🎭 Detected Customer Emotion: [${detectedEmotion.type}] (${detectedEmotion.tone}) for message: "${triggerText.substring(0, 40)}"`);

          if (aiResponse && aiResponse.text) {
            aiResponse.text = adaptResponseToEmotion(aiResponse.text, detectedEmotion, customer);
            aiResponse.emotion = detectedEmotion.type;
          }
        }
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
        const outboundContent = (typeof text === 'string' && text.trim()) ? text.trim() : (media ? '[Media File]' : '');
        let result;
        const resolvedMediaType = extraOptions.mediaType || (media ? 'image' : null);
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
              ...extraOptions,
              mediaType: resolvedMediaType,
              userId
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
          businessPhoneNumber: conversation.businessPhoneNumber || '',
          aiGenerated: true,
          aiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
          tags: ['outbound', 'ai_generated'],
          mediaUrl: media,
          mediaType: resolvedMediaType,
          widgetData: extraOptions
        });
        
        outboundMessage = msg;

        const ConversationMessage = require('../models/ConversationMessage');
        await ConversationMessage.create({
          conversationId: conversation._id,
          customerId: customer._id,
          content: outboundContent,
          messageType: resolvedMediaType === 'document' ? 'DOCUMENT' : (media ? 'IMAGE' : 'TEXT'),
          media: media ? {
            url: media,
            type: resolvedMediaType === 'document' ? 'document' : 'image'
          } : undefined,
          platform: channel.toUpperCase(),
          sender: {
            type: 'SYSTEM',
            name: 'AI Assistant'
          },
          status: msg.status === 'SENT' ? 'SENT' : 'FAILED',
          platformMessageId: result.externalMessageId,
          businessPhoneNumber: conversation.businessPhoneNumber || '',
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
        ruleId: aiResponse.ruleId,
        mediaType: aiResponse.mediaType || (aiResponse.mediaUrl ? 'image' : null),
        mediaFileName: aiResponse.mediaFileName,
        mediaMimeType: aiResponse.mediaMimeType || (aiResponse.mediaType === 'document' ? 'application/pdf' : undefined)
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

  /**
   * Log an outbound message to a conversation (creates/updates conversation & logs message)
   */
  async logOutboundMessage(userId, customerId, content, platform, messageId, mediaUrl = null, options = {}) {
    try {
      const Conversation = require('../models/Conversation');
      const ConversationMessage = require('../models/ConversationMessage');
      const ShopConfig = require('../models/ShopConfig');

      const shop = await ShopConfig.findOne({ userId });
      const currentMetaPhoneNumberId = shop?.metaPhoneNumberId || '';
      const currentBusinessPhoneNumber = shop?.metaDisplayPhoneNumber || shop?.contactPhone || '';

      const metaPhoneNumberId = options.metaPhoneNumberId || currentMetaPhoneNumberId;
      const businessPhoneNumber = options.businessPhoneNumber || currentBusinessPhoneNumber;

      // Find or create conversation
      let conversation = await Conversation.findOne({
        customerId,
        userId,
        status: 'ACTIVE',
        $or: [
          { metaPhoneNumberId: metaPhoneNumberId },
          { metaPhoneNumberId: { $exists: false } },
          { metaPhoneNumberId: null },
          { metaPhoneNumberId: '' }
        ]
      });

      const messageContent = content || (mediaUrl ? 'Sent an image' : '');

      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          customerId,
          title: `Chat with customer`,
          primaryPlatform: platform.toUpperCase(),
          metaPhoneNumberId,
          businessPhoneNumber,
          platforms: [{
            type: platform.toUpperCase(),
            isLinked: true,
            linkedAt: new Date()
          }],
          status: 'ACTIVE',
          messageCount: 1,
          lastMessage: {
            content: messageContent.substring(0, 100),
            sender: 'TEAM',
            timestamp: new Date(),
            platform: platform.toLowerCase()
          }
        });
      } else {
        conversation.messageCount += 1;
        conversation.lastMessage = {
          content: messageContent.substring(0, 100),
          sender: 'TEAM',
          timestamp: new Date(),
          platform: platform.toLowerCase()
        };
        conversation.lastActivityAt = new Date();
        if (metaPhoneNumberId) conversation.metaPhoneNumberId = metaPhoneNumberId;
        if (businessPhoneNumber) conversation.businessPhoneNumber = businessPhoneNumber;
        await conversation.save();
      }

      // Log conversation message
      await ConversationMessage.create({
        conversationId: conversation._id,
        customerId,
        content: messageContent,
        messageType: mediaUrl ? 'IMAGE' : 'TEXT',
        media: mediaUrl ? { url: mediaUrl, type: 'image' } : undefined,
        platform: platform.toUpperCase(),
        sender: {
          type: 'SYSTEM',
          name: 'Campaign Broadcast'
        },
        status: 'SENT',
        platformMessageId: messageId,
        businessPhoneNumber,
        isAutoResponse: true
      });

      return conversation;
    } catch (error) {
      console.error('Failed to log outbound campaign message to conversation:', error.message);
    }
  }
}

module.exports = new AIChatHandler();

