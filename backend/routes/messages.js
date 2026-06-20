// renic-automation-backend/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const WhatsAppService = require('../services/WhatsAppService');
const GeminiService = require('../services/GeminiService');
const VariableInterpolationService = require('../services/VariableInterpolationService');
const { body, validationResult, query } = require('express-validator');

// ============ GET ALL MESSAGES ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('channel').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.channel) {
      query.channel = req.query.channel;
    }

    const messages = await Message.find(query)
      .populate('customerId', 'firstName lastName phone whatsappNumber')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============ GET MESSAGE BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('customerId')
      .populate('campaignId');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get Message Error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// ============ SEND SINGLE MESSAGE ============
router.post('/send', [
  body('customerId').notEmpty(),
  body('content').notEmpty().trim(),
  body('channel').isIn(['whatsapp', 'instagram', 'sms'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, content, channel, mediaUrl } = req.body;

    // Get customer
    const customer = await Customer.findOne({
      _id: customerId,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check opt-in status
    if (!customer.optedIn[channel]) {
      return res.status(400).json({ error: `Customer has not opted in for ${channel}` });
    }

    let result;
    let finalContent = await VariableInterpolationService.interpolateVariables(content, req.user.id, {
      customer
    });

    try {
      const aiMessageAnalyzer = require('../services/aiMessageAnalyzer');
      const detectedLang = aiMessageAnalyzer.detectLanguage(content);
      const targetLang = customer.language || 'en';
      
      if (detectedLang !== targetLang) {
        const shopConfig = await aiMessageAnalyzer.getShopConfig(req.user.id);
        const aiConfig = {
          provider: shopConfig.useAnthropic && shopConfig.anthropicApiKey ? 'anthropic' : 'gemini',
          apiKey: (shopConfig.useAnthropic && shopConfig.anthropicApiKey) ? shopConfig.anthropicApiKey : (shopConfig.geminiApiKey || process.env.GEMINI_API_KEY),
          model: (shopConfig.useAnthropic && shopConfig.anthropicApiKey) ? (shopConfig.anthropicModel || 'claude-3-haiku-20240307') : (shopConfig.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash')
        };
        if (aiConfig.apiKey) {
          console.log(`[Translate Outbound API] Translating from "${detectedLang}" to customer language "${targetLang}"`);
          const translated = await aiMessageAnalyzer.translateText(content, targetLang, aiConfig);
          if (translated && translated.trim()) {
            finalContent = translated;
          }
        }
      }
    } catch (err) {
      console.error('[Translate Outbound API] Outbound translation error:', err.message);
    }

    // Send based on channel
    if (channel === 'whatsapp') {
      result = await WhatsAppService.sendMessage(
        customer.whatsappNumber,
        finalContent,
        { mediaUrl }
      );
    } else if (channel === 'instagram') {
      const InstagramService = require('../services/InstagramService');
      result = await InstagramService.sendDirectMessage(
        customer.instagramHandle || customer.phone,
        finalContent,
        { mediaUrl }
      );
    } else {
      return res.status(400).json({ error: 'Channel not yet implemented' });
    }

    // Create message record
    const message = new Message({
      userId: req.user.id,
      customerId: customer._id,
      content: finalContent,
      originalContent: content,
      channel,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      failureReason: result.error,
      externalMessageId: result.externalMessageId,
      mediaUrl
    });

    await message.save();

    // Update customer stats
    customer.lastMessageSentDate = new Date();
    customer.messagesSentCount++;
    await customer.save();

    res.json({
      message,
      sendResult: result
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ AI REPLY SUGGESTION ============
router.post('/ai/suggest-reply', [
  body('messageId').notEmpty(),
  body('context').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId, context } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      userId: req.user.id
    }).populate('customerId');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const aiPrompt = `Generate a professional and friendly reply to this customer message:

Customer: ${message.customerId?.firstName} ${message.customerId?.lastName}
Message: ${message.responseText || message.content}
${context ? `Context: ${context}` : ''}

Provide 3 different reply options:
1. Professional and formal
2. Friendly and casual
3. Brief and to the point

Keep replies concise and suitable for WhatsApp/Instagram DM.`;

    const suggestions = await GeminiService.generateContent(aiPrompt);

    res.json({
      suggestions,
      originalMessage: message.responseText || message.content,
      customer: {
        name: `${message.customerId?.firstName} ${message.customerId?.lastName}`,
        segment: message.customerId?.rfmSegment
      }
    });
  } catch (error) {
    console.error('AI Reply Error:', error);
    res.status(500).json({ error: 'Failed to generate reply suggestions' });
  }
});

// ============ AI SENTIMENT ANALYSIS ============
router.post('/ai/analyze-sentiment', [
  body('messageId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findOne({
      _id: req.body.messageId,
      userId: req.user.id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const aiPrompt = `Analyze the sentiment of this customer message:

"${message.responseText || message.content}"

Provide:
1. Sentiment: positive, negative, or neutral
2. Confidence score (0-100)
3. Key emotions detected
4. Urgency level (low, medium, high)
5. Suggested action

Format as JSON.`;

    const analysis = await GeminiService.generateContent(aiPrompt);

    res.json({
      messageId: message._id,
      analysis,
      content: message.responseText || message.content
    });
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// ============ MARK MESSAGE AS READ ============
router.patch('/:id/read', async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'READ', readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ============ RETRY FAILED MESSAGE ============
router.post('/:id/retry', async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'FAILED'
    }).populate('customerId');

    if (!message) {
      return res.status(404).json({ error: 'Message not found or not failed' });
    }

    if (message.retryCount >= 3) {
      return res.status(400).json({ error: 'Maximum retry attempts reached' });
    }

    let result;

    if (message.channel === 'whatsapp') {
      result = await WhatsAppService.sendMessage(
        message.customerId.whatsappNumber,
        message.content,
        { mediaUrl: message.mediaUrl }
      );
    }

    message.status = result.success ? 'SENT' : 'FAILED';
    message.sentAt = result.success ? new Date() : message.sentAt;
    message.failureReason = result.error;
    message.retryCount = (message.retryCount || 0) + 1;
    message.externalMessageId = result.externalMessageId || message.externalMessageId;

    await message.save();

    res.json({
      message,
      retryResult: result
    });
  } catch (error) {
    console.error('Retry Message Error:', error);
    res.status(500).json({ error: 'Failed to retry message' });
  }
});

// ============ GET CONVERSATION HISTORY ============
router.get('/conversation/:customerId', async (req, res) => {
  try {
    const messages = await Message.find({
      userId: req.user.id,
      customerId: req.params.customerId
    })
      .sort({ createdAt: 1 })
      .limit(100);

    const customer = await Customer.findOne({
      _id: req.params.customerId,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      customer,
      messages,
      totalMessages: messages.length
    });
  } catch (error) {
    console.error('Conversation History Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// ============ BULK DELETE MESSAGES ============
router.post('/bulk-delete', [
  body('messageIds').isArray().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await Message.deleteMany({
      _id: { $in: req.body.messageIds },
      userId: req.user.id
    });

    res.json({
      message: 'Messages deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

module.exports = router;
