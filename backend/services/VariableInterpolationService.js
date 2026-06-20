/**
 * DYNAMIC VARIABLE INTERPOLATION SERVICE
 * 
 * This service handles replacing template variables with real data from:
 * - ShopConfig (store info, rates, hours, etc.)
 * - Customer data (name, phone, etc.)
 * - Order data (id, amount, items, etc.)
 * - Conditional logic (dates, inventory, etc.)
 * 
 * Usage: {{variable_name}}
 * Example: "Today 22K gold rate is {{gold_rate_22k}} per gram"
 * Output: "Today 22K gold rate is ₹7,200 per gram"
 */

const ShopConfig = require('../models/ShopConfig');

const INR_SYMBOL = '\u20B9';

const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatCurrency = value => `${INR_SYMBOL}${value?.toLocaleString?.() || value || '0'}`;

const getCustomerNameParts = customer => {
  const firstName =
    customer?.firstName ||
    customer?.name ||
    customer?.displayName ||
    customer?.customFields?.displayName ||
    customer?.customFields?.pushName ||
    '';
  const lastName = customer?.lastName || '';

  return {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim()
  };
};

class VariableInterpolationService {
  /**
   * Get all available variables with descriptions
   */
  static async getAvailableVariables(userId) {
    try {
      const shopConfig = await ShopConfig.findOne({ userId });
      
      return {
        storeVariables: {
          "{{shop_name}}": {
            description: "Your store/shop name",
            example: "Renic Jewellers",
            category: "STORE_INFO"
          },
          "{{shop_address}}": {
            description: "Your store address",
            example: "123 Gold Bazaar, T. Nagar, Chennai",
            category: "STORE_INFO"
          },
          "{{shop_phone}}": {
            description: "Your store phone number",
            example: "+91 9345578103",
            category: "STORE_INFO"
          },
          "{{shop_website}}": {
            description: "Your store website URL",
            example: "https://kanalli.in/",
            category: "STORE_INFO"
          },
          "{{shop_hours}}": {
            description: "Store operating hours",
            example: "10:00 AM - 8:30 PM (Monday to Saturday)",
            category: "STORE_INFO"
          },
          "{{return_policy}}": {
            description: "Return/exchange policy details",
            example: "7-day replacement guarantee on manufacturing defects",
            category: "STORE_INFO"
          },
          "{{ai_instructions}}": {
            description: "AI custom instructions/tone",
            example: "Always sound extremely polite and warm",
            category: "STORE_INFO"
          }
        },
        priceVariables: {
          "{{gold_rate_24k}}": {
            description: "Current 24K gold rate per gram",
            example: "₹7,850",
            category: "PRICING",
            unit: "per gram"
          },
          "{{gold_rate_22k}}": {
            description: "Current 22K gold rate per gram",
            example: "₹7,200",
            category: "PRICING",
            unit: "per gram"
          },
          "{{silver_rate}}": {
            description: "Current silver rate per gram",
            example: "₹95",
            category: "PRICING",
            unit: "per gram"
          },
          "{{platinum_rate}}": {
            description: "Current platinum rate per gram",
            example: "₹3,200",
            category: "PRICING",
            unit: "per gram"
          },
          "{{custom_start_price}}": {
            description: "Minimum custom jewelry price",
            example: "₹8,500",
            category: "PRICING"
          }
        },
        customerVariables: {
          "{{customer_name}}": {
            description: "Customer's first name",
            example: "Rajesh",
            category: "CUSTOMER_DATA"
          },
          "{{customer_full_name}}": {
            description: "Customer's full name",
            example: "Rajesh Kumar",
            category: "CUSTOMER_DATA"
          },
          "{{customer_phone}}": {
            description: "Customer's phone number",
            example: "+91 98765 43210",
            category: "CUSTOMER_DATA"
          },
          "{{customer_city}}": {
            description: "Customer's city",
            example: "Chennai",
            category: "CUSTOMER_DATA"
          }
        },
        orderVariables: {
          "{{order_id}}": {
            description: "Unique order ID",
            example: "ORD-2025-001234",
            category: "ORDER_DATA"
          },
          "{{order_amount}}": {
            description: "Total order amount",
            example: "₹45,000",
            category: "ORDER_DATA"
          },
          "{{order_item_count}}": {
            description: "Number of items in order",
            example: "3",
            category: "ORDER_DATA"
          },
          "{{order_date}}": {
            description: "Order creation date",
            example: "June 20, 2025",
            category: "ORDER_DATA"
          },
          "{{delivery_date}}": {
            description: "Expected delivery date",
            example: "June 28, 2025",
            category: "ORDER_DATA"
          }
        },
        productVariables: {
          "{{product_name}}": {
            description: "Product/jewelry name",
            example: "22K Gold Bridal Necklace",
            category: "PRODUCT_DATA"
          },
          "{{product_weight}}": {
            description: "Product weight in grams",
            example: "12.5g",
            category: "PRODUCT_DATA"
          },
          "{{product_purity}}": {
            description: "Gold purity (22K, 24K, etc.)",
            example: "22K",
            category: "PRODUCT_DATA"
          },
          "{{product_price}}": {
            description: "Product price",
            example: "₹87,500",
            category: "PRODUCT_DATA"
          }
        },
        dateTimeVariables: {
          "{{today_date}}": {
            description: "Today's date",
            example: "June 20, 2025",
            category: "DATE_TIME"
          },
          "{{tomorrow_date}}": {
            description: "Tomorrow's date",
            example: "June 21, 2025",
            category: "DATE_TIME"
          },
          "{{current_time}}": {
            description: "Current time",
            example: "3:30 PM",
            category: "DATE_TIME"
          },
          "{{current_month}}": {
            description: "Current month name",
            example: "June",
            category: "DATE_TIME"
          },
          "{{current_year}}": {
            description: "Current year",
            example: "2025",
            category: "DATE_TIME"
          }
        },
        promotionalVariables: {
          "{{discount_percentage}}": {
            description: "Discount percentage",
            example: "15%",
            category: "PROMOTIONAL"
          },
          "{{discount_amount}}": {
            description: "Discount amount in currency",
            example: "₹10,000",
            category: "PROMOTIONAL"
          },
          "{{offer_validity}}": {
            description: "Offer valid until date",
            example: "June 30, 2025",
            category: "PROMOTIONAL"
          },
          "{{coupon_code}}": {
            description: "Promotional coupon code",
            example: "SUMMER25",
            category: "PROMOTIONAL"
          }
        },
        conditionalVariables: {
          "{{if_new_customer}}...{{endif_new_customer}}": {
            description: "Show content only for new customers",
            example: "{{if_new_customer}}Welcome to our store!{{endif_new_customer}}",
            category: "CONDITIONAL"
          },
          "{{if_high_value}}...{{endif_high_value}}": {
            description: "Show content only for high-value customers (>₹1 lakh)",
            example: "{{if_high_value}}Exclusive member benefits apply{{endif_high_value}}",
            category: "CONDITIONAL"
          },
          "{{if_repeat_customer}}...{{endif_repeat_customer}}": {
            description: "Show content only for repeat customers",
            example: "{{if_repeat_customer}}We've missed you!{{endif_repeat_customer}}",
            category: "CONDITIONAL"
          }
        }
      };
    } catch (error) {
      console.error('Error getting available variables:', error);
      return null;
    }
  }

  /**
   * Replace variables in template content with actual values
   */
  static async interpolateVariables(templateContent, userId, contextData = {}) {
    try {
      const shopConfig = await ShopConfig.findOne({ userId }) || {};
      
      if (!shopConfig || Object.keys(shopConfig).length === 0) {
        console.warn('ShopConfig not found for userId:', userId, '- using default variable fallbacks');
      }
      let result = templateContent;

      // DATE/TIME VARIABLES
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const customer = contextData.customer || {};
      const { firstName, lastName } = getCustomerNameParts(customer);
      const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer';
      const customerPhone = customer.phone || customer.whatsappNumber || customer.instagramHandle || '+91 XXXXXXXXXX';
      const customerCity = customer.city || customer.location?.city || 'Your City';
      const order = contextData.order || {};
      const product = contextData.product || {};
      const promotion = contextData.promotion || {};

      const variableMap = {
        '{{shop_name}}': shopConfig.shopName || 'Jewellery Store',
        '{{shop_address}}': shopConfig.address || 'Contact for address',
        '{{shop_phone}}': shopConfig.contactPhone || '+91 XXXXXXXXXX',
        '{{shop_website}}': shopConfig.websiteUrl || 'https://example.com',
        '{{shop_hours}}': shopConfig.operatingHours || '10 AM - 8 PM',
        '{{return_policy}}': shopConfig.returnPolicy || 'Contact for details',
        '{{ai_instructions}}': shopConfig.aiCustomInstructions || '',

        '{{gold_rate_24k}}': formatCurrency(shopConfig.goldRate24K || '7,850'),
        '{{gold_rate_22k}}': formatCurrency(shopConfig.goldRate22K || '7,200'),
        '{{silver_rate}}': formatCurrency(shopConfig.silverRate || '95'),
        '{{platinum_rate}}': formatCurrency(shopConfig.platinumRate || '3,200'),
        '{{custom_start_price}}': formatCurrency(shopConfig.customStartPrice || '8,500'),

        '{{customer_name}}': firstName || 'Valued Customer',
        '{{customer_full_name}}': fullName,
        '{{customer_phone}}': customerPhone,
        '{{customer_city}}': customerCity,

        '{{order_id}}': order.id || 'ORD-000000',
        '{{order_amount}}': formatCurrency(order.amount || '0'),
        '{{order_item_count}}': order.itemCount || '0',
        '{{order_date}}': order.date || this.formatDate(new Date()),
        '{{delivery_date}}': order.deliveryDate || 'TBD',

        '{{product_name}}': product.name || 'Product',
        '{{product_weight}}': product.weight || '0g',
        '{{product_purity}}': product.purity || '22K',
        '{{product_price}}': formatCurrency(product.price || '0'),

        '{{today_date}}': this.formatDate(now),
        '{{tomorrow_date}}': this.formatDate(tomorrow),
        '{{current_time}}': this.formatTime(now),
        '{{current_month}}': this.getMonthName(now.getMonth()),
        '{{current_year}}': now.getFullYear().toString(),

        '{{discount_percentage}}': promotion.percentage || '0%',
        '{{discount_amount}}': formatCurrency(promotion.amount || '0'),
        '{{offer_validity}}': promotion.validityDate || 'TBD',
        '{{coupon_code}}': promotion.couponCode || 'PROMO2025'
      };

      const aliasMap = {
        '{{firstname}}': variableMap['{{customer_name}}'],
        '{{first_name}}': variableMap['{{customer_name}}'],
        '{{firstName}}': variableMap['{{customer_name}}'],
        '{{customer_first_name}}': variableMap['{{customer_name}}'],
        '{{lastname}}': lastName,
        '{{last_name}}': lastName,
        '{{lastName}}': lastName,
        '{{fullname}}': variableMap['{{customer_full_name}}'],
        '{{full_name}}': variableMap['{{customer_full_name}}'],
        '{{fullName}}': variableMap['{{customer_full_name}}'],
        '{{customer_fullname}}': variableMap['{{customer_full_name}}'],
        '{{phone}}': variableMap['{{customer_phone}}'],
        '{{mobile}}': variableMap['{{customer_phone}}'],
        '{{city}}': variableMap['{{customer_city}}'],
        '{{gold rate}}': variableMap['{{gold_rate_22k}}'],
        '{{gold_rate}}': variableMap['{{gold_rate_22k}}'],
        '{{goldRate}}': variableMap['{{gold_rate_22k}}'],
        '{{22k_gold_rate}}': variableMap['{{gold_rate_22k}}'],
        '{{gold_rate_22kt}}': variableMap['{{gold_rate_22k}}'],
        '{{24k_gold_rate}}': variableMap['{{gold_rate_24k}}'],
        '{{gold_rate_24kt}}': variableMap['{{gold_rate_24k}}'],
        '{{silver rate}}': variableMap['{{silver_rate}}'],
        '{{platinum rate}}': variableMap['{{platinum_rate}}'],
        '{{productName}}': variableMap['{{product_name}}'],
        '{{productPrice}}': variableMap['{{product_price}}']
      };

      Object.entries({ ...variableMap, ...aliasMap }).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), String(value ?? ''));
      });

      // CONDITIONAL BLOCKS
      result = this.processConditionalBlocks(result, contextData);

      return result;
    } catch (error) {
      console.error('Error interpolating variables:', error);
      return templateContent; // Return original on error
    }
  }

  /**
   * Process conditional blocks like {{if_new_customer}}...{{endif_new_customer}}
   */
  static processConditionalBlocks(content, contextData) {
    let result = content;

    // NEW CUSTOMER CONDITION
    const isNewCustomer = !contextData.customer?.previousOrders || contextData.customer.previousOrders === 0;
    const newCustomerRegex = /{{if_new_customer}}([\s\S]*?){{endif_new_customer}}/g;
    result = result.replace(newCustomerRegex, isNewCustomer ? '$1' : '');

    // HIGH VALUE CUSTOMER CONDITION (>1 lakh spent)
    const totalSpent = contextData.customer?.totalSpent || 0;
    const isHighValue = totalSpent > 100000;
    const highValueRegex = /{{if_high_value}}([\s\S]*?){{endif_high_value}}/g;
    result = result.replace(highValueRegex, isHighValue ? '$1' : '');

    // REPEAT CUSTOMER CONDITION
    const isRepeatCustomer = contextData.customer?.previousOrders && contextData.customer.previousOrders > 0;
    const repeatCustomerRegex = /{{if_repeat_customer}}([\s\S]*?){{endif_repeat_customer}}/g;
    result = result.replace(repeatCustomerRegex, isRepeatCustomer ? '$1' : '');

    return result;
  }

  /**
   * Format date helper
   */
  static formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  }

  /**
   * Format time helper
   */
  static formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-IN', options);
  }

  /**
   * Get month name
   */
  static getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex] || '';
  }

  /**
   * Validate template - check if all variables are documented
   */
  static async validateTemplate(templateContent, userId) {
    try {
      const variables = await this.getAvailableVariables(userId);
      const allValidVars = Object.keys(variables).flatMap(category => Object.keys(variables[category]));
      const aliasVars = [
        '{{firstname}}',
        '{{first_name}}',
        '{{firstName}}',
        '{{lastname}}',
        '{{last_name}}',
        '{{lastName}}',
        '{{fullname}}',
        '{{full_name}}',
        '{{fullName}}',
        '{{phone}}',
        '{{mobile}}',
        '{{city}}',
        '{{gold rate}}',
        '{{gold_rate}}',
        '{{goldRate}}',
        '{{22k_gold_rate}}',
        '{{24k_gold_rate}}',
        '{{silver rate}}',
        '{{platinum rate}}',
        '{{productName}}',
        '{{productPrice}}'
      ];
      const validVariableSet = new Set([...allValidVars, ...aliasVars]);
      
      // Extract all {{variable}} patterns from template
      const usedVars = templateContent.match(/{{[^}]+}}/g) || [];
      
      const validVars = [];
      const unknownVars = [];

      for (const varPattern of usedVars) {
        if (validVariableSet.has(varPattern)) {
          validVars.push(varPattern);
        } else if (!varPattern.includes('if_') && !varPattern.includes('endif_')) {
          unknownVars.push(varPattern);
        }
      }

      return {
        isValid: unknownVars.length === 0,
        totalVariables: usedVars.length,
        validVariables: validVars,
        unknownVariables: unknownVars
      };
    } catch (error) {
      console.error('Error validating template:', error);
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Get sample output - shows what template looks like with sample data
   */
  static async getSampleOutput(templateContent, userId) {
    const sampleData = {
      customer: {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        phone: '+91 98765 43210',
        city: 'Chennai',
        previousOrders: 2,
        totalSpent: 150000
      },
      order: {
        id: 'ORD-2025-001234',
        amount: 45000,
        itemCount: 3,
        date: 'June 15, 2025',
        deliveryDate: 'June 28, 2025'
      },
      product: {
        name: '22K Gold Bridal Necklace',
        weight: '12.5g',
        purity: '22K',
        price: 87500
      },
      promotion: {
        percentage: '15%',
        amount: 10000,
        validityDate: 'June 30, 2025',
        couponCode: 'SUMMER25'
      }
    };

    return this.interpolateVariables(templateContent, userId, sampleData);
  }
}

module.exports = VariableInterpolationService;
