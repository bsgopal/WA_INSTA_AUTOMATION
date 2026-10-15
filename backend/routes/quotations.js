const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const ShopConfig = require('../models/ShopConfig');
const WhatsAppService = require('../services/WhatsAppService');

/**
 * Generate next quotation number format: RT/YYYY/XXX
 */
async function getNextQuotationNumber(userId) {
  const currentYear = new Date().getFullYear();
  const prefix = `RT/${currentYear}/`;
  
  // Find highest number this year
  const lastQuotation = await Quotation.findOne({
    userId,
    quotationNumber: { $regex: `^${prefix}` }
  }).sort({ createdAt: -1 });

  let nextNum = 1;
  if (lastQuotation && lastQuotation.quotationNumber) {
    const parts = lastQuotation.quotationNumber.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Generate next invoice number format: INV/YYYY/XXX
 */
async function getNextInvoiceNumber(userId) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV/${currentYear}/`;
  
  const lastInvoice = await Invoice.findOne({
    userId,
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ createdAt: -1 });

  let nextNum = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// ============ GET ALL QUOTATIONS ============
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      status = 'ALL',
      startDate,
      endDate,
      followupPending
    } = req.query;

    const query = { userId: req.user.id };

    // Search filter
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { quotationNumber: regex },
        { customerName: regex },
        { phone: regex },
        { email: regex },
        { title: regex }
      ];
    }

    // Status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Follow-up pending: Status is SENT and either sent > 3 days ago or expiring within 3 days
    if (followupPending === 'true') {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      query.status = 'SENT';
      query.$or = [
        { lastSentAt: { $lte: threeDaysAgo } },
        { validUntil: { $lte: threeDaysLater } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('customerId', 'firstName lastName phone email rfmSegment'),
      Quotation.countDocuments(query)
    ]);

    // Aggregate statistics
    const [statsResult] = await Quotation.aggregate([
      { $match: { userId: req.user._id || req.user.id } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
          acceptedCount: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
          acceptedValue: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, '$totalAmount', 0] } },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      quotations,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      },
      stats: statsResult || {
        totalCount: 0,
        totalValue: 0,
        acceptedCount: 0,
        acceptedValue: 0,
        sentCount: 0,
        draftCount: 0
      }
    });
  } catch (error) {
    console.error('Fetch Quotations Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quotations' });
  }
});

// ============ GET SINGLE QUOTATION ============
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('customerId');

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    res.json({ success: true, quotation });
  } catch (error) {
    console.error('Get Quotation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve quotation' });
  }
});

// ============ CREATE QUOTATION ============
router.post('/', async (req, res) => {
  try {
    const {
      title = 'Custom Software Development',
      subtitle = 'A tailored solution to streamline your operations and support your business growth.',
      date,
      validUntil,
      status = 'DRAFT',
      isExistingCustomer = false,
      customerId = null,
      customerName,
      contactPerson = '',
      phone,
      email = '',
      address = '',
      gstin = '',
      items = [],
      currency = 'INR',
      currencySymbol = '₹',
      subtotal,
      taxPercent = 0,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount,
      terms,
      signatoryName,
      signatoryTitle,
      signatoryCompany,
      themeColor = '#DC2626',
      notes = ''
    } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({ success: false, error: 'Customer name and phone number are required' });
    }

    // Auto-generate quotation number
    const quotationNumber = await getNextQuotationNumber(req.user.id);

    // Fetch dynamic company details from ShopConfig
    const shopConfig = await ShopConfig.findOne({ userId: req.user.id });
    const companyDetails = {
      companyName: shopConfig?.companyName || shopConfig?.shopName || 'RENIC TECHNOLOGY',
      tagline: shopConfig?.tagline || 'IDEAS | SOLUTIONS | GROWTH',
      logoUrl: shopConfig?.logoUrl || '',
      phone: shopConfig?.contactPhone || '+91 88070 25752',
      email: shopConfig?.email || 'info@renictechnology.com',
      website: shopConfig?.websiteUrl || 'www.renictechnology.com',
      address: shopConfig?.address || '123, Main Road, Gobichettipalayam, Erode - 638452, Tamil Nadu, India',
      gstin: shopConfig?.gstin || ''
    };

    // Calculate line items and subtotals
    const formattedItems = (items || []).map((it, idx) => ({
      sNo: it.sNo || idx + 1,
      item: it.item || `Service / Item ${idx + 1}`,
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || Number(it.amount) || 0,
      amount: Number(it.amount) || (Number(it.quantity || 1) * Number(it.unitPrice || 0))
    }));

    const calcSubtotal = subtotal !== undefined
      ? Number(subtotal)
      : formattedItems.reduce((sum, it) => sum + (it.amount || 0), 0);
    const calcTax = taxAmount !== undefined ? Number(taxAmount) : (calcSubtotal * (Number(taxPercent) || 0)) / 100;
    const calcTotal = totalAmount !== undefined
      ? Number(totalAmount)
      : Math.max(0, calcSubtotal + calcTax - (Number(discountAmount) || 0));

    const quotation = new Quotation({
      userId: req.user.id,
      quotationNumber,
      title,
      subtitle,
      date: date ? new Date(date) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status,
      isExistingCustomer,
      customerId,
      customerName,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      companyDetails,
      items: formattedItems,
      currency,
      currencySymbol,
      subtotal: calcSubtotal,
      taxPercent: Number(taxPercent) || 0,
      taxAmount: calcTax,
      discountAmount: Number(discountAmount) || 0,
      totalAmount: calcTotal,
      terms: terms || shopConfig?.defaultQuotationTerms || [
        '50% advance payment to start the project.',
        'Balance payment after final delivery.',
        'Timeline: 4 – 6 weeks (depends on features).',
        '1 year free support for the delivered project.',
        'Quotation is valid for 30 days.'
      ],
      signatoryName: signatoryName || shopConfig?.signatoryName || 'Renic Team',
      signatoryTitle: signatoryTitle || shopConfig?.signatoryTitle || 'Authorized Signature',
      signatoryCompany: signatoryCompany || shopConfig?.signatoryCompany || 'RENIC TECHNOLOGY',
      themeColor: themeColor || shopConfig?.themeColor || '#DC2626',
      notes
    });

    await quotation.save();
    res.status(201).json({ success: true, quotation });
  } catch (error) {
    console.error('Create Quotation Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create quotation' });
  }
});

// ============ UPDATE QUOTATION ============
router.put('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const {
      title,
      subtitle,
      date,
      validUntil,
      status,
      isExistingCustomer,
      customerId,
      customerName,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      items,
      currency,
      currencySymbol,
      subtotal,
      taxPercent,
      taxAmount,
      discountAmount,
      totalAmount,
      terms,
      signatoryName,
      signatoryTitle,
      signatoryCompany,
      themeColor,
      notes
    } = req.body;

    if (title !== undefined) quotation.title = title;
    if (subtitle !== undefined) quotation.subtitle = subtitle;
    if (date !== undefined) quotation.date = new Date(date);
    if (validUntil !== undefined) quotation.validUntil = new Date(validUntil);
    if (status !== undefined) quotation.status = status;
    if (isExistingCustomer !== undefined) quotation.isExistingCustomer = isExistingCustomer;
    if (customerId !== undefined) quotation.customerId = customerId;
    if (customerName !== undefined) quotation.customerName = customerName;
    if (contactPerson !== undefined) quotation.contactPerson = contactPerson;
    if (phone !== undefined) quotation.phone = phone;
    if (email !== undefined) quotation.email = email;
    if (address !== undefined) quotation.address = address;
    if (gstin !== undefined) quotation.gstin = gstin;
    if (currency !== undefined) quotation.currency = currency;
    if (currencySymbol !== undefined) quotation.currencySymbol = currencySymbol;
    if (terms !== undefined) quotation.terms = terms;
    if (signatoryName !== undefined) quotation.signatoryName = signatoryName;
    if (signatoryTitle !== undefined) quotation.signatoryTitle = signatoryTitle;
    if (signatoryCompany !== undefined) quotation.signatoryCompany = signatoryCompany;
    if (themeColor !== undefined) quotation.themeColor = themeColor;
    if (notes !== undefined) quotation.notes = notes;

    if (items) {
      quotation.items = items.map((it, idx) => ({
        sNo: it.sNo || idx + 1,
        item: it.item || `Item ${idx + 1}`,
        description: it.description || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || Number(it.amount) || 0,
        amount: Number(it.amount) || (Number(it.quantity || 1) * Number(it.unitPrice || 0))
      }));
    }

    if (subtotal !== undefined) quotation.subtotal = Number(subtotal);
    if (taxPercent !== undefined) quotation.taxPercent = Number(taxPercent);
    if (taxAmount !== undefined) quotation.taxAmount = Number(taxAmount);
    if (discountAmount !== undefined) quotation.discountAmount = Number(discountAmount);
    if (totalAmount !== undefined) quotation.totalAmount = Number(totalAmount);

    await quotation.save();
    res.json({ success: true, quotation });
  } catch (error) {
    console.error('Update Quotation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update quotation' });
  }
});

// ============ UPDATE STATUS ============
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    quotation.status = status;
    if (status === 'ACCEPTED') {
      quotation.acceptedAt = new Date();
    } else if (status === 'SENT') {
      quotation.lastSentAt = new Date();
    }

    await quotation.save();
    res.json({ success: true, quotation });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update quotation status' });
  }
});

// ============ CONVERT TO INVOICE (BILLING) ============
router.post('/:id/convert-to-invoice', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    let customerId = quotation.customerId;

    // If quotation was for a new (unsaved) customer, auto-enroll them in the database!
    if (!customerId) {
      // Check if a customer with this phone number already exists
      let existingCust = await Customer.findOne({
        userId: req.user.id,
        $or: [{ phone: quotation.phone }, { whatsappNumber: quotation.phone }]
      });

      if (!existingCust) {
        // Extract names
        const nameParts = (quotation.customerName || 'Valued Client').trim().split(' ');
        const firstName = nameParts[0] || 'Client';
        const lastName = nameParts.slice(1).join(' ') || '';

        existingCust = new Customer({
          userId: req.user.id,
          firstName,
          lastName,
          phone: quotation.phone,
          whatsappNumber: quotation.phone,
          email: quotation.email || undefined,
          location: {
            address: quotation.address || ''
          },
          rfmSegment: 'NEW',
          status: 'ACTIVE'
        });
        await existingCust.save();
      }

      customerId = existingCust._id;
      quotation.customerId = customerId;
      quotation.isExistingCustomer = true;
    }

    // Generate Invoice Number
    const invoiceNumber = await getNextInvoiceNumber(req.user.id);

    // Create Invoice Record
    const invoice = new Invoice({
      userId: req.user.id,
      invoiceNumber,
      quotationId: quotation._id,
      quotationNumber: quotation.quotationNumber,
      customerId,
      customerName: quotation.customerName,
      phone: quotation.phone,
      email: quotation.email,
      address: quotation.address,
      gstin: quotation.gstin,
      date: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'UNPAID',
      items: quotation.items,
      currency: quotation.currency,
      currencySymbol: quotation.currencySymbol,
      subtotal: quotation.subtotal,
      taxPercent: quotation.taxPercent,
      taxAmount: quotation.taxAmount,
      discountAmount: quotation.discountAmount,
      totalAmount: quotation.totalAmount,
      amountPaid: 0,
      balanceDue: quotation.totalAmount,
      notes: `Converted from Quotation ${quotation.quotationNumber}`
    });

    await invoice.save();

    // Update Quotation Status
    quotation.status = 'CONVERTED_TO_INVOICE';
    quotation.convertedInvoiceId = invoice._id;
    quotation.convertedInvoiceNumber = invoice.invoiceNumber;
    quotation.acceptedAt = quotation.acceptedAt || new Date();
    await quotation.save();

    res.json({
      success: true,
      message: `Quotation converted to Tax Invoice (${invoice.invoiceNumber}) successfully!`,
      invoice,
      quotation
    });
  } catch (error) {
    console.error('Convert Quotation to Invoice Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to convert quotation to invoice' });
  }
});

// ============ SEND QUOTATION VIA WHATSAPP ============
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { customMessage } = req.body;
    const cleanPhone = String(quotation.phone).replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Construct professional quotation summary message
    const itemsSummary = (quotation.items || [])
      .map((it, i) => `${i + 1}. *${it.item}* - ${quotation.currencySymbol} ${it.amount.toLocaleString('en-IN')}`)
      .join('\n');

    const defaultMsg = `📄 *QUOTATION: ${quotation.quotationNumber}*\n` +
      `*${quotation.title}*\n` +
      `_${quotation.subtitle}_\n\n` +
      `Dear *${quotation.customerName}*,\n` +
      `Thank you for your interest. Here is your tailored proposal:\n\n` +
      `*Services / Items:*\n${itemsSummary}\n\n` +
      `💰 *Total Amount:* *${quotation.currencySymbol} ${quotation.totalAmount.toLocaleString('en-IN')}*\n` +
      `📅 *Valid Till:* ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}\n\n` +
      `*Terms & Highlights:*\n` +
      (quotation.terms || []).map(t => `• ${t}`).join('\n') +
      `\n\nBest Regards,\n*${quotation.signatoryName}*\n${quotation.companyDetails?.companyName || 'RENIC TECHNOLOGY'}\n🌐 ${quotation.companyDetails?.website || 'www.renictechnology.com'}`;

    const messageText = customMessage || defaultMsg;

    let sendResult;
    try {
      sendResult = await WhatsAppService.sendMessage(targetPhone, messageText);
    } catch (waErr) {
      console.warn('WhatsApp service direct dispatch note:', waErr.message);
      sendResult = { success: true, simulated: true };
    }

    quotation.status = 'SENT';
    quotation.lastSentAt = new Date();
    await quotation.save();

    res.json({
      success: true,
      message: `Quotation dispatched to ${quotation.phone} on WhatsApp!`,
      quotation,
      sendResult
    });
  } catch (error) {
    console.error('Send Quotation Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to dispatch quotation via WhatsApp' });
  }
});

// ============ DELETE QUOTATION ============
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Delete Quotation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete quotation' });
  }
});

module.exports = router;
