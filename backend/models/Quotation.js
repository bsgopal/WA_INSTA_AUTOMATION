const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  sNo: { type: Number, required: true },
  item: { type: String, required: true }, // e.g. 'Custom Software Development'
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  amount: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  quotationNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: 'Custom Software Development'
  },
  subtitle: {
    type: String,
    default: 'A tailored solution to streamline your operations and support your business growth.'
  },
  date: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_INVOICE'],
    default: 'DRAFT',
    index: true
  },
  
  // Customer Information (Can be existing DB customer OR new prospective lead)
  isExistingCustomer: {
    type: Boolean,
    default: false
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerName: {
    type: String,
    required: true // e.g. 'ABC Enterprises' or 'John Doe'
  },
  contactPerson: {
    type: String,
    default: ''
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

  // Company Profile snapshot (at time of quotation generation)
  companyDetails: {
    companyName: { type: String, default: 'RENIC TECHNOLOGY' },
    tagline: { type: String, default: 'IDEAS | SOLUTIONS | GROWTH' },
    logoUrl: { type: String, default: '' },
    phone: { type: String, default: '+91 88070 25752' },
    email: { type: String, default: 'info@renictechnology.com' },
    website: { type: String, default: 'www.renictechnology.com' },
    address: { type: String, default: '123, Main Road, Gobichettipalayam, Erode - 638452, Tamil Nadu, India' },
    gstin: { type: String, default: '' }
  },

  // Line items
  items: [quotationItemSchema],

  // Financial calculations
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
    required: true,
    default: 0
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
    required: true,
    default: 0
  },

  // Terms and Signatory
  terms: {
    type: [String],
    default: [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ]
  },
  signatoryName: {
    type: String,
    default: 'Renic Team'
  },
  signatoryTitle: {
    type: String,
    default: 'Authorized Signature'
  },
  signatoryCompany: {
    type: String,
    default: 'RENIC TECHNOLOGY'
  },
  themeColor: {
    type: String,
    default: '#DC2626' // Brand Crimson/Red as shown in image
  },

  // Lifecycle & Tracking
  lastSentAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  convertedInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  convertedInvoiceNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto-evaluate expired status
quotationSchema.methods.checkExpiry = function() {
  if (this.status === 'SENT' || this.status === 'DRAFT') {
    if (new Date() > new Date(this.validUntil)) {
      this.status = 'EXPIRED';
    }
  }
  return this.status;
};

module.exports = mongoose.model('Quotation', quotationSchema);
