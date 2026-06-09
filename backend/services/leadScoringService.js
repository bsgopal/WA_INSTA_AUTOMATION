// renic-automation-backend/services/leadScoringService.js
/**
 * Lead Scoring Algorithm
 * Scores conversations 0-10 based on intent, budget, timeline, occasion, and customer history
 */

class LeadScoringService {
  constructor() {
    this.INTENT_SCORES = {
      purchase_intent: 10.0,
      customization: 8.5,
      consultation_booking: 8.0,
      payment_options: 7.0,
      complaint: 8.5,
      stock_check: 5.5,
      product_info: 5.0,
      delivery_query: 6.0,
      price_inquiry: 4.0,
      warranty: 3.0,
      general_inquiry: 2.0
    };

    this.ESCALATION_THRESHOLD = 6.5;
  }

  /**
   * Calculate lead score for a conversation
   */
  calculateScore(analysis, customer, conversationDepth = 1) {
    let score = this.INTENT_SCORES[analysis.intent] || 2.0;

    // Budget modifier
    if (analysis.explicitBudget) {
      score += 1.5;
      if (analysis.explicitBudget > 100000) {
        score += 2.0;
      } else if (analysis.explicitBudget > 50000) {
        score += 1.5;
      }
    }

    // Timeline modifier
    if (analysis.timeline) {
      if (analysis.timeline === 'urgent' || analysis.timeline === 'today' || analysis.timeline === 'this_week') {
        score += 1.5;
      } else if (analysis.timeline === 'this_month') {
        score += 1.0;
      }
    }

    // Occasion modifier (high-value signals)
    if (analysis.occasion) {
      if (['wedding', 'engagement', 'bridal'].includes(analysis.occasion)) {
        score += 1.0;
      }
    }

    // Customer history modifier
    if (customer) {
      if (customer.totalPurchases > 0) {
        score += 1.0; // Existing customer
      }
      if (customer.rfmSegment === 'VIP') {
        score += 1.5;
      }
    }

    // Conversation depth modifier
    if (conversationDepth >= 3) {
      score += 0.5;
    }

    // Sentiment modifier
    if (analysis.sentiment === 'POSITIVE') {
      score += 0.5;
    }

    // Cap at 10
    score = Math.min(score, 10.0);

    return {
      score: parseFloat(score.toFixed(1)),
      shouldEscalate: score >= this.ESCALATION_THRESHOLD,
      reason: this.getScoreReason(analysis, score)
    };
  }

  /**
   * Generate human-readable reason for the score
   */
  getScoreReason(analysis, score) {
    const reasons = [];

    if (analysis.intent === 'purchase_intent') {
      reasons.push('Ready to buy immediately');
    } else if (analysis.intent === 'customization') {
      reasons.push('Custom order request - high value');
    } else if (analysis.intent === 'consultation_booking') {
      reasons.push('Booking consultation - qualified lead');
    }

    if (analysis.explicitBudget) {
      reasons.push(`Budget: ₹${analysis.explicitBudget}`);
    }

    if (analysis.timeline) {
      reasons.push(`Timeline: ${analysis.timeline}`);
    }

    if (analysis.occasion) {
      reasons.push(`Occasion: ${analysis.occasion}`);
    }

    return reasons.join(' | ');
  }

  /**
   * Determine urgency level
   */
  getUrgencyLevel(score) {
    if (score >= 9.5) return 'CRITICAL';
    if (score >= 8.5) return 'HIGH';
    if (score >= 7.0) return 'MEDIUM';
    if (score >= 6.5) return 'WARM';
    return 'COLD';
  }

  /**
   * Get suggested action based on score and intent
   */
  getSuggestedAction(analysis, score) {
    if (score >= 9.5) {
      return 'TAKE OVER NOW — ready to pay immediately';
    }

    if (analysis.intent === 'customization') {
      return 'Book a design call within 1 hour';
    }

    if (analysis.intent === 'complaint') {
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
}

module.exports = new LeadScoringService();
