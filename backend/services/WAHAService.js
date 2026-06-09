// renic-automation-backend/services/WAHAService.js
// WAHA (WhatsApp HTTP API) - Open-source WhatsApp integration
// Free, self-hosted, no approval needed

const axios = require('axios');
const Message = require('../models/Message');

const WAHA_API_URL = process.env.WAHA_API_URL || 'http://localhost:3000';
const SESSION_NAME = process.env.WAHA_SESSION_NAME || 'renic_automation';
const WEBHOOK_URL = process.env.WAHA_WEBHOOK_URL || 'https://workaday-ungarbed-gino.ngrok-free.dev/api/webhooks/whatsapp';

// Create axios instance for WAHA API
const extractStringId = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object') {
    return id._serialized || id.id || JSON.stringify(id);
  }
  return String(id);
};

const wahaClient = axios.create({
  baseURL: `${WAHA_API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.WAHA_API_KEY && { 'X-Api-Key': process.env.WAHA_API_KEY })
  }
});

/**
 * Initialize WAHA session and set up webhooks
 */
const initialize = async () => {
  try {
    console.log('🔄 Initializing WAHA service...');
    console.log(`📍 WAHA API URL: ${WAHA_API_URL}`);
    console.log(`📱 Session Name: ${SESSION_NAME}`);

    // Try to get session status first
    try {
      const sessionStatus = await wahaClient.get(`/sessions/${SESSION_NAME}`);
      console.log(`✅ WAHA session already exists: ${SESSION_NAME}`);
      console.log(`📱 Status: ${sessionStatus.data.status}`);
      console.log(`🔐 Authenticated: ${sessionStatus.data.status === 'WORKING'}`);
      
      // Auto-start if stopped or failed
      if (sessionStatus.data.status === 'STOPPED' || sessionStatus.data.status === 'FAILED') {
        if (sessionStatus.data.status === 'FAILED') {
          try {
            console.log(`🔄 Session is FAILED. Stopping session ${SESSION_NAME} first to reset...`);
            await wahaClient.post(`/sessions/${SESSION_NAME}/stop`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (stopErr) {
            console.warn(`⚠️ Failed to stop FAILED session: ${stopErr.message}`);
          }
        }
        console.log(`🔄 Session is ${sessionStatus.data.status}. Starting session: ${SESSION_NAME}...`);
        await wahaClient.post(`/sessions/${SESSION_NAME}/start`);
      }
      
      // Set up webhook
      await setupWebhook();
      
      return {
        success: true,
        message: 'Session already active',
        sessionName: SESSION_NAME,
        status: sessionStatus.data.status,
        authenticated: sessionStatus.data.status === 'WORKING'
      };
    } catch (statusError) {
      // Session doesn't exist, try to create it
      if (statusError.response?.status === 404) {
        console.log(`📲 Creating new WAHA session: ${SESSION_NAME}`);
        
        try {
          const createResponse = await wahaClient.post('/sessions', {
            name: SESSION_NAME
          });

          console.log('✅ WAHA session created');
          console.log('📸 Scan the QR code to authenticate WhatsApp');
          
          return {
            success: true,
            message: 'Session created. Please scan QR code.',
            sessionName: SESSION_NAME,
            qrCodeUrl: `${WAHA_API_URL}/sessions/${SESSION_NAME}/qr`
          };
        } catch (createError) {
          // If creation fails with "already exists", session was created between checks
          if (createError.response?.status === 422 && createError.response?.data?.message?.includes('already exists')) {
            console.log(`✅ WAHA session exists (created by another process): ${SESSION_NAME}`);
            await setupWebhook();
            
            return {
              success: true,
              message: 'Session already active',
              sessionName: SESSION_NAME
            };
          }
          throw createError;
        }
      } else {
        throw statusError;
      }
    }
  } catch (error) {
    console.error('❌ WAHA Initialization Error:', error.message);
    if (error.response?.data) {
      console.error('📋 Error Details:', error.response.data);
    }
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

/**
 * Set up webhook for incoming messages
 */
const setupWebhook = async () => {
  try {
    console.log('🔗 Setting up WAHA webhook...');

    const webhookConfig = {
      url: WEBHOOK_URL,
      events: ['message', 'message.status', 'presence.update']
    };

    // Register webhook
    await wahaClient.post(`/sessions/${SESSION_NAME}/webhooks`, webhookConfig);

    console.log(`✅ Webhook registered: ${WEBHOOK_URL}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Webhook Setup Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get session QR code
 */
const getQRCode = async () => {
  try {
    const response = await wahaClient.get(`/${SESSION_NAME}/auth/qr`, {
      responseType: 'arraybuffer'
    });
    const base64Qr = Buffer.from(response.data, 'binary').toString('base64');
    return {
      success: true,
      qrCode: `data:image/png;base64,${base64Qr}`
    };
  } catch (error) {
    console.error('❌ QR Code Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get session status
 */
const getSessionStatus = async () => {
  try {
    const response = await wahaClient.get(`/sessions/${SESSION_NAME}`);
    
    // Auto-start if stopped
    if (response.data.status === 'STOPPED') {
      console.log(`🔄 Session is STOPPED during status check. Starting session: ${SESSION_NAME}...`);
      await wahaClient.post(`/sessions/${SESSION_NAME}/start`);
      // Fetch status again
      const reResponse = await wahaClient.get(`/sessions/${SESSION_NAME}`);
      return {
        success: true,
        status: reResponse.data.status,
        authenticated: reResponse.data.status === 'WORKING',
        phoneNumber: reResponse.data.me?.id || null
      };
    }

    // Auto-logout if FAILED to cleanly reset and prompt for fresh QR code
    if (response.data.status === 'FAILED') {
      console.log(`⚠️ Session is FAILED. Logging out session ${SESSION_NAME} to reset stale credentials...`);
      try {
        await wahaClient.post(`/sessions/${SESSION_NAME}/logout`);
        console.log(`✅ Stale session logged out successfully.`);
        // Fetch status again to get the fresh status (usually SCAN_QR_CODE)
        const reResponse = await wahaClient.get(`/sessions/${SESSION_NAME}`);
        return {
          success: true,
          status: reResponse.data.status,
          authenticated: reResponse.data.status === 'WORKING',
          phoneNumber: reResponse.data.me?.id || null
        };
      } catch (logoutErr) {
        console.error(`❌ Failed to log out failed session: ${logoutErr.message}`);
      }
    }

    return {
      success: true,
      status: response.data.status,
      authenticated: response.data.status === 'WORKING',
      phoneNumber: response.data.me?.id || null
    };
  } catch (error) {
    console.error('❌ Session Status Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Format phone number to WAHA format
 */
const formatPhoneNumber = (phone) => {
  let cleaned = phone;
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.includes('@')) {
    return cleaned;
  }
  cleaned = cleaned.replace(/\D/g, '');

  // Add country code if not present
  if (!cleaned.startsWith('91')) {
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
  }

  return cleaned + '@c.us';
};

/**
 * Send a WhatsApp message via WAHA
 */
const sendMessage = async (to, message, options = {}) => {
  try {
    const formattedPhone = formatPhoneNumber(to);
    let response;

    if (options.mediaUrl) {
      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        file: {
          url: options.mediaUrl
        },
        caption: message
      };
      try {
        response = await wahaClient.post('/sendFile', payload);
      } catch (err) {
        const errorMsg = err.response?.data?.message || '';
        if (err.response?.status === 422 && (errorMsg.includes('Plus version') || errorMsg.includes('engine') || errorMsg.includes('available only'))) {
          console.warn(`⚠️ WAHAService: /sendFile requires Plus version. Falling back to plain text sendText.`);
          const fallbackPayload = {
            session: SESSION_NAME,
            chatId: formattedPhone,
            text: `${message}\n\n🖼️ Catalog Banner: ${options.mediaUrl}`
          };
          response = await wahaClient.post('/sendText', fallbackPayload);
        } else {
          throw err;
        }
      }
    } else {
      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        text: message
      };
      response = await wahaClient.post('/sendText', payload);
    }

    return {
      success: true,
      externalMessageId: extractStringId(response.data.id),
      status: 'SENT',
      sentAt: new Date(),
      channel: 'whatsapp',
      to: formattedPhone
    };
  } catch (error) {
    console.error('❌ WAHA Send Error:', error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', error.response.data);
    }
    return {
      success: false,
      error: error.message,
      channel: 'whatsapp',
      to,
      failureReason: error.response?.status || 'WAHA_ERROR'
    };
  }
};

/**
 * Send bulk messages with throttling
 */
const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  const results = [];
  const { throttleDelay = 1000 } = options;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      const result = await sendMessage(
        recipient.whatsappNumber,
        messageTemplate,
        options
      );

      results.push({
        customerId: recipient._id,
        phone: recipient.whatsappNumber,
        ...result
      });

      if (i < recipients.length - 1) {
        await delay(throttleDelay);
      }
    } catch (error) {
      results.push({
        customerId: recipient._id,
        phone: recipient.whatsappNumber,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Handle incoming WAHA webhook message
 */
const handleIncomingMessage = async (data) => {
  try {
    // WAHA webhook format
    const { event, data: eventData } = data;

    if (event === 'message') {
      const { id, from, body, hasMedia, media } = eventData;
      
      // Extract phone number from WAHA format (e.g., "919876543210@c.us")
      const phoneNumber = from.replace('@c.us', '');

      const messageDoc = new Message({
        content: body,
        channel: 'whatsapp',
        status: 'PENDING',
        hasResponse: true,
        responseText: body,
        respondedAt: new Date(),
        externalMessageId: extractStringId(id),
        mediaUrl: hasMedia && media ? media.url : null,
        tags: ['incoming', 'customer']
      });

      await messageDoc.save();

      return {
        success: true,
        messageId: messageDoc._id,
        phoneNumber: '+' + phoneNumber,
        content: body
      };
    }

    return {
      success: false,
      error: 'Unknown event type'
    };
  } catch (error) {
    console.error('❌ WAHA Webhook Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle message status update
 */
const handleStatusUpdate = async (data) => {
  try {
    const { event, data: eventData } = data;

    if (event === 'message.status') {
      const { id, status } = eventData;

      const message = await Message.findOneAndUpdate(
        { externalMessageId: extractStringId(id) },
        {
          status: mapWAHAStatus(status),
          updatedAt: new Date()
        },
        { new: true }
      );

      // Sync status to ConversationMessage
      try {
        const ConversationMessage = require('../models/ConversationMessage');
        await ConversationMessage.findOneAndUpdate(
          { platformMessageId: extractStringId(id) },
          {
            status: mapWAHAStatus(status),
            updatedAt: new Date()
          }
        );
      } catch (syncErr) {
        console.warn('⚠️ ConversationMessage status sync warning:', syncErr.message);
      }

      return {
        success: true,
        messageId: message?._id,
        status: mapWAHAStatus(status)
      };
    }

    return { success: false };
  } catch (error) {
    console.error('❌ Status Update Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Map WAHA status to our status enum
 */
const mapWAHAStatus = (wahaStatus) => {
  const statusMap = {
    'PENDING': 'PENDING',
    'SENT': 'SENT',
    'DELIVERED': 'DELIVERED',
    'READ': 'READ',
    'FAILED': 'FAILED',
    'ERROR': 'FAILED'
  };

  return statusMap[wahaStatus] || 'PENDING';
};

/**
 * Get message delivery status
 */
const getMessageStatus = async (externalMessageId) => {
  try {
    const message = await Message.findOne({ externalMessageId });
    
    if (!message) {
      return {
        success: false,
        error: 'Message not found'
      };
    }

    return {
      success: true,
      status: message.status,
      updatedAt: message.updatedAt
    };
  } catch (error) {
    console.error('❌ Fetch Status Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Retry failed messages
 */
const retryFailedMessages = async (messageIds) => {
  try {
    const messages = await Message.find({
      _id: { $in: messageIds },
      status: 'FAILED',
      retryCount: { $lt: 3 }
    });

    const results = [];

    for (const msg of messages) {
      const result = await sendMessage(msg.externalPhone, msg.content);

      if (result.success) {
        msg.status = 'SENT';
        msg.retryCount = (msg.retryCount || 0) + 1;
        await msg.save();
      }

      results.push({
        messageId: msg._id,
        ...result
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Retry Error:', error.message);
    return [];
  }
};

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all sessions
 */
const getSessions = async () => {
  try {
    const response = await wahaClient.get('/sessions');
    return {
      success: true,
      sessions: response.data
    };
  } catch (error) {
    console.error('❌ Get Sessions Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Logout session
 */
const logout = async () => {
  try {
    await wahaClient.post(`/sessions/${SESSION_NAME}/logout`);
    console.log(`✅ Session ${SESSION_NAME} logged out`);
    return { success: true };
  } catch (error) {
    console.error('❌ Logout Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Request Pairing Code for a phone number
 */
const requestPairingCode = async (phoneNumber) => {
  try {
    let cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhone.startsWith('91') && cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }
    const response = await wahaClient.post(`/${SESSION_NAME}/auth/request-code`, {
      phoneNumber: cleanedPhone
    });

    return {
      success: true,
      code: response.data.code
    };
  } catch (error) {
    console.error('❌ Request Pairing Code Error:', error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', error.response.data);
    }
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

module.exports = {
  initialize,
  setupWebhook,
  getQRCode,
  requestPairingCode,
  getSessionStatus,
  sendMessage,
  sendBulkMessages,
  handleIncomingMessage,
  handleStatusUpdate,
  getMessageStatus,
  retryFailedMessages,
  getSessions,
  logout,
  formatPhoneNumber,
  mapWAHAStatus,
  WAHA_API_URL,
  SESSION_NAME
};
