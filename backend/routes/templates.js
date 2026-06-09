// renic-automation-backend/routes/templates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const GeminiService = require('../services/GeminiService');
const { body, validationResult } = require('express-validator');

// ============ GET ALL TEMPLATES ============
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.userId || req.user._id })
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ============ GET TEMPLATE BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get Template Error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// ============ CREATE TEMPLATE ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('content').notEmpty(),
  body('category').optional().isIn([
    'WELCOME',
    'ORDER_CONFIRMATION',
    'SHIPPING_UPDATE',
    'DELIVERY_NOTIFICATION',
    'PRODUCT_RECOMMENDATION',
    'DISCOUNT_OFFER',
    'BIRTHDAY_WISH',
    'RE_ENGAGEMENT',
    'FEEDBACK_REQUEST',
    'CART_ABANDONMENT',
    'CUSTOM'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Map category if it's a custom value
    let category = req.body.category || 'CUSTOM';
    
    // If category is not in enum, use CUSTOM
    const validCategories = [
      'WELCOME',
      'ORDER_CONFIRMATION',
      'SHIPPING_UPDATE',
      'DELIVERY_NOTIFICATION',
      'PRODUCT_RECOMMENDATION',
      'DISCOUNT_OFFER',
      'BIRTHDAY_WISH',
      'RE_ENGAGEMENT',
      'FEEDBACK_REQUEST',
      'CART_ABANDONMENT',
      'CUSTOM'
    ];
    
    if (!validCategories.includes(category)) {
      category = 'CUSTOM';
    }

    const template = new Template({
      name: req.body.name,
      content: req.body.content,
      category: category,
      supportedChannels: req.body.supportedChannels || ['whatsapp', 'instagram'],
      userId: req.userId || req.user._id,
      description: req.body.description || '',
      type: req.body.type || 'TEXT'
    });

    await template.save();

    res.status(201).json(template);
  } catch (error) {
    console.error('Create Template Error:', error);
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// ============ UPDATE TEMPLATE ============
router.put('/:id', async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId || req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Update Template Error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// ============ DELETE TEMPLATE ============
router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete Template Error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============ AI GENERATE TEMPLATE ============
router.post('/ai/generate', [
  body('prompt').notEmpty().trim(),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'INTERACTIVE']),
  body('tone').optional().isIn(['professional', 'friendly', 'casual', 'formal', 'persuasive']),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, type = 'TEXT', tone = 'friendly', language = 'en' } = req.body;

    const aiPrompt = `Generate a ${tone} ${type} message template for WhatsApp/Instagram automation with the following requirements:
${prompt}

Language: ${language}
Keep it concise, engaging, and suitable for direct messaging.
Include personalization placeholders like {{firstName}}, {{lastName}}, {{productName}} where appropriate.`;

    const result = await GeminiService.generateMessage('CUSTOM', language, { prompt });
    const generatedContent = result.success ? result.content : result.content;

    res.json({
      content: generatedContent,
      type,
      tone,
      language
    });
  } catch (error) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// ============ AI OPTIMIZE TEMPLATE ============
router.post('/ai/optimize', [
  body('content').notEmpty().trim(),
  body('goal').optional().isIn(['engagement', 'conversion', 'retention', 'awareness'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, goal = 'engagement' } = req.body;

    const result = await GeminiService.generateMessage('CUSTOM', 'en', { content, goal });
    const optimization = result.success ? result.content : result.content;

    res.json({
      original: content,
      optimized: optimization,
      goal
    });
  } catch (error) {
    console.error('AI Optimize Error:', error);
    res.status(500).json({ error: 'Failed to optimize template' });
  }
});

// ============ PREVIEW TEMPLATE ============
router.post('/:id/preview', [
  body('customerData').optional().isObject()
], async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const customerData = req.body.customerData || {
      firstName: 'John',
      lastName: 'Doe',
      productName: 'Sample Product'
    };

    let preview = template.content;

    // Replace placeholders
    Object.keys(customerData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, customerData[key]);
    });

    res.json({
      preview,
      template: template.content,
      placeholders: Object.keys(customerData)
    });
  } catch (error) {
    console.error('Preview Error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

module.exports = router;
