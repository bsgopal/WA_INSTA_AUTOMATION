// renic-automation-backend/models/ResponseRule.js
const mongoose = require('mongoose');

const MessageBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['TEXT', 'CARD', 'BUTTONS', 'LIST', 'RELATED_QUESTIONS'],
    required: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const ResponseRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  triggerType: {
    type: String,
    enum: ['INTENT', 'KEYWORD', 'EXACT_MATCH'],
    default: 'INTENT'
  },
  triggerValue: {
    type: String,
    required: true,
    trim: true,
    description: 'Intent category (e.g. general_inquiry), comma-separated keywords, or exact text'
  },
  messageBlocks: [MessageBlockSchema],
  actionType: {
    type: String,
    enum: ['SEND_TEXT', 'SEND_TEMPLATE', 'TRIGGER_WORKFLOW', 'HUMAN_HANDOVER'],
    default: 'SEND_TEXT'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: false
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

ResponseRuleSchema.index({ userId: 1, triggerType: 1 });
ResponseRuleSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('ResponseRule', ResponseRuleSchema);
