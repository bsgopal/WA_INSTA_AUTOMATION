// renic-automation-backend/utils/smartTagParser.js

/**
 * Replaces non-technical Smart Tags with real customer, order, and store data
 * Gracefully falls back to friendly defaults if data is missing.
 *
 * @param {string} text - Message template containing smart tags
 * @param {Object} context - Customer & store data
 * @param {Object} [context.customer] - Customer model/object
 * @param {Object} [context.order] - Order / Bill data
 * @param {Object} [context.store] - Store / Showroom settings
 * @returns {string} Fully resolved message text
 */
function resolveSmartTags(text, context = {}) {
  if (!text || typeof text !== 'string') return '';

  const customer = context.customer || {};
  const order = context.order || {};
  const store = context.store || {};

  const customerName = customer.firstName || customer.name || 'Valued Customer';
  const customerPhone = customer.phone || customer.whatsappNumber || '';
  const storeName = store.companyName || store.shopName || store.name || 'Renic Silks & Textiles';
  const storeAddress = store.address || 'Commercial Complex, Main Road';
  const billAmount = order.grandTotal || order.total || order.amount ? `₹${Number(order.grandTotal || order.total || order.amount).toLocaleString('en-IN')}` : '';
  const orderId = order.billNumber || order.orderId || order.invoiceNumber || '';
  const todayDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let resolved = text;

  // 1. Standard Smart Tags (Square brackets)
  resolved = resolved.split('[Customer Name]').join(customerName);
  resolved = resolved.split('[Mobile Number]').join(customerPhone);
  resolved = resolved.split('[Store Name]').join(storeName);
  resolved = resolved.split('[Store Address]').join(storeAddress);
  resolved = resolved.split('[Bill Amount]').join(billAmount || '₹0');
  resolved = resolved.split('[Order ID]').join(orderId || '-');
  resolved = resolved.split("[Today's Date]").join(todayDate);

  // 2. Legacy Curly Braces fallback ({name}, {{name}}, etc.)
  resolved = resolved.replace(/\{\s*name\s*\}|\{\{\s*name\s*\}\}/gi, customerName);
  resolved = resolved.replace(/\{\s*phone\s*\}|\{\{\s*phone\s*\}\}/gi, customerPhone);
  resolved = resolved.replace(/\{\s*store\s*\}|\{\{\s*store\s*\}\}/gi, storeName);
  resolved = resolved.replace(/\{\s*amount\s*\}|\{\{\s*amount\s*\}\}/gi, billAmount);
  resolved = resolved.replace(/\{\s*order\s*\}|\{\{\s*order\s*\}\}/gi, orderId);

  return resolved;
}

module.exports = {
  resolveSmartTags
};
