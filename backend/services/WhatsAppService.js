// renic-automation-backend/services/WhatsAppService.js
// Wrapper service that delegates to either WAHA (Docker Local QR) or Meta WhatsApp Cloud API
// Provides clean and strictly isolated interfaces for WhatsApp operations

const WAHAService = require('./WAHAService');
const MetaService = require('./MetaService');

async function getMetaConfig(userId) {
  try {
    const ShopConfig = require('../models/ShopConfig');
    let config;
    if (userId) {
      config = await ShopConfig.findOne({ userId });
    }
    if (!config) {
      config = await ShopConfig.findOne({ userId: process.env.DEFAULT_USER_ID });
    }
    if (!config) {
      config = await ShopConfig.findOne({ metaApiEnabled: true }).sort({ updatedAt: -1 });
    }
    if (!config) return null;
    return {
      enabled: config.metaApiEnabled || false,
      appId: config.metaAppId || '',
      appSecret: config.metaAppSecret || '',
      phoneNumberId: config.metaPhoneNumberId || '',
      accessToken: config.metaAccessToken || '',
      webhookVerifyToken: config.metaWebhookVerifyToken || '',
      businessAccountId: config.metaBusinessAccountId || ''
    };
  } catch (e) {
    return null;
  }
}

const isMetaConfigured = async (userId) => {
  const config = await getMetaConfig(userId);
  return !!(config && config.enabled && config.accessToken && config.phoneNumberId);
};

// Enterprise WhatsApp Prepaid Wallet & Rate Management
async function getWalletGateInfo() {
  try {
    const License = require('../models/License');
    const license = await License.findOne().sort({ createdAt: -1 });
    const isBypassActive = !!(license?.allowWithoutBalance);
    const messageRate = Number(license?.messageRate ?? 0.90);
    const balance = Number(license?.walletBalance ?? 0);
    const availableCredits = messageRate > 0 ? Math.floor(balance / messageRate) : 0;
    return { license, isBypassActive, messageRate, balance, availableCredits };
  } catch (err) {
    return { license: null, isBypassActive: false, messageRate: 0.90, balance: 0, availableCredits: 0 };
  }
}

async function deductWalletBalance(license, count, description = '', referenceId = '', performedBy = {}) {
  if (!license || license.allowWithoutBalance) return;
  try {
    const messageRate = Number(license.messageRate ?? 0.90);
    const totalDeduct = count * messageRate;
    const balanceBefore = Number(license.walletBalance ?? 0);
    const balanceAfter = Math.max(0, balanceBefore - totalDeduct);
    license.walletBalance = balanceAfter;
    license.availableCredits = messageRate > 0 ? Math.floor(balanceAfter / messageRate) : 0;
    license.totalMessagesSent = (license.totalMessagesSent || 0) + count;
    await license.save();

    // Log transaction in WalletTransaction ledger
    const WalletTransaction = require('../models/WalletTransaction');
    const crypto = require('crypto');
    await WalletTransaction.create({
      transactionId: `TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      customerCode: license.customerCode || 'default',
      type: 'MESSAGE_CONSUMPTION',
      amount: totalDeduct,
      messagesCount: count,
      messageRate,
      balanceBefore,
      balanceAfter,
      description: description || `WhatsApp message consumption (${count} msgs @ Rs ${messageRate.toFixed(2)})`,
      referenceId: referenceId || '',
      performedBy: {
        userId: performedBy.userId || '',
        name: performedBy.name || 'Client User',
        role: performedBy.role || 'user'
      }
    }).catch(e => console.warn('[WhatsAppService] Ledger entry failed:', e.message));
  } catch (err) {
    console.warn('[WhatsAppService] Deduct balance error:', err.message);
  }
}

const sendMessage = async (to, message, options = {}) => {
  // 1. Enterprise Wallet Gate Check
  const { license, isBypassActive, messageRate, balance } = await getWalletGateInfo();
  if (license && !isBypassActive && balance < messageRate) {
    console.warn(`[WhatsAppService] 🛑 Pre-flight wallet gate BLOCKED message to '${to}'. Balance: Rs ${balance.toFixed(2)}, Required: Rs ${messageRate.toFixed(2)}`);
    return {
      success: false,
      error: 'INSUFFICIENT_WALLET_BALANCE',
      message: `Your WhatsApp wallet is empty (Rs ${balance.toFixed(2)}). Rate per message is Rs ${messageRate.toFixed(2)}. Please recharge your wallet in Renic Soft.`,
      channel: 'whatsapp',
      to,
      failureReason: 'EMPTY_WALLET'
    };
  }

  const userId = options.userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
  const senderMode = (options.forceWaha ? 'DOCKER' : options.forceMeta ? 'META' : (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER'))).toUpperCase();

  let sendResult;
  if (senderMode === 'DOCKER') {
    sendResult = await WAHAService.sendMessage(to, message, options);
  } else if (await isMetaConfigured(userId)) {
    sendResult = await MetaService.sendMessage(to, message, { ...options, userId });
  } else {
    sendResult = {
      success: false,
      error: 'Meta Cloud API is not configured or missing credentials',
      channel: 'whatsapp',
      to,
      failureReason: 'META_NOT_CONFIGURED'
    };
  }

  // 2. Deduct message rate from client wallet upon successful delivery
  if (sendResult?.success && license && !isBypassActive) {
    await deductWalletBalance(license, 1, `Direct message to ${to}`, sendResult.id || sendResult.messageId || '', {
      userId: options.userId,
      name: options.userName
    });
  }

  return sendResult;
};

const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  // 1. Enterprise Bulk Wallet Gate Check
  const count = recipients.length;
  const { license, isBypassActive, messageRate, balance } = await getWalletGateInfo();
  const totalCost = count * messageRate;

  if (license && !isBypassActive && balance < totalCost) {
    const availableMsgs = messageRate > 0 ? Math.floor(balance / messageRate) : 0;
    console.warn(`[WhatsAppService] 🛑 Pre-flight bulk wallet gate BLOCKED. Targets: ${count}, Available: ${availableMsgs} (Bal: Rs ${balance.toFixed(2)} @ Rs ${messageRate.toFixed(2)}/msg)`);
    return {
      success: false,
      error: 'INSUFFICIENT_WALLET_BALANCE',
      message: `Insufficient message credits. Bulk dispatch requires ${count} messages (Rs ${totalCost.toFixed(2)}), but your wallet only has Rs ${balance.toFixed(2)} (${availableMsgs} messages remaining @ Rs ${messageRate.toFixed(2)}/msg). Please recharge your wallet in Renic Soft.`,
      sentCount: 0,
      failedCount: count
    };
  }

  const userId = options.userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
  const senderMode = (options.forceWaha ? 'DOCKER' : options.forceMeta ? 'META' : (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER'))).toUpperCase();

  let sendResult;
  if (senderMode === 'DOCKER') {
    const throttleDelay = (shop?.dockerThrottleSeconds || 6) * 1000;
    sendResult = await WAHAService.sendBulkMessages(recipients, messageTemplate, { ...options, throttleDelay });
  } else if (await isMetaConfigured(userId)) {
    sendResult = await MetaService.sendBulkMessages(recipients, messageTemplate, { ...options, userId });
  } else {
    sendResult = {
      success: false,
      error: 'Meta WhatsApp Cloud API is not configured or enabled',
      sentCount: 0,
      failedCount: recipients.length
    };
  }

  // 2. Deduct actual sent messages from client wallet
  if (sendResult?.sentCount > 0 && license && !isBypassActive) {
    await deductWalletBalance(license, sendResult.sentCount, `Bulk campaign dispatch (${sendResult.sentCount} sent)`, '', {
      userId: options.userId,
      name: options.userName
    });
  }

  return sendResult;
};

const handleIncomingMessage = async (data) => {
  return WAHAService.handleIncomingMessage(data);
};

const updateMessageStatus = async (externalMessageId, status, errorInfo) => {
  return WAHAService.handleStatusUpdate({
    event: 'message.status',
    data: {
      id: externalMessageId,
      status: status,
      errorInfo: errorInfo
    }
  });
};

const verifyWebhookSignature = (signature, url, params) => {
  return true;
};

const getMessageStatus = async (externalMessageId) => {
  return WAHAService.getMessageStatus(externalMessageId);
};

const retryFailedMessages = async (messageIds) => {
  return WAHAService.retryFailedMessages(messageIds);
};

const formatPhoneNumber = (phone) => {
  return WAHAService.formatPhoneNumber(phone);
};

const initialize = async () => {
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({}) || {};
  const senderMode = (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();

  if (senderMode === 'DOCKER') {
    return WAHAService.initialize();
  }

  const metaConfigured = await isMetaConfigured();
  if (metaConfigured) {
    return {
      success: true,
      message: 'Meta WhatsApp Cloud API configured and ready',
      sessionName: 'meta_api',
      status: 'META_API',
      authenticated: true
    };
  }

  return {
    success: false,
    error: 'Meta Cloud API not configured',
    status: 'NOT_CONFIGURED',
    authenticated: false
  };
};

const getSessionStatus = async (userId) => {
  const finalUserId = userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId: finalUserId }) || await ShopConfig.findOne({});
  const senderMode = (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();

  if (senderMode === 'DOCKER') {
    const wahaStatus = await WAHAService.getSessionStatus();
    return {
      ...wahaStatus,
      channel: 'docker',
      senderMode: 'DOCKER'
    };
  }

  // META mode
  const metaConfigured = await isMetaConfigured(finalUserId);
  if (metaConfigured) {
    const displayNum = shop?.metaDisplayPhoneNumber || (shop?.metaPhoneNumberId ? `Meta ID: ${shop.metaPhoneNumberId}` : null);
    return {
      success: true,
      status: 'META_API',
      authenticated: true,
      phoneNumber: displayNum,
      verifiedName: shop?.metaVerifiedName || '',
      channel: 'meta_api',
      senderMode: 'META'
    };
  }

  return {
    success: false,
    status: 'NOT_CONFIGURED',
    authenticated: false,
    phoneNumber: null,
    channel: 'meta_api',
    senderMode: 'META'
  };
};

const getQRCode = async () => {
  return WAHAService.getQRCode();
};

const getWAHAStatus = async () => {
  return WAHAService.getSessionStatus();
};

const logout = async () => {
  return WAHAService.logout();
};

const restartSession = async () => {
  return WAHAService.restartSession();
};

const requestPairingCode = async (phoneNumber) => {
  return WAHAService.requestPairingCode(phoneNumber);
};

module.exports = {
  sendMessage,
  sendBulkMessages,
  handleIncomingMessage,
  updateMessageStatus,
  verifyWebhookSignature,
  getMessageStatus,
  retryFailedMessages,
  formatPhoneNumber,
  initialize,
  getSessionStatus,
  getWAHAStatus,
  getQRCode,
  logout,
  restartSession,
  requestPairingCode,
  testConnection: WAHAService.testConnection
};
