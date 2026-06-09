const mongoose = require('mongoose');

const ShopConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    default: 'Renic Jewellers'
  },
  websiteUrl: {
    type: String,
    default: 'https://kanalli.in/'
  },
  catalogImageUrl: {
    type: String,
    default: ''
  },
  customStartPrice: {
    type: Number,
    default: 8500
  },

  goldRate22K: {
    type: Number,
    default: 7200 // Price per gram in INR
  },
  goldRate24K: {
    type: Number,
    default: 7850 // Price per gram in INR
  },
  silverRate: {
    type: Number,
    default: 95 // Price per gram in INR
  },
  platinumRate: {
    type: Number,
    default: 3200 // Price per gram in INR
  },
  address: {
    type: String,
    default: '123 Gold Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017'
  },
  operatingHours: {
    type: String,
    default: '10:00 AM - 8:30 PM (Monday to Saturday)'
  },
  contactPhone: {
    type: String,
    default: '+91 9345578103'
  },
  returnPolicy: {
    type: String,
    default: '7-day replacement guarantee on manufacturing defects. 100% buyback guarantee at current gold rates.'
  },
  aiCustomInstructions: {
    type: String,
    default: 'Always sound extremely polite, warm, and helpful. Invite customers to consult on gold customization options.'
  },
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ShopConfig', ShopConfigSchema);
