// renic-automation-backend/routes/customers.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// ============ GET ALL CUSTOMERS ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
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
      const searchTerm = req.query.search.trim();
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedTerm, $options: 'i' };

      const predicates = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: searchRegex },
        { whatsappNumber: searchRegex }
      ];

      const digitsOnly = searchTerm.replace(/\D/g, '');
      if (digitsOnly) {
        const digitFuzzy = digitsOnly.split('').map((d) => `\\D*${d}`).join('');
        predicates.push({ phone: { $regex: digitFuzzy } });
        predicates.push({ whatsappNumber: { $regex: digitFuzzy } });
      }

      query.$or = predicates;
    }

    // Segment filter
    if (req.query.segment && req.query.segment !== 'ALL') {
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

// ============ GET CUSTOMERS COUNT ============
router.get('/count', async (req, res) => {
  try {
    const query = { userId: req.user.id };

    if (req.query.segment && req.query.segment !== 'ALL') {
      query.rfmSegment = req.query.segment;
    }

    const count = await Customer.countDocuments(query);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get Customers Count Error:', error);
    res.status(500).json({ error: 'Failed to count customers' });
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
  body('lastName').optional({ values: 'falsy' }).trim(),
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
      whatsappNumber,
      optedIn: {
        whatsapp: true,
        instagram: true,
        sms: true,
        email: true
      }
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

// ============ BULK DELETE CUSTOMERS ============
router.post('/bulk-delete', async (req, res) => {
  try {
    const { customerIds, deleteAll } = req.body;
    if (!deleteAll && (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0)) {
      return res.status(400).json({ error: 'No customer IDs provided' });
    }

    const query = deleteAll 
      ? { userId: req.user.id } 
      : { _id: { $in: customerIds }, userId: req.user.id };

    const result = await Customer.deleteMany(query);

    res.json({
      message: `${result.deletedCount} customers deleted successfully.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Customers Error:', error);
    res.status(500).json({ error: 'Failed to delete selected customers' });
  }
});

// ============ BULK UPDATE CUSTOMER STATUS ============
router.post('/bulk-update-status', async (req, res) => {
  try {
    const { customerIds, rfmSegment, updateAll } = req.body;
    if (!updateAll && (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0)) {
      return res.status(400).json({ error: 'No customer IDs provided' });
    }
    if (!rfmSegment || !['VIP', 'LOYAL', 'REGULAR', 'AT_RISK', 'INACTIVE', 'LOST', 'NEW'].includes(rfmSegment)) {
      return res.status(400).json({ error: 'Invalid or missing customer status' });
    }

    const query = updateAll 
      ? { userId: req.user.id } 
      : { _id: { $in: customerIds }, userId: req.user.id };

    const result = await Customer.updateMany(
      query,
      { $set: { rfmSegment, updatedAt: Date.now() } }
    );

    res.json({
      message: `Successfully updated status to ${rfmSegment} for ${result.modifiedCount} customers.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
});


// ============ BULK IMPORT CUSTOMERS (EXCEL/CSV) ============
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const errors = [];
    let imported = 0;
    let skipped = 0;

    // Read the file using xlsx (supports CSV, XLS, XLSX, etc.)
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Parse as raw rows (array of arrays) to dynamically locate the header row
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    const normalizePhone = (phone) => {
      if (!phone) return '';
      // Strip spaces, dashes, brackets, and only keep + and digits
      return phone.replace(/[\s\-\(\)]/g, '');
    };

    // Find the actual header row (e.g., skip title banners at the top)
    let headerRowIndex = 0;
    let headers = [];
    const phoneHeaderAliases = ['mobilenumber', 'phone', 'mobile', 'phonenumber', 'whatsappnumber', 'contactnumber', 'contact', 'number', 'tel', 'cell', 'whatsapp', 'ph', 'phno'];
    
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i] || [];
      const hasPhoneColumn = row.some(cell => {
        const norm = String(cell).toLowerCase().trim().replace(/[\s_-]/g, '');
        return phoneHeaderAliases.includes(norm) || norm.includes('phone') || norm.includes('contact') || norm.includes('mobile');
      });
      if (hasPhoneColumn) {
        headerRowIndex = i;
        headers = row.map(h => String(h).trim());
        break;
      }
    }

    // Default to row 0 if no clear header was detected
    if (headers.length === 0 && rawRows.length > 0) {
      headers = (rawRows[0] || []).map(h => String(h).trim());
      headerRowIndex = 0;
    }

    // Map rows into objects using the detected headers
    const results = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;
      const rowObj = {};
      let hasData = false;
      headers.forEach((header, colIdx) => {
        if (header) {
          const val = row[colIdx];
          rowObj[header] = val !== undefined ? val : '';
          if (val !== undefined && String(val).trim() !== '') {
            hasData = true;
          }
        }
      });
      if (hasData) {
        results.push(rowObj);
      }
    }

    const getFieldValue = (row, fieldAliases) => {
      for (const alias of fieldAliases) {
        for (const key of Object.keys(row)) {
          const normKey = key.toLowerCase().trim().replace(/[\s_-]/g, '');
          const normAlias = alias.toLowerCase().replace(/[\s_-]/g, '');
          if (normKey === normAlias || normKey.includes(normAlias)) {
            return row[key];
          }
        }
      }
      return undefined;
    };

    for (let index = 0; index < results.length; index++) {
      const row = results[index];
      const lineNum = index + 2; // Line 1 is header, data starts at Line 2

      try {
        const nameVal = getFieldValue(row, ['customername', 'name', 'fullname', 'firstname', 'first']);
        const phoneVal = getFieldValue(row, ['mobilenumber', 'phone', 'mobile', 'phonenumber', 'whatsappnumber', 'contactnumber', 'contact']);
        const addressVal = getFieldValue(row, ['address', 'location', 'customeraddress', 'customer_address']);
        const emailVal = getFieldValue(row, ['email', 'emailaddress']);
        const instagramHandleVal = getFieldValue(row, ['instagramhandle', 'instagram']);
        const languageVal = getFieldValue(row, ['language', 'lang']);
        const segmentVal = getFieldValue(row, ['segment', 'status', 'customertype', 'type', 'rfmsegment', 'customerstatus']);
        const tierVal = getFieldValue(row, ['tier', 'loyalty', 'loyaltytier', 'membership']);

        // Validation: Mobile Number is required
        if (!phoneVal || String(phoneVal).trim() === '') {
          // Ignore empty lines silently (e.g. blank spacer rows at the bottom of the Excel sheet)
          continue;
        }

        // Validate exactly 10 digits
        const phoneStr = String(phoneVal).trim();
        const digits = phoneStr.replace(/\D/g, ''); // keep only digits
        let cleanPhone = digits;
        if (digits.length === 12 && digits.startsWith('91')) {
          cleanPhone = digits.slice(2);
        } else if (digits.length === 11 && digits.startsWith('0')) {
          cleanPhone = digits.slice(1);
        }

        if (cleanPhone.length !== 10) {
          errors.push(`Line ${lineNum}: Mobile number must be exactly 10 digits (found ${cleanPhone.length} digits: ${phoneStr}).`);
          continue;
        }

        // Check if customer already exists for this user
        const normalizedNumber = normalizePhone(cleanPhone);
        const exists = await Customer.findOne({
          userId: req.user.id,
          phone: normalizedNumber
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Split name into firstName and lastName (optional)
        const fullName = String(nameVal || '').trim();
        let firstName = '';
        let lastName = '';
        if (fullName) {
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || `Customer (${cleanPhone})`;
          lastName = parts.slice(1).join(' ') || '';
        } else {
          firstName = `Customer (${cleanPhone})`;
        }

        // Parse and validate segment/status (allowed values: VIP, LOYAL, REGULAR, AT_RISK, INACTIVE, LOST, NEW)
        let rfmSegment = 'NEW';
        if (segmentVal) {
          const normSeg = String(segmentVal).toUpperCase().trim().replace(/[\s_-]/g, '');
          const allowedSegments = ['VIP', 'LOYAL', 'REGULAR', 'AT_RISK', 'INACTIVE', 'LOST', 'NEW'];
          if (allowedSegments.includes(normSeg)) {
            rfmSegment = normSeg;
          } else if (normSeg === 'ACTIVE') {
            rfmSegment = 'REGULAR';
          }
        }

        // Parse and validate loyalty tier (allowed values: BRONZE, SILVER, GOLD, DIAMOND)
        let loyaltyTier = 'BRONZE';
        if (tierVal) {
          const normTier = String(tierVal).toUpperCase().trim().replace(/[\s_-]/g, '');
          const allowedTiers = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
          if (allowedTiers.includes(normTier)) {
            loyaltyTier = normTier;
          }
        }

        const customer = new Customer({
          userId: req.user.id,
          firstName,
          lastName: lastName || undefined,
          email: emailVal ? String(emailVal).trim() : undefined,
          phone: normalizedNumber,
          whatsappNumber: normalizedNumber,
          instagramHandle: instagramHandleVal ? String(instagramHandleVal).trim() : undefined,
          language: languageVal ? String(languageVal).trim() : 'en',
          location: addressVal ? { address: String(addressVal).trim(), country: 'India' } : undefined,
          rfmSegment,
          loyaltyTier,
          importedAt: new Date(),
          optedIn: {
            whatsapp: true,
            instagram: true,
            sms: true,
            email: true
          }
        });

        await customer.save();
        imported++;
      } catch (error) {
        errors.push(`Line ${lineNum}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to delete upload file:', err);
    }

    res.json({
      message: 'Import completed',
      imported,
      skipped,
      errors: errors.length,
      errorDetails: errors
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
