const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String
});

const shopConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: () => new mongoose.Types.ObjectId() },
  shopName: { type: String, default: 'Renic Technology' },
  companyName: { type: String, default: 'RENIC TECHNOLOGY' },
  tagline: { type: String, default: 'IDEAS | SOLUTIONS | GROWTH' },
  email: { type: String, default: 'info@renictechnology.com' },
  websiteUrl: { type: String, default: 'https://www.renictechnology.com' },
  catalogImageUrl: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  customStartPrice: { type: Number, default: 8500 },
  goldRate22K: { type: Number, default: 7200 },
  goldRate24K: { type: Number, default: 7850 },
  silverRate: { type: Number, default: 95 },
  platinumRate: { type: Number, default: 3200 },
  address: { type: String, default: '123, Main Road, Gobichettipalayam, Erode - 638452, Tamil Nadu, India' },
  operatingHours: { type: String, default: '9:00 AM - 7:00 PM (Monday to Saturday)' },
  contactPhone: { type: String, default: '+91 88070 25752' },
  gstin: { type: String, default: '33AAAAA0000A1Z5' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  themeColor: { type: String, default: '#DC2626' },
  signatoryName: { type: String, default: 'Renic Team' },
  signatoryTitle: { type: String, default: 'Authorized Signature' },
  signatoryCompany: { type: String, default: 'RENIC TECHNOLOGY' },
  defaultQuotationTerms: {
    type: [String],
    default: [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ]
  },
  returnPolicy: { type: String, default: '7-day replacement guarantee on manufacturing defects. 100% buyback guarantee at current gold rates.' },
  aiCustomInstructions: { type: String, default: 'Always sound extremely polite, warm, and helpful. Invite customers to consult on gold customization options.' },
  useAnthropic: { type: Boolean, default: false },
  anthropicApiKey: { type: String, default: '' },
  anthropicModel: { type: String, default: 'claude-3-haiku-20240307' },
  geminiApiKey: { type: String, default: '' },
  geminiModel: { type: String, default: 'gemini-1.5-flash' },
  metaApiEnabled: { type: Boolean, default: false },
  metaAppId: { type: String, default: '' },
  metaAppSecret: { type: String, default: '' },
  metaPhoneNumberId: { type: String, default: '' },
  metaAccessToken: { type: String, default: '' },
  metaWebhookVerifyToken: { type: String, default: '' },
  metaBusinessAccountId: { type: String, default: '' },
  metaDisplayPhoneNumber: { type: String, default: '' },
  metaVerifiedName: { type: String, default: '' },
  metaForwardReplies: { type: Boolean, default: false },
  metaHandoffMessage: { type: String, default: 'Hi {name}! You replied to our promotional number. Our support team will now continue this chat with you on this number. How can we help you?' },
  metaAutoReplyMessage: { type: String, default: 'Hi {name}, how can I help you?' },
  oauthConfig: {
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date, default: null }
  },
  oauthEnforced: { type: Boolean, default: true },
  screenPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  businessType: { type: String, default: 'salon' },
  solutionMode: { type: String, default: 'standalone' },
  solutionModes: { type: [String], default: ['standalone'] },
  customTerminology: { type: mongoose.Schema.Types.Mixed, default: {} },
  customerCode: { type: String, default: '' },
  whatsappSenderMode: {
    type: String,
    enum: ['META', 'DOCKER'],
    default: 'DOCKER'
  },
  dockerThrottleSeconds: {
    type: Number,
    default: 6
  },
  faqs: [faqSchema]
}, { timestamps: true });

module.exports = mongoose.model('ShopConfig', shopConfigSchema);