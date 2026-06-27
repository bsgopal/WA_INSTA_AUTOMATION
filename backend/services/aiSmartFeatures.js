// renic-automation-backend/services/aiSmartFeatures.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Customer = require('../models/Customer');
const Message = require('../models/Message');

// Initialize Gemini AI safely
const getModel = (modelName) => {
  const apiKey = process.env.GEMINI_API_KEY || 'dummy_key';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Predict optimal send time for a customer based on their engagement history
 */
const predictOptimalSendTime = async (customerId) => {
  try {
    const messages = await Message.find({
      customerId,
      status: { $in: ['DELIVERED', 'READ'] }
    }).sort({ sentAt: 1 }).limit(100);

    if (messages.length < 5) {
      // Default to 10 AM if not enough data
      return { hour: 10, minute: 0, confidence: 'low' };
    }

    // Analyze engagement patterns
    const hourEngagement = {};
    
    messages.forEach(msg => {
      if (msg.readAt) {
        const hour = new Date(msg.readAt).getHours();
        hourEngagement[hour] = (hourEngagement[hour] || 0) + 1;
      }
    });

    // Find peak engagement hour
    let maxHour = 10;
    let maxCount = 0;

    Object.entries(hourEngagement).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    });

    return {
      hour: maxHour,
      minute: 0,
      confidence: maxCount > 10 ? 'high' : maxCount > 5 ? 'medium' : 'low',
      engagementData: hourEngagement
    };
  } catch (error) {
    console.error('Predict Send Time Error:', error.message);
    return { hour: 10, minute: 0, confidence: 'low' };
  }
};

/**
 * Analyze sentiment of customer message
 */
const analyzeSentiment = async (messageText) => {
  try {
    const model = getModel(process.env.GEMINI_MODEL || 'gemini-1.5-flash');

    const prompt = `You are a jewelry business AI assistant. Analyze the sentiment of this customer message about jewelry/jewelry business.

Message: "${messageText}"

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "confidence": 0-100,
  "emotions": ["emotion1", "emotion2"],
  "urgency": "low" | "medium" | "high",
  "suggestedAction": "brief action"
}

Examples:
- "I love this diamond necklace!" → POSITIVE, high confidence, emotions: ["joy", "satisfaction"]
- "The ring has a loose stone" → NEGATIVE, high confidence, emotions: ["frustration", "disappointment"]
- "What is the price?" → NEUTRAL, medium confidence, emotions: []`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || 'NEUTRAL',
        confidence: parsed.confidence || 0,
        emotions: parsed.emotions || [],
        urgency: parsed.urgency || 'low',
        suggestedAction: parsed.suggestedAction || 'Review message'
      };
    }

    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      emotions: [],
      urgency: 'low',
      suggestedAction: 'Error analyzing sentiment'
    };
  } catch (error) {
    console.error('Sentiment Analysis Error:', error.message);
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      emotions: [],
      urgency: 'low',
      suggestedAction: 'Error analyzing sentiment'
    };
  }
};

/**
 * Generate smart reply suggestions
 */
const generateSmartReplies = async (messageText, customerContext = {}) => {
  try {
    const model = getModel(process.env.GEMINI_MODEL || 'gemini-1.5-flash');

    const prompt = `You are a jewelry business customer service AI. Generate 3 different reply options for this customer message.

Customer Message: "${messageText}"
Customer Segment: ${customerContext.segment || 'REGULAR'}
Customer Language: ${customerContext.language || 'en'}

Generate 3 contextual replies for a jewelry business:
1. Professional and formal
2. Friendly and warm  
3. Brief and to the point

Respond with ONLY valid JSON array (no markdown, no extra text):
[
  {"type": "professional", "text": "..."},
  {"type": "friendly", "text": "..."},
  {"type": "brief", "text": "..."}
]

Examples for "What is the price of gold bangles?":
- Professional: "Hi! 💎 Our gold bangles start from ₹18,000. What type are you interested in?"
- Friendly: "Welcome! Our gold bangles range from ₹18,000 to ₹65,000. Can I help you find something?"
- Brief: "Hello! We have beautiful gold bangles. What's your budget?"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      { type: 'professional', text: 'Thank you for your message. How can I assist you today?' },
      { type: 'friendly', text: 'Hi! Thanks for reaching out. What can I help you with?' },
      { type: 'brief', text: 'Hello! How can I help?' }
    ];
  } catch (error) {
    console.error('Smart Reply Error:', error.message);
    return [
      { type: 'professional', text: 'Thank you for your message. How can I assist you today?' },
      { type: 'friendly', text: 'Hi! Thanks for reaching out. What can I help you with?' },
      { type: 'brief', text: 'Hello! How can I help?' }
    ];
  }
};

/**
 * Categorize customer query automatically
 */
const categorizeQuery = async (messageText) => {
  try {
    const model = getModel(process.env.GEMINI_MODEL || 'gemini-1.5-flash');

    const prompt = `You are a jewelry business AI. Categorize this customer query into one of these categories:

Message: "${messageText}"

Categories:
- PRICE_INQUIRY: Asking about prices
- PRODUCT_INQUIRY: Asking about products/designs
- CUSTOMIZATION: Wants custom jewelry
- ORDER_STATUS: Asking about order status
- COMPLAINT: Complaining about product/service
- FEEDBACK: Giving feedback
- SUPPORT_REQUEST: Needs help/support
- PURCHASE_INTENT: Ready to buy
- GENERAL_QUESTION: Other questions

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "category": "CATEGORY_NAME",
  "confidence": 0-100,
  "intent": "brief intent",
  "urgency": "low" | "medium" | "high",
  "budget": number or null,
  "timeline": "string or null"
}

Examples:
- "What is the price of diamond necklace?" → PRICE_INQUIRY, urgency: medium
- "I want custom bridal set, budget ₹1,50,000, wedding in 6 weeks" → CUSTOMIZATION, urgency: high, budget: 150000, timeline: "6 weeks"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      category: 'GENERAL_QUESTION',
      confidence: 50,
      intent: 'unknown',
      urgency: 'low',
      budget: null,
      timeline: null
    };
  } catch (error) {
    console.error('Categorize Query Error:', error.message);
    return {
      category: 'GENERAL_QUESTION',
      confidence: 0,
      intent: 'unknown',
      urgency: 'low',
      budget: null,
      timeline: null
    };
  }
};

/**
 * Predict customer churn risk
 */
const predictChurnRisk = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return { risk: 'unknown', score: 0 };
    }

    let riskScore = 0;

    // Factor 1: Recency (days since last purchase)
    if (customer.lastPurchaseDate) {
      const daysSinceLastPurchase = Math.floor(
        (Date.now() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPurchase > 180) riskScore += 40;
      else if (daysSinceLastPurchase > 90) riskScore += 25;
      else if (daysSinceLastPurchase > 60) riskScore += 15;
    } else {
      riskScore += 30;
    }

    // Factor 2: Engagement decline
    const recentMessages = await Message.countDocuments({
      customerId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (recentMessages === 0) riskScore += 30;
    else if (recentMessages < 2) riskScore += 15;

    // Factor 3: RFM Segment
    if (customer.rfmSegment === 'LOST') riskScore += 30;
    else if (customer.rfmSegment === 'INACTIVE') riskScore += 20;
    else if (customer.rfmSegment === 'AT_RISK') riskScore += 15;

    // Determine risk level
    let risk = 'low';
    if (riskScore >= 70) risk = 'critical';
    else if (riskScore >= 50) risk = 'high';
    else if (riskScore >= 30) risk = 'medium';

    return {
      risk,
      score: riskScore,
      factors: {
        recency: customer.lastPurchaseDate ? 'analyzed' : 'no_data',
        engagement: recentMessages,
        segment: customer.rfmSegment
      },
      recommendations: getChurnRecommendations(risk)
    };
  } catch (error) {
    console.error('Churn Prediction Error:', error.message);
    return { risk: 'unknown', score: 0 };
  }
};

/**
 * Get churn prevention recommendations
 */
const getChurnRecommendations = (riskLevel) => {
  const recommendations = {
    critical: [
      'Send personalized win-back campaign immediately',
      'Offer exclusive discount or incentive',
      'Request feedback on why they stopped engaging',
      'Assign to high-touch sales team'
    ],
    high: [
      'Send re-engagement campaign',
      'Highlight new products or features',
      'Offer loyalty rewards',
      'Schedule follow-up in 1 week'
    ],
    medium: [
      'Send value-focused content',
      'Remind of loyalty benefits',
      'Share customer success stories',
      'Monitor for 2 weeks'
    ],
    low: [
      'Continue regular engagement',
      'Maintain current communication cadence',
      'Monitor engagement metrics'
    ]
  };

  return recommendations[riskLevel] || recommendations.low;
};

/**
 * Personalize message content dynamically
 */
const personalizeMessage = async (template, customer, context = {}) => {
  try {
    let personalized = template;

    // Basic placeholder replacement
    const placeholders = {
      '{{firstName}}': customer.firstName || '',
      '{{lastName}}': customer.lastName || '',
      '{{fullName}}': `${customer.firstName} ${customer.lastName}`.trim(),
      '{{customer_name}}': `${customer.firstName} ${customer.lastName}`.trim() || customer.firstName || '',
      '{{customer_phone}}': customer.whatsappNumber || customer.phone || '',
      '{{selected_item}}': context.selectedItemTitle || customer.customFields?.selectedItemTitle || '',
      '{{selected_description}}': context.selectedItemDescription || customer.customFields?.selectedItemDescription || '',
      '{{shop_name}}': process.env.SHOP_NAME || 'Kanalli',
      '{{current_date}}': new Date().toLocaleDateString(),
      '{{loyaltyTier}}': customer.loyaltyTier || 'BRONZE',
      '{{loyaltyPoints}}': customer.loyaltyPoints || 0,
      '{{totalSpent}}': customer.totalSpent || 0,
      '{{segment}}': customer.rfmSegment || 'NEW',
      '{{productName}}': customer.customFields?.selectedProduct?.name || customer.customFields?.lastScrapedProducts?.[0]?.name || '',
      '{{price}}': customer.customFields?.selectedProduct?.price || customer.customFields?.lastScrapedProducts?.[0]?.price || ''
    };

    Object.entries(placeholders).forEach(([key, value]) => {
      // Escape regex special chars
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      personalized = personalized.replace(new RegExp(escapedKey, 'g'), value);
    });

    // AI-powered personalization for dynamic content
    if (template.includes('{{ai_recommendation}}')) {
      if (!process.env.GEMINI_API_KEY) {
        const fallbackRecommendation = customer.language === 'hi' 
          ? 'हम विशेष रूप से आपके लिए बनाए गए हमारे नए कलेक्शन की सलाह देते हैं!'
          : 'We highly recommend our latest designer collection tailored for your refined taste!';
        personalized = personalized.replace('{{ai_recommendation}}', fallbackRecommendation);
      } else {
        const model = getModel(process.env.GEMINI_MODEL_PRO || 'gemini-1.5-pro');

        const prompt = `Generate a personalized product recommendation for this customer:

Customer Segment: ${customer.rfmSegment}
Total Spent: ₹${customer.totalSpent}
Loyalty Tier: ${customer.loyaltyTier}
Language: ${customer.language}

Provide a brief, engaging recommendation (1-2 sentences) in ${customer.language === 'en' ? 'English' : 'the customer\'s language'}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const recommendation = response.text().trim();

        personalized = personalized.replace('{{ai_recommendation}}', recommendation);
      }
    }

    return personalized;
  } catch (error) {
    console.error('Personalization Error:', error.message);
    return template;
  }
};

/**
 * Calculate customer lifetime value prediction
 */
const predictLifetimeValue = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return { ltv: 0, confidence: 'low' };
    }

    // Simple LTV calculation: Average Order Value × Purchase Frequency × Customer Lifespan
    const avgOrderValue = customer.averageOrderValue || 0;
    const purchaseFrequency = customer.totalPurchases || 0;
    const estimatedLifespan = 3; // years

    const ltv = avgOrderValue * purchaseFrequency * estimatedLifespan;

    // Adjust based on segment
    let multiplier = 1;
    if (customer.rfmSegment === 'VIP') multiplier = 1.5;
    else if (customer.rfmSegment === 'LOYAL') multiplier = 1.3;
    else if (customer.rfmSegment === 'AT_RISK') multiplier = 0.7;
    else if (customer.rfmSegment === 'INACTIVE') multiplier = 0.5;

    const adjustedLtv = ltv * multiplier;

    return {
      ltv: Math.round(adjustedLtv),
      confidence: purchaseFrequency > 5 ? 'high' : purchaseFrequency > 2 ? 'medium' : 'low',
      breakdown: {
        avgOrderValue,
        purchaseFrequency,
        estimatedLifespan,
        segmentMultiplier: multiplier
      }
    };
  } catch (error) {
    console.error('LTV Prediction Error:', error.message);
    return { ltv: 0, confidence: 'low' };
  }
};

module.exports = {
  predictOptimalSendTime,
  analyzeSentiment,
  generateSmartReplies,
  categorizeQuery,
  predictChurnRisk,
  personalizeMessage,
  predictLifetimeValue
};
