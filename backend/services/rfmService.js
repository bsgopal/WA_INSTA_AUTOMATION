// renic-automation-backend/services/rfmService.js
const Customer = require('../models/Customer');

/**
 * Default RFM Configuration thresholds
 */
const DEFAULT_RFM_CONFIG = {
  vipSpendThreshold: 50000,
  loyalSpendThreshold: 20000,
  loyalOrderCount: 5,
  regularOrderCount: 2,
  atRiskDays: 60,
  inactiveDays: 120,
  lostDays: 180
};

/**
 * Calculates and returns the appropriate RFM segment for given customer metrics
 * @param {Object} metrics
 * @param {number} metrics.totalSpent
 * @param {number} metrics.orderCount
 * @param {Date|string} metrics.lastPurchaseDate
 * @param {Object} [customConfig]
 * @returns {string} One of: 'VIP', 'LOYAL', 'REGULAR', 'NEW', 'AT_RISK', 'INACTIVE', 'LOST'
 */
function calculateSegment(metrics, customConfig = {}) {
  const cfg = { ...DEFAULT_RFM_CONFIG, ...customConfig };
  const totalSpent = Number(metrics.totalSpent) || 0;
  const orderCount = Number(metrics.orderCount) || 1;
  const lastDate = metrics.lastPurchaseDate ? new Date(metrics.lastPurchaseDate) : new Date();

  const daysSincePurchase = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // 1. Inactivity checks first
  if (daysSincePurchase > cfg.lostDays) {
    return 'LOST';
  }
  if (daysSincePurchase > cfg.inactiveDays) {
    return 'INACTIVE';
  }
  if (daysSincePurchase > cfg.atRiskDays && (totalSpent >= cfg.loyalSpendThreshold || orderCount >= cfg.regularOrderCount)) {
    return 'AT_RISK';
  }

  // 2. Active tier scoring
  if (totalSpent >= cfg.vipSpendThreshold) {
    return 'VIP';
  }
  if (totalSpent >= cfg.loyalSpendThreshold || orderCount >= cfg.loyalOrderCount) {
    return 'LOYAL';
  }
  if (orderCount >= cfg.regularOrderCount) {
    return 'REGULAR';
  }

  return 'NEW';
}

/**
 * Automatically evaluates and updates a customer's RFM segment in MongoDB
 * @param {string} customerId
 * @param {Object} [purchaseIncrement]
 * @returns {Promise<{ customer: Object, segmentChanged: boolean, previousSegment: string, newSegment: string }>}
 */
async function evaluateCustomerRFM(customerId, purchaseIncrement = {}) {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return null;

    const previousSegment = customer.rfmSegment || 'NEW';

    // Apply any new purchase increment
    if (purchaseIncrement.amount) {
      customer.totalSpent = (customer.totalSpent || 0) + Number(purchaseIncrement.amount);
      customer.orderCount = (customer.orderCount || 0) + 1;
      customer.lastPurchaseDate = new Date();
      customer.lastActiveAt = new Date();
    }

    const newSegment = calculateSegment({
      totalSpent: customer.totalSpent,
      orderCount: customer.orderCount || 1,
      lastPurchaseDate: customer.lastPurchaseDate || customer.createdAt
    });

    const segmentChanged = previousSegment !== newSegment;
    customer.rfmSegment = newSegment;
    customer.updatedAt = new Date();
    await customer.save();

    if (segmentChanged) {
      console.log(`✨ [Auto-RFM] Customer ${customer.firstName} (${customer.phone}) updated: ${previousSegment} ➔ ${newSegment}`);
    }

    return {
      customer,
      segmentChanged,
      previousSegment,
      newSegment
    };
  } catch (error) {
    console.error('❌ Failed to evaluate RFM for customer:', error);
    return null;
  }
}

/**
 * Scheduled sweep: Recalculate recency and transition dormant customers to AT_RISK or INACTIVE
 */
async function runDailyRFMSweep() {
  try {
    console.log('🕒 [Auto-RFM Sweep] Running automated customer segment sweep...');
    const customers = await Customer.find({ status: 'ACTIVE' });
    let updatedCount = 0;

    for (const customer of customers) {
      const prev = customer.rfmSegment || 'NEW';
      const next = calculateSegment({
        totalSpent: customer.totalSpent || 0,
        orderCount: customer.orderCount || 1,
        lastPurchaseDate: customer.lastPurchaseDate || customer.updatedAt || customer.createdAt
      });

      if (prev !== next) {
        customer.rfmSegment = next;
        await customer.save();
        updatedCount++;
      }
    }

    console.log(`✅ [Auto-RFM Sweep] Completed. Evaluated ${customers.length} customers, updated ${updatedCount} segments.`);
    return { evaluated: customers.length, updated: updatedCount };
  } catch (error) {
    console.error('❌ RFM daily sweep error:', error);
    return { error: error.message };
  }
}

module.exports = {
  calculateSegment,
  evaluateCustomerRFM,
  runDailyRFMSweep,
  DEFAULT_RFM_CONFIG
};
