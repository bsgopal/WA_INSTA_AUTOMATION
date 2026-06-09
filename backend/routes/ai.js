// renic-automation-backend/routes/ai.js
const express = require('express');
const router = express.Router();
const aiSmartFeatures = require('../services/aiSmartFeatures');
const { body, validationResult } = require('express-validator');

// ============ PREDICT OPTIMAL SEND TIME ============
router.get('/optimal-send-time/:customerId', async (req, res) => {
  try {
    const result = await aiSmartFeatures.predictOptimalSendTime(req.params.customerId);
    res.json(result);
  } catch (error) {
    console.error('Optimal Send Time Error:', error);
    res.status(500).json({ error: 'Failed to predict optimal send time' });
  }
});

// ============ ANALYZE SENTIMENT ============
router.post('/analyze-sentiment', [
  body('messageText').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await aiSmartFeatures.analyzeSentiment(req.body.messageText);
    res.json(result);
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// ============ GENERATE SMART REPLIES ============
router.post('/smart-replies', [
  body('messageText').notEmpty().trim(),
  body('customerContext').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageText, customerContext } = req.body;
    const replies = await aiSmartFeatures.generateSmartReplies(messageText, customerContext);
    
    res.json({ replies });
  } catch (error) {
    console.error('Smart Replies Error:', error);
    res.status(500).json({ error: 'Failed to generate smart replies' });
  }
});

// ============ CATEGORIZE QUERY ============
router.post('/categorize-query', [
  body('messageText').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await aiSmartFeatures.categorizeQuery(req.body.messageText);
    res.json(result);
  } catch (error) {
    console.error('Categorize Query Error:', error);
    res.status(500).json({ error: 'Failed to categorize query' });
  }
});

// ============ PREDICT CHURN RISK ============
router.get('/churn-risk/:customerId', async (req, res) => {
  try {
    const result = await aiSmartFeatures.predictChurnRisk(req.params.customerId);
    res.json(result);
  } catch (error) {
    console.error('Churn Risk Error:', error);
    res.status(500).json({ error: 'Failed to predict churn risk' });
  }
});

// ============ PERSONALIZE MESSAGE ============
router.post('/personalize-message', [
  body('template').notEmpty().trim(),
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({
      _id: req.body.customerId,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const personalized = await aiSmartFeatures.personalizeMessage(
      req.body.template,
      customer
    );

    res.json({ personalized });
  } catch (error) {
    console.error('Personalize Message Error:', error);
    res.status(500).json({ error: 'Failed to personalize message' });
  }
});

// ============ PREDICT LIFETIME VALUE ============
router.get('/lifetime-value/:customerId', async (req, res) => {
  try {
    const result = await aiSmartFeatures.predictLifetimeValue(req.params.customerId);
    res.json(result);
  } catch (error) {
    console.error('LTV Prediction Error:', error);
    res.status(500).json({ error: 'Failed to predict lifetime value' });
  }
});

// ============ BATCH ANALYZE CUSTOMERS ============
router.post('/batch-analyze', [
  body('customerIds').isArray().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerIds } = req.body;
    const results = [];

    for (const customerId of customerIds) {
      const churnRisk = await aiSmartFeatures.predictChurnRisk(customerId);
      const ltv = await aiSmartFeatures.predictLifetimeValue(customerId);
      const optimalTime = await aiSmartFeatures.predictOptimalSendTime(customerId);

      results.push({
        customerId,
        churnRisk,
        ltv,
        optimalTime
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Batch Analyze Error:', error);
    res.status(500).json({ error: 'Failed to batch analyze customers' });
  }
});

module.exports = router;
