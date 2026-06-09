// renic-automation-backend/models/Analytics.js
const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Overview Metrics
  totalMessagesSent: {
    type: Number,
    default: 0
  },
  totalMessagesDelivered: {
    type: Number,
    default: 0
  },
  totalMessagesRead: {
    type: Number,
    default: 0
  },
  totalMessagesFailed: {
    type: Number,
    default: 0
  },
  
  // Channel Breakdown
  channelMetrics: {
    whatsapp: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    instagram: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    sms: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    },
    email: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  
  // Language Breakdown
  languageMetrics: {
    en: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    hi: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    ta: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    te: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    mr: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    gu: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    kn: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    ml: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } },
    pa: { sent: { type: Number, default: 0 }, delivered: { type: Number, default: 0 } }
  },
  
  // Message Type Performance
  messageTypeMetrics: {
    WELCOME: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    ORDER_CONFIRMATION: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    SHIPPING_UPDATE: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    DELIVERY_NOTIFICATION: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    PRODUCT_RECOMMENDATION: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    DISCOUNT_OFFER: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    BIRTHDAY_WISH: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    RE_ENGAGEMENT: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } }
  },
  
  // Segment Performance
  segmentMetrics: {
    VIP: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    LOYAL: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    REGULAR: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    AT_RISK: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    INACTIVE: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    LOST: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    NEW: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } }
  },
  
  // Engagement Metrics
  totalClicks: {
    type: Number,
    default: 0
  },
  totalConversions: {
    type: Number,
    default: 0
  },
  conversionValue: {
    type: Number,
    default: 0
  },
  
  // Calculated Rates
  deliveryRate: Number,
  readRate: Number,
  clickRate: Number,
  conversionRate: Number,
  
  // Sentiment Analysis
  sentimentMetrics: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  
  // Customer Metrics
  newCustomersAdded: {
    type: Number,
    default: 0
  },
  customersEngaged: {
    type: Number,
    default: 0
  },
  
  // Campaigns Run
  campaignsRun: {
    type: Number,
    default: 0
  },
  
  // Cost Metrics
  estimatedCost: {
    type: Number,
    default: 0
  },
  
  // Regional Breakdown
  regionalMetrics: {
    North: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    South: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    East: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    West: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },
    Northeast: { sent: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Indexes
AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);