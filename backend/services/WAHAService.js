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

const extractMessageIdFromResponse = (responseData) => {
  if (!responseData) return '';
  return extractStringId(
    responseData.id ||
    responseData.messageId ||
    responseData.message?.id ||
    responseData.message?._serialized ||
    responseData.data?.id ||
    responseData.key?.id
  );
};

const buildReadableListFallback = (message, listConfig = {}) => {
  const sections = Array.isArray(listConfig.sections) ? listConfig.sections : [];

  const lines = [];
  const promptText = String(message || '').trim();
  if (promptText) {
    lines.push(promptText);
    lines.push('');
  }

  let globalRowIndex = 0;
  sections.forEach((section, sectionIndex) => {
    const sectionTitle = String(section?.title || '').trim();
    if (sectionTitle) {
      lines.push(`📁 ${sectionTitle}`);
    }

    (section?.rows || []).forEach((row) => {
      const rowTitle = String(row?.title || row?.label || 'Option').trim();
      const rowDescription = String(row?.description || '').trim();
      if (!rowTitle) return;
      
      const rowNum = globalRowIndex + 1;
      let rowText = `${rowNum}. ${rowTitle}`;
      if (rowDescription) {
        rowText += ` — ${rowDescription}`;
      }
      if (row.price) {
        rowText += ` (${row.price})`;
      }
      
      lines.push(rowText);
      globalRowIndex++;
    });
  });

  if (globalRowIndex > 0) {
    lines.push('');
    lines.push('_Reply with the number to select_');
  }

  return lines.join('\n').trim();
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
      name: SESSION_NAME,
      url: WEBHOOK_URL,
      events: ['message', 'message.status', 'presence.update']
    };

    // Register webhook
    await wahaClient.post('/webhooks', webhookConfig);

    console.log(`✅ Webhook registered: ${WEBHOOK_URL}`);
    return { success: true };
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Webhook API registration returned 404. Relying on pre-configured webhook environment variables.');
      return { success: true, message: 'Using environment variables' };
    }
    console.error('❌ Webhook Setup Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get session QR code
 * Status-aware: only requests the QR once the session is actually in SCAN_QR_CODE state,
 * otherwise returns a clear error instead of hanging until timeout.
 */
const getQRCode = async () => {
  try {
    const sessionStatus = await getSessionStatus();
    if (!sessionStatus.success) {
      return { success: false, error: `Cannot reach WAHA (${sessionStatus.error}). Is the Docker container running?` };
    }

    if (sessionStatus.authenticated) {
      return { success: false, error: 'Session is already connected.', authenticated: true };
    }

    if (sessionStatus.status === 'STARTING' || sessionStatus.status === 'STOPPING') {
      return {
        success: false,
        error: 'WhatsApp session is starting up, please wait a few seconds and try again.',
        status: sessionStatus.status,
        retryAfter: 5000
      };
    }

    if (sessionStatus.status === 'STOPPED' || sessionStatus.status === 'FAILED') {
      console.log(`Session is ${sessionStatus.status}. Starting session ${SESSION_NAME} for QR scan...`);
      try {
        await wahaClient.post(`/sessions/${SESSION_NAME}/start`);
      } catch (startErr) {
        console.warn(`Failed to start session before QR: ${startErr.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const response = await wahaClient.get(`/${SESSION_NAME}/auth/qr`, {
      responseType: 'arraybuffer',
      timeout: 60000
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

  // Strip a leading "0" national prefix (e.g. 09345578103 -> 9345578103)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Add country code if not present (any exactly 10-digit Indian number requires prepended country code)
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return cleaned + '@c.us';
};

/**
 * Send a WhatsApp message via WAHA
 */
const sendMessage = async (to, message, options = {}) => {
  try {
    const sessionState = await getSessionStatus();
    if (!sessionState.success || !sessionState.authenticated) {
      return {
        success: false,
        error: 'WhatsApp session is not connected. Please reconnect in Settings.',
        channel: 'whatsapp',
        to,
        failureReason: 'SESSION_NOT_CONNECTED'
      };
    }

    const formattedPhone = formatPhoneNumber(to);
    let response;
    const mediaDataUrl =
      (typeof options.mediaData === 'string' && options.mediaData.startsWith('data:') ? options.mediaData : null) ||
      (typeof options.mediaUrl === 'string' && options.mediaUrl.startsWith('data:') ? options.mediaUrl : null);

    // 1. Handle interactive list messages
    if (options.list) {
      const fallbackText = buildReadableListFallback(message, options.list);
      const allowNativeLists = String(process.env.WAHA_ENABLE_NATIVE_LISTS || '').toLowerCase() === 'true';

      if (!allowNativeLists) {
        console.warn("WAHAService: Native list messages are disabled for this WAHA setup. Sending plain text fallback.");
        response = await wahaClient.post('/sendText', {
          session: SESSION_NAME,
          chatId: formattedPhone,
          text: fallbackText
        });
      } else {
        const payload = {
          session: SESSION_NAME,
          chatId: formattedPhone,
          title: options.list.title || 'Options',
          text: message,
          button: options.list.buttonText || 'Select',
          sections: options.list.sections || []
        };
        try {
          response = await wahaClient.post('/sendList', payload);
        } catch (err) {
          console.warn("WAHAService: /sendList failed. Falling back to plain text formatting.");
          response = await wahaClient.post('/sendText', {
            session: SESSION_NAME,
            chatId: formattedPhone,
            text: fallbackText
          });
        }
      }
    }
    // 1.5 Handle split sending for media card with buttons
    else if ((mediaDataUrl || options.mediaUrl) && options.buttons && options.buttons.length > 0) {
      try {
        const filePayload = mediaDataUrl
          ? {
              mimetype: options.mediaMimeType || mediaDataUrl.match(/^data:(.*?);base64,/)?.[1] || 'application/octet-stream',
              filename: options.mediaFileName || 'campaign-media',
              data: mediaDataUrl.split(',')[1]
            }
          : { url: options.mediaUrl };
        await wahaClient.post('/sendFile', {
          session: SESSION_NAME,
          chatId: formattedPhone,
          file: filePayload,
          caption: message
        });
      } catch (err) {
        console.warn(`⚠️ WAHAService: /sendFile failed in card-button send:`, err.message);
      }
      const wahaButtons = options.buttons.map(b => ({
        id: b.value,
        reply: { id: b.value, title: b.label }
      }));
      response = await wahaClient.post('/sendButtons', {
        session: SESSION_NAME,
        chatId: formattedPhone,
        text: 'Action buttons:',
        buttons: wahaButtons
      });
    }
    // 2. Handle interactive buttons
    else if (options.buttons && options.buttons.length > 0) {
      const wahaButtons = options.buttons.map(b => ({
        id: b.value,
        reply: { id: b.value, title: b.label }
      }));
      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        text: message,
        buttons: wahaButtons
      };
      try {
        response = await wahaClient.post('/sendButtons', payload);
      } catch (err) {
        console.warn(`⚠️ WAHAService: /sendButtons failed. Falling back to numbered text format.`);
        let fallbackText = message + '\n';
        options.buttons.forEach((b, idx) => {
          const num = idx + 1;
          if (b.type === 'URL' || b.actionType === 'URL' || b.value?.startsWith('http')) {
            fallbackText += `\n${num}. 🔗 ${b.label}`;
            if (!message.includes(b.value)) fallbackText += `\n   ${b.value}`;
          } else {
            fallbackText += `\n${num}. ${b.label}`;
          }
        });
        fallbackText += '\n\n_Reply with the number to select_';
        response = await wahaClient.post('/sendText', {
          session: SESSION_NAME,
          chatId: formattedPhone,
          text: fallbackText
        });
      }
    }
    // 3. Handle file media
    else if (mediaDataUrl || options.mediaUrl) {
      const mediaType = options.mediaType || 'image';
      let targetUrl = options.mediaUrl;
      
      // Translate localhost/127.0.0.1 to host.docker.internal so Docker container can resolve it
      if (targetUrl && (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1'))) {
        targetUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
        console.log(`🔄 WAHAService: Local URL detected, translated to: ${targetUrl}`);
      }

      console.log(`📤 WAHAService: Preparing ${mediaType} media send for ${formattedPhone}`, {
        hasBase64: !!mediaDataUrl,
        hasUrl: !!targetUrl,
        mediaFileName: options.mediaFileName
      });

      // Construct file payload according to WAHA schema (using "file" object)
      const filePayload = mediaDataUrl
        ? {
            mimetype: options.mediaMimeType || mediaDataUrl.match(/^data:(.*?);base64,/)?.[1] || 'application/octet-stream',
            filename: options.mediaFileName || 'campaign-media',
            data: mediaDataUrl.split(',')[1]
          }
        : {
            mimetype: options.mediaMimeType || (mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'application/octet-stream'),
            filename: options.mediaFileName || 'campaign-media',
            url: targetUrl
          };

      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        file: filePayload,
        caption: message
      };

      // Determine endpoint based on media type
      let endpoint = '/sendFile'; // Default fallback
      if (mediaType === 'image') {
        endpoint = '/sendImage';
      } else if (mediaType === 'video') {
        endpoint = '/sendVideo';
      } else if (mediaType === 'document' || mediaType === 'pdf') {
        endpoint = '/sendDocument';
      } else if (mediaType === 'audio') {
        endpoint = '/sendAudio';
      }

      let mediaAttemptFailed = false;
      let lastError = null;

      // Try type-specific endpoint
      try {
        console.log(`🔄 WAHAService: Trying endpoint ${endpoint}...`);
        response = await wahaClient.post(endpoint, payload);
        console.log(`✅ WAHAService: ${endpoint} success response:`, response.data);
      } catch (typeSpecificErr) {
        mediaAttemptFailed = true;
        lastError = typeSpecificErr;
        const errStatus = typeSpecificErr.response?.status;
        const errMsg = typeSpecificErr.response?.data?.description || typeSpecificErr.response?.data?.message || typeSpecificErr.message;
        
        console.warn(`⚠️  WAHAService: ${endpoint} failed (${errStatus}): ${errMsg}`);

        // If type-specific endpoint failed, try generic /sendFile
        if (endpoint !== '/sendFile') {
          try {
            console.log(`🔄 WAHAService: Falling back to /sendFile endpoint...`);
            response = await wahaClient.post('/sendFile', payload);
            console.log(`✅ WAHAService: /sendFile fallback success:`, response.data);
            mediaAttemptFailed = false; // Reset since fallback succeeded
          } catch (fileSendErr) {
            lastError = fileSendErr;
            const fileErrStatus = fileSendErr.response?.status;
            const fileErrMsg = fileSendErr.response?.data?.description || fileSendErr.response?.data?.message || fileSendErr.message;
            console.error(`❌ WAHAService: /sendFile also failed (${fileErrStatus}):`, fileErrMsg);
          }
        }
      }

      // If media send completely failed, check if it's a Plus version issue or any other recoverable error
      if (mediaAttemptFailed && lastError) {
        const errStatus = lastError.response?.status;
        const errData = lastError.response?.data || {};
        const errMsg = errData.description || errData.message || lastError.message || '';
        
        console.log(`🔍 WAHAService: Error details:`, {
          status: errStatus,
          description: errData.description,
          message: errData.message,
          fullMsg: errMsg,
          isPlusRequired: errMsg.includes('Plus version') || errMsg.includes('NOWEB')
        });
        
        if (errStatus === 422 && (errMsg.includes('Plus version') || errMsg.includes('NOWEB') || errMsg.includes('available only'))) {
          console.warn(`⚠️  WAHAService: WAHA Plus version required for media. Falling back to link-in-text method.`);
          
          // Send message with media link as text instead
          const mediaEmoji = mediaType === 'image' ? '🖼️' 
                           : mediaType === 'video' ? '🎥'
                           : mediaType === 'audio' ? '🎵'
                           : '📎';
          
          const linkText = targetUrl 
            ? `${message}\n\n${mediaEmoji} ${options.mediaFileName || 'Media'}: ${targetUrl}`
            : `${message}\n\n${mediaEmoji} [${options.mediaFileName || 'Media'} attached but could not be sent]`;
          
          try {
            response = await wahaClient.post('/sendText', {
              session: SESSION_NAME,
              chatId: formattedPhone,
              text: linkText
            });
            console.log(`✅ WAHAService: Sent message with media link as fallback`);
          } catch (linkErr) {
            console.error(`❌ WAHAService: Even text fallback failed:`, linkErr.message);
            throw linkErr;
          }
        } else {
          // Some other error, re-throw it
          throw lastError;
        }
      }
    } 
    // 4. Handle plain text
    else {
      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        text: message
      };
      response = await wahaClient.post('/sendText', payload);
    }

    const externalMessageId = extractMessageIdFromResponse(response.data);
    if (!externalMessageId) {
      console.error('WAHA Send Warning: response missing message id', response.data);
      return {
        success: false,
        error: 'WAHA did not return a message ID. Message may not have been sent.',
        channel: 'whatsapp',
        to: formattedPhone,
        failureReason: 'MISSING_MESSAGE_ID'
      };
    }

    return {
      success: true,
      externalMessageId,
      status: 'QUEUED',
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
    const { event, data: eventData, payload } = data;
    const statusPayload = eventData || payload || {};

    if (event === 'message.status' || event === 'message.ack') {
      const { id, status, ack, ackName, errorInfo } = statusPayload;
      const normalizedStatus = event === 'message.ack'
        ? mapWAHAAckStatus(ackName || ack)
        : mapWAHAStatus(status);

      // Load the previous status first so campaign counters only increment on real transitions
      const existingMessage = await Message.findOne({ externalMessageId: extractStringId(id) }).lean();
      const previousStatus = existingMessage?.status;

      const message = await Message.findOneAndUpdate(
        { externalMessageId: extractStringId(id) },
        {
          status: normalizedStatus,
          failureReason: normalizedStatus === 'FAILED'
            ? (errorInfo || `WAHA ${event}: ${ackName || ack || status || 'unknown'}`)
            : undefined,
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
            status: normalizedStatus,
            updatedAt: new Date()
          }
        );
      } catch (syncErr) {
        console.warn('ConversationMessage status sync warning:', syncErr.message);
      }

      // Bump campaign performance counters on genuine transitions
      if (existingMessage && existingMessage.campaignId) {
        try {
          await updateCampaignStatusCounters(existingMessage.campaignId, previousStatus, normalizedStatus);
        } catch (campErr) {
          console.warn('[WAHA] Campaign counter update error:', campErr.message);
        }
      }

      return {
        success: true,
        messageId: message?._id,
        status: normalizedStatus
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
    'QUEUED': 'QUEUED',
    'SENT': 'SENT',
    'DELIVERED': 'DELIVERED',
    'READ': 'READ',
    'FAILED': 'FAILED',
    'ERROR': 'FAILED'
  };

  // Status webhooks can arrive with plain names OR raw ACK values
  // (e.g. forwarded ackName "DEVICE"/"SERVER" or numeric ack 1/2/3).
  const normalized = typeof wahaStatus === 'string' ? wahaStatus.toUpperCase() : wahaStatus;

  if (statusMap[normalized]) return statusMap[normalized];
  return mapWAHAAckStatus(normalized);
};

const mapWAHAAckStatus = (ackValue) => {
  const normalized = typeof ackValue === 'string' ? ackValue.toUpperCase() : ackValue;
  const ackMap = {
    [-1]: 'FAILED',
    0: 'PENDING',
    1: 'SENT',
    2: 'DELIVERED',
    3: 'READ',
    4: 'READ',
    ERROR: 'FAILED',
    PENDING: 'PENDING',
    SERVER: 'SENT',
    DEVICE: 'DELIVERED',
    READ: 'READ',
    PLAYED: 'READ'
  };

  return ackMap[normalized] || 'PENDING';
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
 * Bump a campaign's performance counters based on message status transitions.
 * Only increments when the status actually changes (e.g. SENT -> DELIVERED -> READ),
 * so counters stay accurate even if duplicate status webhooks arrive.
 */
const updateCampaignStatusCounters = async (campaignId, previousStatus, newStatus) => {
  if (!campaignId || !previousStatus || !newStatus || previousStatus === newStatus) return;

  const Campaign = require('../models/Campaign');
  const update = {};

  if (newStatus === 'DELIVERED' && !['DELIVERED', 'READ'].includes(previousStatus)) {
    update.totalDelivered = 1;
  }
  if (newStatus === 'READ' && previousStatus !== 'READ') {
    update.totalRead = 1;
  }
  // A message that was already accepted (SENT) later reported as FAILED
  if (newStatus === 'FAILED' && ['SENT', 'DELIVERED', 'READ'].includes(previousStatus)) {
    update.totalFailed = 1;
  }

  if (Object.keys(update).length === 0) return;

  await Campaign.updateOne(
    { _id: campaignId },
    {
      $inc: update,
      $set: { updatedAt: new Date() }
    }
  );

  // Recompute delivery rate from the authoritative (now-incremented) counters
  const camp = await Campaign.findOne({ _id: campaignId }).select('totalSent totalDelivered').lean();
  if (camp) {
    await Campaign.updateOne(
      { _id: campaignId },
      { deliveryRate: camp.totalSent > 0 ? Math.round(camp.totalDelivered / camp.totalSent * 100 * 100) / 100 : 0 }
    );
  }
};

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
 * Restart a stuck or starting session (breaks STARTING/registering loops)
 */
const restartSession = async () => {
  try {
    console.log(`🔄 Restarting session ${SESSION_NAME}...`);
    await wahaClient.post(`/sessions/${SESSION_NAME}/restart`);
    await new Promise(resolve => setTimeout(resolve, 4000));
    return { success: true };
  } catch (error) {
    console.error('❌ Restart Session Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Request Pairing Code for a phone number
 */
const requestPairingCode = async (phoneNumber) => {
  try {
    let cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
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
  restartSession,
  formatPhoneNumber,
  mapWAHAStatus,
  updateCampaignStatusCounters,
  WAHA_API_URL,
  SESSION_NAME
};





