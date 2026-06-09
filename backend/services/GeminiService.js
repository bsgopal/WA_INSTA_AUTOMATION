// renic-automation-backend/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AI_PROMPTS, LANGUAGE_CONFIG } = require('../constants/constants');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI features will be limited.');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest' 
    });
  }

  /**
   * Helper to execute Gemini generation with rate-limit retry and exponential backoff
   */
  async generateContentWithRetry(prompt, retries = 5, initialDelay = 3000) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set');
    }
    
    let delay = initialDelay;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.model.generateContent(prompt);
      } catch (err) {
        const errMsg = err.message || '';
        const isRateLimit = errMsg.includes('429') || 
                            errMsg.includes('Quota exceeded') || 
                            errMsg.includes('Too Many Requests') || 
                            errMsg.includes('RESOURCE_EXHAUSTED') || 
                            err.status === 429;
                            
        if (isRateLimit && attempt < retries) {
          console.warn(`⚠️ Gemini API Rate Limit (429) hit. Retrying in ${(delay / 1000).toFixed(1)}s (Attempt ${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * Generate AI message based on type and language
   */
  async generateMessage(messageType, language = 'en', variables = {}) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return this.getFallbackMessage(messageType, language);
      }

      const prompt = this.buildPrompt(messageType, language, variables);
      
      const result = await this.generateContentWithRetry(prompt);
      const text = result.response.text();
      
      // Clean and validate the generated message
      const cleanedText = this.cleanMessage(text, language);
      
      return {
        success: true,
        content: cleanedText,
        language: language,
        messageType: messageType,
        model: 'gemini-1.5-flash',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Gemini Error:', error.message);
      return {
        success: false,
        error: error.message,
        content: this.getFallbackMessage(messageType, language),
        fallback: true
      };
    }
  }

  /**
   * Build the AI prompt with context
   */
  buildPrompt(messageType, language, variables) {
    const languageInfo = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.en;
    let basePrompt = AI_PROMPTS[messageType] || AI_PROMPTS.WELCOME;

    let fullPrompt = basePrompt
      .replace('{lang}', languageInfo.name)
      .replace('{language_script}', languageInfo.script);

    if (variables.prompt) {
      fullPrompt = fullPrompt.replace('{prompt}', variables.prompt);
    }

    // Add variables context if provided (exclude prompt if it was replaced)
    const otherVars = { ...variables };
    delete otherVars.prompt;

    if (Object.keys(otherVars).length > 0) {
      fullPrompt += '\n\nVariables to include:';
      for (const [key, value] of Object.entries(otherVars)) {
        fullPrompt += `\n- {{${key}}}: ${value}`;
      }
    }

    fullPrompt += '\n\nBrand Context: Renic Technology - Professional automation solutions';
    fullPrompt += '\n\nIMPORTANT: Keep message under 240 characters.';

    return fullPrompt;
  }

  /**
   * Clean and validate generated message
   */
  cleanMessage(text, language) {
    // Remove markdown, quotes, and extra whitespace
    let cleaned = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^["`*]+|["`*]+$/g, '') // Remove quotes/backticks
      .trim();

    // Ensure character limit
    const maxChars = LANGUAGE_CONFIG[language]?.maxChars || 240;
    if (cleaned.length > maxChars) {
      cleaned = cleaned.substring(0, maxChars).trim();
      // Remove incomplete words at the end
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > 0) {
        cleaned = cleaned.substring(0, lastSpace);
      }
    }

    return cleaned;
  }

  /**
   * Get fallback message if AI fails
   */
  getFallbackMessage(messageType, language) {
    const fallbacks = {
      WELCOME: {
        en: 'Welcome to Renic Technology! We are excited to have you. How can we assist you today?',
        hi: 'Renic Technology में आपका स्वागत है! आपको होने के लिए हम उत्सुक हैं।',
        ta: 'Renic Technology இல் உங்களை வரவேற்கிறோம்! உங்களைப் பெற்ற திற நாம் ஆர்வமாக உள்ளோம்.',
      },
      ORDER_CONFIRMATION: {
        en: 'Thank you for your order! Your order has been confirmed and will be processed shortly.',
        hi: 'आपके ऑर्डर के लिए धन्यवाद! आपका ऑर्डर की पुष्टि हो गई है।',
        ta: 'உங்கள் ஆர்டருக்கு நன்றி! உங்கள் ஆர்டர் உறுதிசெய்யப்பட்டு உள்ளது।',
      },
      DISCOUNT_OFFER: {
        en: 'Special offer just for you! Enjoy exclusive discounts on our products.',
        hi: 'आपके लिए विशेष ऑफर! हमारे उत्पादों पर विशेष छूट का आनंद लें।',
        ta: 'உங்களுக்கான சிறப்பு வாய்ப்பு! எங்கள் பொருட்களில் பிரத்যேக ছাড்ுகளை அனுபவிக்கவும்।',
      }
    };

    return (fallbacks[messageType]?.[language] || fallbacks[messageType]?.['en'] || 
            'Thank you for choosing Renic Technology!');
  }

  /**
   * Detect language from text (basic Unicode-based detection)
   */
  detectLanguage(text) {
    const scripts = {
      en: /[a-zA-Z]/,
      hi: /[\u0900-\u097F]/,
      ta: /[\u0B80-\u0BFF]/,
      te: /[\u0C00-\u0C7F]/,
      mr: /[\u0900-\u097F]/,
      gu: /[\u0A80-\u0AFF]/,
      kn: /[\u0C80-\u0CFF]/,
      ml: /[\u0D00-\u0D7F]/,
      pa: /[\u0A00-\u0A7F]/,
    };

    for (const [lang, regex] of Object.entries(scripts)) {
      if (regex.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Batch generate multiple messages
   */
  async generateBatch(messages) {
    const results = [];
    
    for (const msg of messages) {
      const result = await this.generateMessage(
        msg.messageType,
        msg.language,
        msg.variables
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Check API quota status
   */
  async checkQuotaStatus() {
    try {
      // Attempt a minimal generation to check if API is accessible
      const result = await this.generateContentWithRetry('test', 2, 1000);
      return {
        status: 'ok',
        available: true
      };
    } catch (error) {
      if (error.message.includes('RESOURCE_EXHAUSTED')) {
        return {
          status: 'quota_exhausted',
          available: false
        };
      }
      return {
        status: 'error',
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();