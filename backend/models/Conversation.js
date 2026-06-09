// renic-automation-backend/models/Conversation.js
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
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
  
  // Conversation Metadata
  title: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'PENDING', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_TEAM'],
    default: 'ACTIVE'
  },
  
  // Platform Information
  platforms: [{
    type: {
      type: String,
      enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
      required: true
    },
    platformId: String, // Instagram DM ID, WhatsApp number, etc.
    isLinked: {
      type: Boolean,
      default: false
    },
    linkedAt: Date,
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Primary Platform (where conversation started)
  primaryPlatform: {
    type: String,
    enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
    required: true
  },
  
  // Team Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Conversation Tags
  tags: [String],
  
  // Message Count
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Last Message Info
  lastMessage: {
    content: String,
    sender: {
      type: String,
      enum: ['CUSTOMER', 'TEAM']
    },
    timestamp: Date,
    platform: String
  },
  
  // Conversation Metadata
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  
  category: {
    type: String,
    enum: ['INQUIRY', 'SUPPORT', 'COMPLAINT', 'FEEDBACK', 'SALES', 'OTHER'],
    default: 'INQUIRY'
  },
  
  // Auto-Response Settings
  autoReplyEnabled: {
    type: Boolean,
    default: true
  },
  autoResponseSent: {
    type: Boolean,
    default: false
  },
  autoResponseTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  
  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now
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
ConversationSchema.index({ userId: 1, status: 1 });
ConversationSchema.index({ customerId: 1, userId: 1 });
ConversationSchema.index({ assignedTo: 1, status: 1 });
ConversationSchema.index({ lastActivityAt: -1 });
ConversationSchema.index({ 'platforms.platformId': 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
