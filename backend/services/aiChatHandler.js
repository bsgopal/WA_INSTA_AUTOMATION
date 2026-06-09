// renic-automation-backend/services/aiChatHandler.js
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const aiMessageAnalyzer = require('./aiMessageAnalyzer');
const leadScoringService = require('./leadScoringService');
const ownerNotificationService = require('./ownerNotificationService');
const WhatsAppService = require('./WhatsAppService');

class AIChatHandler {
  /**
   * Main entry point: Handle incoming customer message
   */
  async handleCustomerMessage(phoneNumber, messageBody, channel, userId, mediaUrl = null, options = {}) {
    try {
      let outboundMessage = null;
      const normalizedMessageBody = typeof messageBody === 'string' ? messageBody.trim() : '';
      const inboundContent = normalizedMessageBody || (mediaUrl ? '[Image]' : '');
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
        // Link original LID if it wasn't linked before
        if (options.whatsappLid && (!customer.customFields || !customer.customFields.whatsappLid)) {
          customer.customFields = {
            ...(customer.customFields || {}),
            whatsappLid: options.whatsappLid
          };
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
        inboundContent,
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

      // Step 8: Generate AI response
      const customerLanguage = (customer.customFields && customer.customFields.languageSelected) ? customer.language : language;
      const aiResponse = await aiMessageAnalyzer.generateResponse(
        analysis,
        customer,
        customerLanguage,
        inboundContent,
        mediaUrl
      );

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

      // Helper to send and log a single message to keep the unified inbox synced
      const sendAndLog = async (text, media = null, type = 'WELCOME') => {
        const outboundContent = (typeof text === 'string' && text.trim()) ? text.trim() : (media ? '[Image]' : '');
        let result;
        if (channel === 'instagram') {
          const InstagramService = require('./InstagramService');
          result = await InstagramService.sendDirectMessage(
            phoneNumber,
            outboundContent,
            media ? { mediaUrl: media } : {}
          );
        } else {
          result = await WhatsAppService.sendMessage(
            phoneNumber,
            outboundContent,
            media ? { mediaUrl: media } : {}
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
          mediaType: media ? 'image' : null
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
          isAutoResponse: true
        });

          return result;
      };

      let sentResult;
      let totalMessagesSent = 0;

      // Step 9: Artificial human-like delay (2-4 seconds)
      await this.delay(2000 + Math.random() * 2000);

      if (scrapedProducts.length > 0) {
        const selectedCategory = aiResponse.selectedCategory || 'products';
        const lang = customerLanguage || 'en';
        
        const headerText = aiResponse.customHeader || aiMessageAnalyzer.localize('category_header', lang, { category: selectedCategory.toLowerCase() });
        
        const displayProducts = scrapedProducts.slice(0, 3);
        let productsText = '';
        for (let idx = 0; idx < displayProducts.length; idx++) {
          const p = displayProducts[idx];
          const productCaption = aiMessageAnalyzer.localize('product_caption', lang, {
            idx: idx + 1,
            name: p.name,
            price: p.price,
            productUrl: p.productUrl
          });
          productsText += `\n\n${productCaption}`;
        }
        
        const footerText = aiMessageAnalyzer.localize('product_footer', lang, { subcategory: selectedCategory.toLowerCase() });
        const consolidatedMessage = `${headerText}${productsText}\n\n${footerText}`;
        
        sentResult = await sendAndLog(consolidatedMessage, aiResponse.mediaUrl);
        totalMessagesSent = 1;
      } else {
        sentResult = await sendAndLog(aiResponse.text, aiResponse.mediaUrl);
        totalMessagesSent = 1;
      }

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
      if (leadScore.shouldEscalate) {
        await ownerNotificationService.sendLeadAlert({
          customer,
          message: inboundContent,
          analysis,
          leadScore,
          language,
          userId
        });
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
