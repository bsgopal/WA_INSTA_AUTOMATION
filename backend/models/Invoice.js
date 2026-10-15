const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  sNo: { type: Number, required: true },
  item: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  amount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    default: null
  },
  quotationNumber: {
    type: String,
    default: ''
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  gstin: {
    type: String,
    default: ''
  },
  
  // Dates & Status
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
  },
  status: {
    type: String,
    enum: ['PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
    default: 'UNPAID',
    index: true
  },

  // Line items & Pricing
  items: [invoiceItemSchema],
  currency: {
    type: String,
    default: 'INR'
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxPercent: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: function() {
      return this.totalAmount - (this.amountPaid || 0);
    }
  },

  // Payment info
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER'],
    default: 'UPI'
  },
  paymentReference: {
    type: String,
    default: ''
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
