// renic-automation-backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const WhatsAppService = require('../services/WhatsAppService');
const GeminiService = require('../services/GeminiService');
const campaignService = require('../services/campaignService');
const { body, validationResult, query } = require('express-validator');

// ============ GET ALL CAMPAIGNS ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const campaigns = await Campaign.find(query)
      .populate('messageTemplate', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Campaigns Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// ============ GET CAMPAIGN BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('messageTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get Campaign Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// ============ CREATE CAMPAIGN ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['ONE_TIME', 'RECURRING', 'AUTOMATED', 'TRIGGERED']),
  body('channels').isArray(),
  body('messageTemplate').notEmpty(),
  body('messageType').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculate estimated reach
    let estimatedReach = 0;
    if (req.body.targetAudience) {
      const query = { userId: req.user.id };

      if (req.body.targetAudience.segments?.length > 0) {
        query.rfmSegment = { $in: req.body.targetAudience.segments };
      }
      if (req.body.targetAudience.languages?.length > 0) {
        query.language = { $in: req.body.targetAudience.languages };
      }
      if (req.body.targetAudience.loyaltyTiers?.length > 0) {
        query.loyaltyTier = { $in: req.body.targetAudience.loyaltyTiers };
      }

      estimatedReach = await Customer.countDocuments(query);
    }

    const campaign = new Campaign({
      ...req.body,
      userId: req.user.id,
      estimatedReach,
      status: 'DRAFT'
    });

    await campaign.save();

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// ============ UPDATE CAMPAIGN ============
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow editing running campaigns
    if (campaign.status === 'RUNNING') {
      return res.status(400).json({ error: 'Cannot edit a running campaign' });
    }

    Object.assign(campaign, req.body);
    campaign.updatedAt = Date.now();

    await campaign.save();

    res.json(campaign);
  } catch (error) {
    console.error('Update Campaign Error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ============ DELETE CAMPAIGN ============
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow deleting running campaigns
    if (campaign.status === 'RUNNING') {
      return res.status(400).json({ error: 'Cannot delete a running campaign. Pause it first.' });
    }

    await campaign.deleteOne();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete Campaign Error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ============ LAUNCH CAMPAIGN ============
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('messageTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Campaign cannot be launched' });
    }

    // Get target customers
    const query = { userId: req.user.id };

    if (campaign.targetAudience?.segments?.length > 0) {
      query.rfmSegment = { $in: campaign.targetAudience.segments };
    }
    if (campaign.targetAudience?.languages?.length > 0) {
      query.language = { $in: campaign.targetAudience.languages };
    }
    if (campaign.targetAudience?.loyaltyTiers?.length > 0) {
      query.loyaltyTier = { $in: campaign.targetAudience.loyaltyTiers };
    }

    // Only send to opted-in customers
    if (campaign.channels.includes('whatsapp')) {
      query['optedIn.whatsapp'] = true;
    }

    const customers = await Customer.find(query);

    campaign.status = 'RUNNING';
    campaign.startedAt = new Date();
    campaign.totalTargets = customers.length;
    await campaign.save();

    // Launch campaign asynchronously
    setImmediate(() => campaignService.executeCampaign(campaign, customers));

    res.json({
      message: 'Campaign launched successfully',
      targetCount: customers.length,
      campaign
    });
  } catch (error) {
    console.error('Launch Campaign Error:', error);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

// ============ PAUSE CAMPAIGN ============
router.post('/:id/pause', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'RUNNING' },
      { status: 'PAUSED', pausedAt: new Date() },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or not running' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Pause Campaign Error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// ============ RESUME CAMPAIGN ============
router.post('/:id/resume', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'PAUSED' },
      { status: 'RUNNING', pausedAt: null },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or not paused' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Resume Campaign Error:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
});

// ============ GET CAMPAIGN ANALYTICS ============
router.get('/:id/analytics', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get message statistics
    const messages = await Message.find({ campaignId: campaign._id });

    const analytics = {
      overview: {
        totalTargets: campaign.totalTargets,
        totalSent: campaign.totalSent,
        totalDelivered: campaign.totalDelivered,
        totalRead: campaign.totalRead,
        totalFailed: campaign.totalFailed,
        deliveryRate: campaign.totalSent > 0 ? (campaign.totalDelivered / campaign.totalSent * 100).toFixed(2) : 0,
        readRate: campaign.totalDelivered > 0 ? (campaign.totalRead / campaign.totalDelivered * 100).toFixed(2) : 0
      },
      timeline: messages.reduce((acc, msg) => {
        const date = msg.sentAt?.toISOString().split('T')[0];
        if (date) {
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {}),
      statusBreakdown: {
        sent: messages.filter(m => m.status === 'SENT').length,
        delivered: messages.filter(m => m.status === 'DELIVERED').length,
        read: messages.filter(m => m.status === 'READ').length,
        failed: messages.filter(m => m.status === 'FAILED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Campaign Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Campaign execution moved to campaignService.js

module.exports = router;
