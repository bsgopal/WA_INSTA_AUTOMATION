// renic-automation-backend/routes/lists.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Import model - will be created separately
let ListResponse;
try {
  ListResponse = require('../models/ListResponse');
} catch (error) {
  console.warn('ListResponse model not found, will attempt to load dynamically');
}

// Ensure ListResponse is loaded
function getListResponseModel() {
  if (!ListResponse) {
    ListResponse = require('../models/ListResponse');
  }
  return ListResponse;
}

// ============ CREATE NEW LIST RESPONSE ============
router.post('/', [
  body('name').notEmpty().trim().withMessage('List name is required'),
  body('listItems').isArray().withMessage('listItems must be an array'),
  body('listItems.*.title').optional().trim(),
  body('listItems.*.description').optional().trim(),
  body('listItems.*.rowNumber').optional().isInt({ min: 1 }).withMessage('rowNumber must be a positive integer'),
  body('listItems.*.responseText').optional().trim(),
  body('listItems.*.linkedQuickReplyId').optional().trim(),
  body('listItems.*.buttonType').optional().isIn(['QUICK_REPLY', 'OPEN_URL', 'CALL_PHONE', 'CUSTOM_TRIGGER']),
  body('listItems.*.buttonValue').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, listItems } = req.body;
    const Model = getListResponseModel();

    const newList = new Model({
      userId: req.user.id,
      name,
      listItems: listItems || []
    });

    const savedList = await newList.save();
    res.status(201).json(savedList);
  } catch (error) {
    console.error('Create List Error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// ============ GET ALL LIST RESPONSES ============
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const Model = getListResponseModel();

    const lists = await Model.find({ userId: req.user.id })
      .populate('listItems.linkedQuickReplyId', 'name content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Model.countDocuments({ userId: req.user.id });

    res.json({
      data: lists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Lists Error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// ============ GET SPECIFIC LIST RESPONSE ============
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const Model = getListResponseModel();

    const list = await Model.findOne({
      _id: id,
      userId: req.user.id
    }).populate('listItems.linkedQuickReplyId', 'name content');

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json(list);
  } catch (error) {
    console.error('Get List Error:', error);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

// ============ UPDATE LIST RESPONSE ============
router.put('/:id', [
  body('name').optional().notEmpty().trim().withMessage('List name cannot be empty'),
  body('listItems').optional().isArray().withMessage('listItems must be an array'),
  body('listItems.*.title').optional().trim(),
  body('listItems.*.description').optional().trim(),
  body('listItems.*.rowNumber').optional().isInt({ min: 1 }).withMessage('rowNumber must be a positive integer'),
  body('listItems.*.responseText').optional().trim(),
  body('listItems.*.buttonType').optional().isIn(['QUICK_REPLY', 'OPEN_URL', 'CALL_PHONE', 'CUSTOM_TRIGGER']),
  body('listItems.*.buttonValue').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, listItems } = req.body;
    const Model = getListResponseModel();

    const list = await Model.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (name !== undefined) {
      list.name = name;
    }
    if (listItems !== undefined) {
      list.listItems = listItems;
    }

    const updatedList = await list.save();
    res.json(updatedList);
  } catch (error) {
    console.error('Update List Error:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// ============ DELETE LIST RESPONSE ============
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const Model = getListResponseModel();

    const list = await Model.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    await Model.deleteOne({ _id: id });
    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete List Error:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

// ============ HANDLE LIST ITEM SELECTION ============
router.post('/select-item', [
  body('phoneNumber').optional(),
  body('messageBody').notEmpty().withMessage('messageBody is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  body('channel').isIn(['whatsapp', 'instagram', 'sms']).withMessage('channel must be whatsapp, instagram, or sms')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, messageBody, userId, channel } = req.body;
    const Model = getListResponseModel();
    const QuickReply = require('../models/QuickReply');

    // Parse messageBody as a number for row selection
    const rowNumber = parseInt(messageBody.trim(), 10);

    if (isNaN(rowNumber) || rowNumber <= 0) {
      return res.status(400).json({ error: 'Message must be a valid positive number to select a row' });
    }

    // Query ListResponse documents for userId where listItem.rowNumber matches
    const matchingLists = await Model.find({
      userId: userId,
      'listItems.rowNumber': rowNumber
    }).populate('listItems.linkedQuickReplyId', 'name content');

    if (!matchingLists || matchingLists.length === 0) {
      return res.status(404).json({ error: `No list item found with row number ${rowNumber}` });
    }

    // Find the specific matching item from the first matching list
    const selectedList = matchingLists[0];
    const selectedItem = selectedList.listItems.find(
      item => item.rowNumber && item.rowNumber === rowNumber
    );

    if (!selectedItem) {
      return res.status(404).json({ error: 'No matching item found in list' });
    }

    // Merge response text: use linked quick reply content if available, otherwise use responseText
    let finalResponseText = selectedItem.responseText || '';
    if (selectedItem.linkedQuickReplyId) {
      finalResponseText = selectedItem.linkedQuickReplyId.content || selectedItem.responseText || '';
    }

    // Return matching list and selected item with merged response
    res.json({
      list: selectedList,
      selectedItem: {
        ...selectedItem.toObject ? selectedItem.toObject() : selectedItem,
        responseText: finalResponseText,
        linkedQuickReplyName: selectedItem.linkedQuickReplyId?.name || null
      },
      phoneNumber,
      channel
    });
  } catch (error) {
    console.error('Select List Item Error:', error);
    res.status(500).json({ error: 'Failed to process list item selection' });
  }
});

module.exports = router;
