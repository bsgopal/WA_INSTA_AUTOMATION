// renic-automation-backend/models/Workflow.js
const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  priority: {
    type: Number,
    default: 1
  },
  
  // Trigger Configuration
  trigger: {
    type: {
      type: String,
      default: 'KEYWORD'
    },
    keywords: [String],
    value: String,
    event: String, // 'customer_created', 'message_received', 'purchase_made', etc.
    schedule: {
      frequency: String, // 'daily', 'weekly', 'monthly'
      time: String, // HH:MM
      dayOfWeek: Number, // 0-6
      dayOfMonth: Number, // 1-31
      timezone: String
    },
    responseRuleId: String,
    responseRuleName: String,
    conditions: [{
      field: String,
      operator: String, // 'equals', 'contains', 'greater_than', etc.
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Workflow Steps (flat or sequential)
  steps: [{
    id: String,
    type: {
      type: String,
      default: 'SEND_MESSAGE'
    },
    name: String,
    config: mongoose.Schema.Types.Mixed,
    nextStepId: String,
    alternateStepId: String, // For conditional branching
    position: {
      x: Number,
      y: Number
    }
  }],
  
  // 2D Visual Flow Designer Nodes & Edges Graph
  nodes: [mongoose.Schema.Types.Mixed],
  edges: [mongoose.Schema.Types.Mixed],
  
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  
  // Execution Stats
  stats: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastExecutedAt: Date
  },
  
  // Settings
  settings: {
    maxExecutionsPerDay: Number,
    stopOnError: {
      type: Boolean,
      default: false
    },
    notifyOnError: {
      type: Boolean,
      default: true
    }
  },
  
  // Visual Builder Canvas State
  conditions: mongoose.Schema.Types.Mixed,
  responseCards: mongoose.Schema.Types.Mixed,
  defaultCard: mongoose.Schema.Types.Mixed,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
WorkflowSchema.index({ userId: 1, createdAt: -1 });
WorkflowSchema.index({ userId: 1, status: 1 });
WorkflowSchema.index({ 'trigger.type': 1, status: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
