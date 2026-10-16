// renic-automation-backend/services/WAHAService.js
// WAHA (WhatsApp HTTP API) - Open-source WhatsApp integration
// Free, self-hosted, no approval needed

const fs = require('fs');
const path = require('path');
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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.WAHA_API_KEY && { 'X-Api-Key': process.env.WAHA_API_KEY })
  }
});

// Dynamic configuration interceptor: loads tenant-configured wahaApiUrl & wahaApiKey on every outgoing request
wahaClient.interceptors.request.use(async (config) => {
  try {
    let shopConfig = null;
    try {
      const { getModel } = require('../middlewares/tenantContext');
      const TenantShopConfig = getModel('ShopConfig');
      shopConfig = await TenantShopConfig.findOne({});
    } catch (e) {}

    if (!shopConfig) {
      const ShopConfig = require('../models/ShopConfig');
      shopConfig = await ShopConfig.findOne({});
    }

    if (shopConfig?.wahaApiUrl && shopConfig.wahaApiUrl.trim()) {
      const cleanUrl = shopConfig.wahaApiUrl.trim().replace(/\/+$/, '');
      config.baseURL = `${cleanUrl}/api`;
    }
    const activeKey = (shopConfig?.wahaApiKey !== undefined && shopConfig?.wahaApiKey !== '')
      ? shopConfig.wahaApiKey.trim()
      : (process.env.WAHA_API_KEY || '');

    if (activeKey) {
      config.headers['X-Api-Key'] = activeKey;
    } else {
      delete config.headers['X-Api-Key'];
    }
  } catch (err) {}
  return config;
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

    const defaultLocalWebhook = 'http://host.docker.internal:5000/api/webhooks/whatsapp';
    const targetWebhookUrl = process.env.WAHA_WEBHOOK_URL || defaultLocalWebhook;

    const webhookList = [
      {
        url: targetWebhookUrl,
        events: ['message', 'message.ack']
      }
    ];

    // In modern WAHA, webhooks are configured directly on the session
    try {
      await wahaClient.put(`/sessions/${SESSION_NAME}`, {
        config: {
          webhooks: webhookList
        }
      });
      console.log(`✅ Session webhook registered: ${targetWebhookUrl}`);
      return { success: true };
    } catch (putErr) {
      console.warn(`Could not update session webhooks via PUT: ${putErr.message}`);
    }

    // Fallback to legacy global /webhooks endpoint if supported
    try {
      await wahaClient.post('/webhooks', {
        name: SESSION_NAME,
        url: targetWebhookUrl,
        events: ['message', 'message.status', 'presence.update']
      });
      console.log(`✅ Legacy Webhook registered: ${targetWebhookUrl}`);
    } catch {
      // ignore
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Webhook Setup Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get contact info from WAHA
 */
const getContact = async (contactId, session = SESSION_NAME) => {
  try {
    const response = await wahaClient.get('/contacts', {
      params: { contactId, session }
    });
    return response.data || null;
  } catch (err) {
    return null;
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

    // Auto-restart if FAILED or network dropped to reconnect existing session
    if (response.data.status === 'FAILED') {
      console.log(`⚠️ Session is FAILED (temporary network drop). Reconnecting session ${SESSION_NAME} using saved credentials...`);
      try {
        await wahaClient.post(`/sessions/${SESSION_NAME}/stop`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await wahaClient.post(`/sessions/${SESSION_NAME}/start`);
        console.log(`🔄 Session restart triggered to resume WhatsApp connection.`);
        
        // Fetch status again after initiating reconnect
        const reResponse = await wahaClient.get(`/sessions/${SESSION_NAME}`);
        return {
          success: true,
          status: reResponse.data.status,
          authenticated: reResponse.data.status === 'WORKING',
          phoneNumber: reResponse.data.me?.id || null
        };
      } catch (restartErr) {
        console.error(`❌ Failed to restart failed session: ${restartErr.message}`);
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
 * Resolve media file from options (base64, local file path, or remote URL)
 * Converts to base64 payload so WAHA inside Docker does not fail with network URL fetches.
 */
const resolveMediaFilePayload = async (options = {}) => {
  const mediaDataUrl =
    (typeof options.mediaData === 'string' && options.mediaData.startsWith('data:') ? options.mediaData : null) ||
    (typeof options.mediaUrl === 'string' && options.mediaUrl.startsWith('data:') ? options.mediaUrl : null);

  let mediaType = options.mediaType || 'image';
  let mimetype = options.mediaMimeType || '';
  let filename = options.mediaFileName || 'media';
  let base64Data = null;

  if (mediaDataUrl) {
    const match = mediaDataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
      mimetype = mimetype || match[1];
      base64Data = match[2];
    }
  } else if (options.mediaUrl) {
    let urlStr = String(options.mediaUrl).trim();

    // Check if URL contains /uploads/ or points to a local file
    let relativePath = null;
    if (urlStr.includes('/uploads/')) {
      relativePath = urlStr.substring(urlStr.indexOf('/uploads/') + 1);
    } else if (urlStr.startsWith('uploads/')) {
      relativePath = urlStr;
    }

    if (relativePath) {
      relativePath = decodeURIComponent(relativePath);
      const possiblePath = path.join(__dirname, '..', relativePath);

      if (fs.existsSync(possiblePath)) {
        try {
          const fileBuffer = fs.readFileSync(possiblePath);
          base64Data = fileBuffer.toString('base64');
          if (!mimetype) {
            const ext = path.extname(possiblePath).toLowerCase().replace('.', '');
            if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
              mimetype = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            } else if (['mp4', 'mov'].includes(ext)) {
              mimetype = 'video/mp4';
            } else if (ext === 'pdf') {
              mimetype = 'application/pdf';
            }
          }
          filename = filename || path.basename(possiblePath);
        } catch (readErr) {
          console.warn(`WAHAService: Could not read local file ${possiblePath}:`, readErr.message);
        }
      } else {
        // Try searching in directory in case of minor filename differences
        const dir = path.dirname(possiblePath);
        const base = path.basename(possiblePath);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const prefix = base.split('-')[0];
          const matchedFile = files.find(f => f.startsWith(prefix) || f === base);
          if (matchedFile) {
            const actualPath = path.join(dir, matchedFile);
            const fileBuffer = fs.readFileSync(actualPath);
            base64Data = fileBuffer.toString('base64');
            if (!mimetype) {
              const ext = path.extname(actualPath).toLowerCase().replace('.', '');
              if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
                mimetype = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
              }
            }
            filename = filename || matchedFile;
          }
        }
      }
    }

    // If still no base64 and it's a remote URL (http/https), fetch it into buffer so WAHA doesn't have to download it
    if (!base64Data && (urlStr.startsWith('http://') || urlStr.startsWith('https://'))) {
      let fetchUrl = urlStr;
      if (fetchUrl.includes('host.docker.internal')) {
        fetchUrl = fetchUrl.replace('host.docker.internal', '127.0.0.1');
      }
      try {
        const res = await axios.get(fetchUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const buf = Buffer.from(res.data);
        base64Data = buf.toString('base64');
        mimetype = mimetype || res.headers['content-type'] || 'image/jpeg';
      } catch (dlErr) {
        console.warn(`WAHAService: Could not pre-fetch remote media URL (${fetchUrl}): ${dlErr.message}`);
      }
    }
  }

  if (!mimetype) {
    mimetype = mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'application/octet-stream';
  }
  if (!filename.includes('.')) {
    const ext = mimetype.split('/')[1] || 'jpg';
    filename = `${filename}.${ext}`;
  }

  if (base64Data) {
    const dataUri = `data:${mimetype};base64,${base64Data}`;
    return {
      filePayload: {
        mimetype,
        filename,
        data: base64Data
      },
      hasMedia: true,
      hasBase64: true,
      mediaType,
      targetUrl: options.mediaUrl || dataUri
    };
  }

  let targetUrl = options.mediaUrl;
  if (targetUrl && (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1'))) {
    targetUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
  }

  return {
    filePayload: {
      mimetype,
      filename,
      url: targetUrl
    },
    hasMedia: !!(options.mediaUrl || mediaDataUrl),
    hasBase64: false,
    mediaType,
    targetUrl
  };
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
        const mediaInfo = await resolveMediaFilePayload(options);
        const filePayload = mediaInfo.filePayload;
        const isImage = (mediaInfo.mediaType === 'image') || (filePayload.mimetype && filePayload.mimetype.startsWith('image/'));
        const mediaEndpoint = isImage ? '/sendImage' : '/sendFile';
        await wahaClient.post(mediaEndpoint, {
          session: SESSION_NAME,
          chatId: formattedPhone,
          file: filePayload,
          caption: message
        });
      } catch (err) {
        console.warn(`⚠️ WAHAService: media send failed in card-button send:`, err.message);
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
      const mediaInfo = await resolveMediaFilePayload(options);
      const filePayload = mediaInfo.filePayload;
      const isImage = (mediaInfo.mediaType === 'image') || (filePayload.mimetype && filePayload.mimetype.startsWith('image/'));
      const isVideo = (mediaInfo.mediaType === 'video') || (filePayload.mimetype && filePayload.mimetype.startsWith('video/'));
      const primaryEndpoint = isImage ? '/sendImage' : isVideo ? '/sendVideo' : '/sendFile';
      const secondaryEndpoint = isImage ? '/sendFile' : '/sendImage';

      console.log(`📤 WAHAService: Preparing ${mediaInfo.mediaType || 'media'} send via ${primaryEndpoint} for ${formattedPhone}`, {
        hasBase64: !!mediaInfo.hasBase64,
        filename: filePayload.filename,
        mimetype: filePayload.mimetype
      });

      const payload = {
        session: SESSION_NAME,
        chatId: formattedPhone,
        file: filePayload,
        caption: message
      };

      let mediaAttemptFailed = false;
      let lastError = null;

      // Primary send (via /sendImage for photos, /sendVideo for videos, /sendFile for docs)
      try {
        console.log(`🔄 WAHAService: Sending media via ${primaryEndpoint}...`);
        response = await wahaClient.post(primaryEndpoint, payload);
        console.log(`✅ WAHAService: ${primaryEndpoint} success response:`, response.data);
      } catch (sendErr) {
        mediaAttemptFailed = true;
        lastError = sendErr;
        const errStatus = sendErr.response?.status;
        const errMsg = sendErr.response?.data?.description || sendErr.response?.data?.message || sendErr.message;
        console.warn(`⚠️ WAHAService: ${primaryEndpoint} failed (${errStatus}): ${errMsg}`);

        // Try secondary fallback endpoint
        try {
          console.log(`🔄 WAHAService: Retrying via ${secondaryEndpoint} endpoint...`);
          response = await wahaClient.post(secondaryEndpoint, payload);
          console.log(`✅ WAHAService: ${secondaryEndpoint} fallback success:`, response.data);
          mediaAttemptFailed = false;
          lastError = null;
        } catch (fallbackErr) {
          lastError = fallbackErr;
          console.error(`❌ WAHAService: ${secondaryEndpoint} also failed:`, fallbackErr.response?.data || fallbackErr.message);
        }
      }

      // If media send completely failed, fall back to text message delivery with media link
      if (mediaAttemptFailed && lastError) {
        const errStatus = lastError.response?.status;
        const errData = lastError.response?.data || {};
        const errMsg = errData.exception?.message || errData.description || errData.message || lastError.message || '';
        
        console.warn(`⚠️ WAHAService: Media send failed (${errStatus || 'error'}: ${errMsg}). Falling back to text message delivery.`);

        const mediaEmoji = mediaType === 'image' ? '🖼️' 
                         : mediaType === 'video' ? '🎥'
                         : mediaType === 'audio' ? '🎵'
                         : '📎';

        let linkText = message || '';
        let targetUrl = mediaInfo.targetUrl || options.mediaUrl || '';
        if (global.ngrokStatus?.url && (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1') || targetUrl.includes('host.docker.internal'))) {
          targetUrl = targetUrl.replace(/https?:\/\/[^\/]+/, global.ngrokStatus.url);
        } else if (process.env.PUBLIC_URL && (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1') || targetUrl.includes('host.docker.internal'))) {
          targetUrl = targetUrl.replace(/https?:\/\/[^\/]+/, process.env.PUBLIC_URL);
        }

        if (targetUrl && !targetUrl.startsWith('data:')) {
          linkText = linkText ? `${linkText}\n\n${mediaEmoji} ${options.mediaFileName || 'Media'}: ${targetUrl}` : `${mediaEmoji} ${options.mediaFileName || 'Media'}: ${targetUrl}`;
        }
        if (!linkText.trim()) {
          linkText = `${mediaEmoji} [${options.mediaFileName || 'Media attached'}]`;
        }

        try {
          response = await wahaClient.post('/sendText', {
            session: SESSION_NAME,
            chatId: formattedPhone,
            text: linkText
          });
          console.log(`✅ WAHAService: Sent message with media link as fallback for ${formattedPhone}`);
          mediaAttemptFailed = false;
          lastError = null;
        } catch (linkErr) {
          console.error(`❌ WAHAService: Even text fallback failed:`, linkErr.message);
          throw linkErr;
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

    // WhatsApp accepted the message and returned an ID, so it has left our
    // system. Seeding anything weaker than SENT leaves the row stuck forever:
    // callers write result.status verbatim, and if no delivery receipt ever
    // arrives there is nothing to advance it. Receipts upgrade SENT ->
    // DELIVERED -> READ (or FAILED).
    return {
      success: true,
      externalMessageId,
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

/**
 * Background Session Health Keeper:
 * Runs periodically to ensure WhatsApp session remains connected.
 * If status becomes STOPPED or FAILED (e.g. after laptop wake-up or temporary WiFi drop),
 * it automatically re-starts the session using saved tokens without logging out.
 */
let healthWorkerInterval = null;
const startSessionHealthWorker = () => {
  if (healthWorkerInterval) return;
  console.log('🛡️ [WAHA Health Keeper] Session auto-recovery worker started (checks every 30s)');

  healthWorkerInterval = setInterval(async () => {
    try {
      const sessionStatus = await wahaClient.get(`/sessions/${SESSION_NAME}`);
      const st = sessionStatus.data?.status;

      if (st === 'STOPPED' || st === 'FAILED') {
        console.log(`🔄 [WAHA Health Keeper] Session is ${st}. Auto-reconnecting session "${SESSION_NAME}" using saved credentials...`);
        if (st === 'FAILED') {
          try {
            await wahaClient.post(`/sessions/${SESSION_NAME}/stop`);
            await new Promise(r => setTimeout(r, 1000));
          } catch {}
        }
        await wahaClient.post(`/sessions/${SESSION_NAME}/start`);
        console.log(`✅ [WAHA Health Keeper] Auto-restart triggered successfully.`);
      }
    } catch (err) {
      // WAHA container may be temporarily restarting, ignore error
    }
  }, 30000);
};

const testConnection = async (customUrl, customKey) => {
  let apiUrl = customUrl;
  let apiKey = customKey;

  if (!apiUrl) {
    try {
      const { getModel } = require('../middlewares/tenantContext');
      const TenantShopConfig = getModel('ShopConfig');
      const sc = await TenantShopConfig.findOne({});
      apiUrl = sc?.wahaApiUrl;
      if (apiKey === undefined) apiKey = sc?.wahaApiKey;
    } catch (e) {}
  }

  apiUrl = (apiUrl || process.env.WAHA_API_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
  if (apiKey === undefined) {
    apiKey = process.env.WAHA_API_KEY || '';
  }

  try {
    const testAxios = axios.create({
      baseURL: `${apiUrl}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-Api-Key': apiKey.trim() } : {})
      }
    });

    const res = await testAxios.get('/sessions');
    return {
      success: true,
      message: `Connected successfully to WAHA server at ${apiUrl}!`,
      apiUrl,
      sessionsCount: Array.isArray(res.data) ? res.data.length : 0,
      sessions: res.data
    };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return {
        success: false,
        statusCode: 401,
        apiUrl,
        error: `Authentication Rejected (HTTP 401 Unauthorized): The WAHA server at ${apiUrl} rejected the provided API Key. Please verify WAHA_API_KEY in your Railway service variables or update the key here.`
      };
    }

    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      try {
        const { exec } = require('child_process');
        exec('docker start waha', () => {});
      } catch (e) {}
    }

    return {
      success: false,
      statusCode: status || 500,
      apiUrl,
      error: `Connection Failed: Cannot reach WAHA at ${apiUrl} (${err.message}). Make sure the server or container is running.`
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
  getContact,
  startSessionHealthWorker,
  testConnection,
  WAHA_API_URL,
  SESSION_NAME
};





