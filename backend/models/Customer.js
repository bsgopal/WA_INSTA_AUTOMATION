// renic-automation-backend/models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  whatsappNumber: {
    type: String
  },
  instagramHandle: {
    type: String
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
    default: 'en'
  },
  region: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'Northeast']
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipcode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  dateOfBirth: Date,
  anniversary: Date,
  
  // RFM Scoring
  rfmSegment: {
    type: String,
    enum: ['VIP', 'LOYAL', 'REGULAR', 'AT_RISK', 'INACTIVE', 'LOST', 'NEW'],
    default: 'NEW'
  },
  rfmScore: {
    recency: Number,
    frequency: Number,
    monetary: Number,
    overall: Number
  },
  
  // Loyalty
  loyaltyTier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'],
    default: 'BRONZE'
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // Engagement
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: Date,
  averageOrderValue: {
    type: Number,
    default: 0
  },
  
  // Communication
  optedIn: {
    whatsapp: {
      type: Boolean,
      default: true
    },
    instagram: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    }
  },
  optOutReason: String,
  optOutDate: Date,
  
  // Interaction History
  lastMessageSentDate: Date,
  lastMessageType: String,
  messagesSentCount: {
    type: Number,
    default: 0
  },
  messagesReadCount: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  
  // Purchase History (References)
  purchaseHistory: [{
    orderId: String,
    date: Date,
    amount: Number,
    items: [String],
    status: String
  }],
  
  // Preferences
  preferredChannel: {
    type: String,
    enum: ['whatsapp', 'instagram', 'sms', 'email'],
    default: 'whatsapp'
  },
  
  // Tags & Notes
  tags: [String],
  notes: String,
  
  // Metadata
  customFields: mongoose.Schema.Types.Mixed,
  importedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for faster queries
CustomerSchema.index({ userId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ userId: 1, email: 1 });
CustomerSchema.index({ userId: 1, rfmSegment: 1 });
CustomerSchema.index({ userId: 1, language: 1 });
CustomerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Customer', CustomerSchema);