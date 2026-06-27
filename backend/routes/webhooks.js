// renic-automation-backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/WhatsAppService');
const InstagramService = require('../services/InstagramService');
const aiChatHandler = require('../services/aiChatHandler');
const messageQueueService = require('../services/messageQueueService');

const isQueueEnabled = () => process.env.AI_QUEUE_ENABLED !== 'false';

const getDefaultUserId = async () => {
  let userId = process.env.DEFAULT_USER_ID;
  if (!userId || userId === '000000000000000000000000') {
    const User = require('../models/User');
    const defaultUser = await User.findOne({ role: 'ADMIN' });
    userId = defaultUser ? defaultUser._id : '000000000000000000000000';
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

// ============ WHATSAPP WEBHOOK (WAHA) ============
router.post('/whatsapp', async (req, res) => {
  try {
    const { event } = req.body;
    const data = req.body.payload || req.body.data;
    console.log(`Incoming WAHA Webhook: event="${event}"`, JSON.stringify(req.body).substring(0, 300));

    if (event === 'message' && data) {
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

      const userId = await getDefaultUserId();
      const externalMessageId = data.id || _data?.id?.id || _data?.key?.id || null;

      const result = await processOrQueueMessage({
        phoneNumber,
        messageBody: normalizedReply.body || '',
        channel: 'whatsapp',
        userId,
        mediaUrl: hasMedia && media ? media.url : null,
        externalMessageId,
        timestamp: data.timestamp || Date.now(),
        options: {
          pushName: _data?.pushName,
          whatsappLid: originalLid,
          interactiveReply: normalizedReply.interactive,
          rawMessageType: data.type || _data?.type || null
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
      await WhatsAppService.handleStatusUpdate({
        event,
        data: statusPayload
      });
      console.log(`Message ${messageId} status updated from ${event} to ${rawStatus}`);
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
      instagram: 'active'
    },
    timestamp: new Date()
  });
});

module.exports = router;
