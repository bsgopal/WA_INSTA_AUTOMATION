// renic-automation-backend/services/WhatsAppService.js
// Wrapper service that delegates to WAHA (WhatsApp HTTP API)
// Provides unified interface for WhatsApp operations

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
  return config && config.enabled && config.accessToken && config.phoneNumberId;
};

const sendMessage = async (to, message, options = {}) => {
  const userId = options.userId || process.env.DEFAULT_USER_ID;

  // Bulk/campaign sends must ALWAYS use the Meta Cloud API config, never WAHA/docker.
  let providers;
  if (options.forceWaha) {
    providers = ['waha'];
  } else if (options.forceMeta) {
    providers = ['meta'];
  } else {
    const metaConfigured = await isMetaConfigured(userId);
    providers = metaConfigured
      ? ['meta', 'waha']
      : ['waha', 'meta'];
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      let result;
      if (provider === 'meta') {
        result = await MetaService.sendMessage(to, message, { ...options, userId });
      } else {
        result = await WAHAService.sendMessage(to, message, options);
      }

      if (result && result.success) {
        result.provider = provider;
        return result;
      }

      lastError = result?.error || result?.failureReason || `Unknown ${provider} error`;
      console.warn(`[WhatsAppService] ${provider.toUpperCase()} send failed (${to}): ${lastError}${providers.length > 1 ? ' - trying fallback provider' : ''}`);

      if (provider === 'meta' && result && result.failureReason) {
        const fallbackTriggers = [
          'META_131047',
          'META_132001',
          'Re-engagement',
          're-engagement',
          'reengagement',
          'Template'
        ];
        if (fallbackTriggers.some(trigger => String(lastError).includes(trigger))) {
          console.warn(`[WhatsAppService] Falling back from Meta to WAHA because of Meta re-engagement error for ${to}`);
          if (!providers.includes('waha')) {
            providers.push('waha');
          }
        }
      }
    } catch (err) {
      lastError = err.message;
      console.warn(`[WhatsAppService] ${provider.toUpperCase()} send threw (${to}): ${err.message}`);
    }
  }

  return {
    success: false,
    error: lastError || 'All WhatsApp providers failed',
    channel: 'whatsapp',
    to,
    failureReason: options.forceMeta ? 'META_SEND_FAILED' : 'ALL_PROVIDERS_FAILED'
  };
};

const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  const userId = options.userId || process.env.DEFAULT_USER_ID;
  const ShopConfig = require('../models/ShopConfig');
  const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
  const senderMode = (options.forceWaha ? 'DOCKER' : options.forceMeta ? 'META' : (shop?.whatsappSenderMode || 'META')).toUpperCase();

  if (senderMode === 'DOCKER') {
    const throttleDelay = (shop?.dockerThrottleSeconds || 6) * 1000;
    return WAHAService.sendBulkMessages(recipients, messageTemplate, { ...options, throttleDelay });
  }

  if (await isMetaConfigured(userId)) {
    return MetaService.sendBulkMessages(recipients, messageTemplate, { ...options, userId });
  }
  return WAHAService.sendBulkMessages(recipients, messageTemplate, options);
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
  const metaConfigured = await isMetaConfigured();
  let wahaStatus = null;
  try {
    wahaStatus = await WAHAService.initialize();
  } catch (err) {
    console.warn('[WhatsAppService] WAHA initialize error:', err.message);
  }

  if (metaConfigured) {
    return {
      success: true,
      message: wahaStatus?.success
        ? 'Meta API configured (primary) + WAHA session available (fallback)'
        : 'Meta API configured - using Meta WhatsApp Cloud API',
      sessionName: 'meta_api',
      status: 'META_API',
      authenticated: true,
      waha: wahaStatus
    };
  }
  return wahaStatus || { success: false, error: 'No provider available' };
};

const getSessionStatus = async (userId) => {
  const finalUserId = userId || process.env.DEFAULT_USER_ID;
  const metaConfigured = await isMetaConfigured(finalUserId);
  let wahaStatus = null;
  try {
    wahaStatus = await WAHAService.getSessionStatus();
  } catch (err) {
    console.warn('[WhatsAppService] WAHA session status error:', err.message);
  }

  if (metaConfigured) {
    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId: finalUserId });
    const displayNum = shop?.metaDisplayPhoneNumber || (shop?.metaPhoneNumberId ? `Meta Number ID: ${shop.metaPhoneNumberId}` : null);
    return {
      success: true,
      status: 'META_API',
      authenticated: true,
      phoneNumber: displayNum,
      channel: 'meta_api',
      fallbackAvailable: !!(wahaStatus && wahaStatus.success && wahaStatus.authenticated),
      waha: wahaStatus
    };
  }
  return wahaStatus || { success: false, error: 'No provider available' };
};

const getQRCode = async () => {
  // Always attempt WAHA QR so users can connect the fallback session,
  // even when Meta API is also configured.
  return WAHAService.getQRCode();
};

const getWAHAStatus = async () => {
  // Raw WAHA session status - used by the "WhatsApp Login" tab so it always
  // shows the QR-scanned session (never the Meta API channel).
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
  requestPairingCode
};