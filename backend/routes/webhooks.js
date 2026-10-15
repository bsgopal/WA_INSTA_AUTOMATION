// renic-automation-backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/WhatsAppService');
const WAHAService = require('../services/WAHAService');
const InstagramService = require('../services/InstagramService');
const MetaService = require('../services/MetaService');
const aiChatHandler = require('../services/aiChatHandler');
const messageQueueService = require('../services/messageQueueService');
const { runWithTenant } = require('../middlewares/tenantContext');

const isQueueEnabled = () => process.env.AI_QUEUE_ENABLED !== 'false';

// Deduplication tracker: prevent duplicate handling of the same WhatsApp message
const _processedMsgIds = new Set();
const isDuplicateMessage = (id) => {
  if (!id) return false;
  if (_processedMsgIds.has(id)) return true;
  _processedMsgIds.add(id);
  if (_processedMsgIds.size > 3000) {
    const first = _processedMsgIds.values().next().value;
    _processedMsgIds.delete(first);
  }
  return false;
};

const getDefaultUserId = async () => {
  let userId = process.env.DEFAULT_USER_ID;
  if (!userId || userId === '000000000000000000000000') {
    const User = require('../models/User');
    // Prioritize PLATFORM_OWNER since that profile holds root rule configuration authority
    const platformOwner = await User.findOne({ role: 'PLATFORM_OWNER' });
    if (platformOwner) {
      userId = platformOwner._id;
    } else {
      const defaultUser = await User.findOne({ role: 'ADMIN' });
      userId = defaultUser ? defaultUser._id : '000000000000000000000000';
    }
  }
  return userId;
};

const processOrQueueMessage = async payload => {
  if (isQueueEnabled()) {
    try {
      const queued = await messageQueueService.enqueueIncomingMessage(payload);
      return {
        success: true,
        queued: true,
        ...queued
      };
    } catch (error) {
      console.error('AI queue unavailable, processing inline:', error.message);
    }
  }

  const result = await aiChatHandler.handleCustomerMessage(
    payload.phoneNumber,
    payload.messageBody,
    payload.channel,
    payload.userId,
    payload.mediaUrl || null,
    payload.options || {}
  );

  return {
    ...result,
    queued: false
  };
};

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const normalizeInteractiveReply = data => {
  const raw = data || {};
  const rawData = raw._data || {};
  const buttonReply = raw.buttonReply || raw.selectedButton || rawData.buttonReply || rawData.selectedButton || {};
  const listReply = raw.listReply || raw.selectedRow || rawData.listReply || rawData.selectedRow || {};
  const interactive = raw.interactive || rawData.interactive || {};
  const interactiveButton = interactive.button_reply || interactive.buttonReply || {};
  const interactiveList = interactive.list_reply || interactive.listReply || {};
  const nativeFlow = interactive.nfm_reply || interactive.nativeFlowReply || {};

  const selectedId = firstText(
    raw.selectedButtonId,
    raw.selectedRowId,
    raw.buttonId,
    raw.button?.id,
    rawData.selectedButtonId,
    rawData.selectedRowId,
    rawData.buttonId,
    rawData.button?.id,
    buttonReply.id,
    buttonReply.buttonId,
    listReply.id,
    listReply.rowId,
    interactiveButton.id,
    interactiveList.id,
    nativeFlow.name
  );

  const selectedText = firstText(
    raw.selectedButtonText,
    raw.selectedRowTitle,
    raw.buttonText,
    raw.button?.text,
    rawData.selectedButtonText,
    rawData.selectedRowTitle,
    rawData.buttonText,
    rawData.button?.text,
    buttonReply.text,
    buttonReply.title,
    listReply.title,
    listReply.description,
    interactiveButton.title,
    interactiveList.title,
    nativeFlow.body
  );

  const body = firstText(raw.body, raw.text, raw.caption, rawData.body, rawData.text, rawData.caption);
  const interactiveText = selectedId || selectedText;

  if (!interactiveText) {
    return {
      body,
      interactive: null
    };
  }

  const numericMatch = interactiveText.match(/^[^\d]*([1-9])(?:\D|$)/);
  const normalizedBody = numericMatch ? numericMatch[1] : interactiveText;

  return {
    body: normalizedBody,
    interactive: {
      id: selectedId || null,
      text: selectedText || null,
      originalBody: body || null
    }
  };
};

// ============ WHATSAPP WEBHOOK (WAHA & META) ============
router.get(['/whatsapp', '/whatsapp/:customerCode'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'renic_automation_verify_token')) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  return res.status(200).json({ status: 'ok', service: 'WAHA / WhatsApp Webhook', active: true });
});

router.post(['/whatsapp', '/whatsapp/:customerCode'], async (req, res) => {
  try {
    let targetCustomerCode = req.params.customerCode || req.headers['x-customer-code'];
    if (!targetCustomerCode && req.body.session) {
      const sess = String(req.body.session);
      if (sess.startsWith('customer_')) {
        targetCustomerCode = sess.replace('customer_', '');
      }
    }
    if (!targetCustomerCode) {
      targetCustomerCode = req.customerCode || 'DEFAULT';
    }
    targetCustomerCode = targetCustomerCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const { event } = req.body;
    const data = req.body.payload || req.body.data;
    console.log(`Incoming WAHA Webhook [Tenant: ${targetCustomerCode}]: event="${event}"`, JSON.stringify(req.body).substring(0, 300));

    if ((event === 'message' || event === 'message.any') && data) {
      const { from, hasMedia, media, fromMe, _data } = data;
      const normalizedReply = normalizeInteractiveReply(data);

      if (!from) {
        return res.status(200).send('OK');
      }

      if (fromMe === true) {
        console.log('Ignoring message sent by ourselves (fromMe = true)');
        return res.status(200).send('OK');
      }

      if (from.includes('@g.us') || from.includes('status@broadcast')) {
        console.log(`Ignoring group/broadcast message from: ${from}`);
        return res.status(200).send('OK');
      }

      let resolvedFrom = from;
      let originalLid = null;
      let contactInfo = null;

      if (from.endsWith('@lid')) {
        originalLid = '+' + from.replace('@lid', '') + '@lid';
        if (_data?.key?.remoteJidAlt) {
          resolvedFrom = _data.key.remoteJidAlt;
          console.log(`Resolved LID "${from}" to phone JID "${resolvedFrom}" via remoteJidAlt`);
        } else if (_data?.key?.participantAlt) {
          resolvedFrom = _data.key.participantAlt;
          console.log(`Resolved LID "${from}" to phone JID "${resolvedFrom}" via participantAlt`);
        }
      }

      // Query WAHA contact API to resolve real phone number and customer name
      try {
        const sessionName = req.body.session || process.env.WAHA_SESSION_NAME || 'default';
        contactInfo = await WAHAService.getContact(from, sessionName);
        if (contactInfo) {
          if (from.endsWith('@lid') && contactInfo.id && (contactInfo.id.endsWith('@c.us') || contactInfo.id.endsWith('@s.whatsapp.net'))) {
            resolvedFrom = contactInfo.id;
            console.log(`Resolved LID "${from}" to real phone JID "${resolvedFrom}" via WAHA contact API`);
          }
        }
      } catch (cErr) {
        console.warn('Could not fetch WAHA contact:', cErr.message);
      }

      let phoneNumber;
      if (resolvedFrom.endsWith('@c.us') || resolvedFrom.endsWith('@s.whatsapp.net')) {
        const cleanedFrom = resolvedFrom.replace('@c.us', '').replace('@s.whatsapp.net', '');
        phoneNumber = '+' + cleanedFrom;
      } else if (resolvedFrom.endsWith('@lid')) {
        const cleanedFrom = resolvedFrom.replace('@lid', '');
        phoneNumber = '+' + cleanedFrom + '@lid';
      } else {
        phoneNumber = resolvedFrom;
      }

      const pushName =
        data.pushName ||
        _data?.notifyName ||
        _data?.pushName ||
        data.notifyName ||
        contactInfo?.name ||
        contactInfo?.pushname ||
        contactInfo?.shortName ||
        null;

      const userId = await getDefaultUserId();
      const externalMessageId = data.id || _data?.id?.id || _data?.key?.id || null;

      // 1. Deduplication check: ignore duplicate webhooks for the same message
      if (externalMessageId && isDuplicateMessage(externalMessageId)) {
        console.log(`[WAHA] Ignoring duplicate webhook delivery: ${externalMessageId}`);
        return res.status(200).send('OK');
      }

      // 2. Ignore old historical sync messages (older than 3 minutes, e.g. WAHA historical chat sync on startup)
      const rawTimestamp = data.timestamp || _data?.t || null;
      if (rawTimestamp) {
        const msgTimeMs = rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp;
        const ageSec = Math.round((Date.now() - msgTimeMs) / 1000);
        if (ageSec > 180) {
          console.log(`[WAHA] Ignoring old historical sync message (${ageSec}s old): ${externalMessageId}`);
          return res.status(200).send('OK');
        }
      }

      // ============ VOICE MESSAGE DETECTION & TRANSCRIPTION ============
      const rawMessageType = data.type || _data?.type || '';
      const isVoiceMessage = hasMedia && (
        rawMessageType === 'ptt' ||
        rawMessageType === 'audio' ||
        media?.mimetype?.includes('audio') ||
        media?.url?.includes('voice') ||
        media?.url?.includes('audio')
      );

      let messageBody = normalizedReply.body || '';

      if (isVoiceMessage && media?.url) {
        console.log('🎤 Voice message detected, transcribing via Gemini...');
        try {
          const TranscriptionService = require('../services/TranscriptionService');
          const transcribed = await TranscriptionService.transcribeVoiceNote(media.url);
          if (transcribed) {
            messageBody = transcribed;
          }
        } catch (transcribeErr) {
          console.error('❌ Voice transcription error:', transcribeErr.message);
        }
      }

      const result = await processOrQueueMessage({
        phoneNumber,
        messageBody,
        channel: 'whatsapp',
        userId,
        mediaUrl: hasMedia && media ? media.url : null,
        externalMessageId,
        timestamp: data.timestamp || Date.now(),
        options: {
          pushName,
          contactName: contactInfo?.name || contactInfo?.shortName || null,
          whatsappLid: originalLid,
          interactiveReply: normalizedReply.interactive,
          rawMessageType,
          isVoiceMessage,
          transcribedBody: isVoiceMessage ? messageBody : null
        }
      });

      if (result.queued) {
        console.log('WhatsApp message queued:', {
          jobId: result.jobId,
          phoneNumber
        });
      } else if (result.success) {
        console.log('WhatsApp message processed inline:', {
          customerId: result.customerId,
          intent: result.analysis?.intent,
          leadScore: result.leadScore?.score,
          escalated: result.escalated
        });
      } else {
        console.error('WhatsApp message processing failed:', result.error);
      }
    }

    if (event === 'session.status') {
      const { status } = data || {};
      console.log(`Webhook session status updated to "${status}"`);
      if (status === 'FAILED') {
        try {
          await WhatsAppService.logout();
          console.log('Webhook auto-logout completed successfully.');
        } catch (err) {
          console.error(`Webhook failed to logout failed session: ${err.message}`);
        }
      }
    }

    if (event === 'message.status' || event === 'message.ack') {
      const statusPayload = data || {};
      const messageId = statusPayload.id;
      const rawStatus = event === 'message.ack'
        ? (statusPayload.ackName || statusPayload.ack)
        : statusPayload.status;
      
      try {
        await WhatsAppService.updateMessageStatus(messageId, rawStatus);
        console.log(`Message ${messageId} status updated from ${event} to ${rawStatus}`);
      } catch (err) {
        console.error(`Failed to update message status for ${messageId}:`, err.message);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============ INSTAGRAM WEBHOOK VERIFICATION ============
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'renic_instagram_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Instagram webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ============ INSTAGRAM WEBHOOK ============
router.post('/instagram', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = JSON.stringify(req.body);
    const isValid = InstagramService.verifyWebhookSignature(signature, rawBody);

    if (!isValid) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const { object, entry } = req.body;

    if (object === 'instagram') {
      for (const item of entry) {
        if (!item.messaging) {
          continue;
        }

        for (const event of item.messaging) {
          if (!event.message) {
            continue;
          }

          const senderId = event.sender.id;
          const messageText = event.message.text || '';
          let mediaUrl = null;

          if (event.message.attachments && event.message.attachments.length > 0) {
            const attachment = event.message.attachments[0];
            if (attachment.payload && attachment.payload.url) {
              mediaUrl = attachment.payload.url;
            }
          }

          if (!messageText && !mediaUrl) {
            continue;
          }

          await InstagramService.markAsSeen(senderId);

          const userId = await getDefaultUserId();
          const result = await processOrQueueMessage({
            phoneNumber: senderId,
            messageBody: messageText,
            channel: 'instagram',
            userId,
            mediaUrl,
            externalMessageId: event.message.mid || null,
            timestamp: event.timestamp || Date.now()
          });

          if (result.queued) {
            console.log('Instagram message queued:', {
              jobId: result.jobId,
              senderId
            });
          } else if (result.success) {
            console.log('Instagram message processed inline:', {
              customerId: result.customerId,
              intent: result.analysis?.intent,
              leadScore: result.leadScore?.score,
              escalated: result.escalated
            });
          } else {
            console.error('Instagram message processing failed:', result.error);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Instagram Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============ GENERIC WEBHOOK HEALTH CHECK ============
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    queueEnabled: isQueueEnabled(),
    webhooks: {
      whatsapp: 'active (WAHA)',
      instagram: 'active',
      meta: 'active'
    },
    timestamp: new Date()
  });
});

// ============ META WHATSAPP CLOUD API WEBHOOK ============
router.get('/meta/whatsapp', MetaService.verifyWebhook);
router.post('/meta/whatsapp', MetaService.handleWebhook);

module.exports = router;
