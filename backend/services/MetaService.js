const axios = require('axios');
const FormData = require('form-data');
const ShopConfig = require('../models/ShopConfig');
const Template = require('../models/Template');

const META_API_VERSION = process.env.META_API_VERSION || 'v18.0';

async function getMetaConfig(userId) {
  let config;
  if (userId) {
    config = await ShopConfig.findOne({ userId });
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
}

async function getAccessToken(userId) {
  const config = await getMetaConfig(userId);
  if (!config || !config.enabled) return null;
  if (config.accessToken) return config.accessToken;
  return null;
}

function normalizeWhatsAppTemplateLanguage(languageCode) {
  if (!languageCode) return 'en_US';
  return String(languageCode).replace('-', '_');
}

function getMetaTemplateBodyPreview(components = []) {
  if (!Array.isArray(components)) return '';
  const bodyComponent = components.find((component) => component.type === 'BODY' || component.type === 'body');
  if (!bodyComponent) return '';
  if (bodyComponent.text) return bodyComponent.text;
  if (bodyComponent.parameters && Array.isArray(bodyComponent.parameters)) {
    return bodyComponent.parameters.map((param) => param.text || '').join(' ');
  }
  return '';
}

function getMetaTemplateType(components = []) {
  if (!Array.isArray(components)) return 'TEXT';
  const header = components.find((component) => component.type === 'HEADER' || component.type === 'header');
  if (!header || !Array.isArray(header.parameters)) return 'TEXT';
  const mediaParam = header.parameters.find((param) => param.type === 'image' || param.type === 'video' || param.type === 'document');
  if (!mediaParam) return 'TEXT';
  return mediaParam.type === 'image' ? 'IMAGE' : mediaParam.type === 'video' ? 'VIDEO' : 'TEXT';
}

const META_REENGAGEMENT_FALLBACK_REGEX = /131047|Re-?engagement|reengagement/i;

async function tryMetaReengagementFallback(wamid, errorInfo) {
  if (!wamid || !errorInfo || !META_REENGAGEMENT_FALLBACK_REGEX.test(errorInfo)) {
    return false;
  }

  try {
    const WAHAService = require('./WAHAService');
    const Message = require('../models/Message');
    const Customer = require('../models/Customer');
    const ConversationMessage = require('../models/ConversationMessage');

    const message = await Message.findOne({ externalMessageId: wamid });
    if (!message || message.channel !== 'whatsapp') {
      return false;
    }

    if (['DELIVERED', 'READ'].includes(message.status)) {
      return false;
    }

    const retryLimit = message.maxRetries || 3;
    if ((message.retryCount || 0) >= retryLimit) {
      console.warn(`[MetaService] Skipping WAHA fallback for ${wamid}: retryCount ${message.retryCount} >= maxRetries ${retryLimit}`);
      return false;
    }

    const customer = await Customer.findById(message.customerId).lean();
    if (!customer?.whatsappNumber) {
      return false;
    }

    const sendResult = await WAHAService.sendMessage(
      customer.whatsappNumber,
      message.content || '',
      {
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        mediaMimeType: message.mediaMimeType,
        mediaFileName: message.mediaFileName,
        ...(message.widgetData?.buttons ? { buttons: message.widgetData.buttons } : {})
      }
    );

    if (!sendResult.success) {
      console.warn(`[MetaService] WAHA fallback failed for ${customer.whatsappNumber}:`, sendResult.error || sendResult.failureReason);
      return false;
    }

    const previousExternalId = message.externalMessageId;
    message.externalMessageId = sendResult.externalMessageId || message.externalMessageId;
    message.status = 'SENT';
    message.sentAt = new Date();
    message.failureReason = undefined;
    message.retryCount = (message.retryCount || 0) + 1;
    message.updatedAt = new Date();
    await message.save();

    await ConversationMessage.findOneAndUpdate(
      { platformMessageId: previousExternalId },
      { platformMessageId: message.externalMessageId, status: 'SENT', updatedAt: new Date() }
    );

    console.log(`[MetaService] Meta re-engagement fallback succeeded: ${previousExternalId} -> ${message.externalMessageId}`);
    return true;
  } catch (error) {
    console.error('[MetaService] Re-engagement fallback error:', error.message);
    return false;
  }
}

/**
 * Counts the number of body placeholders ({{1}}, {{2}}, ...) a real Meta template expects.
 * Fetches the template from the Graph API and returns null if it cannot be resolved.
 */
async function getTemplateBodyParamCount(userId, templateName, templateLanguage) {
  try {
    const templates = await listWhatsAppTemplates(userId);
    const lang = normalizeWhatsAppTemplateLanguage(templateLanguage || 'en_US');
    let tpl = templates.find((t) => t.name === templateName && t.language === lang);
    if (!tpl) tpl = templates.find((t) => t.name === templateName);
    if (!tpl) return null;
    const body = (tpl.components || []).find((c) => c.type === 'BODY' || c.type === 'body');
    const text = (body && body.text) || '';
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    return matches.length;
  } catch (error) {
    console.warn('[MetaService] getTemplateBodyParamCount error:', error.message);
    return null;
  }
}

/**
 * Meta template body parameters cannot contain new-line/tab characters or
 * more than 4 consecutive spaces. Sanitize the text before sending.
 */
function sanitizeTemplateParamText(text) {
  return String(text || '')
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/ {5,}/g, '    ')
    .trim();
}

/**
 * Builds the body parameters array for a template send.
 * Fills the first placeholder with the message text and pads the rest with empty strings,
 * so the parameter count always matches what Meta expects.
 */
function buildTemplateParams(count, messageText) {
  const params = [];
  for (let i = 0; i < count; i++) {
    params.push({ type: 'text', text: i === 0 ? sanitizeTemplateParamText(messageText) : '' });
  }
  return params;
}

async function listWhatsAppTemplates(userId) {  try {
    const config = await getMetaConfig(userId);
    const accessToken = await getAccessToken(userId);
    if (!config || !config.enabled || !accessToken || !config.phoneNumberId) {
      return [];
    }

    const endpointId = config.businessAccountId || config.phoneNumberId;
    if (!endpointId) {
      return [];
    }
    const endpointPath = config.businessAccountId
      ? `${META_API_VERSION}/${config.businessAccountId}/message_templates`
      : `${META_API_VERSION}/${config.phoneNumberId}/message_templates`;

    const response = await axios.get(
      `https://graph.facebook.com/${endpointPath}`,
      {
        params: {
          access_token: accessToken,
          fields: 'name,language,components,status',
          limit: 200
        },
        timeout: 20000
      }
    );

    const templates = response.data?.data || [];
    return templates.map((template) => ({
      name: template.name,
      language: normalizeWhatsAppTemplateLanguage(template.language?.code || template.language),
      status: template.status || '',
      components: template.components || [],
      content: getMetaTemplateBodyPreview(template.components),
      type: getMetaTemplateType(template.components)
    }));
  } catch (error) {
    console.error('Meta template list error:', error.message);
    if (error.response?.data) {
      console.error('Meta template list response:', error.response.data);
    }
    return [];
  }
}

async function syncWhatsAppTemplatesToLocalDb(userId) {
  try {
    const metaTemplates = await listWhatsAppTemplates(userId);
    if (!metaTemplates.length) return [];

    const existingTemplates = await Template.find({
      userId,
      name: { $in: metaTemplates.map((tpl) => tpl.name) }
    }).lean();

    const existingNames = new Set(existingTemplates.map((tpl) => tpl.name));
    const newTemplates = metaTemplates
      .filter((tpl) => !existingNames.has(tpl.name))
      .map((tpl) => ({
        userId,
        name: tpl.name,
        description: `Synced from Meta WhatsApp template`,
        category: 'CUSTOM',
        content: tpl.content || tpl.name,
        type: tpl.type || 'TEXT',
        format: 'TEXT',
        supportedChannels: ['whatsapp'],
        mediaType: tpl.type === 'IMAGE' ? 'image' : undefined,
        mediaUrl: '',
        mediaPreviewData: '',
        mediaMimeType: '',
        mediaFileName: '',
        variables: [],
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    if (newTemplates.length > 0) {
      await Template.insertMany(newTemplates, { ordered: false });
    }

    return await Template.find({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('WhatsApp template sync error:', error.message);
    return [];
  }
}

async function sendMessage(to, message, options = {}) {
  try {
    const userId = options.userId || process.env.DEFAULT_USER_ID;
    const config = await getMetaConfig(userId);
    if (!config || !config.enabled) {
      return {
        success: false,
        error: 'Meta API is not configured. Please configure Meta API in Settings.',
        channel: 'whatsapp',
        to,
        failureReason: 'META_NOT_CONFIGURED'
      };
    }

    const accessToken = config.accessToken;
    const phoneNumberId = config.phoneNumberId;
    const formattedPhone = formatPhoneNumber(to);

    let payload;

    if (options.templateName) {
      payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: options.templateName,
          language: {
            code: options.templateLanguage || 'en_US'
          },
          components: []
        }
      };

      const bodyParameters = options.templateParams || [];
      const headerComponent = (options.mediaUrl || options.mediaData)
        ? {
            type: 'header',
            parameters: [
              {
                type: options.mediaType || 'image',
                [options.mediaType || 'image']: options.mediaData
                  ? { id: (await uploadMedia(options.mediaData, options.mediaType || 'image', accessToken, phoneNumberId)).mediaId }
                  : { link: options.mediaUrl }
              }
            ]
          }
        : null;

      if (headerComponent) {
        payload.template.components.push(headerComponent);
      }

      if (bodyParameters.length > 0) {
        payload.template.components.push({
          type: 'body',
          parameters: bodyParameters
        });
      }
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      };

      if (options.buttons && options.buttons.length > 0) {
        payload.type = 'interactive';
        delete payload.text;
        payload.interactive = {
          type: 'button',
          body: { text: message },
          action: {
            buttons: options.buttons.map(b => ({
              type: 'reply',
              reply: { id: b.value, title: b.label }
            }))
          }
        };
      }

      if (options.list) {
        payload.type = 'interactive';
        delete payload.text;
        payload.interactive = {
          type: 'list',
          body: { text: message },
          action: {
            button: options.list.buttonText || 'View Options',
            sections: options.list.sections || []
          }
        };
      }

      let mediaData = options.mediaData;
      let mediaUrl = options.mediaUrl;

      if (mediaUrl || mediaData) {
        const mediaType = options.mediaType || 'image';
        let mediaPayload;

        // If it's a local URL but no base64 is provided, try to read the local file to send as base64 upload
        if (!mediaData && mediaUrl && (mediaUrl.includes('/uploads/') || mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1'))) {
          try {
            const fs = require('fs');
            const path = require('path');
            
            let relativePath = '';
            const uploadsIndex = mediaUrl.indexOf('/uploads/');
            if (uploadsIndex !== -1) {
              relativePath = mediaUrl.substring(uploadsIndex + '/uploads/'.length);
            } else if (mediaUrl.startsWith('uploads/')) {
              relativePath = mediaUrl.substring('uploads/'.length);
            }
            
            if (relativePath) {
              const localFilePath = path.join(__dirname, '..', 'uploads', relativePath);
              if (fs.existsSync(localFilePath)) {
                const fileBuffer = fs.readFileSync(localFilePath);
                const base64Content = fileBuffer.toString('base64');
                const ext = path.extname(localFilePath).toLowerCase();
                const mimeTypes = {
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.gif': 'image/gif',
                  '.webp': 'image/webp',
                  '.mp4': 'video/mp4',
                  '.pdf': 'application/pdf',
                  '.mp3': 'audio/mpeg',
                  '.wav': 'audio/wav',
                  '.ogg': 'audio/ogg'
                };
                const fileMime = mimeTypes[ext] || 'application/octet-stream';
                mediaData = `data:${fileMime};base64,${base64Content}`;
                console.log(`🔄 MetaService: Converted local file to base64 for upload: ${localFilePath}`);
              }
            }
          } catch (readErr) {
            console.warn('⚠️ MetaService: Failed to read local file for base64 fallback:', readErr.message);
          }
        }

        if (mediaData) {
          const uploadResult = await uploadMedia(mediaData, mediaType, accessToken, phoneNumberId);
          if (uploadResult.success) {
            mediaPayload = { id: uploadResult.mediaId };
          } else {
            throw new Error(uploadResult.error);
          }
        } else {
          mediaPayload = { link: mediaUrl };
        }

        // If media + buttons are requested, send media first then an interactive button message
        if (options.buttons && Array.isArray(options.buttons) && options.buttons.length > 0) {
          // Send media payload first
          const mediaPayloadWrapper = {}
          if (mediaType === 'image') mediaPayloadWrapper.image = mediaPayload;
          else if (mediaType === 'video') mediaPayloadWrapper.video = mediaPayload;
          else if (mediaType === 'document') mediaPayloadWrapper.document = mediaPayload;
          else mediaPayloadWrapper.image = mediaPayload;

          const mediaResponse = await axios.post(
            `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
            Object.assign({ messaging_product: 'whatsapp', to: formattedPhone }, mediaPayloadWrapper),
            { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, timeout: 15000 }
          );

          if (mediaResponse.data?.error) {
            const metaErr = mediaResponse.data.error;
            throw new Error(metaErr.message || 'Meta API rejected the media');
          }

          // Now send interactive button message as a separate message
          payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: message || 'Please select an option' },
              action: {
                buttons: options.buttons.map(b => ({ type: 'reply', reply: { id: b.value, title: b.label } }))
              }
            }
          };
        } else {
          if (mediaType === 'image') {
            payload.type = 'image';
            payload.image = mediaPayload;
            delete payload.text;
            if (message) payload.image.caption = message;
          } else if (mediaType === 'video') {
            payload.type = 'video';
            payload.video = mediaPayload;
            delete payload.text;
            if (message) payload.video.caption = message;
          } else if (mediaType === 'document') {
            payload.type = 'document';
            payload.document = mediaPayload;
            delete payload.text;
            if (message) payload.document.caption = message;
          } else {
            payload.type = 'image';
            payload.image = mediaPayload;
            delete payload.text;
            if (message) payload.image.caption = message;
          }
        }
      }
    }

    const response = await axios.post(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    // Meta can return HTTP 200 with an error body (e.g. outside 24h window, unregistered phone)
    if (response.data?.error) {
      const metaErr = response.data.error;
      console.log(`Meta API returned error in 200 response: ${metaErr.code} ${metaErr.message}`);
      return {
        success: false,
        error: metaErr.message || 'Meta API rejected the message',
        channel: 'whatsapp',
        to: formattedPhone,
        failureReason: `META_${metaErr.code || 'ERROR'}`
      };
    }

    const externalMessageId = response.data?.messages?.[0]?.id || '';
    if (!externalMessageId) {
      console.error('Meta API warning: no message id returned', JSON.stringify(response.data).substring(0, 300));
      return {
        success: false,
        error: 'Meta did not return a message ID. Message may not have been sent.',
        channel: 'whatsapp',
        to: formattedPhone,
        failureReason: 'META_MISSING_MESSAGE_ID'
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
    console.error('Meta API Send Error:', error.message);
    if (error.response?.data) {
      console.error('Meta API Error Details:', JSON.stringify(error.response.data));
    }
    return {
      success: false,
      error: error.message || 'Meta API send failed',
      channel: 'whatsapp',
      to,
      failureReason: error.response?.data?.error?.code ? `META_${error.response.data.error.code}` : 'META_ERROR'
    };
  }
}

async function uploadMedia(mediaData, mediaType, accessToken, phoneNumberId) {
  try {
    let mimeType;
    let fileName;
    let base64Data;

    if (mediaData && mediaData.startsWith('data:')) {
      const match = mediaData.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    } else {
      base64Data = mediaData;
    }

    if (!mimeType) {
      mimeType = mediaType === 'video' ? 'video/mp4' : mediaType === 'document' ? 'application/pdf' : 'image/jpeg';
    }

    const extension = mimeType.split('/')[1];
    fileName = `campaign-media.${extension}`;

    // form-data v4 exports the FormData constructor directly; be defensive across versions
    const FormDataClass = FormData.default || FormData;
    const formData = new FormDataClass();
    formData.append('file', Buffer.from(base64Data, 'base64'), {
      filename: fileName,
      contentType: mimeType
    });
    formData.append('messaging_product', 'whatsapp');

    const response = await axios.post(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      mediaId: response.data.id
    };
  } catch (error) {
    console.error('Meta Media Upload Error:', error.message);
    return {
      success: false,
      error: error.message || 'Media upload failed'
    };
  }
}

async function sendBulkMessages(recipients, messageTemplate, options = {}) {
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
}

function formatPhoneNumber(phone) {
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

  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const config = await getMetaConfig(req.user?._id || process.env.DEFAULT_USER_ID);
  const verifyToken = config?.webhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN || 'renic_meta_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Meta webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
}

async function handleWebhook(req, res) {
  try {
    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(200).send('OK');
    }

    for (const entryItem of entry) {
      const changes = entryItem.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // ============ DELIVERY / READ / FAILURE STATUSES ============
        if (Array.isArray(value.statuses) && value.statuses.length > 0) {
          for (const st of value.statuses) {
            const wamid = st.id || st.messageId;
            const rawStatus = (st.status || '').toLowerCase();
            let normalized = 'PENDING';
            if (rawStatus === 'sent') normalized = 'SENT';
            else if (rawStatus === 'delivered') normalized = 'DELIVERED';
            else if (rawStatus === 'read') normalized = 'READ';
            else if (rawStatus === 'failed') normalized = 'FAILED';
            else if (rawStatus === 'pending') normalized = 'PENDING';
            else if (rawStatus === 'queued') normalized = 'QUEUED';

            if (wamid && normalized === 'FAILED') {
              const errorInfo = (st.errors || []).map((e) => `Meta ${e.code}: ${e.title}${e.details ? ' - ' + e.details : ''}`).join('; ');
              const fallbackSent = await tryMetaReengagementFallback(wamid, errorInfo);
              if (fallbackSent) {
                continue;
              }

              if (errorInfo) {
                console.error(`Meta webhook status: ${wamid} -> ${normalized} | ${errorInfo}`);
              } else {
                console.log(`Meta webhook status: ${wamid} -> ${normalized}`);
              }

              try {
                const WhatsAppService = require('./WhatsAppService');
                await WhatsAppService.updateMessageStatus(wamid, normalized, errorInfo);
              } catch (statusErr) {
                console.error('Meta status update failed:', statusErr.message);
              }
            } else if (wamid && normalized !== 'PENDING') {
              const errorInfo = (st.errors || []).map((e) => `Meta ${e.code}: ${e.title}${e.details ? ' - ' + e.details : ''}`).join('; ');
              if (errorInfo) {
                console.error(`Meta webhook status: ${wamid} -> ${normalized} | ${errorInfo}`);
              } else {
                console.log(`Meta webhook status: ${wamid} -> ${normalized}`);
              }

              try {
                const WhatsAppService = require('./WhatsAppService');
                await WhatsAppService.updateMessageStatus(wamid, normalized, errorInfo);
              } catch (statusErr) {
                console.error('Meta status update failed:', statusErr.message);
              }
            }
          }
          continue;
        }

        if (change.field !== 'messages') continue;
        const messages = value.messages || [];

        for (const message of messages) {
          const from = message.from;
          const messageType = message.type;
          let messageBody = '';

          if (messageType === 'text') {
            messageBody = message.text?.body || '';
          } else if (messageType === 'interactive') {
            if (message.interactive?.type === 'button_reply') {
              messageBody = message.interactive.button_reply?.title || '';
            } else if (message.interactive?.type === 'list_reply') {
              messageBody = message.interactive.list_reply?.title || '';
            }
          } else if (messageType === 'image' || messageType === 'video' || messageType === 'document') {
            messageBody = `[${messageType} media]`;
          }

            if (from) {
            const phoneNumber = '+' + from.replace('@c.us', '').replace('@s.whatsapp.net', '');
            console.log(`Meta webhook incoming: ${phoneNumber} - ${messageBody}`);

            const metadata = value.metadata || {};
            const phone_number_id = metadata.phone_number_id || '';
            const display_phone_number = metadata.display_phone_number || '';

            // Process asynchronously to quickly return 200 OK response to Meta (Meta expects <3s response)
            setImmediate(async () => {
              try {
                let userId = process.env.DEFAULT_USER_ID || '6a17148cea9e57bf1536e91a';
                
                if (phone_number_id) {
                  const ShopConfig = require('../models/ShopConfig');
                  const config = await ShopConfig.findOne({ metaPhoneNumberId: phone_number_id });
                  if (config) {
                    userId = config.userId;
                    if (display_phone_number && config.metaDisplayPhoneNumber !== display_phone_number) {
                      config.metaDisplayPhoneNumber = display_phone_number;
                      await config.save();
                    }
                  }
                }

                // Check if forwarding is enabled - if yes, skip AI and forward directly
                const shopConfig = await ShopConfig.findOne({ userId });
                let forwardingEnabled = shopConfig?.metaForwardReplies || false;

                if (forwardingEnabled) {
                  // Verify that the team WhatsApp is actually logged in before trying to forward
                  const WAHAService = require('./WAHAService');
                  const wahaSession = await WAHAService.getSessionStatus();
                  if (!wahaSession.success || !wahaSession.authenticated) {
                    console.log(`[MetaService] Forwarding is enabled but team WhatsApp (WAHA) is not logged in. Falling back to AI rules for ${phoneNumber}.`);
                    forwardingEnabled = false;
                  }
                }

                if (forwardingEnabled) {
                  // Forwarding mode: Send auto-reply from team's WhatsApp and skip AI
                  console.log(`[MetaService] Forwarding enabled and team WhatsApp is logged in for ${phoneNumber}, skipping AI rules`);
                  const leadForwardingService = require('./leadForwardingService');
                  await leadForwardingService.handleForwardedMessage({
                    phoneNumber,
                    messageBody,
                    userId,
                    metaPhoneNumberId: phone_number_id
                  });
                } else {
                  // Normal mode: Execute AI rules
                  const aiChatHandler = require('./aiChatHandler');
                  await aiChatHandler.handleCustomerMessage(
                    phoneNumber,
                    messageBody,
                    'whatsapp',
                    userId,
                    null, // mediaUrl
                    {
                      metaPhoneNumberId: phone_number_id,
                      displayPhoneNumber: display_phone_number
                    }
                  );

                  // Still do legacy handoff if configured (for backward compatibility)
                  const leadForwardingService = require('./leadForwardingService');
                  await leadForwardingService.forwardMetaReplyToWhatsApp({
                    phoneNumber,
                    userId,
                    metaPhoneNumberId: phone_number_id
                  });
                }
              } catch (innerErr) {
                console.error('Meta AI Chat Handler Inner Error:', innerErr.message);
              }
            });
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Meta Webhook Error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = {
  getMetaConfig,
  getAccessToken,
  listWhatsAppTemplates,
  syncWhatsAppTemplatesToLocalDb,
  getTemplateBodyParamCount,
  buildTemplateParams,
  sendMessage,
  sendBulkMessages,
  uploadMedia,
  formatPhoneNumber,
  verifyWebhook,
  handleWebhook
};