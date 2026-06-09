// renic-automation-backend/config/constants.js

// ============ LANGUAGE CONFIGURATION ============
const LANGUAGE_CONFIG = {
  hi: { 
    name: 'Hindi', 
    script: 'Devanagari', 
    nativeName: 'हिंदी',     
    region: 'North',     
    speakers: '340M+', 
    maxChars: 240 
  },
  en: { 
    name: 'English', 
    script: 'Latin', 
    nativeName: 'English',     
    region: 'All', 
    speakers: '125M+', 
    maxChars: 240 
  },
  ta: { 
    name: 'Tamil', 
    script: 'Tamil', 
    nativeName: 'தமிழ்',     
    region: 'South',     
    speakers: '78M+', 
    maxChars: 240 
  },
  te: { 
    name: 'Telugu', 
    script: 'Telugu', 
    nativeName: 'తెలుగు',     
    region: 'South',     
    speakers: '74M+', 
    maxChars: 240 
  },
  mr: { 
    name: 'Marathi', 
    script: 'Devanagari', 
    nativeName: 'मराठी',     
    region: 'West',     
    speakers: '83M+', 
    maxChars: 240 
  },
  gu: { 
    name: 'Gujarati', 
    script: 'Gujarati', 
    nativeName: 'ગુજરાતી',     
    region: 'West',     
    speakers: '60M+', 
    maxChars: 240 
  },
  kn: { 
    name: 'Kannada', 
    script: 'Kannada', 
    nativeName: 'ಕನ್ನಡ',     
    region: 'South',     
    speakers: '44M+', 
    maxChars: 240 
  },
  ml: { 
    name: 'Malayalam', 
    script: 'Malayalam', 
    nativeName: 'മലയാളം',     
    region: 'South',     
    speakers: '35M+', 
    maxChars: 240 
  },
  pa: { 
    name: 'Punjabi', 
    script: 'Gurmukhi', 
    nativeName: 'ਪੰਜਾਬੀ',     
    region: 'North',     
    speakers: '125M+', 
    maxChars: 240 
  }
};

// ============ MESSAGE TYPES ============
const MESSAGE_TYPES = [
  'WELCOME',
  'ORDER_CONFIRMATION',
  'SHIPPING_UPDATE',
  'DELIVERY_NOTIFICATION',
  'PRODUCT_RECOMMENDATION',
  'DISCOUNT_OFFER',
  'BIRTHDAY_WISH',
  'RE_ENGAGEMENT',
  'FEEDBACK_REQUEST',
  'CART_ABANDONMENT'
];

// ============ SEGMENT TYPES ============
const SEGMENT_TYPES = [
  'VIP',
  'LOYAL',
  'REGULAR',
  'AT_RISK',
  'INACTIVE',
  'LOST',
  'NEW'
];

// ============ CAMPAIGN STATUS ============
const CAMPAIGN_STATUS = [
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED'
];

// ============ MESSAGE STATUS ============
const MESSAGE_STATUS = [
  'PENDING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'SKIPPED'
];

// ============ CHANNEL TYPES ============
const CHANNELS = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  SMS: 'sms'
};

// ============ LOYALTY TIERS ============
const LOYALTY_TIERS = [
  { tier: 'BRONZE', minSpend: 0, discount: 0 },
  { tier: 'SILVER', minSpend: 5000, discount: 5 },
  { tier: 'GOLD', minSpend: 25000, discount: 10 },
  { tier: 'DIAMOND', minSpend: 100000, discount: 15 }
];

// ============ RFM SCORING ============
const RFM_CONFIG = {
  recency: { threshold: 90 }, // days
  frequency: { threshold: 5 }, // transactions
  monetary: { threshold: 10000 } // amount
};

// ============ AI PROMPTS ============
const AI_PROMPTS = {
  WELCOME: `Generate a warm, personalized WhatsApp welcome message for a jewelry customer. Include brand story elements. Max 240 chars. Language: {lang}`,
  ORDER_CONFIRMATION: `Create a professional order confirmation message in {lang}. Include order number placeholder {{order_id}}. Max 240 chars.`,
  SHIPPING_UPDATE: `Write a tracking update message in {lang}. Include estimated delivery {{delivery_date}}. Max 240 chars.`,
  DELIVERY_NOTIFICATION: `Generate delivery confirmation message in {lang}. Express gratitude and offer support. Max 240 chars.`,
  PRODUCT_RECOMMENDATION: `Suggest a jewelry product based on purchase history in {lang}. Be personalized and elegant. Max 240 chars.`,
  DISCOUNT_OFFER: `Create an exclusive discount offer message in {lang}. Include discount percentage {{discount}}. Max 240 chars.`,
  BIRTHDAY_WISH: `Write a heartfelt birthday message in {lang}. Include brand name and special offer. Max 240 chars.`,
  RE_ENGAGEMENT: `Create a re-engagement message in {lang} for lapsed customers. Offer incentive. Max 240 chars.`,
  FEEDBACK_REQUEST: `Generate a polite feedback request in {lang}. Include rating link {{link}}. Max 240 chars.`,
  CART_ABANDONMENT: `Write a cart recovery message in {lang}. Include items {{items}} and checkout link {{link}}. Max 240 chars.`,
  CUSTOM: `Generate a message based on this custom request: "{prompt}". Keep it under 240 characters. Language: {lang}`
};

// ============ RATE LIMITS ============
const RATE_LIMITS = {
  GEMINI: { windowMs: 60 * 1000, max: 50 }, // 50 per minute
  MESSAGE: { windowMs: 60 * 1000, max: 100 }, // 100 per minute
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 minutes
  CAMPAIGN: { windowMs: 60 * 60 * 1000, max: 50 } // 50 per hour
};

module.exports = {
  LANGUAGE_CONFIG,
  MESSAGE_TYPES,
  SEGMENT_TYPES,
  CAMPAIGN_STATUS,
  MESSAGE_STATUS,
  CHANNELS,
  LOYALTY_TIERS,
  RFM_CONFIG,
  AI_PROMPTS,
  RATE_LIMITS
};