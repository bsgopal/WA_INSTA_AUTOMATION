// renic-automation-backend/models/ConversationLog.js
const mongoose = require('mongoose');

const ConversationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },

  responseRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResponseRule',
    required: false
  },

  // Interaction Context for workflow routing
  interactionContext: {
    type: {
      enum: ['LIST_SELECTION', 'BUTTON_PRESS', 'QUICK_REPLY', 'TEXT_INPUT'],
      default: 'TEXT_INPUT'
    },
    selectedItemId: String,  // Row ID selected from LIST (e.g., "row_1", "row_2")
    selectedItemTitle: String,
    selectedItemDescription: String,
    listSectionTitle: String,
    listTitle: String,
    selectedButtonId: String,
    selectedButtonLabel: String,
    quickReplyId: String,
    variablesContext: mongoose.Schema.Types.Mixed
  },

  // Event Type
  type: {
    type: String,
    enum: [
      'MESSAGE_RECEIVED',
      'MESSAGE_PROCESSED',
      'AI_RESPONSE_SENT',
      'LEAD_ESCALATED',
      'OWNER_TOOK_OVER',
      'CONVERSATION_CLOSED',
      'COMPLAINT_LOGGED',
      'COMPLAINT_RESOLVED',
      'CONSULTATION_BOOKED',
      'ORDER_PLACED',
      'FOLLOW_UP_SENT'
    ],
    required: true,
    default: 'MESSAGE_RECEIVED'
  },

  // Event Details
  details: {
    intent: String,
    leadScore: Number,
    sentiment: String,
    language: String,
    messageContent: String,
    reason: String,
    action: String
  },

  // Metadata
  channel: {
    type: String,
    enum: ['whatsapp', 'instagram', 'sms', 'email'],
    default: 'whatsapp'
  },

  tags: [String],
  notes: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for optimized query performance
// Index for workflow routing queries - find all LIST selections for a specific response rule
ConversationLogSchema.index({ 
  responseRuleId: 1, 
  'interactionContext.type': 1,
  createdAt: -1
});

// Index for LIST item tracking - query logs by selectedItemId
ConversationLogSchema.index({ 
  'interactionContext.selectedItemId': 1,
  createdAt: -1
});

// Index for user and customer conversation history with timestamp
ConversationLogSchema.index({ 
  userId: 1, 
  customerId: 1, 
  createdAt: -1 
});

// Index for event type filtering with timestamp
ConversationLogSchema.index({ 
  type: 1, 
  createdAt: -1 
});

// Index for conversation-based queries
ConversationLogSchema.index({ 
  conversationId: 1 
});

// Index for combined workflow and interaction context queries
ConversationLogSchema.index({
  responseRuleId: 1,
  'interactionContext.type': 1,
  'interactionContext.selectedItemId': 1
});

module.exports = mongoose.model('ConversationLog', ConversationLogSchema);
