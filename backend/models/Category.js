// renic-automation-backend/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#2196F3'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  type: {
    type: String,
    enum: ['workflow', 'campaign', 'template', 'customer'],
    required: true
  },
  workflowCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
CategorySchema.index({ userId: 1, type: 1 });
CategorySchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Category', CategorySchema);
