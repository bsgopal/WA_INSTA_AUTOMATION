// renic-automation-backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
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
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  
  // Message Content
  content: {
    type: String,
    required: true
  },
  originalContent: String, // Before variables replacement
  messageType: {
    type: String,
    enum: [
      'WELCOME',
      'ORDER_CONFIRMATION',
      'SHIPPING_UPDATE',
      'DELIVERY_NOTIFICATION',
      'PRODUCT_RECOMMENDATION',
      'DISCOUNT_OFFER',
      'BIRTHDAY_WISH',
      'RE_ENGAGEMENT',
      'FEEDBACK_REQUEST',
      'CART_ABANDONMENT',
      'MANUAL'
    ],
    required: true
  },
  
  // Channel & Language
  channel: {
    type: String,
    enum: ['whatsapp', 'instagram', 'sms', 'email'],
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
    default: 'en'
  },
  
  // Status & Delivery
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED'],
    default: 'PENDING'
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // External IDs
  externalMessageId: String, // Twilio/Meta ID
  externalStatusCode: String,
  
  // Media
  mediaUrl: String,
  mediaType: String, // image, video, document
  
  // AI Related
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiModel: String,
  aiPrompt: String,
  
  // Engagement Metrics
  clicked: {
    type: Boolean,
    default: false
  },
  clickedAt: Date,
  clickUrl: String,
  
  // A/B Testing
  abTestVariant: String,
  abTestId: mongoose.Schema.Types.ObjectId,
  
  // Response (if any)
  hasResponse: {
    type: Boolean,
    default: false
  },
  responseText: String,
  respondedAt: Date,
  
  // Sentiment
  sentiment: {
    type: String,
    enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
    default: null
  },
  sentimentScore: Number,
  
  // Metadata
  variables: mongoose.Schema.Types.Mixed,
  widgetData: mongoose.Schema.Types.Mixed,
  tags: [String],
  notes: String,
  
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
MessageSchema.index({ userId: 1, status: 1 });
MessageSchema.index({ customerId: 1, createdAt: -1 });
MessageSchema.index({ campaignId: 1 });
MessageSchema.index({ channel: 1, status: 1 });
MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
