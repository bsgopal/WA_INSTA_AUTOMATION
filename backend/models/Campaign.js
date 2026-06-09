// renic-automation-backend/models/Campaign.js
const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
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
  objective: {
    type: String,
    enum: ['AWARENESS', 'ENGAGEMENT', 'CONVERSION', 'RETENTION', 'FEEDBACK'],
    default: 'ENGAGEMENT'
  },
  
  // Campaign Type
  type: {
    type: String,
    enum: ['ONE_TIME', 'RECURRING', 'AUTOMATED', 'TRIGGERED'],
    default: 'ONE_TIME'
  },
  
  // Targeting
  targetAudience: {
    segments: [String], // ['VIP', 'LOYAL', 'NEW']
    languages: [String], // ['en', 'hi', 'ta']
    regions: [String], // ['North', 'South']
    loyaltyTiers: [String], // ['GOLD', 'DIAMOND']
    customFilter: mongoose.Schema.Types.Mixed
  },
  estimatedReach: {
    type: Number,
    default: 0
  },
  
  // Channels
  channels: {
    type: [String],
    enum: ['whatsapp', 'instagram', 'sms', 'email'],
    required: true
  },
  
  // Content
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  messageType: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
    default: 'en'
  },
  
  // Schedule
  scheduleType: {
    type: String,
    enum: ['IMMEDIATE', 'SCHEDULED', 'RECURRING', 'TRIGGERED'],
    default: 'IMMEDIATE'
  },
  scheduledAt: Date,
  recurringPattern: {
    frequency: String, // DAILY, WEEKLY, MONTHLY
    dayOfWeek: String,
    time: String, // HH:MM format
    timezone: String
  },
  
  // A/B Testing
  abTestEnabled: {
    type: Boolean,
    default: false
  },
  abTestVariants: [{
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    content: String,
    splitPercentage: Number,
    sent: Number,
    conversions: Number
  }],
  abTestWinner: String,
  
  // Throttling
  throttlingEnabled: {
    type: Boolean,
    default: true
  },
  throttleDelay: {
    type: Number,
    default: 1000, // milliseconds between messages
    description: 'Delay between sending messages to prevent rate limiting'
  },
  batchSize: {
    type: Number,
    default: 100, // Process 100 at a time
    description: 'Number of messages to send in each batch'
  },
  
  // Status & Execution
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'],
    default: 'DRAFT'
  },
  
  startedAt: Date,
  completedAt: Date,
  pausedAt: Date,
  
  // Performance Metrics
  totalTargets: {
    type: Number,
    default: 0
  },
  totalSent: {
    type: Number,
    default: 0
  },
  totalDelivered: {
    type: Number,
    default: 0
  },
  totalRead: {
    type: Number,
    default: 0
  },
  totalFailed: {
    type: Number,
    default: 0
  },
  totalClicked: {
    type: Number,
    default: 0
  },
  totalConverted: {
    type: Number,
    default: 0
  },
  
  // Calculated Metrics
  deliveryRate: Number,
  readRate: Number,
  clickRate: Number,
  conversionRate: Number,
  
  // Budget (if applicable)
  budgetLimit: Number,
  budgetSpent: {
    type: Number,
    default: 0
  },
  
  // Configuration
  retryFailedMessages: {
    type: Boolean,
    default: true
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Additional Settings
  unsubscribeEnabled: {
    type: Boolean,
    default: true
  },
  trackingEnabled: {
    type: Boolean,
    default: true
  },
  
  // Notes & Tags
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
CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Campaign', CampaignSchema);