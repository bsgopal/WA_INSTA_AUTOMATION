const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  customerCode: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['RECHARGE', 'MESSAGE_CONSUMPTION', 'REFUND', 'MANUAL_ADJUSTMENT'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  messagesCount: {
    type: Number,
    default: 0
  },
  messageRate: {
    type: Number,
    default: 0.90
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  performedBy: {
    userId: { type: String, default: '' },
    name: { type: String, default: 'Client User' },
    mobile: { type: String, default: '' },
    role: { type: String, default: 'CLIENT' }
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'PENDING', 'FAILED'],
    default: 'SUCCESS'
  },
  timestampIst: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
