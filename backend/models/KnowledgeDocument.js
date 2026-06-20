// renic-automation-backend/models/KnowledgeDocument.js
const mongoose = require('mongoose');

const KnowledgeDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileType: {
    type: String,
    enum: ['txt', 'pdf', 'csv'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'ACTIVE', 'FAILED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

KnowledgeDocumentSchema.index({ userId: 1 });
KnowledgeDocumentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('KnowledgeDocument', KnowledgeDocumentSchema);
