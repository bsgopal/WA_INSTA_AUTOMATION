// renic-automation-backend/models/QuickReply.js
const mongoose = require('mongoose');

const QuickReplySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['GREETING', 'INQUIRY', 'PAYMENT', 'DELIVERY', 'COMPLAINT', 'FOLLOW_UP', 'CLOSING', 'OTHER'],
    default: 'OTHER'
  },
  
  shortcut: {
    type: String,
    trim: true
  },
  
  platforms: [{
    type: String,
    enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']
  }],
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  lastUsedAt: Date,
  
  isActive: {
    type: Boolean,
    default: true
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
QuickReplySchema.index({ userId: 1, category: 1 });
QuickReplySchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('QuickReply', QuickReplySchema);
