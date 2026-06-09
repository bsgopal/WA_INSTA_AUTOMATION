// renic-automation-backend/routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Workflow = require('../models/Workflow');
const { body, validationResult } = require('express-validator');

// ============ GET ALL CATEGORIES BY TYPE ============
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type
    const validTypes = ['workflow', 'campaign', 'template', 'customer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const categories = await Category.find({ 
      userId: req.user.id,
      type: type
    }).sort({ createdAt: -1 });

    res.json(categories);
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============ CREATE CATEGORY ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['workflow', 'campaign', 'template', 'customer']),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if category with same name already exists for this user and type
    const existingCategory = await Category.findOne({
      userId: req.user.id,
      name: req.body.name,
      type: req.body.type
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = new Category({
      ...req.body,
      userId: req.user.id
    });

    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ============ UPDATE CATEGORY ============
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// ============ DELETE CATEGORY ============
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove category from all workflows
    await Workflow.updateMany(
      { category: req.params.id },
      { $unset: { category: 1 } }
    );

    // Delete the category
    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ GET CATEGORIES WITH COUNTS ============
router.get('/:type/with-counts', async (req, res) => {
  try {
    const { type } = req.params;
    
    const validTypes = ['workflow', 'campaign', 'template', 'customer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const categories = await Category.find({ 
      userId: req.user.id,
      type: type
    }).sort({ createdAt: -1 });

    // Get counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        let count = 0;
        if (type === 'workflow') {
          count = await Workflow.countDocuments({ category: cat._id });
        }
        return {
          ...cat.toObject(),
          itemCount: count
        };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Get Categories With Counts Error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
