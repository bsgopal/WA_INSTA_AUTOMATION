// renic-automation-backend/routes/workflows.js
const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const workflowEngine = require('../services/workflowEngine');
const { body, validationResult } = require('express-validator');

// ============ GET ALL WORKFLOWS ============
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(workflows);
  } catch (error) {
    console.error('Get Workflows Error:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// ============ GET WORKFLOW BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Get Workflow Error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// ============ CREATE WORKFLOW ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('trigger').isObject(),
  body('steps').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workflow = new Workflow({
      ...req.body,
      userId: req.user.id
    });

    await workflow.save();

    res.status(201).json(workflow);
  } catch (error) {
    console.error('Create Workflow Error:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// ============ UPDATE WORKFLOW ============
router.put('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Update Workflow Error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// ============ DELETE WORKFLOW ============
router.delete('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete Workflow Error:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// ============ ACTIVATE WORKFLOW ============
router.post('/:id/activate', async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'ACTIVE' },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Activate Workflow Error:', error);
    res.status(500).json({ error: 'Failed to activate workflow' });
  }
});

// ============ PAUSE WORKFLOW ============
router.post('/:id/pause', async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'PAUSED' },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Pause Workflow Error:', error);
    res.status(500).json({ error: 'Failed to pause workflow' });
  }
});

// ============ EXECUTE WORKFLOW MANUALLY ============
router.post('/:id/execute', [
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, context } = req.body;

    const result = await workflowEngine.executeWorkflow(
      req.params.id,
      customerId,
      context || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Execute Workflow Error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// ============ GET WORKFLOW STATS ============
router.get('/:id/stats', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const successRate = workflow.stats.totalExecutions > 0
      ? (workflow.stats.successfulExecutions / workflow.stats.totalExecutions * 100).toFixed(2)
      : 0;

    res.json({
      ...workflow.stats.toObject(),
      successRate: parseFloat(successRate)
    });
  } catch (error) {
    console.error('Workflow Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow stats' });
  }
});

// ============ TEST WORKFLOW ============
router.post('/:id/test', [
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workflow = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Execute in test mode (don't update stats)
    const result = await workflowEngine.executeWorkflow(
      workflow._id,
      req.body.customerId,
      { testMode: true }
    );

    res.json({
      ...result,
      message: 'Workflow test completed'
    });
  } catch (error) {
    console.error('Test Workflow Error:', error);
    res.status(500).json({ error: 'Failed to test workflow' });
  }
});

module.exports = router;
