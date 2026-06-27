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

// Helper to compile visual builder layout to flat workflow steps
const compileConditionalSteps = (body) => {
  const conditions = body.conditions || [];
  const responseCards = body.responseCards || [];
  const defaultCard = body.defaultCard || null;
  const steps = [];

  // Compile conditions
  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i];
    const isLast = i === conditions.length - 1;
    
    steps.push({
      id: cond.id,
      type: 'CONDITION',
      name: cond.itemTitle ? `Is ${cond.itemTitle}?` : 'Check Selection',
      config: {
        field: cond.field || 'selectedItemId',
        operator: cond.operator || 'equals',
        value: cond.value
      },
      nextStepId: cond.responseCardId,
      alternateStepId: isLast ? (defaultCard ? 'default' : null) : conditions[i + 1].id
    });
  }

  // Compile response cards
  for (const card of responseCards) {
    steps.push({
      id: card.id,
      type: card.type || 'SEND_MESSAGE',
      name: card.title || 'Send Message',
      config: {
        channel: 'whatsapp',
        template: card.config?.message || '',
        mediaUrl: card.config?.mediaUrl || '',
        buttonUrl: card.config?.buttonUrl || '',
        buttonLabel: card.config?.buttonLabel || '',
        ruleId: card.config?.ruleId || '',
        templateId: card.config?.templateId || '',
        quickReplyId: card.config?.quickReplyId || '',
      },
      nextStepId: null
    });
  }

  // Compile default card
  if (defaultCard) {
    steps.push({
      id: 'default',
      type: defaultCard.type || 'SEND_MESSAGE',
      name: defaultCard.title || 'Default Response',
      config: {
        channel: 'whatsapp',
        template: defaultCard.config?.message || '',
        mediaUrl: defaultCard.config?.mediaUrl || '',
        buttonUrl: defaultCard.config?.buttonUrl || '',
        buttonLabel: defaultCard.config?.buttonLabel || '',
        ruleId: defaultCard.config?.ruleId || '',
        templateId: defaultCard.config?.templateId || '',
        quickReplyId: defaultCard.config?.quickReplyId || '',
      },
      nextStepId: null
    });
  }

  return steps;
};

// ============ CREATE CONDITIONAL WORKFLOW ============
router.post('/conditional', [
  body('name').notEmpty().trim(),
  body('trigger').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Compile frontend conditions/cards into schema steps
    const steps = compileConditionalSteps(req.body);

    const workflow = new Workflow({
      ...req.body,
      steps,
      userId: req.user.id
    });

    await workflow.save();
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Create Conditional Workflow Error:', error);
    res.status(500).json({ error: 'Failed to create workflow', details: error.message });
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
    let updatePayload = { ...req.body };

    // If updating visual builder layout, re-compile flat steps
    if (req.body.conditions || req.body.responseCards) {
      updatePayload.steps = compileConditionalSteps(req.body);
    }

    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...updatePayload, updatedAt: Date.now() },
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
  body('customerId').optional()
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

    let customerId = req.body.customerId;
    if (!customerId) {
      const Customer = require('../models/Customer');
      const defaultCustomer = await Customer.findOne({ userId: req.user.id });
      if (defaultCustomer) {
        customerId = defaultCustomer._id;
      } else {
        const stubCustomer = await Customer.create({
          userId: req.user.id,
          firstName: 'Test',
          lastName: 'User',
          phone: '+15555555555',
          whatsappNumber: '+15555555555',
          preferredChannel: 'whatsapp'
        });
        customerId = stubCustomer._id;
      }
    }

    // Execute in test mode (don't update stats) with selection context
    const result = await workflowEngine.executeWorkflow(
      workflow._id,
      customerId,
      {
        testMode: true,
        selectedItemId: req.body.selectedItemId,
        selectedItemTitle: req.body.selectedItemTitle,
        ...(req.body.context || {})
      }
    );

    res.json({
      success: result.success,
      executionTrace: result.trace ? result.trace.map(t => ({
        stepName: t.name,
        type: t.type,
        status: t.success ? 'success' : 'error'
      })) : [],
      messageToBeSent: result.trace ? (result.trace.find(t => t.type === 'SEND_MESSAGE')?.data?.messageText || '') : '',
      branchTaken: result.trace ? (result.trace.find(t => t.type === 'CONDITION')?.conditionMet ? 'Yes Branch' : 'No Branch') : '',
      message: 'Workflow test completed'
    });
  } catch (error) {
    console.error('Test Workflow Error:', error);
    res.status(500).json({ error: 'Failed to test workflow' });
  }
});

module.exports = router;
