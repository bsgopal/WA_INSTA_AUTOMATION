// renic-automation-backend/routes/customers.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// ============ GET ALL CUSTOMERS ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('segment').optional().isString(),
  query('language').optional().isString(),
  query('loyaltyTier').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.user.id };

    // Search filter
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Segment filter
    if (req.query.segment) {
      query.rfmSegment = req.query.segment;
    }

    // Language filter
    if (req.query.language) {
      query.language = req.query.language;
    }

    // Loyalty tier filter
    if (req.query.loyaltyTier) {
      query.loyaltyTier = req.query.loyaltyTier;
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Customers Error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ============ GET CUSTOMER BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get Customer Error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ============ CREATE CUSTOMER ============
router.post('/', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('whatsappNumber').optional().trim(),
  body('instagramHandle').optional().trim(),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizePhone = (phone) => {
      if (!phone) return phone;
      // Strip spaces, dashes, brackets, and only keep + and digits
      return phone.replace(/[\s\-\(\)]/g, '');
    };

    const phone = normalizePhone(req.body.phone);
    const whatsappNumber = normalizePhone(req.body.whatsappNumber) || phone;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      userId: req.user.id,
      phone: phone
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }

    const customer = new Customer({
      ...req.body,
      userId: req.user.id,
      phone,
      whatsappNumber
    });

    await customer.save();

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create Customer Error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// ============ UPDATE CUSTOMER ============
router.put('/:id', [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional().trim(),
  body('whatsappNumber').optional().trim(),
  body('instagramHandle').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizePhone = (phone) => {
      if (!phone) return phone;
      return phone.replace(/[\s\-\(\)]/g, '');
    };

    const updateData = { ...req.body };
    if (updateData.phone) {
      updateData.phone = normalizePhone(updateData.phone);
    }
    if (updateData.whatsappNumber) {
      updateData.whatsappNumber = normalizePhone(updateData.whatsappNumber);
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Update Customer Error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// ============ DELETE CUSTOMER ============
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete Customer Error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ============ BULK IMPORT CUSTOMERS (CSV) ============
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        let skipped = 0;

        for (const row of results) {
          try {
            // Check if customer exists
            const exists = await Customer.findOne({
              userId: req.user.id,
              phone: row.phone
            });

            if (exists) {
              skipped++;
              continue;
            }

            const customer = new Customer({
              userId: req.user.id,
              firstName: row.firstName || row.first_name,
              lastName: row.lastName || row.last_name,
              email: row.email,
              phone: row.phone,
              whatsappNumber: row.whatsappNumber || row.whatsapp_number || row.phone,
              instagramHandle: row.instagramHandle || row.instagram_handle,
              language: row.language || 'en',
              importedAt: new Date()
            });

            await customer.save();
            imported++;
          } catch (error) {
            errors.push({ row, error: error.message });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: 'Import completed',
          imported,
          skipped,
          errors: errors.length,
          errorDetails: errors.slice(0, 10) // Return first 10 errors
        });
      });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ error: 'Failed to import customers' });
  }
});

// ============ GET CUSTOMER SEGMENTS ============
router.get('/analytics/segments', async (req, res) => {
  try {
    const segments = await Customer.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$rfmSegment',
          count: { $sum: 1 },
          avgSpent: { $avg: '$totalSpent' },
          avgPurchases: { $avg: '$totalPurchases' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(segments);
  } catch (error) {
    console.error('Segments Error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// ============ UPDATE RFM SCORES ============
router.post('/analytics/update-rfm', async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });

    let updated = 0;

    for (const customer of customers) {
      // Calculate recency (days since last purchase)
      const recency = customer.lastPurchaseDate
        ? Math.floor((Date.now() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate frequency (total purchases)
      const frequency = customer.totalPurchases || 0;

      // Calculate monetary (total spent)
      const monetary = customer.totalSpent || 0;

      // Score each dimension (1-5)
      const recencyScore = recency < 30 ? 5 : recency < 60 ? 4 : recency < 90 ? 3 : recency < 180 ? 2 : 1;
      const frequencyScore = frequency >= 10 ? 5 : frequency >= 7 ? 4 : frequency >= 4 ? 3 : frequency >= 2 ? 2 : 1;
      const monetaryScore = monetary >= 10000 ? 5 : monetary >= 5000 ? 4 : monetary >= 2000 ? 3 : monetary >= 500 ? 2 : 1;

      const overallScore = (recencyScore + frequencyScore + monetaryScore) / 3;

      // Determine segment
      let segment = 'NEW';
      if (overallScore >= 4.5) segment = 'VIP';
      else if (overallScore >= 3.5) segment = 'LOYAL';
      else if (overallScore >= 2.5) segment = 'REGULAR';
      else if (recencyScore <= 2 && frequencyScore >= 3) segment = 'AT_RISK';
      else if (recency > 180) segment = 'LOST';
      else if (recency > 90) segment = 'INACTIVE';

      customer.rfmScore = {
        recency: recencyScore,
        frequency: frequencyScore,
        monetary: monetaryScore,
        overall: overallScore
      };
      customer.rfmSegment = segment;

      await customer.save();
      updated++;
    }

    res.json({ message: 'RFM scores updated', updated });
  } catch (error) {
    console.error('RFM Update Error:', error);
    res.status(500).json({ error: 'Failed to update RFM scores' });
  }
});

module.exports = router;
