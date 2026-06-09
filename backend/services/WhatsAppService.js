// renic-automation-backend/services/WhatsAppService.js
// Wrapper service that delegates to WAHA (WhatsApp HTTP API)
// Provides unified interface for WhatsApp operations

const WAHAService = require('./WAHAService');

/**
 * Send a WhatsApp message
 */
const sendMessage = async (to, message, options = {}) => {
  return WAHAService.sendMessage(to, message, options);
};

/**
 * Send bulk messages with throttling
 */
const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  return WAHAService.sendBulkMessages(recipients, messageTemplate, options);
};

/**
 * Handle incoming WhatsApp webhook
 */
const handleIncomingMessage = async (data) => {
  return WAHAService.handleIncomingMessage(data);
};

/**
 * Update message delivery status
 */
const updateMessageStatus = async (externalMessageId, status) => {
  return WAHAService.handleStatusUpdate({
    event: 'message.status',
    data: {
      id: externalMessageId,
      status: status
    }
  });
};

/**
 * Verify webhook signature (WAHA doesn't require signature verification)
 */
const verifyWebhookSignature = (signature, url, params) => {
  // WAHA webhooks are sent to our configured URL, no signature verification needed
  // This is a security advantage - we control the webhook URL
  return true;
};

/**
 * Get message delivery status
 */
const getMessageStatus = async (externalMessageId) => {
  return WAHAService.getMessageStatus(externalMessageId);
};

/**
 * Retry failed messages
 */
const retryFailedMessages = async (messageIds) => {
  return WAHAService.retryFailedMessages(messageIds);
};

/**
 * Format phone number
 */
const formatPhoneNumber = (phone) => {
  return WAHAService.formatPhoneNumber(phone);
};

/**
 * Initialize WhatsApp service
 */
const initialize = async () => {
  return WAHAService.initialize();
};

/**
 * Get session status
 */
const getSessionStatus = async () => {
  return WAHAService.getSessionStatus();
};

/**
 * Get QR code for authentication
 */
const getQRCode = async () => {
  return WAHAService.getQRCode();
};

/**
 * Logout session
 */
const logout = async () => {
  return WAHAService.logout();
};

/**
 * Request pairing code for authentication
 */
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
  getQRCode,
  logout,
  requestPairingCode
};