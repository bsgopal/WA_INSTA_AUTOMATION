// renic-automation-backend/models/ConversationMessage.js
const mongoose = require('mongoose');

const ConversationMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  
  // Message Content
  content: {
    type: String,
    required: true
  },
  
  messageType: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'TEMPLATE'],
    default: 'TEXT'
  },
  
  // Media Information
  media: {
    url: String,
    type: String,
    size: Number,
    mimeType: String
  },
  
  // Sender Information
  sender: {
    type: {
      type: String,
      enum: ['CUSTOMER', 'TEAM', 'SYSTEM'],
      required: true
    },
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    avatar: String
  },
  
  // Platform Information
  platform: {
    type: String,
    enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
    required: true
  },
  
  platformMessageId: String,
  
  // Message Status
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING'],
    default: 'SENT'
  },
  
  // Linked Messages (for synced conversations)
  linkedMessages: [{
    platform: String,
    platformMessageId: String,
    status: String
  }],
  
  // Reactions
  reactions: [{
    emoji: String,
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: Date
  }],
  
  // Reply To
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConversationMessage'
  },
  
  // AI Analysis
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE']
    },
    category: String,
    suggestedReply: String,
    confidence: Number
  },
  
  // Metadata
  isAutoResponse: {
    type: Boolean,
    default: false
  },

  widgetData: mongoose.Schema.Types.Mixed,

  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
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
ConversationMessageSchema.index({ conversationId: 1, createdAt: -1 });
ConversationMessageSchema.index({ platform: 1, platformMessageId: 1 });
ConversationMessageSchema.index({ 'sender.type': 1, createdAt: -1 });

module.exports = mongoose.model('ConversationMessage', ConversationMessageSchema);
