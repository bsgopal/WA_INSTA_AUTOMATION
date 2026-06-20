// renic-automation-backend/services/ownerNotificationService.js
const WhatsAppService = require('./WhatsAppService');
const User = require('../models/User');

class OwnerNotificationService {
  /**
   * Send lead alert to owner's WhatsApp
   */
  async sendLeadAlert(data) {
    try {
      const {
        customer,
        message,
        analysis,
        leadScore,
        language,
        userId
      } = data;

      // Get owner's WhatsApp number
      const owner = await User.findById(userId);
      const ShopConfig = require('../models/ShopConfig');
      const shopConfig = await ShopConfig.findOne({ userId });
      const ownerPhone = shopConfig?.contactPhone || (owner ? (owner.whatsappNumber || owner.phone) : null);
      
      if (!ownerPhone) {
        console.warn('Owner WhatsApp number not configured');
        return { success: false, reason: 'Owner number not configured' };
      }

      // Build alert message
      const alertMessage = this.buildAlertMessage(
        customer,
        message,
        analysis,
        leadScore,
        language
      );

      // Send to owner
      const result = await WhatsAppService.sendMessage(
        ownerPhone,
        alertMessage
      );

      return {
        success: result.success,
        messageId: result.externalMessageId,
        sentAt: new Date()
      };
    } catch (error) {
      console.error('Owner Notification Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build formatted alert message for owner
   */
  buildAlertMessage(customer, message, analysis, leadScore, language) {
    const emoji = leadScore.score >= 9 ? '🔥🔥🔥'
                : leadScore.score >= 8 ? '🔥🔥'
                : '🔥';

    const urgencyLine = analysis.timeline && analysis.timeline !== 'not_specified'
      ? `Timeline: ${this.formatTimeline(analysis.timeline)} ⚡`
      : 'Timeline: Not specified';

    const budgetLine = analysis.explicitBudget
      ? `Budget: ₹${analysis.explicitBudget} 💰`
      : analysis.budgetRange !== 'not_mentioned'
      ? `Budget Range: ${analysis.budgetRange}`
      : 'Budget: Not mentioned';

    const occasionLine = analysis.occasion && analysis.occasion !== 'not_specified'
      ? `Occasion: ${analysis.occasion}`
      : '';

    const customerHistoryLine = customer.totalPurchases > 0
      ? `Customer history: ${customer.totalPurchases} orders, ₹${customer.totalSpent} spent`
      : 'New customer';

    const suggestedAction = this.getSuggestedAction(analysis.intent, leadScore.score);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const chatLink = `${clientUrl}/conversations?customerId=${customer._id}`;

    const alertText = `${emoji} HOT LEAD — ${leadScore.score}/10

Customer: ${customer.firstName} ${customer.lastName}
Phone: ${customer.whatsappNumber}
Language: ${language}

Intent: ${this.formatIntent(analysis.intent)}
${budgetLine}
${urgencyLine}
${occasionLine}

Message: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"

${customerHistoryLine}

Reason: ${leadScore.reason}

🔗 Open Chat: ${chatLink}

💡 Suggested action: ${suggestedAction}`;

    return alertText;
  }

  /**
   * Format intent for display
   */
  formatIntent(intent) {
    const intentMap = {
      purchase_intent: 'Ready to Buy Now',
      customization: 'Custom Order Request',
      consultation_booking: 'Booking Consultation',
      payment_options: 'Asking Payment Methods',
      complaint: 'Customer Complaint',
      stock_check: 'Checking Stock',
      product_info: 'Product Information',
      delivery_query: 'Delivery Status',
      price_inquiry: 'Price Inquiry',
      warranty: 'Warranty Question',
      general_inquiry: 'General Inquiry'
    };

    return intentMap[intent] || intent;
  }

  /**
   * Format timeline for display
   */
  formatTimeline(timeline) {
    const timelineMap = {
      today: 'Wants it TODAY',
      this_week: 'This week',
      this_month: 'This month',
      next_month: 'Next month',
      urgent: 'URGENT'
    };

    return timelineMap[timeline] || timeline;
  }

  /**
   * Get suggested action based on intent and score
   */
  getSuggestedAction(intent, score) {
    if (score >= 9.5) {
      return 'TAKE OVER NOW — ready to pay immediately';
    }

    if (intent === 'customization') {
      return 'Book a design call within 1 hour';
    }

    if (intent === 'complaint') {
      return 'Send personal apology + resolution offer';
    }

    if (score >= 8) {
      return 'Send one personal closing message + offer';
    }

    if (score >= 6.5) {
      return 'Monitor — AI will continue nurturing';
    }

    return 'Let AI handle — low priority';
  }

  /**
   * Send daily summary to owner
   */
  async sendDailySummary(userId, summaryData) {
    try {
      const owner = await User.findById(userId);
      if (!owner || !owner.whatsappNumber) {
        return { success: false };
      }

      const summaryMessage = `
📊 DAILY SUMMARY — ${new Date().toLocaleDateString()}

🔥 Hot Leads: ${summaryData.hotLeads}
💬 Total Messages: ${summaryData.totalMessages}
💰 Pipeline Value: ₹${summaryData.pipelineValue}
✅ Closed Today: ${summaryData.closedToday}

Top Lead: ${summaryData.topLead?.name || 'None'}
Score: ${summaryData.topLead?.score || 'N/A'}/10

Dashboard: [link]`;

      const result = await WhatsAppService.sendMessage(
        owner.whatsappNumber,
        summaryMessage
      );

      return { success: result.success };
    } catch (error) {
      console.error('Daily Summary Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OwnerNotificationService();
