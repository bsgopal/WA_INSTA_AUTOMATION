const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// ============ GET ALL INVOICES ============
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', status = 'ALL' } = req.query;
    const query = { userId: req.user.id };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNumber: regex },
        { customerName: regex },
        { phone: regex },
        { quotationNumber: regex }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('customerId', 'firstName lastName phone email rfmSegment'),
      Invoice.countDocuments(query)
    ]);

    res.json({
      success: true,
      invoices,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Fetch Invoices Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// ============ GET SINGLE INVOICE ============
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('customerId');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    res.status(500).json({ success: false, error: 'Failed to get invoice' });
  }
});

// ============ UPDATE INVOICE PAYMENT / STATUS ============
router.patch('/:id/payment', async (req, res) => {
  try {
    const { amountPaid, paymentMethod, paymentReference, status } = req.body;
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (amountPaid !== undefined) {
      invoice.amountPaid = Number(amountPaid);
      invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
      if (invoice.balanceDue === 0) {
        invoice.status = 'PAID';
        invoice.paidAt = new Date();
      } else if (invoice.amountPaid > 0) {
        invoice.status = 'PARTIALLY_PAID';
      }
    }

    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paymentReference) invoice.paymentReference = paymentReference;
    if (status) invoice.status = status;

    await invoice.save();
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Update Invoice Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice payment' });
  }
});

module.exports = router;
