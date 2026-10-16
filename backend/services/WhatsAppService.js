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

const sendMessage = async (to, message, options = {}) => {
  const userId = options.userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
  const senderMode = (options.forceWaha ? 'DOCKER' : options.forceMeta ? 'META' : (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER'))).toUpperCase();

  if (senderMode === 'DOCKER') {
    return WAHAService.sendMessage(to, message, options);
  }

  // Meta Cloud API Mode
  if (await isMetaConfigured(userId)) {
    return MetaService.sendMessage(to, message, { ...options, userId });
  }

  return {
    success: false,
    error: 'Meta Cloud API is not configured or missing credentials',
    channel: 'whatsapp',
    to,
    failureReason: 'META_NOT_CONFIGURED'
  };
};

const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  const userId = options.userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
  const senderMode = (options.forceWaha ? 'DOCKER' : options.forceMeta ? 'META' : (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER'))).toUpperCase();

  if (senderMode === 'DOCKER') {
    const throttleDelay = (shop?.dockerThrottleSeconds || 6) * 1000;
    return WAHAService.sendBulkMessages(recipients, messageTemplate, { ...options, throttleDelay });
  }

  if (await isMetaConfigured(userId)) {
    return MetaService.sendBulkMessages(recipients, messageTemplate, { ...options, userId });
  }

  return {
    success: false,
    error: 'Meta WhatsApp Cloud API is not configured or enabled',
    sentCount: 0,
    failedCount: recipients.length
  };
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
