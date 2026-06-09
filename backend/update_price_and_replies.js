const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'services', 'aiMessageAnalyzer.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add parsePrice, extractPriceFilter, and getTemplateCategoryForIntent helper methods
const getCategoryPathSig = 'getCategoryPath(gender, subcategory) {';
const getCategoryPathIndex = content.indexOf(getCategoryPathSig);

if (getCategoryPathIndex === -1) {
  console.error("Could not find getCategoryPath signature!");
  process.exit(1);
}

const helpers = `  parsePrice(priceText) {
    if (!priceText) return 0;
    const clean = priceText.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  extractPriceFilter(message) {
    const text = (message || '').toLowerCase().trim();
    let minPrice = null;
    let maxPrice = null;

    // Scale thousands: e.g. 10k -> 10000, 2.5k -> 2500
    let cleanText = text.replace(/(\\d+)\\s*k\\b/gi, '$1000');
    cleanText = cleanText.replace(/(\\d+)\\.(\\d+)\\s*k\\b/gi, (match, p1, p2) => {
      const scale = p2.padEnd(3, '0').substring(0, 3);
      return p1 + scale;
    });

    // Scale lakhs: e.g. 1.5L -> 150000, 1lakh -> 100000
    cleanText = cleanText.replace(/(\\d+)\\s*(?:l|lakhs?)\\b/gi, '$100000');
    cleanText = cleanText.replace(/(\\d+)\\.(\\d+)\\s*(?:l|lakhs?)\\b/gi, (match, p1, p2) => {
      const scale = p2.padEnd(5, '0').substring(0, 5);
      return p1 + scale;
    });

    // Remove commas from numbers
    cleanText = cleanText.replace(/(\\d),(\\d)/g, '$1$2');

    // 1. Match range: "between 2000 and 5000"
    const rangeMatch = cleanText.match(/(?:between|from)?\\s*(?:rs\\.?|₹)?\\s*(\\d+)\\s*(?:to|and|-)\\s*(?:rs\\.?|₹)?\\s*(\\d+)/i);
    if (rangeMatch) {
      const val1 = parseInt(rangeMatch[1], 10);
      const val2 = parseInt(rangeMatch[2], 10);
      if (val1 < val2) {
        minPrice = val1;
        maxPrice = val2;
      } else {
        minPrice = val2;
        maxPrice = val1;
      }
      return { minPrice, maxPrice };
    }

    // 2. Match under/max limit (including regional equivalents)
    const underMatch = cleanText.match(/(?:under|below|less than|within|max|maximum|up\\s*to|upto|के अंदर|के नीचे|से कम|குறைந்த|கீழ்|க்குள்|లోపు|తక్కువ|ఒಳಗಿನ|ಕಡಿಮೆ)\\s*(?:rs\\.?|₹)?\\s*(\\d+)/i) ||
                       cleanText.match(/(?:rs\\.?|₹)?\\s*(\\d+)\\s*(?:under|below|max|maximum|के अंदर|के नीचे|से कम|குறைந்த|கீழ்|க்குள்|లోపు|తక్కువ|ఒಳಗಿನ|ಕಡಿಮೆ)/i);
    if (underMatch) {
      maxPrice = parseInt(underMatch[1], 10);
      return { minPrice, maxPrice };
    }

    // 3. Match starting/above limit
    const aboveMatch = cleanText.match(/(?:above|greater than|more than|min|minimum|starting|starts?|से शुरू|இருந்து|నుండి|ఇంద)\\s*(?:from)?\\s*(?:rs\\.?|₹)?\\s*(\\d+)/i) ||
                       cleanText.match(/(?:rs\\.?|₹)?\\s*(\\d+)\\s*(?:above|greater|more|starting|से शुरू|இருந்து|నుండి|ఇంద)/i);
    if (aboveMatch) {
      minPrice = parseInt(aboveMatch[1], 10);
      return { minPrice, maxPrice };
    }

    // 4. Fallback budget match
    const budgetMatch = cleanText.match(/(?:budget|rs\\.?|₹|for|of)\\s*(\\d+)/i);
    if (budgetMatch) {
      maxPrice = parseInt(budgetMatch[1], 10);
      return { minPrice, maxPrice };
    }

    return { minPrice, maxPrice };
  }

  getTemplateCategoryForIntent(intent) {
    const mappings = {
      general_inquiry: 'WELCOME',
      purchase_intent: 'PRODUCT_RECOMMENDATION',
      delivery_query: 'SHIPPING_UPDATE',
      customization: 'CUSTOM',
      complaint: 'FEEDBACK_REQUEST'
    };
    return mappings[intent] || null;
  }

`;

content = content.substring(0, getCategoryPathIndex) + helpers + content.substring(getCategoryPathIndex);

// 2. Modify scrapeProductsFromUrl count limit from 3 to 12
const oldScrapeLimit = 'while ((match = productRegex.exec(html)) !== null && count < 3) {';
const newScrapeLimit = 'while ((match = productRegex.exec(html)) !== null && count < 12) {';

if (content.indexOf(oldScrapeLimit) === -1) {
  console.error("Could not find old scrape loop limit!");
  process.exit(1);
}
content = content.replace(oldScrapeLimit, newScrapeLimit);

// 3. Replace checkInterceptions completely to implement price filtering, quick replies, and templates
const checkInterceptionsStartIndex = content.indexOf('async checkInterceptions(messageBody, customerProfile, config) {');
const checkInterceptionsEndIndex = content.lastIndexOf('module.exports = new AIMessageAnalyzer();');

if (checkInterceptionsStartIndex === -1 || checkInterceptionsEndIndex === -1) {
  console.error("Could not find checkInterceptions index!");
  process.exit(1);
}

const newCheckInterceptionsBlock = `async checkInterceptions(messageBody, customerProfile, config, analysis = null) {
    if (!customerProfile) return null;

    const lowerMsg = (messageBody || '').toLowerCase().trim();
    const languageSelected = customerProfile.customFields?.languageSelected;
    const awaitingLanguage = customerProfile.customFields?.awaitingLanguageSelection;

    const languageMenu = \`Welcome to Renic Jewellers! Please select your preferred language to continue:
नमस्ते! कृपया आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें:

1. English 🇬🇧
2. Hindi (हिंदी) 🇮🇳
3. Tamil (தமிழ்) 🇮🇳
4. Telugu (తెలుగు) 🇮🇳
5. Marathi (मराठी) 🇮🇳
6. Kannada (ಕನ್ನಡ) 🇮🇳

Please reply with the number (1-6) of your choice! / कृपया अपनी पसंद की संख्या (1-6) के साथ उत्तर दें!\`;

    // Dynamic Language Switching Check
    const changeLangKeywords = [
      'change language', 'switch language', 'select language', 'language', 'change lang',
      'भाषा बदलें', 'भाषा', 'बोली',
      'மொழி மாற்று', 'மொழி',
      'భాష మార్చండి', 'భాష',
      'ಭಾಷೆ ಬದಲಾಯಿಸಿ', 'ಭಾಷೆ'
    ];
    const isChangeLangRequest = changeLangKeywords.some(kw => lowerMsg === kw || lowerMsg.includes(kw)) &&
                                !['1', '2', '3', '4', '5', '6'].includes(lowerMsg);

    if (isChangeLangRequest) {
      const Customer = mongoose.model('Customer');
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.languageSelected': false,
        'customFields.awaitingLanguageSelection': true
      });
      return {
        success: true,
        text: languageMenu,
        generatedAt: new Date()
      };
    }

    // Language Onboarding on First Message
    if (!languageSelected) {
      const Customer = mongoose.model('Customer');
      if (!awaitingLanguage) {
        // First message - prompt for language
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.awaitingLanguageSelection': true
        });
        return {
          success: true,
          text: languageMenu,
          generatedAt: new Date()
        };
      } else {
        // Awaiting language input - match the number
        let selectedLang = null;
        let welcomeMsg = '';
        
        if (lowerMsg === '1' || lowerMsg.includes('english')) {
          selectedLang = 'en';
          welcomeMsg = \`Nice to meet you! Welcome to Renic Jewellers. How can we help you today?\`;
        } else if (lowerMsg === '2' || lowerMsg.includes('hindi') || lowerMsg.includes('हिंदी')) {
          selectedLang = 'hi';
          welcomeMsg = \`नमस्ते! रेनिक ज्वेलर्स में आपका स्वागत है। आज हम आपकी क्या सहायता कर सकते हैं?\`;
        } else if (lowerMsg === '3' || lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) {
          selectedLang = 'ta';
          welcomeMsg = \`வணக்கம்! ரெனிக் ஜூவல்லரிக்கு உங்களை வரவேற்கிறோம். இன்று உங்களுக்கு எவ்வாறு உதவலாம்?\`;
        } else if (lowerMsg === '4' || lowerMsg.includes('telugu') || lowerMsg.includes('తెలుగు')) {
          selectedLang = 'te';
          welcomeMsg = \`నమస్కారం! రేనిక్ జ్యువెలర్స్‌కు స్వాగతం. ఈరోజు మేము మీకు ఎలా సహాయపడగలము?\`;
        } else if (lowerMsg === '5' || lowerMsg.includes('marathi') || lowerMsg.includes('मराठी')) {
          selectedLang = 'mr';
          welcomeMsg = \`नमस्कार! रेनिक ज्वेलर्समध्ये आपले स्वागत आहे. आज आम्ही आपली काय मदत करू शकतो?\`;
        } else if (lowerMsg === '6' || lowerMsg.includes('kannada') || lowerMsg.includes('ಕನ್ನಡ')) {
          selectedLang = 'kn';
          welcomeMsg = \`ನಮಸ್ಕಾರ! ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?\`;
        }

        if (selectedLang) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            language: selectedLang,
            'customFields.languageSelected': true,
            'customFields.awaitingLanguageSelection': false
          });

          return {
            success: true,
            text: welcomeMsg,
            generatedAt: new Date()
          };
        } else {
          return {
            success: true,
            text: \`Invalid selection. / अमान्य विकल्प।\\n\\n\u0024{languageMenu}\`,
            generatedAt: new Date()
          };
        }
      }
    }

    const Customer = mongoose.model('Customer');
    const lang = customerProfile.language || 'en';
    let catalogState = customerProfile.customFields?.catalogState || null;

    // Helper to filter products list in-memory based on extracted price filter
    const applyPriceFilter = (products, filter) => {
      if (!products || products.length === 0) return [];
      let filtered = products.filter(p => {
        const parsed = this.parsePrice(p.price);
        if (parsed === 0) return true; // keep contact for price
        if (filter.minPrice !== null && parsed < filter.minPrice) return false;
        if (filter.maxPrice !== null && parsed > filter.maxPrice) return false;
        return true;
      });
      
      // If we filtered out everything, fall back to returning closest available designs
      if (filtered.length === 0) {
        return products.slice(0, 3);
      }
      return filtered.slice(0, 3);
    };

    // Parse active price filter
    const priceFilter = this.extractPriceFilter(messageBody);
    const hasPriceFilter = priceFilter.minPrice !== null || priceFilter.maxPrice !== null;

    // 1. Quick Reply Matching
    const QuickReply = mongoose.model('QuickReply');
    const activeQuickReplies = await QuickReply.find({ userId: customerProfile.userId, isActive: true }).lean();
    let matchedQuickReply = null;
    
    for (const qr of activeQuickReplies) {
      if (qr.shortcut) {
        const shortcutClean = qr.shortcut.replace(/^\\//, '').toLowerCase().trim();
        if (lowerMsg === shortcutClean || lowerMsg === '/' + shortcutClean) {
          matchedQuickReply = qr;
          break;
        }
      }
      if (qr.title) {
        const titleClean = qr.title.toLowerCase().trim();
        if (lowerMsg === titleClean) {
          matchedQuickReply = qr;
          break;
        }
      }
    }
    
    // Fallback keyword match for quick reply
    if (!matchedQuickReply) {
      for (const qr of activeQuickReplies) {
        if (qr.shortcut) {
          const shortcutClean = qr.shortcut.replace(/^\\//, '').toLowerCase().trim();
          if (lowerMsg.includes(shortcutClean) && shortcutClean.length > 3) {
            matchedQuickReply = qr;
            break;
          }
        }
      }
    }

    if (matchedQuickReply) {
      // Async update usage stats
      QuickReply.findByIdAndUpdate(matchedQuickReply._id, {
        \\u0024inc: { usageCount: 1 },
        lastUsedAt: new Date()
      }).catch(err => console.error('Failed to update quick reply stats:', err.message));

      const aiSmartFeatures = require('./aiSmartFeatures');
      const personalizedText = await aiSmartFeatures.personalizeMessage(matchedQuickReply.content, customerProfile);
      
      // Exit catalog flow to prevent blocking after quick reply
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.catalogState': null
      });
      if (customerProfile.customFields) {
        customerProfile.customFields.catalogState = null;
      }

      return {
        success: true,
        text: personalizedText,
        language: lang,
        generatedAt: new Date()
      };
    }

    // 2. Template Matching based on analyzed intent
    if (analysis && analysis.intent) {
      const templateCategory = this.getTemplateCategoryForIntent(analysis.intent);
      if (templateCategory) {
        const Template = mongoose.model('Template');
        const matchedTemplate = await Template.findOne({
          userId: customerProfile.userId,
          category: templateCategory,
          isActive: true
        }).lean();

        if (matchedTemplate) {
          // Async update stats
          Template.findByIdAndUpdate(matchedTemplate._id, {
            \\u0024inc: { usageCount: 1 },
            lastUsedAt: new Date()
          }).catch(err => console.error('Failed to update template stats:', err.message));

          const aiSmartFeatures = require('./aiSmartFeatures');
          const personalizedText = await aiSmartFeatures.personalizeMessage(matchedTemplate.content, customerProfile);

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }

          return {
            success: true,
            text: personalizedText,
            mediaUrl: matchedTemplate.mediaUrl || null,
            language: lang,
            generatedAt: new Date()
          };
        }
      }
    }

    // 3. Intercept catalog entry triggers
    const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
    const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties'].some(kw => lowerMsg.includes(kw));

    if (asksCatalogDirect || asksCollectionsGen) {
      const newState = { 
        menuLevel: 'TOP',
        priceFilter: hasPriceFilter ? priceFilter : null
      };
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.catalogState': newState
      });
      if (customerProfile.customFields) {
        customerProfile.customFields.catalogState = newState;
      } else {
        customerProfile.customFields = { catalogState: newState };
      }

      return {
        success: true,
        text: this.localize('catalog_prompt', lang),
        mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
        language: lang,
        generatedAt: new Date()
      };
    }

    // 4. State Machine Catalog Flow
    if (catalogState && catalogState.menuLevel) {
      const menuLevel = catalogState.menuLevel;
      const activeFilter = hasPriceFilter ? priceFilter : catalogState.priceFilter;

      // Check for "back" navigation
      if (this.isBackCommand(messageBody)) {
        let nextLevel = 'TOP';
        let nextGender = catalogState.gender;
        let nextSub = catalogState.subcategory;
        let responseText = '';
        let responseMediaUrl = config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png';
        let responseScrapedProducts = null;
        let responseSelectedCategory = null;

        if (menuLevel === 'PRODUCT_DETAIL') {
          nextLevel = 'PRODUCTS';
          responseText = '';
          responseScrapedProducts = catalogState.products || [];
          responseSelectedCategory = catalogState.subcategory;
        } else if (menuLevel === 'PRODUCTS') {
          if (catalogState.gender === 'GIFTS') {
            nextLevel = 'TOP';
            responseText = this.localize('catalog_prompt', lang);
          } else {
            nextLevel = 'SUB_CATEGORY';
            responseText = this.localize(catalogState.gender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu', lang);
          }
        } else if (menuLevel === 'SUB_CATEGORY') {
          nextLevel = 'TOP';
          responseText = this.localize('catalog_prompt', lang);
        } else {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return null;
        }

        const updatedState = {
          menuLevel: nextLevel,
          gender: nextGender,
          subcategory: nextSub,
          products: catalogState.products,
          priceFilter: activeFilter
        };

        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': updatedState
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = updatedState;
        }

        return {
          success: true,
          text: responseText,
          mediaUrl: responseMediaUrl,
          scrapedProducts: responseScrapedProducts,
          selectedCategory: responseSelectedCategory,
          language: lang,
          generatedAt: new Date()
        };
      }

      // Forward Navigation
      if (menuLevel === 'TOP') {
        const selectedGender = this.detectTopMenuSelection(messageBody);
        if (selectedGender) {
          if (selectedGender === 'GIFTS') {
            const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', 'GIFTS', 'GIFTS');
            const filtered = activeFilter ? applyPriceFilter(rawProducts, activeFilter) : rawProducts.slice(0, 3);
            
            const updatedState = {
              menuLevel: 'PRODUCTS',
              gender: 'GIFTS',
              subcategory: 'GIFTS',
              products: filtered,
              priceFilter: activeFilter
            };

            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            return {
              success: true,
              text: '',
              scrapedProducts: filtered,
              selectedCategory: 'Gifts',
              language: lang,
              generatedAt: new Date()
            };
          } else {
            const updatedState = {
              menuLevel: 'SUB_CATEGORY',
              gender: selectedGender,
              priceFilter: activeFilter
            };
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            const submenuKey = selectedGender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu';
            return {
              success: true,
              text: this.localize(submenuKey, lang),
              language: lang,
              generatedAt: new Date()
            };
          }
        } else {
          if (/^\\d+\$/.test(lowerMsg)) {
            return {
              success: true,
              text: \`Invalid selection. Please choose 1, 2, or 3.\\n\\n\u0024{this.localize('catalog_prompt', lang)}\`,
              mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
              language: lang,
              generatedAt: new Date()
            };
          } else {
            // Unrelated response - exit flow
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'SUB_CATEGORY') {
        const sub = this.detectSubCategorySelection(messageBody, catalogState.gender);
        if (sub) {
          const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, sub);
          const filtered = activeFilter ? applyPriceFilter(rawProducts, activeFilter) : rawProducts.slice(0, 3);
          
          const updatedState = {
            menuLevel: 'PRODUCTS',
            gender: catalogState.gender,
            subcategory: sub,
            products: filtered,
            priceFilter: activeFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: '',
            scrapedProducts: filtered,
            selectedCategory: sub,
            language: lang,
            generatedAt: new Date()
          };
        } else {
          if (/^\\d+\$/.test(lowerMsg)) {
            const submenuKey = catalogState.gender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu';
            return {
              success: true,
              text: \`Invalid choice. Please select from the menu.\\n\\n\u0024{this.localize(submenuKey, lang)}\`,
              language: lang,
              generatedAt: new Date()
            };
          } else {
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'PRODUCTS') {
        // If a price filter is sent while looking at products, re-filter the products list
        if (hasPriceFilter) {
          const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, catalogState.subcategory);
          const filtered = applyPriceFilter(rawProducts, priceFilter);
          
          const updatedState = {
            menuLevel: 'PRODUCTS',
            gender: catalogState.gender,
            subcategory: catalogState.subcategory,
            products: filtered,
            priceFilter: priceFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: '',
            scrapedProducts: filtered,
            selectedCategory: catalogState.subcategory,
            language: lang,
            generatedAt: new Date()
          };
        }

        const products = catalogState.products || [];
        const selectedProd = this.detectProductSelection(messageBody, products);

        if (selectedProd) {
          const updatedState = {
            menuLevel: 'PRODUCT_DETAIL',
            gender: catalogState.gender,
            subcategory: catalogState.subcategory,
            products: products,
            selectedProduct: selectedProd,
            priceFilter: activeFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: this.localize('product_selected', lang, { name: selectedProd.name, price: selectedProd.price }),
            language: lang,
            generatedAt: new Date()
          };
        } else {
          if (/^\\d+\$/.test(lowerMsg)) {
            return {
              success: true,
              text: \`Invalid selection. Please choose 1, 2, or 3 from the products listed above, or type *back*.\`,
              language: lang,
              generatedAt: new Date()
            };
          } else {
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'PRODUCT_DETAIL') {
        const isOption1 = ['1', 'one', 'order online', 'order on website', 'online', 'website', 'web link', 'link'].includes(lowerMsg) || 
                          (lowerMsg.includes('order') && lowerMsg.includes('website')) ||
                          (lowerMsg.includes('order') && lowerMsg.includes('online')) ||
                          (catalogState.selectedProduct && lowerMsg === '1');

        const isOption2 = ['2', 'two', 'order here', 'order in chat', 'chat', 'order here in chat', 'here'].includes(lowerMsg) ||
                          (lowerMsg.includes('order') && lowerMsg.includes('chat')) ||
                          (lowerMsg.includes('order') && lowerMsg.includes('here')) ||
                          (catalogState.selectedProduct && lowerMsg === '2');

        const selectedProduct = catalogState.selectedProduct;
        if (isOption1 && selectedProduct) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return {
            success: true,
            text: this.localize('option_1_checkout', lang, { name: selectedProduct.name, productUrl: selectedProduct.productUrl }),
            language: lang,
            generatedAt: new Date()
          };
        }

        if (isOption2 && selectedProduct) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return {
            success: true,
            text: this.localize('option_2_checkout', lang, { name: selectedProduct.name, price: selectedProduct.price }),
            language: lang,
            generatedAt: new Date()
          };
        }

        if (/^\\d+\$/.test(lowerMsg)) {
          return {
            success: true,
            text: \`Please reply with "1" to order on our website or "2" to order in chat. You can also type *back* to return to the products list.\`,
            language: lang,
            generatedAt: new Date()
          };
        } else {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return null;
        }
      }
    }

    // 5. Global price filtering if no active category catalog state
    if (hasPriceFilter) {
      const CatalogItem = mongoose.model('CatalogItem');
      const query = { userId: customerProfile.userId };
      
      if (priceFilter.minPrice !== null) query.price = { \\u0024gte: priceFilter.minPrice };
      if (priceFilter.maxPrice !== null) query.price = { ...query.price, \\u0024lte: priceFilter.maxPrice };

      const localItems = await CatalogItem.find(query).limit(3).lean();
      
      if (localItems && localItems.length > 0) {
        const productsList = localItems.map(item => ({
          name: item.name,
          price: \`₹\${item.price}\`,
          imageUrl: item.imageUrl,
          productUrl: (config.websiteUrl || 'https://kanalli.in/')
        }));

        const newState = {
          menuLevel: 'PRODUCTS',
          gender: 'GIFTS', // Generic/fallback group
          subcategory: 'Gifts',
          products: productsList,
          priceFilter: priceFilter
        };

        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': newState
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = newState;
        }

        return {
          success: true,
          text: '',
          scrapedProducts: productsList,
          selectedCategory: 'Items Matching Budget',
          language: lang,
          generatedAt: new Date()
        };
      }
    }

    // A. Fallback old product check
    const lastScrapedProducts = customerProfile.customFields?.lastScrapedProducts;
    const selectedProduct = customerProfile.customFields?.selectedProduct;

    if (lastScrapedProducts && lastScrapedProducts.length > 0) {
      const selectedProd = this.detectProductSelection(messageBody, lastScrapedProducts);
      if (selectedProd) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': selectedProd,
          'customFields.lastScrapedProducts': null
        });

        return {
          success: true,
          text: this.localize('product_selected', lang, { name: selectedProd.name, price: selectedProd.price }),
          generatedAt: new Date()
        };
      }
    }

    // Define options selectors
    const isOption1 = ['1', 'one', 'order online', 'order on website', 'online', 'website', 'web link', 'link'].includes(lowerMsg) || 
                      (lowerMsg.includes('order') && lowerMsg.includes('website')) ||
                      (lowerMsg.includes('order') && lowerMsg.includes('online')) ||
                      (selectedProduct && lowerMsg === '1');

    const isOption2 = ['2', 'two', 'order here', 'order in chat', 'chat', 'order here in chat', 'here'].includes(lowerMsg) ||
                      (lowerMsg.includes('order') && lowerMsg.includes('chat')) ||
                      (lowerMsg.includes('order') && lowerMsg.includes('here')) ||
                      (selectedProduct && lowerMsg === '2');

    // B. Check if a product checkout option is active
    if (selectedProduct) {
      if (isOption1) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': null
        });
        
        return {
          success: true,
          text: this.localize('option_1_checkout', lang, { name: selectedProduct.name, productUrl: selectedProduct.productUrl }),
          generatedAt: new Date()
        };
      }
      
      if (isOption2) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': null
        });

        return {
          success: true,
          text: this.localize('option_2_checkout', lang, { name: selectedProduct.name, price: selectedProduct.price }),
          generatedAt: new Date()
        };
      }
    }

    // 1. Fallback Category Website Order Check
    if (isOption1) {
      const selectedCategory = await this.getLastSelectedCategory(customerProfile._id);
      
      const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : \`\${config.websiteUrl}/\`;
      let categoryUrl = base;
      let catName = '';

      if (selectedCategory) {
        let path = '';
        const catUpper = selectedCategory.toUpperCase();
        if (catUpper === 'RINGS') path = 'product-category/women/rings/';
        else if (catUpper === 'NECKLACES' || catUpper === 'NECKLACE') path = 'product-category/women/necklace/';
        else if (catUpper === 'BANGLES' || catUpper === 'BANGLE') path = 'product-category/women/bangle/';
        else if (catUpper === 'EARRINGS' || catUpper === 'EARRING') path = 'product-category/women/earrings/';
        else if (catUpper === 'SHOW_MORE') path = 'product-category/all-products/';
        categoryUrl = \`\${base}\${path}\`;
        
        catName = catUpper === 'SHOW_MORE' ? '' : \` \` + \`*\${selectedCategory.toLowerCase()}*\`;
      }

      return {
        success: true,
        text: this.localize('option_1_category', lang, { catName, categoryUrl }),
        generatedAt: new Date()
      };
    }

    // 2. Fallback Category Chat Order Check
    if (isOption2) {
      return {
        success: true,
        text: this.localize('option_2_category', lang),
        generatedAt: new Date()
      };
    }

    // 3. Check for payment, order status, admin contact, or "more things"
    const adminKeywords = [
      'pay', 'payment', 'gpay', 'phonepe', 'bank', 'upi', 'transfer', 'cod', 'cash', 'credit card', 'debit card', 'card payment', 'netbanking', 'upi payment', 'payment number', 'how to pay',
      'status', 'track', 'where is my', 'order id', 'order status', 'shipped', 'delivered', 'cancel', 'return',
      'call', 'contact', 'phone', 'number', 'talk to', 'speak to', 'human', 'admin', 'manager', 'owner', 'whatsapp number'
    ];

    const hasAdminKeyword = adminKeywords.some(kw => {
      const escaped = kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
      const regex = new RegExp(\`\\\\b\${escaped}\\\\b\`, 'i');
      return regex.test(lowerMsg);
    });

    if (hasAdminKeyword) {
      return {
        success: true,
        text: this.localize('admin_contact', lang, { phone: config.contactPhone || '+91 9345578103' }),
        generatedAt: new Date()
      };
    }

    return null;
  }
`;

content = content.substring(0, checkInterceptionsStartIndex) + newCheckInterceptionsBlock + content.substring(checkInterceptionsEndIndex);

// Add Template saving parameter passing inside handleCategoryCatalogResponse
// Find where handleCategoryCatalogResponse is called and ensure it has 5 parameters:
// await this.handleCategoryCatalogResponse(selectedCategory, userId, config, language, customerProfile)
// We already did this, but let's make sure it's 100% in-sync

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated aiMessageAnalyzer.js with price filtering, quick replies, and templates!");
