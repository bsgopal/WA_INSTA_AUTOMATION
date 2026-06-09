// renic-automation-backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/WhatsAppService');
const InstagramService = require('../services/InstagramService');
const aiChatHandler = require('../services/aiChatHandler');
const aiSmartFeatures = require('../services/aiSmartFeatures');

// ============ WHATSAPP WEBHOOK (WAHA) ============
router.post('/whatsapp', async (req, res) => {
  try {
    const { event } = req.body;
    const data = req.body.payload || req.body.data;
    console.log(`ðŸ“¥ Incoming WAHA Webhook: event="${event}"`, JSON.stringify(req.body).substring(0, 300));

    // Handle incoming message
    if (event === 'message' && data) {
      const { from, body, hasMedia, media, fromMe, _data } = data;

      if (!from) {
        return res.status(200).send('OK');
      }

      if (fromMe === true) {
        console.log('â„¹ï¸ Ignoring message sent by ourselves (fromMe = true)');
        return res.status(200).send('OK');
      }

      // Ignore group chats and status broadcasts
      if (from.includes('@g.us') || from.includes('status@broadcast')) {
        console.log(`â„¹ï¸ Ignoring group/broadcast message from: ${from}`);
        return res.status(200).send('OK');
      }

      // Extract phone number or keep LID JID directly
      let resolvedFrom = from;
      let originalLid = null;

      if (from.endsWith('@lid')) {
        originalLid = '+' + from.replace('@lid', '') + '@lid';
        if (_data?.key?.remoteJidAlt) {
          resolvedFrom = _data.key.remoteJidAlt;
          console.log(`â„¹ï¸ Resolved LID "${from}" to phone JID "${resolvedFrom}" via remoteJidAlt`);
        } else if (_data?.key?.participantAlt) {
          resolvedFrom = _data.key.participantAlt;
          console.log(`â„¹ï¸ Resolved LID "${from}" to phone JID "${resolvedFrom}" via participantAlt`);
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

      // Retrieve default userId or lookup first ADMIN user from database dynamically
      let userId = process.env.DEFAULT_USER_ID;
      if (!userId || userId === '000000000000000000000000') {
        const User = require('../models/User');
        const defaultUser = await User.findOne({ role: 'ADMIN' });
        if (defaultUser) {
          userId = defaultUser._id;
        } else {
          userId = '000000000000000000000000';
        }
      }

      // Process message with AI chat handler
      const result = await aiChatHandler.handleCustomerMessage(
        phoneNumber,
        body,
        'whatsapp',
        userId,
        hasMedia && media ? media.url : null,
        {
          pushName: _data?.pushName,
          whatsappLid: originalLid
        }
      );

      if (result.success) {
        console.log('âœ… WhatsApp Message Processed:', {
          customerId: result.customerId,
          intent: result.analysis.intent,
          leadScore: result.leadScore.score,
          escalated: result.escalated
        });
      } else {
        console.error('âŒ Message Processing Failed:', result.error);
      }
    }

    // Handle session status update (e.g. mobile logout or connection failure)
    if (event === 'session.status') {
      const { status } = data || {};
      console.log(`â„¹ï¸ Webhook: Session status updated to "${status}"`);
      if (status === 'FAILED') {
        console.log('âš ï¸ Webhook: Session is FAILED. Triggering auto-logout to reset stale credentials...');
        try {
          await WhatsAppService.logout();
          console.log('âœ… Webhook auto-logout completed successfully.');
        } catch (err) {
          console.error(`âŒ Webhook: Failed to logout failed session: ${err.message}`);
        }
      }
    }

    // Handle message status update
    if (event === 'message.status') {
      const { id, status } = data;
      await WhatsAppService.updateMessageStatus(id, status);
      console.log(`ðŸ“Š Message ${id} status updated to ${status}`);
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
    // Verify signature
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

          let userId = process.env.DEFAULT_USER_ID;
          if (!userId || userId === '000000000000000000000000') {
            const User = require('../models/User');
            const defaultUser = await User.findOne({ role: 'ADMIN' });
            if (defaultUser) {
              userId = defaultUser._id;
            } else {
              userId = '000000000000000000000000';
            }
          }

          const result = await aiChatHandler.handleCustomerMessage(
            senderId,
            messageText,
            'instagram',
            userId,
            mediaUrl
          );

          if (result.success) {
            console.log('Instagram Message Processed:', {
              customerId: result.customerId,
              intent: result.analysis?.intent,
              leadScore: result.leadScore?.score,
              escalated: result.escalated
            });
          } else {
            console.error('Instagram Message Processing Failed:', result.error);
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
    webhooks: {
      whatsapp: 'active (WAHA)',
      instagram: 'active'
    },
    timestamp: new Date()
  });
});

module.exports = router;
