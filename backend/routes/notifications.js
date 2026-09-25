// renic-automation-backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const WhatsAppService = require('../services/WhatsAppService');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ConversationMessage = require('../models/ConversationMessage');
const { evaluateCustomerRFM } = require('../services/rfmService');

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
  try {
    fs.mkdirSync(invoicesDir, { recursive: true });
  } catch (err) {
    console.warn('⚠️ Could not create invoices folder:', err.message);
  }
}

/**
 * Format phone to international format (defaults to India 91)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * POST /api/notifications/send-document
 * Sends a PDF document (e.g. Tax Invoice) or file to a customer via WhatsApp
 */
router.post('/send-document', async (req, res) => {
  try {
    const {
      phone,
      pdfBase64,
      pdfUrl,
      filename = 'Invoice.pdf',
      caption = 'Here is your official invoice. Thank you for shopping with us! 🛍️',
      customerName = '',
      metadata = {}
    } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Target phone number is required' });
    }

    const formattedPhone = cleanPhoneNumber(phone);
    let resolvedMediaUrl = pdfUrl;
    let base64DataUrl = null;

    // If PDF base64 provided, save to public uploads and serve via local server URL
    if (pdfBase64) {
      const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(invoicesDir, safeFilename);
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));

      // Local served URL
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      resolvedMediaUrl = `${protocol}://${host}/uploads/invoices/${safeFilename}`;
      base64DataUrl = `data:application/pdf;base64,${cleanBase64}`;
    }

    // Find or create customer
    let customer = await Customer.findOne({
      $or: [{ phone: formattedPhone }, { whatsappNumber: formattedPhone }]
    });

    if (!customer) {
      customer = new Customer({
        firstName: customerName || 'Valued Customer',
        phone: formattedPhone,
        whatsappNumber: formattedPhone,
        status: 'ACTIVE',
        rfmSegment: 'NEW'
      });
      await customer.save();
    }

    // Auto-evaluate customer RFM metrics
    try {
      const billAmount = metadata?.amount || metadata?.totalAmount || 0;
      await evaluateCustomerRFM(customer._id, { amount: billAmount });
    } catch (rfmErr) {
      console.warn('⚠️ Auto-RFM evaluation notice:', rfmErr.message);
    }

    // Send document via WhatsAppService
    const sendOptions = {
      mediaUrl: resolvedMediaUrl,
      mediaType: 'document',
      mediaMimeType: 'application/pdf',
      mediaFileName: filename,
      caption: caption
    };

    if (base64DataUrl) {
      sendOptions.mediaDataUrl = base64DataUrl;
    }

    const sendResult = await WhatsAppService.sendMessage(formattedPhone, caption, sendOptions);

    // Save message record
    const messageDoc = new Message({
      customerId: customer._id,
      direction: 'OUTBOUND',
      channel: 'whatsapp',
      messageType: 'document',
      content: caption,
      mediaUrl: resolvedMediaUrl,
      mediaType: 'document',
      mediaFileName: filename,
      status: sendResult.success ? 'SENT' : 'FAILED',
      externalMessageId: sendResult.externalMessageId || null,
      metadata: {
        ...metadata,
        notificationType: 'BILL_INVOICE_PDF'
      }
    });
    await messageDoc.save();

    // Sync to Unified Inbox Conversation
    try {
      let conv = await Conversation.findOne({ customerId: customer._id });
      if (!conv) {
        conv = new Conversation({
          customerId: customer._id,
          channel: 'whatsapp',
          lastMessageAt: new Date(),
          lastMessagePreview: `[📄 Document: ${filename}] ${caption}`,
          status: 'ACTIVE'
        });
      } else {
        conv.lastMessageAt = new Date();
        conv.lastMessagePreview = `[📄 Document: ${filename}] ${caption}`;
      }
      await conv.save();

      const convMsg = new ConversationMessage({
        conversationId: conv._id,
        customerId: customer._id,
        senderType: 'AGENT',
        channel: 'whatsapp',
        direction: 'OUTBOUND',
        content: `[📄 Document: ${filename}] ${caption}`,
        mediaUrl: resolvedMediaUrl,
        mediaType: 'document',
        status: 'SENT',
        platformMessageId: sendResult.externalMessageId || null
      });
      await convMsg.save();
    } catch (syncErr) {
      console.warn('⚠️ Unified inbox sync warning:', syncErr.message);
    }

    return res.json({
      success: true,
      message: 'Document dispatched successfully',
      result: sendResult,
      invoiceUrl: resolvedMediaUrl
    });
  } catch (error) {
    console.error('❌ Failed to dispatch WhatsApp document:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/send-alert
 * General transactional alert (e.g. Renic_Soft license created/renewed, TextilePOS order alert)
 */
router.post('/send-alert', async (req, res) => {
  try {
    const {
      phone,
      message,
      title = '',
      recipientName = '',
      metadata = {}
    } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    const formattedPhone = cleanPhoneNumber(phone);
    const fullText = title ? `*${title}*\n\n${message}` : message;

    const sendResult = await WhatsAppService.sendMessage(formattedPhone, fullText);

    return res.json({
      success: true,
      result: sendResult
    });
  } catch (error) {
    console.error('❌ Failed to send transactional alert:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/sync-customer
 * Sync customer details from TextilePOS or Renic_Soft
 */
router.post('/sync-customer', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, rfmSegment, totalSpent } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const formattedPhone = cleanPhoneNumber(phone);
    let customer = await Customer.findOne({
      $or: [{ phone: formattedPhone }, { whatsappNumber: formattedPhone }]
    });

    if (customer) {
      if (firstName) customer.firstName = firstName;
      if (lastName) customer.lastName = lastName;
      if (email) customer.email = email;
      if (rfmSegment) customer.rfmSegment = rfmSegment;
      if (totalSpent) customer.totalSpent = (customer.totalSpent || 0) + Number(totalSpent);
      customer.lastActiveAt = new Date();
      await customer.save();
    } else {
      customer = new Customer({
        firstName: firstName || 'Valued Customer',
        lastName: lastName || '',
        phone: formattedPhone,
        whatsappNumber: formattedPhone,
        email: email || '',
        rfmSegment: rfmSegment || 'NEW',
        totalSpent: Number(totalSpent) || 0,
        status: 'ACTIVE'
      });
      await customer.save();
    }

    try {
      await evaluateCustomerRFM(customer._id);
    } catch (e) {}

    return res.json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
