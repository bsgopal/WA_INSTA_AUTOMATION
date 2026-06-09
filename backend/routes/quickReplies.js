// renic-automation-backend/routes/quickReplies.js
const express = require('express');
const router = express.Router();
const QuickReply = require('../models/QuickReply');
const { body, validationResult } = require('express-validator');

// ============ GET ALL QUICK REPLIES ============
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, platform, search } = req.query;

    const query = { userId, isActive: true };

    if (category) query.category = category;
    if (platform) query.platforms = platform;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { shortcut: { $regex: search, $options: 'i' } }
      ];
    }

    const quickReplies = await QuickReply.find(query)
      .sort({ category: 1, usageCount: -1 });

    res.json(quickReplies);
  } catch (error) {
    console.error('Get Quick Replies Error:', error);
    res.status(500).json({ error: 'Failed to fetch quick replies' });
  }
});

// ============ CREATE QUICK REPLY ============
router.post('/', [
  body('title').notEmpty().trim(),
  body('content').notEmpty().trim(),
  body('category').isIn(['GREETING', 'INQUIRY', 'PAYMENT', 'DELIVERY', 'COMPLAINT', 'FOLLOW_UP', 'CLOSING', 'OTHER']),
  body('platforms').isArray().notEmpty(),
  body('shortcut').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const quickReply = new QuickReply({
      ...req.body,
      userId: req.user.id
    });

    await quickReply.save();

    res.status(201).json(quickReply);
  } catch (error) {
    console.error('Create Quick Reply Error:', error);
    res.status(500).json({ error: 'Failed to create quick reply' });
  }
});

// ============ UPDATE QUICK REPLY ============
router.put('/:id', [
  body('title').optional().notEmpty().trim(),
  body('content').optional().notEmpty().trim(),
  body('category').optional().isIn(['GREETING', 'INQUIRY', 'PAYMENT', 'DELIVERY', 'COMPLAINT', 'FOLLOW_UP', 'CLOSING', 'OTHER']),
  body('platforms').optional().isArray(),
  body('shortcut').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const quickReply = await QuickReply.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!quickReply) {
      return res.status(404).json({ error: 'Quick reply not found' });
    }

    res.json(quickReply);
  } catch (error) {
    console.error('Update Quick Reply Error:', error);
    res.status(500).json({ error: 'Failed to update quick reply' });
  }
});

// ============ DELETE QUICK REPLY ============
router.delete('/:id', async (req, res) => {
  try {
    const quickReply = await QuickReply.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quickReply) {
      return res.status(404).json({ error: 'Quick reply not found' });
    }

    res.json({ message: 'Quick reply deleted successfully' });
  } catch (error) {
    console.error('Delete Quick Reply Error:', error);
    res.status(500).json({ error: 'Failed to delete quick reply' });
  }
});

// ============ USE QUICK REPLY (INCREMENT USAGE) ============
router.post('/:id/use', async (req, res) => {
  try {
    const quickReply = await QuickReply.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $inc: { usageCount: 1 },
        lastUsedAt: new Date()
      },
      { new: true }
    );

    if (!quickReply) {
      return res.status(404).json({ error: 'Quick reply not found' });
    }

    res.json(quickReply);
  } catch (error) {
    console.error('Use Quick Reply Error:', error);
    res.status(500).json({ error: 'Failed to update quick reply usage' });
  }
});

// ============ GET QUICK REPLIES BY CATEGORY ============
router.get('/category/:category', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;

    const quickReplies = await QuickReply.find({
      userId,
      category,
      isActive: true
    }).sort({ usageCount: -1 });

    res.json(quickReplies);
  } catch (error) {
    console.error('Get Category Quick Replies Error:', error);
    res.status(500).json({ error: 'Failed to fetch quick replies' });
  }
});

// ============ SEARCH QUICK REPLIES ============
router.get('/search/:query', async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.params;

    const quickReplies = await QuickReply.find({
      userId,
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { shortcut: { $regex: query, $options: 'i' } }
      ]
    }).sort({ usageCount: -1 });

    res.json(quickReplies);
  } catch (error) {
    console.error('Search Quick Replies Error:', error);
    res.status(500).json({ error: 'Failed to search quick replies' });
  }
});

module.exports = router;
