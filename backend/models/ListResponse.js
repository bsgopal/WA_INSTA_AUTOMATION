// renic-automation-backend/models/ListResponse.js
const mongoose = require('mongoose');

const ListItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  rowNumber: {
    type: Number,
    required: false,
    min: 1
  },
  responseText: {
    type: String,
    required: false
  },
  linkedQuickReplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuickReply',
    required: false
  },
  buttonType: {
    type: String,
    enum: ['QUICK_REPLY', 'OPEN_URL', 'CALL_PHONE', 'CUSTOM_TRIGGER'],
    required: false
  },
  buttonValue: {
    type: String,
    required: false
  }
});

const ListResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  listItems: [ListItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

ListResponseSchema.index({ userId: 1 });
ListResponseSchema.index({ isActive: 1 });

module.exports = mongoose.model('ListResponse', ListResponseSchema);
