// renic-automation-backend/routes/conversations.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const ConversationMessage = require('../models/ConversationMessage');
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');

// ============ GET ALL CONVERSATIONS (UNIFIED INBOX) ============
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, assignedTo, platform, search, page = 1, limit = 20 } = req.query;

    const query = { userId };

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (platform) query.primaryPlatform = platform;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'lastMessage.content': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find(query)
      .populate('customerId', 'firstName lastName phone whatsappNumber rfmSegment loyaltyTier language totalSpent')
      .populate('assignedTo', 'name email')
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ============ GET CONVERSATION BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (req.params.id.startsWith('temp_')) {
      const customerId = req.params.id.replace('temp_', '');
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const customer = await Customer.findOne({
        _id: customerId,
        userId: req.user.id
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      return res.json({
        conversation: {
          _id: req.params.id,
          customerId: customer,
          primaryPlatform: 'WHATSAPP',
          status: 'ACTIVE',
          messageCount: 0,
          lastMessage: null,
          isTemporary: true
        },
        messages: []
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('customerId')
      .populate('assignedTo', 'name email')
      .populate('autoResponseTemplate');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messages = await ConversationMessage.find({
      conversationId: req.params.id
    })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    res.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// ============ CREATE CONVERSATION ============
router.post('/', [
  body('customerId').notEmpty(),
  body('primaryPlatform').isIn(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  body('title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, primaryPlatform, title } = req.body;

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      customerId,
      userId: req.user.id,
      primaryPlatform,
      status: { $in: ['ACTIVE', 'PENDING'] }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const customer = await Customer.findById(customerId);

    const conversation = new Conversation({
      userId: req.user.id,
      customerId,
      primaryPlatform,
      title: title || `Chat with ${customer.firstName} ${customer.lastName}`,
      platforms: [{
        type: primaryPlatform,
        platformId: primaryPlatform === 'WHATSAPP' ? customer.whatsappNumber : customer.instagramHandle
      }]
    });

    await conversation.save();

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create Conversation Error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ============ LINK PLATFORMS (ROUTE INSTAGRAM TO WHATSAPP) ============
router.post('/:id/link-platform', [
  body('platform').isIn(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  body('platformId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, platformId } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $push: {
          platforms: {
            type: platform,
            platformId,
            isLinked: true,
            linkedAt: new Date(),
            linkedBy: req.user.id
          }
        }
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      message: `${platform} linked successfully`,
      conversation
    });
  } catch (error) {
    console.error('Link Platform Error:', error);
    res.status(500).json({ error: 'Failed to link platform' });
  }
});

// ============ ASSIGN CONVERSATION TO TEAM MEMBER ============
router.post('/:id/assign', [
  body('assignedTo').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        assignedTo,
        assignedAt: new Date(),
        assignedBy: req.user.id,
        status: 'ACTIVE'
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation assigned successfully',
      conversation
    });
  } catch (error) {
    console.error('Assign Conversation Error:', error);
    res.status(500).json({ error: 'Failed to assign conversation' });
  }
});

// ============ UPDATE CONVERSATION STATUS ============
router.put('/:id/status', [
  body('status').isIn(['ACTIVE', 'RESOLVED', 'PENDING', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_TEAM'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const updateData = { status, updatedAt: new Date() };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update conversation status' });
  }
});

// ============ TOGGLE CONVERSATION AUTO-REPLY ============
router.put('/:id/auto-reply', [
  body('autoReplyEnabled').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { autoReplyEnabled } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { autoReplyEnabled, updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Toggle Auto-Reply Error:', error);
    res.status(500).json({ error: 'Failed to toggle auto-reply status' });
  }
});

// ============ ADD MESSAGE TO CONVERSATION ============
router.post('/:id/messages', [
  body('content').notEmpty().trim(),
  body('platform').isIn(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  body('sender').isIn(['CUSTOMER', 'TEAM', 'SYSTEM'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, platform, sender, messageType = 'TEXT', media } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const customer = await Customer.findById(conversation.customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let result = { success: true };
    if (platform === 'WHATSAPP' && sender === 'TEAM') {
      const WhatsAppService = require('../services/WhatsAppService');
      result = await WhatsAppService.sendMessage(customer.whatsappNumber, content);
      
      if (!result.success) {
        if (result.failureReason === 422) {
          return res.status(400).json({
            error: 'WhatsApp is disconnected. Please go to Settings > Integrations and scan the QR code to link your phone.'
          });
        }
        return res.status(500).json({ error: result.error || 'Failed to send WhatsApp message' });
      }
    }

    const message = new ConversationMessage({
      conversationId: req.params.id,
      userId: sender === 'TEAM' ? req.user.id : null,
      customerId: conversation.customerId,
      content,
      platform,
      messageType,
      media,
      sender: {
        type: sender,
        userId: sender === 'TEAM' ? req.user.id : null,
        name: sender === 'TEAM' ? req.user.name : 'Customer'
      },
      status: 'SENT',
      platformMessageId: result.externalMessageId
    });

    await message.save();

    // Sync to Message model for Whatsapp outbound manual
    if (platform === 'WHATSAPP' && sender === 'TEAM') {
      const Message = require('../models/Message');
      await Message.create({
        userId: req.user.id,
        customerId: customer._id,
        content,
        channel: 'whatsapp',
        messageType: 'MANUAL',
        language: customer.language || 'en',
        status: 'SENT',
        externalMessageId: result.externalMessageId,
        aiGenerated: false,
        tags: ['outbound', 'manual']
      });
    }

    // Update conversation
    await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        messageCount: conversation.messageCount + 1,
        lastMessage: {
          content: content.substring(0, 100),
          sender,
          timestamp: new Date(),
          platform
        },
        lastActivityAt: new Date()
      }
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Add Message Error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// ============ GET CONVERSATION MESSAGES ============
router.get('/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await ConversationMessage.find({
      conversationId: req.params.id
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ConversationMessage.countDocuments({
      conversationId: req.params.id
    });

    res.json({
      messages: messages.reverse(),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============ GET CONVERSATIONS BY TEAM MEMBER ============
router.get('/team/:userId', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      assignedTo: req.params.userId
    };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find(query)
      .populate('customerId', 'firstName lastName phone')
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Team Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch team conversations' });
  }
});

// ============ GET CONVERSATION STATS ============
router.get('/stats/overview', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await Conversation.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          whatsapp: { $sum: { $cond: [{ $eq: ['$primaryPlatform', 'WHATSAPP'] }, 1, 0] } },
          instagram: { $sum: { $cond: [{ $eq: ['$primaryPlatform', 'INSTAGRAM'] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      total: 0,
      active: 0,
      resolved: 0,
      pending: 0,
      whatsapp: 0,
      instagram: 0
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
