const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String
});

const shopConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, default: 'Renic Jewellers' },
  websiteUrl: { type: String, default: 'https://kanalli.in/' },
  catalogImageUrl: { type: String, default: 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png' },
  customStartPrice: { type: Number, default: 8500 },
  goldRate22K: { type: Number, default: 7200 },
  goldRate24K: { type: Number, default: 7850 },
  silverRate: { type: Number, default: 95 },
  platinumRate: { type: Number, default: 3200 },
  address: { type: String, default: '123 Gold Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017' },
  operatingHours: { type: String, default: '10:00 AM - 8:30 PM (Monday to Saturday)' },
  contactPhone: { type: String, default: '+91 9345578103' },
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
  oauthEnforced: { type: Boolean, default: false },
  screenPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  whatsappSenderMode: {
    type: String,
    enum: ['META', 'DOCKER'],
    default: 'META'
  },
  dockerThrottleSeconds: {
    type: Number,
    default: 6
  },
  faqs: [faqSchema]
}, { timestamps: true });

module.exports = mongoose.model('ShopConfig', shopConfigSchema);