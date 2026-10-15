// renic-automation-backend/models/License.js
const mongoose = require('mongoose');

const LicenseSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'ADMIN'
  },
  planTier: {
    type: String,
    default: 'basic'
  },
  licenseStart: {
    type: Date,
    default: Date.now
  },
  licenseEnd: {
    type: Date
  },
  otpHash: {
    type: String
  },
  otpExpire: {
    type: Date
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  subdomain: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  customerCode: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  billingCycle: {
    type: String,
    enum: ['1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR', 'LIFETIME'],
    default: '1_MONTH'
  },
  featurePermissions: {
    quickReplies: { type: Boolean, default: true },
    workflows: { type: Boolean, default: true },
    catalog: { type: Boolean, default: true },
    templates: { type: Boolean, default: true },
    responseRules: { type: Boolean, default: true },
    bulkBroadcast: { type: Boolean, default: true },
    aiAgent: { type: Boolean, default: false },
    metaCloudApi: { type: Boolean, default: true },
    exportReports: { type: Boolean, default: true }
  },
  limits: {
    maxContacts: { type: Number, default: 10000 },
    maxMonthlyMessages: { type: Number, default: 50000 },
    maxConcurrentSessions: { type: Number, default: 2 }
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('License', LicenseSchema);
