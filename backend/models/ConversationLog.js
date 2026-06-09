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
    required: true
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

// Indexes
ConversationLogSchema.index({ userId: 1, customerId: 1, createdAt: -1 });
ConversationLogSchema.index({ type: 1, createdAt: -1 });
ConversationLogSchema.index({ conversationId: 1 });

module.exports = mongoose.model('ConversationLog', ConversationLogSchema);
