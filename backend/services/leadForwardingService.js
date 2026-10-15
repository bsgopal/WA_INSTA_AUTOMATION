// renic-automation-backend/services/leadForwardingService.js
// Lead handoff: when a customer replies to the Meta campaign number,
// send a handoff message to the customer FROM the QR-scanned (WAHA) WhatsApp
// so staff can continue the chat on their own number/phone.

const WAHAService = require('./WAHAService');
const ShopConfig = require('../models/ShopConfig');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const ConversationMessage = require('../models/ConversationMessage');

const DEFAULT_HANDOFF_MESSAGE =
  'Hi {name}! You replied to our promotional number. Our support team will now continue this chat with you on this number. How can we help you?';

const DEFAULT_AUTO_REPLY = 'Hi {name}, how can I help you?';
const DEFAULT_FORWARD_NOTIFICATION = 'Hello, Customer {name} ({phone}) sent message: {message}';

const resolveCustomer = async (userId, phoneNumber) => {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const last10Digits = digitsOnly.slice(-10);
  const regexPattern = last10Digits.split('').join('[^0-9]*') + '(?:@[a-z.]+)?$';

  return Customer.findOne({
    userId,
    $or: [
      { whatsappNumber: phoneNumber },
      { whatsappNumber: digitsOnly },
      { phone: phoneNumber },
      { phone: digitsOnly },
      { whatsappNumber: { $regex: regexPattern } },
      { phone: { $regex: regexPattern } }
    ]
  });
};

const parseCustomerName = (customer, phoneNumber) => {
  const firstName = customer?.firstName;
  if (firstName && !/^(\+?\d{6,})$/.test(firstName)) {
    return `${firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`.trim();
  }
  return phoneNumber;
};

/**
 * Get the team's WhatsApp number from WAHA session
 */
const getTeamWhatsAppNumber = async () => {
  try {
    const sessionStatus = await WAHAService.getSessionStatus();
    if (sessionStatus?.success && sessionStatus?.phoneNumber) {
      let phone = sessionStatus.phoneNumber;
      // Normalize phone number
      if (phone.includes('@c.us')) {
        phone = phone.replace('@c.us', '');
      } else if (phone.includes('@s.whatsapp.net')) {
        phone = phone.replace('@s.whatsapp.net', '');
      }
      if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }
      return phone;
    }
    return null;
  } catch (error) {
    console.error('[LeadForwarding] Error getting team WhatsApp number:', error.message);
    return null;
  }
};

/**
 * Send auto-reply to customer from team's WhatsApp
 */
const sendAutoReplyToCustomer = async (customerPhone, customerName, customAutoReply) => {
  try {
    const template = customAutoReply || DEFAULT_AUTO_REPLY;
    const autoReply = template.replace(/\{name\}/g, customerName || 'there');
    console.log(`[LeadForwarding] Sending auto-reply to ${customerPhone}: ${autoReply}`);

    const result = await WAHAService.sendMessage(customerPhone, autoReply).catch(err => ({ success: false, error: err.message }));
    
    if (!result || !result.success) {
      console.warn(`[LeadForwarding] Auto-reply send failed (${customerPhone}): ${result?.error || 'unknown'}. Attempting WhatsAppService fallback.`);
      try {
        const WhatsAppService = require('./WhatsAppService');
        const fallback = await WhatsAppService.sendMessage(customerPhone, autoReply, { forceWaha: false, forceMeta: false });
        if (fallback && fallback.success) {
          console.log(`[LeadForwarding] Auto-reply fallback succeeded via WhatsAppService (${customerPhone})`);
          return fallback;
        }
      } catch (fallbackErr) {
        console.error('[LeadForwarding] Auto-reply fallback error:', fallbackErr.message);
      }
      return { success: false, error: result?.error || 'FALLBACK_SEND_FAILED' };
    }

    console.log(`[LeadForwarding] Auto-reply sent to ${customerPhone} from team's WhatsApp`);
    return { success: true, externalMessageId: result.externalMessageId || result.messageId || null };
  } catch (error) {
    console.error('[LeadForwarding] Auto-reply error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to team's WhatsApp about new customer message
 */
const sendNotificationToTeam = async (phoneNumber, customerName, messageBody, teamWhatsAppNumber) => {
  try {
    if (!teamWhatsAppNumber) {
      console.warn('[LeadForwarding] No team WhatsApp number available for notification');
      return { success: false, reason: 'NO_TEAM_NUMBER' };
    }

    const notification = DEFAULT_FORWARD_NOTIFICATION
      .replace(/\{name\}/g, customerName)
      .replace(/\{phone\}/g, phoneNumber)
      .replace(/\{message\}/g, messageBody);

    console.log(`[LeadForwarding] Sending notification to team (${teamWhatsAppNumber}): ${notification}`);

    const result = await WAHAService.sendMessage(teamWhatsAppNumber, notification).catch(err => ({ success: false, error: err.message }));
    
    if (!result || !result.success) {
      console.warn(`[LeadForwarding] Team notification failed: ${result?.error || 'unknown'}`);
      return { success: false, error: result?.error || 'SEND_FAILED' };
    }

    console.log(`[LeadForwarding] Notification sent to team at ${teamWhatsAppNumber}`);
    return { success: true, externalMessageId: result.externalMessageId || result.messageId || null };
  } catch (error) {
    console.error('[LeadForwarding] Team notification error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Handle forwarded message from Meta to WhatsApp
 * This is the main entry point when forwarding is enabled
 */
const handleForwardedMessage = async ({ phoneNumber, messageBody, userId, metaPhoneNumberId }) => {
  try {
    const shop = await ShopConfig.findOne({ userId });
    if (!shop) {
      return { forwarded: false, reason: 'NO_SHOP_CONFIG' };
    }

    // Get team's WhatsApp number
    const teamWhatsAppNumber = await getTeamWhatsAppNumber();
    if (!teamWhatsAppNumber) {
      console.log(`[LeadForwarding] WAHA session not connected. Cannot forward message.`);
      return { forwarded: false, reason: 'WAHA_NOT_CONNECTED' };
    }

    // Resolve customer
    const customer = await resolveCustomer(userId, phoneNumber);
    if (!customer) {
      return { forwarded: false, reason: 'NO_CUSTOMER' };
    }

    const customerName = parseCustomerName(customer, phoneNumber);

    // Check if this is the first message in the conversation
    let conversation = await Conversation.findOne({
      userId,
      customerId: customer._id
    }).sort({ updatedAt: -1 });

    const isFirstMessage = !conversation || !conversation.metaHandoffSent;

    if (isFirstMessage) {
      // First message: Send notification to team AND auto-reply to customer
      console.log(`[LeadForwarding] First message from ${phoneNumber}, sending notification and auto-reply`);

      // Send notification to team's WhatsApp
      await sendNotificationToTeam(phoneNumber, customerName, messageBody, teamWhatsAppNumber);

      // Send auto-reply from team's WhatsApp to customer
      const autoReplyText = shop.metaAutoReplyMessage || DEFAULT_AUTO_REPLY;
      await sendAutoReplyToCustomer(phoneNumber, customerName, autoReplyText);

      // Create or update conversation
      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          customerId: customer._id,
          title: `Chat with ${customerName}`,
          primaryPlatform: 'WHATSAPP',
          metaPhoneNumberId: metaPhoneNumberId || '',
          platforms: [{
            type: 'WHATSAPP',
            isLinked: false,
            linkedAt: new Date()
          }],
          status: 'ACTIVE',
          messageCount: 1,
          lastMessage: {
            content: messageBody.substring(0, 100),
            sender: 'CUSTOMER',
            timestamp: new Date(),
            platform: 'whatsapp'
          },
          metaHandoffSent: true
        });
      } else {
        conversation.metaHandoffSent = true;
        conversation.messageCount += 1;
        conversation.lastMessage = {
          content: messageBody.substring(0, 100),
          sender: 'CUSTOMER',
          timestamp: new Date(),
          platform: 'whatsapp'
        };
        conversation.lastActivityAt = new Date();
        if (metaPhoneNumberId) conversation.metaPhoneNumberId = metaPhoneNumberId;
        await conversation.save();
      }

      // Log the customer's original message
      await ConversationMessage.create({
        conversationId: conversation._id,
        customerId: customer._id,
        content: messageBody,
        messageType: 'TEXT',
        platform: 'WHATSAPP',
        sender: {
          type: 'CUSTOMER',
          name: customerName
        },
        status: 'RECEIVED',
        platformMessageId: '',
        isAutoResponse: false
      }).catch(e => console.error('[LeadForwarding] Failed to create first message:', e.message));

      return { forwarded: true, reason: 'FIRST_MESSAGE_HANDLED' };
    } else {
      // Subsequent messages: Log them and forward to team (no auto-reply to customer)
      console.log(`[LeadForwarding] Subsequent message from ${phoneNumber}, forwarding to team without auto-reply`);

      // Send notification to team's WhatsApp
      await sendNotificationToTeam(phoneNumber, customerName, messageBody, teamWhatsAppNumber);

      conversation.messageCount += 1;
      conversation.lastMessage = {
        content: messageBody.substring(0, 100),
        sender: 'CUSTOMER',
        timestamp: new Date(),
        platform: 'whatsapp'
      };
      conversation.lastActivityAt = new Date();
      await conversation.save();

      await ConversationMessage.create({
        conversationId: conversation._id,
        customerId: customer._id,
        content: messageBody,
        messageType: 'TEXT',
        platform: 'WHATSAPP',
        sender: {
          type: 'CUSTOMER',
          name: customerName
        },
        status: 'RECEIVED',
        platformMessageId: '',
        isAutoResponse: false
      }).catch(e => console.error('[LeadForwarding] Failed to create subsequent message:', e.message));

      return { forwarded: true, reason: 'SUBSEQUENT_MESSAGE_FORWARDED' };
    }
  } catch (error) {
    console.error('[LeadForwarding] Error:', error.message);
    return { forwarded: false, reason: error.message };
  }
};

/**
 * Forward a Meta inbound reply to the WAHA/QR-connected WhatsApp.
 * Sends the handoff message once per conversation, then marks it sent.
 * @deprecated Use handleForwardedMessage instead for new forwarding logic
 */
const forwardMetaReplyToWhatsApp = async ({ phoneNumber, userId, metaPhoneNumberId }) => {
  try {
    const shop = await ShopConfig.findOne({ userId });
    if (!shop || !shop.metaForwardReplies) {
      return { forwarded: false, reason: 'FORWARDING_DISABLED' };
    }

    let sessionStatus = await WAHAService.getSessionStatus().catch(() => null);
    if (!sessionStatus || !sessionStatus.success || !sessionStatus.authenticated) {
      console.log(`[LeadForwarding] WAHA session not connected (${sessionStatus?.status || 'unknown'}). Attempting to initialize WAHA session and retry.`);
      try {
        const init = await WAHAService.initialize().catch(() => null);
        if (init && init.success) {
          console.log('[LeadForwarding] WAHA initialize returned success, re-checking session status');
          sessionStatus = await WAHAService.getSessionStatus().catch(() => null);
        }
      } catch (initErr) {
        console.warn('[LeadForwarding] WAHA initialize attempt failed:', initErr.message);
      }

      if (!sessionStatus || !sessionStatus.success || !sessionStatus.authenticated) {
        console.log(`[LeadForwarding] WAHA session still not connected (${sessionStatus?.status || 'unknown'}). Skipping handoff to ${phoneNumber}`);
        return { forwarded: false, reason: 'WAHA_NOT_CONNECTED' };
      }
    }

    const customer = await resolveCustomer(userId, phoneNumber);
    if (!customer) {
      return { forwarded: false, reason: 'NO_CUSTOMER' };
    }

    let conversation = await Conversation.findOne({
      userId,
      customerId: customer._id,
      metaPhoneNumberId: metaPhoneNumberId || { $exists: true }
    }).sort({ lastActivityAt: -1 });

    if (conversation && conversation.metaHandoffSent) {
      return { forwarded: false, reason: 'ALREADY_SENT' };
    }

    const name = parseCustomerName(customer, phoneNumber);
    const message = (shop.metaHandoffMessage || DEFAULT_HANDOFF_MESSAGE)
      .replace(/\{name\}/g, name)
      .replace(/\{phone\}/g, phoneNumber);

    let result = await WAHAService.sendMessage(phoneNumber, message).catch(err => ({ success: false, error: err.message }));
    if (!result || !result.success) {
      console.warn(`[LeadForwarding] WAHA send failed (${phoneNumber}): ${result?.error || 'unknown'}. Attempting WhatsAppService fallback.`);
      try {
        const WhatsAppService = require('./WhatsAppService');
        const fallback = await WhatsAppService.sendMessage(phoneNumber, message, { forceWaha: false, forceMeta: false, userId });
        if (fallback && fallback.success) {
          console.log(`[LeadForwarding] Fallback send succeeded via WhatsAppService (${phoneNumber}) using ${fallback.provider || fallback.channel}`);
          result = fallback;
        } else {
          console.warn(`[LeadForwarding] Fallback send also failed (${phoneNumber}): ${fallback?.error || fallback?.failureReason || 'unknown'}`);
          return { forwarded: false, reason: fallback?.error || 'FALLBACK_SEND_FAILED' };
        }
      } catch (fallbackErr) {
        console.error('[LeadForwarding] Fallback send error:', fallbackErr.message);
        return { forwarded: false, reason: fallbackErr.message };
      }
    }

    // Re-fetch without the metaPhoneNumberId filter: the handoff message is
    // attached to the customer's conversation regardless of which Meta number
    // triggered it. `conversation` was already declared above for the dedup
    // check, so this re-assigns rather than re-declaring (the duplicate `let`
    // made the whole module fail to parse).
    conversation = await Conversation.findOne({
      userId,
      customerId: customer._id
    }).sort({ updatedAt: -1 });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        customerId: customer._id,
        title: `Chat with ${name}`,
        primaryPlatform: 'WHATSAPP',
        metaPhoneNumberId: metaPhoneNumberId || '',
        platforms: [{
          type: 'WHATSAPP',
          isLinked: false,
          linkedAt: new Date()
        }],
        status: 'ACTIVE',
        messageCount: 1,
        lastMessage: {
          content: message.substring(0, 100),
          sender: 'TEAM',
          timestamp: new Date(),
          platform: 'whatsapp'
        },
        metaHandoffSent: true
      });
    } else {
      conversation.metaHandoffSent = true;
      conversation.messageCount += 1;
      conversation.lastMessage = {
        content: message.substring(0, 100),
        sender: 'TEAM',
        timestamp: new Date(),
        platform: 'whatsapp'
      };
      conversation.lastActivityAt = new Date();
      if (metaPhoneNumberId) conversation.metaPhoneNumberId = metaPhoneNumberId;
      await conversation.save();
    }

    await ConversationMessage.create({
      conversationId: conversation._id,
      customerId: customer._id,
      content: message,
      messageType: 'TEXT',
      platform: 'WHATSAPP',
      sender: {
        type: 'SYSTEM',
        name: 'Lead Handoff'
      },
      status: 'SENT',
      platformMessageId: result.externalMessageId || result.messageId || '',
      isAutoResponse: true
    }).catch(() => {});

    console.log(`[LeadForwarding] Handoff message sent to ${phoneNumber} via WAHA session`);
    return { forwarded: true, externalMessageId: result.externalMessageId || result.messageId || null };
  } catch (error) {
    console.error('[LeadForwarding] Error:', error.message);
    return { forwarded: false, reason: error.message };
  }
};

module.exports = {
  forwardMetaReplyToWhatsApp,
  handleForwardedMessage,
  sendAutoReplyToCustomer,
  sendNotificationToTeam,
  getTeamWhatsAppNumber,
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_AUTO_REPLY,
  DEFAULT_FORWARD_NOTIFICATION
};