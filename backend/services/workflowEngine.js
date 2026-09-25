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

    if (!workflow || (workflow.status !== 'ACTIVE' && !context.testMode)) {
      throw new Error('Workflow not found or not active');
    }

    if (!customer) {
      throw new Error('Customer not found');
    }

    console.log(`Executing workflow ${workflow.name} for customer ${customer.firstName} ${customer.lastName} (testMode: ${!!context.testMode})`);

    // Start from first step
    let currentStepId = workflow.steps[0]?.id;
    let executionContext = { ...context, customer };
    const trace = [];

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      
      if (!step) break;

      console.log(`Executing step: ${step.name} (${step.type})`);

      const result = await executeStep(step, customer, executionContext, workflow);

      trace.push({
        stepId: step.id,
        name: step.name,
        type: step.type,
        success: result.success,
        conditionMet: result.conditionMet,
        data: result.data,
        error: result.error
      });

      if (!result.success) {
        if (!context.testMode) {
          workflow.stats.failedExecutions++;
          await workflow.save();
        }

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

    if (!context.testMode) {
      // Update workflow stats
      workflow.stats.totalExecutions++;
      workflow.stats.successfulExecutions++;
      workflow.stats.lastExecutedAt = new Date();
      await workflow.save();
    }

    return {
      success: true,
      workflowId: workflow._id,
      customerId: customer._id,
      trace,
      finalContext: executionContext
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
      case 'RESPONSE_RULE':
      case 'SEND_TEMPLATE':
      case 'QUICK_REPLY':
        return await executeSendMessage(step, customer, context);

      case 'IF_ELSE':
        return await executeIfElse(step, customer, context);

      case 'PARALLEL_SPLIT':
        return await executeParallelSplit(step, customer, context);

      case 'WAIT':
        return await executeWait(step, context);

      case 'CONDITION':
        return await executeCondition(step, customer, context);

      case 'UPDATE_CUSTOMER':
        return await executeUpdateCustomer(step, customer, context);

      case 'TAG':
        return await executeTag(step, customer, context);

      case 'AI_ACTION':
        return await executeAIAction(step, customer, context);

      case 'WEBHOOK':
        return await executeWebhook(step, customer, context);

      case 'ASK_DATA':
        return await executeAskData(step, customer, context);

      default:
        return { success: false, error: 'Unknown step type' };
    }
  } catch (error) {
    console.error(`Step Execution Error (${step.type}):`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Execute SEND_MESSAGE, RESPONSE_RULE, SEND_TEMPLATE or QUICK_REPLY step
 */
const executeSendMessage = async (step, customer, context) => {
  try {
    const WhatsAppService = require('./WhatsAppService');
    const InstagramService = require('./InstagramService');
    const ResponseRule = require('../models/ResponseRule');
    const AIChatHandler = require('./aiChatHandler');

    let channel = step.config?.channel || 'whatsapp';
    let template = step.config?.template || step.config?.message || step.config?.value || '';
    let mediaUrl = step.config?.mediaUrl || null;
    let buttons = step.config?.buttons || null;
    let list = step.config?.list || null;
    let ruleId = step.config?.ruleId || (step.type === 'RESPONSE_RULE' ? step.id || step.config?.id : null);
    let templateId = step.config?.templateId || (step.type === 'SEND_TEMPLATE' ? step.id || step.config?.id : null);
    let quickReplyId = step.config?.quickReplyId || (step.type === 'QUICK_REPLY' ? step.id || step.config?.id : null);

    // If templateId is configured, load the template content
    if (templateId || step.type === 'SEND_TEMPLATE') {
      const rId = templateId || step.config?.templateId;
      if (rId) {
        const Template = require('../models/Template');
        const tpl = await Template.findById(rId);
        if (tpl) {
          template = tpl.content;
        }
      }
    }
    // If quickReplyId is configured, load the quick reply content
    else if (quickReplyId || step.type === 'QUICK_REPLY') {
      const rId = quickReplyId || step.config?.quickReplyId;
      if (rId) {
        const QuickReply = require('../models/QuickReply');
        const qr = await QuickReply.findById(rId);
        if (qr) {
          template = qr.content;
        }
      }
    }
    // If ruleId is configured (or this is a RESPONSE_RULE node), load the interactive blocks
    else if (ruleId || step.type === 'RESPONSE_RULE') {
      const rId = ruleId || step.config?.ruleId;
      if (rId) {
        const rule = await ResponseRule.findById(rId);
        if (rule) {
          const payload = AIChatHandler.buildRuleResponsePayload(rule);
          template = payload.responseText;
          mediaUrl = payload.responseImages && payload.responseImages.length > 0 ? payload.responseImages[0] : mediaUrl;
          buttons = payload.buttons || null;
          list = payload.list || null;
        }
      }
    }

    // If buttonUrl is configured, add a URL link button (with fallback label)
    if (!buttons && step.config?.buttonUrl) {
      buttons = [{
        label: step.config.buttonLabel || 'Link',
        value: step.config.buttonUrl,
        type: 'URL',
        actionType: 'URL'
      }];
    }

    // Personalize message
    const personalizedMessage = await aiSmartFeatures.personalizeMessage(template, customer, context);

    let result;

    if (context.testMode) {
      result = { success: true, externalMessageId: 'simulated_id' };
    } else {
      if (channel === 'whatsapp') {
        const targetNumber = customer.whatsappNumber || customer.phone;
        result = await WhatsAppService.sendMessage(
          targetNumber,
          personalizedMessage,
          {
            mediaUrl,
            buttons,
            list,
            userId: customer.userId
          }
        );
      } else if (channel === 'instagram') {
        result = await InstagramService.sendDirectMessage(
          customer.instagramHandle || customer.phone,
          personalizedMessage,
          { mediaUrl }
        );
      }
    }

    return {
      success: result?.success !== false,
      data: {
        messageSent: true,
        messageId: result?.externalMessageId || 'simulated_id',
        messageText: personalizedMessage,
        channel,
        buttons,
        list
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute IF_ELSE conditional gateway step
 */
const executeIfElse = async (step, customer, context) => {
  try {
    const config = step.config || {};
    const variable = config.variable || 'customer_tag';
    const operator = config.operator || '=';
    const targetValue = String(config.value || '').trim().toLowerCase();

    let actualValue = '';
    if (variable === 'customer_tag' || variable === 'tag') {
      actualValue = (customer.tags || []).join(' ').toLowerCase();
    } else if (variable === 'city') {
      actualValue = String(customer.city || customer.customFields?.city || '').toLowerCase();
    } else if (variable === 'order_count') {
      actualValue = String(customer.ordersCount || customer.totalOrders || 0);
    } else if (variable === 'last_message') {
      actualValue = String(context.incomingMessage || '').toLowerCase();
    } else {
      actualValue = String(customer[variable] || customer.customFields?.[variable] || '').toLowerCase();
    }

    let conditionMet = false;
    if (operator === '=') {
      conditionMet = actualValue.includes(targetValue) || actualValue === targetValue;
    } else if (operator === '!=') {
      conditionMet = !actualValue.includes(targetValue);
    } else if (operator === 'contains') {
      conditionMet = actualValue.includes(targetValue);
    } else if (operator === '>') {
      conditionMet = Number(actualValue) > Number(targetValue);
    }

    const branchToExecute = conditionMet ? config.trueBranch : config.falseBranch;
    let branchResult = null;
    if (branchToExecute && (branchToExecute.message || branchToExecute.template)) {
      const msg = branchToExecute.message || branchToExecute.template;
      const personalized = await aiSmartFeatures.personalizeMessage(msg, customer, context);
      const res = await WhatsAppService.sendMessage(customer.whatsappNumber || customer.phone, personalized, {
        userId: customer.userId
      });
      branchResult = { messageSent: true, messageText: personalized, res };
    }

    return {
      success: true,
      conditionMet,
      data: {
        branch: conditionMet ? 'TRUE_BRANCH' : 'FALSE_BRANCH',
        result: branchResult
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Execute PARALLEL_SPLIT concurrent actions step
 */
const executeParallelSplit = async (step, customer, context) => {
  try {
    const config = step.config || {};
    const branchA = config.branchA;
    const branchB = config.branchB;

    const promises = [];

    // Parallel Action A
    if (branchA && branchA.message) {
      promises.push((async () => {
        const msg = await aiSmartFeatures.personalizeMessage(branchA.message, customer, context);
        return WhatsAppService.sendMessage(customer.whatsappNumber || customer.phone, msg, {
          userId: customer.userId
        });
      })());
    }

    // Parallel Action B
    if (branchB && branchB.message) {
      promises.push((async () => {
        if (branchB.actionType === 'WEBHOOK' || branchB.webhookUrl) {
          const fetch = require('node-fetch');
          return fetch(branchB.webhookUrl || 'https://httpbin.org/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer, context, action: branchB.label, message: branchB.message })
          });
        } else {
          const msg = await aiSmartFeatures.personalizeMessage(branchB.message, customer, context);
          return WhatsAppService.sendMessage(customer.whatsappNumber || customer.phone, msg, {
            userId: customer.userId
          });
        }
      })());
    }

    const results = await Promise.allSettled(promises);

    return {
      success: true,
      data: {
        parallelActionsExecuted: results.length,
        results
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Execute WEBHOOK step
 */
const executeWebhook = async (step, customer, context) => {
  try {
    const fetch = require('node-fetch');
    const url = step.config?.url || step.config?.webhookUrl;
    if (!url) return { success: true, data: { skipped: true } };

    const res = await fetch(url, {
      method: step.config?.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, context, timestamp: new Date() })
    });

    return { success: res.ok, data: { status: res.status } };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Execute ASK_DATA step
 */
const executeAskData = async (step, customer, context) => {
  try {
    const question = step.config?.question || 'Please share your details:';
    const personalized = await aiSmartFeatures.personalizeMessage(question, customer, context);
    await WhatsAppService.sendMessage(customer.whatsappNumber || customer.phone, personalized, {
      userId: customer.userId
    });
    return { success: true, data: { asked: question } };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Execute WAIT step
 */
const executeWait = async (step, context) => {
  try {
    const { duration, unit } = step.config; // duration: number, unit: 'minutes', 'hours', 'days'

    if (context && context.testMode) {
      return { success: true, data: { waited: true, duration: `${duration} ${unit}` } };
    }

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

    // Retrieve from context if present, fallback to customer
    let fieldValue = context[field] !== undefined ? context[field] : customer[field];

    // Support nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      fieldValue = parts.reduce((obj, key) => obj?.[key], context) !== undefined
        ? parts.reduce((obj, key) => obj?.[key], context)
        : parts.reduce((obj, key) => obj?.[key], customer);
    }

    let conditionMet = false;

    switch (operator) {
      case 'equals':
        conditionMet = String(fieldValue).toLowerCase().trim() === String(value).toLowerCase().trim();
        break;
      case 'not_equals':
        conditionMet = String(fieldValue).toLowerCase().trim() !== String(value).toLowerCase().trim();
        break;
      case 'contains':
        conditionMet = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        break;
      case 'greater_than':
        conditionMet = Number(fieldValue) > Number(value);
        break;
      case 'less_than':
        conditionMet = Number(fieldValue) < Number(value);
        break;
      case 'in':
        if (Array.isArray(value)) {
          conditionMet = value.map(v => String(v).toLowerCase().trim()).includes(String(fieldValue).toLowerCase().trim());
        } else if (typeof value === 'string') {
          const arr = value.split(',').map(v => String(v).toLowerCase().trim());
          conditionMet = arr.includes(String(fieldValue).toLowerCase().trim());
        }
        break;
    }

    return {
      success: true,
      conditionMet,
      data: { conditionResult: conditionMet, evaluatedValue: fieldValue }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Execute UPDATE_CUSTOMER step
 */
const executeUpdateCustomer = async (step, customer, context) => {
  try {
    const { updates } = step.config;

    if (context && context.testMode) {
      return { success: true, data: { customerUpdated: true, simulatedUpdates: updates } };
    }

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
const executeTag = async (step, customer, context) => {
  try {
    const { action, tags } = step.config; // action: 'add' or 'remove'

    if (context && context.testMode) {
      return { success: true, data: { tagsUpdated: true, simulatedAction: action, simulatedTags: tags } };
    }

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

    if (context && context.testMode) {
      return { success: true, data: { aiResult: `simulated_ai_result_for_${action}` } };
    }

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

/**
 * Trigger workflows based on Response Rule List item selection
 */
const triggerResponseRuleWorkflows = async (responseRuleId, eventData) => {
  try {
    const workflows = await Workflow.find({
      status: 'ACTIVE',
      'trigger.type': 'RESPONSE_RULE_SELECTION',
      'trigger.responseRuleId': responseRuleId
    });

    console.log(`Triggering RESPONSE_RULE_SELECTION workflows for rule ${responseRuleId}. Found ${workflows.length} workflows.`);

    const results = [];

    for (const workflow of workflows) {
      const result = await executeWorkflow(
        workflow._id,
        eventData.customerId,
        eventData // Passes selectedItemId, selectedItemTitle, etc.
      );

      results.push({
        workflowId: workflow._id,
        workflowName: workflow.name,
        ...result
      });
    }

    return results;
  } catch (error) {
    console.error('Trigger Response Rule Workflows Error:', error.message);
    return [];
  }
};

module.exports = {
  executeWorkflow,
  executeStep,
  checkTriggerConditions,
  triggerWorkflowsByEvent,
  triggerResponseRuleWorkflows
};
