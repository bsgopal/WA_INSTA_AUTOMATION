// renic-automation-backend/routes/catalog.js
const express = require('express');
const router = express.Router();
const CatalogItem = require('../models/CatalogItem');
const { body, validationResult, query } = require('express-validator');

// ============ GET ALL CATALOG ITEMS ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('search').optional().isString(),
  query('category').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Build query for catalog items belonging to this user
    const queryObj = { userId: req.user.id };

    // Search filter (matches name, description or keywords)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      queryObj.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { keywords: searchRegex }
      ];
    }

    // Category filter
    if (req.query.category && req.query.category !== 'ALL') {
      queryObj.category = req.query.category.toUpperCase();
    }

    const items = await CatalogItem.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CatalogItem.countDocuments(queryObj);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Catalog Error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog items' });
  }
});

// ============ GET CATALOG ITEM BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const item = await CatalogItem.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get Catalog Item Error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog item' });
  }
});

// ============ CREATE CATALOG ITEM ============
router.post('/', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('category').isIn(['RINGS', 'NECKLACES', 'BANGLES', 'EARRINGS', 'CUSTOM', 'OTHER']).withMessage('Invalid category'),
  body('keywords').optional().trim(),
  body('imageUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Provide default image url if not provided
    let imageUrl = req.body.imageUrl || '';
    if (!imageUrl) {
      const cat = req.body.category.toUpperCase();
      if (cat === 'RINGS') imageUrl = '/uploads/catalog/gold_diamond_ring.jpg';
      else if (cat === 'NECKLACES') imageUrl = '/uploads/catalog/bridal_gold_necklace.jpg';
      else if (cat === 'BANGLES') imageUrl = '/uploads/catalog/antique_gold_bangles.jpg';
      else if (cat === 'EARRINGS') imageUrl = '/uploads/catalog/emerald_gold_earrings.jpg';
      else imageUrl = '/uploads/catalog/gold_diamond_ring.jpg';
    }

    const item = new CatalogItem({
      ...req.body,
      imageUrl,
      userId: req.user.id
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Create Catalog Item Error:', error);
    res.status(500).json({ error: 'Failed to create catalog item' });
  }
});

// ============ UPDATE CATALOG ITEM ============
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().notEmpty().trim(),
  body('category').optional().isIn(['RINGS', 'NECKLACES', 'BANGLES', 'EARRINGS', 'CUSTOM', 'OTHER']),
  body('keywords').optional().trim(),
  body('imageUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await CatalogItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Update Catalog Item Error:', error);
    res.status(500).json({ error: 'Failed to update catalog item' });
  }
});

// ============ DELETE CATALOG ITEM ============
router.delete('/:id', async (req, res) => {
  try {
    const item = await CatalogItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    res.json({ message: 'Catalog item deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete Catalog Item Error:', error);
    res.status(500).json({ error: 'Failed to delete catalog item' });
  }
});

module.exports = router;
