// renic-automation-backend/models/Template.js
const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
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
      'CUSTOM'
    ],
    required: true
  },
  
  // Multi-language support (supports en, hi, ta, te, kn, ml, mr, gu, bn, pa, or, as, ur, etc.)
  translations: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Content
  content: {
    type: String,
    required: true,
    description: 'Default content (usually English)'
  },
  
  // Message Blocks for Q&A/Rich Layout
  messageBlocks: [{
    type: String,
    config: mongoose.Schema.Types.Mixed
  }],
  
  // Template Type
  type: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'QA_BLOCKS', 'INTERACTIVE'],
    default: 'TEXT'
  },
  
  // Template Format
  format: {
    type: String,
    enum: ['TEXT', 'QA', 'RICH'],
    default: 'TEXT'
  },
  // Target Dispatch Engine (Meta official vs Docker WAHA vs Both)
  targetEngine: {
    type: String,
    enum: ['META', 'DOCKER', 'BOTH'],
    default: 'BOTH'
  },
  // Example: {{customer_name}}, {{order_id}}, {{discount_percentage}}
  variables: [{
    name: String,
    description: String,
    example: String,
    required: Boolean
  }],
  
  // Channels supported
  supportedChannels: {
    type: [String],
    enum: ['whatsapp', 'instagram', 'sms', 'email'],
    required: true
  },
  
  // Media
  mediaUrl: String,
  mediaType: String, // image, video, document
  mediaPreviewData: String, // base64 data URL - reliable for Meta Cloud API
  mediaMimeType: String,
  mediaFileName: String,
  
  // AI Configuration
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiModel: String,
  aiPrompt: String,
  
  // Personalization Settings
  personalizationLevel: {
    type: String,
    enum: ['NONE', 'BASIC', 'ADVANCED'],
    default: 'BASIC'
  },
  
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  
  // Performance Metrics
  averageOpenRate: Number,
  averageClickRate: Number,
  averageConversionRate: Number,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Approval Workflow
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Tags & Notes
  tags: [String],
  notes: String,
  
  // Preview Versions
  variants: [{
    language: String,
    content: String,
    mediaUrl: String
  }],
  
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
TemplateSchema.index({ userId: 1, category: 1 });
TemplateSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Template', TemplateSchema);