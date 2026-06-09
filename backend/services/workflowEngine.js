// renic-automation-backend/services/workflowEngine.js
const Workflow = require('../models/Workflow');
const Customer = require('../models/Customer');
const WhatsAppService = require('./WhatsAppService');
const InstagramService = require('./InstagramService');
const aiSmartFeatures = require('./aiSmartFeatures');

// Helper: Delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a workflow for a specific customer
 */
const executeWorkflow = async (workflowId, customerId, context = {}) => {
  try {
    const workflow = await Workflow.findById(workflowId);
    const customer = await Customer.findById(customerId);

    if (!workflow || workflow.status !== 'ACTIVE') {
      throw new Error('Workflow not found or not active');
    }

    if (!customer) {
      throw new Error('Customer not found');
    }

    console.log(`Executing workflow ${workflow.name} for customer ${customer.firstName} ${customer.lastName}`);

    // Start from first step
    let currentStepId = workflow.steps[0]?.id;
    let executionContext = { ...context, customer };

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      
      if (!step) break;

      console.log(`Executing step: ${step.name} (${step.type})`);

      const result = await executeStep(step, customer, executionContext, workflow);

      if (!result.success) {
        workflow.stats.failedExecutions++;
        await workflow.save();

        if (workflow.settings.stopOnError) {
          throw new Error(`Step ${step.name} failed: ${result.error}`);
        }
      }

      // Determine next step
      if (step.type === 'CONDITION' && result.conditionMet === false) {
        currentStepId = step.alternateStepId;
      } else {
        currentStepId = step.nextStepId;
      }

      // Update context with step results
      executionContext = { ...executionContext, ...result.data };
    }

    // Update workflow stats
    workflow.stats.totalExecutions++;
    workflow.stats.successfulExecutions++;
    workflow.stats.lastExecutedAt = new Date();
    await workflow.save();

    return {
      success: true,
      workflowId: workflow._id,
      customerId: customer._id
    };
  } catch (error) {
    console.error('Workflow Execution Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute a single workflow step
 */
const executeStep = async (step, customer, context, workflow) => {
  try {
    switch (step.type) {
      case 'SEND_MESSAGE':
        return await executeSendMessage(step, customer, context);

      case 'WAIT':
        return await executeWait(step);

      case 'CONDITION':
        return await executeCondition(step, customer, context);

      case 'UPDATE_CUSTOMER':
        return await executeUpdateCustomer(step, customer);

      case 'TAG':
        return await executeTag(step, customer);

      case 'AI_ACTION':
        return await executeAIAction(step, customer, context);

      default:
        return { success: false, error: 'Unknown step type' };
    }
  } catch (error) {
    console.error(`Step Execution Error (${step.type}):`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Execute SEND_MESSAGE step
 */
const executeSendMessage = async (step, customer, context) => {
  try {
    const { channel, template, mediaUrl } = step.config;

    // Personalize message
    const personalizedMessage = await aiSmartFeatures.personalizeMessage(template, customer);

    let result;

    if (channel === 'whatsapp') {
      result = await WhatsAppService.sendMessage(
        customer.whatsappNumber,
        personalizedMessage,
        { mediaUrl }
      );
    } else if (channel === 'instagram') {
      result = await InstagramService.sendDirectMessage(
        customer.instagramHandle,
        personalizedMessage,
        { mediaUrl }
      );
    }

    return {
      success: result.success,
      data: { messageSent: true, messageId: result.externalMessageId }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute WAIT step
 */
const executeWait = async (step) => {
  try {
    const { duration, unit } = step.config; // duration: number, unit: 'minutes', 'hours', 'days'

    let milliseconds = 0;

    switch (unit) {
      case 'minutes':
        milliseconds = duration * 60 * 1000;
        break;
      case 'hours':
        milliseconds = duration * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = duration * 24 * 60 * 60 * 1000;
        break;
    }

    await delay(milliseconds);

    return { success: true, data: { waited: true } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute CONDITION step
 */
const executeCondition = async (step, customer, context) => {
  try {
    const { field, operator, value } = step.config;

    let fieldValue = customer[field];

    // Support nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      fieldValue = parts.reduce((obj, key) => obj?.[key], customer);
    }

    let conditionMet = false;

    switch (operator) {
      case 'equals':
        conditionMet = fieldValue === value;
        break;
      case 'not_equals':
        conditionMet = fieldValue !== value;
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(value);
        break;
      case 'greater_than':
        conditionMet = Number(fieldValue) > Number(value);
        break;
      case 'less_than':
        conditionMet = Number(fieldValue) < Number(value);
        break;
      case 'in':
        conditionMet = Array.isArray(value) && value.includes(fieldValue);
        break;
    }

    return {
      success: true,
      conditionMet,
      data: { conditionResult: conditionMet }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute UPDATE_CUSTOMER step
 */
const executeUpdateCustomer = async (step, customer) => {
  try {
    const { updates } = step.config;

    Object.keys(updates).forEach(key => {
      customer[key] = updates[key];
    });

    await customer.save();

    return { success: true, data: { customerUpdated: true } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute TAG step
 */
const executeTag = async (step, customer) => {
  try {
    const { action, tags } = step.config; // action: 'add' or 'remove'

    if (action === 'add') {
      customer.tags = [...new Set([...customer.tags, ...tags])];
    } else if (action === 'remove') {
      customer.tags = customer.tags.filter(tag => !tags.includes(tag));
    }

    await customer.save();

    return { success: true, data: { tagsUpdated: true } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute AI_ACTION step
 */
const executeAIAction = async (step, customer, context) => {
  try {
    const { action } = step.config;

    let result;

    switch (action) {
      case 'predict_churn':
        result = await aiSmartFeatures.predictChurnRisk(customer._id);
        break;

      case 'predict_ltv':
        result = await aiSmartFeatures.predictLifetimeValue(customer._id);
        break;

      case 'optimal_send_time':
        result = await aiSmartFeatures.predictOptimalSendTime(customer._id);
        break;

      default:
        return { success: false, error: 'Unknown AI action' };
    }

    return {
      success: true,
      data: { aiResult: result }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if workflow trigger conditions are met
 */
const checkTriggerConditions = async (workflow, eventData) => {
  try {
    if (!workflow.trigger.conditions || workflow.trigger.conditions.length === 0) {
      return true;
    }

    for (const condition of workflow.trigger.conditions) {
      const { field, operator, value } = condition;
      const fieldValue = eventData[field];

      let conditionMet = false;

      switch (operator) {
        case 'equals':
          conditionMet = fieldValue === value;
          break;
        case 'contains':
          conditionMet = String(fieldValue).includes(value);
          break;
        case 'greater_than':
          conditionMet = Number(fieldValue) > Number(value);
          break;
      }

      if (!conditionMet) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Trigger Condition Check Error:', error.message);
    return false;
  }
};

/**
 * Trigger workflows based on event
 */
const triggerWorkflowsByEvent = async (eventType, eventData) => {
  try {
    const workflows = await Workflow.find({
      status: 'ACTIVE',
      'trigger.type': 'EVENT',
      'trigger.event': eventType
    });

    const results = [];

    for (const workflow of workflows) {
      const conditionsMet = await checkTriggerConditions(workflow, eventData);

      if (conditionsMet) {
        const result = await executeWorkflow(
          workflow._id,
          eventData.customerId,
          eventData
        );

        results.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          ...result
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Trigger Workflows Error:', error.message);
    return [];
  }
};

module.exports = {
  executeWorkflow,
  executeStep,
  checkTriggerConditions,
  triggerWorkflowsByEvent
};
