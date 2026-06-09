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
  
  // Trigger Configuration
  trigger: {
    type: {
      type: String,
      enum: ['MANUAL', 'SCHEDULED', 'EVENT', 'WEBHOOK', 'CUSTOMER_ACTION'],
      required: true
    },
    event: String, // 'customer_created', 'message_received', 'purchase_made', etc.
    schedule: {
      frequency: String, // 'daily', 'weekly', 'monthly'
      time: String, // HH:MM
      dayOfWeek: Number, // 0-6
      dayOfMonth: Number, // 1-31
      timezone: String
    },
    conditions: [{
      field: String,
      operator: String, // 'equals', 'contains', 'greater_than', etc.
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Workflow Steps
  steps: [{
    id: String,
    type: {
      type: String,
      enum: ['SEND_MESSAGE', 'WAIT', 'CONDITION', 'UPDATE_CUSTOMER', 'TAG', 'WEBHOOK', 'AI_ACTION'],
      required: true
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
  
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
    default: 'DRAFT'
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
WorkflowSchema.index({ userId: 1, status: 1 });
WorkflowSchema.index({ 'trigger.type': 1, status: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
