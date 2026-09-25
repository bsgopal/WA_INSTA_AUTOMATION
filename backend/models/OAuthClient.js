const mongoose = require('mongoose');

const OAuthClientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientSecretHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Primary ERP / API Connector'
  },
  scopes: {
    type: [String],
    default: [
      'messages:send',
      'messages:read',
      'catalog:read',
      'templates:read',
      'customers:read',
      'customers:write'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.OAuthClient || mongoose.model('OAuthClient', OAuthClientSchema);
