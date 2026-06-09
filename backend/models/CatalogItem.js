const mongoose = require('mongoose');

const CatalogItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['RINGS', 'NECKLACES', 'BANGLES', 'EARRINGS', 'CUSTOM', 'PENDANT', 'NOSE_PINS', 'BRACELET', 'CHAINS', 'GIFTS', 'OTHER'],
    default: 'OTHER'
  },
  price: {
    type: Number,
    required: true // Stored in INR
  },
  description: {
    type: String,
    required: true
  },
  keywords: {
    type: String,
    default: '' // comma-separated keywords for matches
  },
  imageUrl: {
    type: String,
    required: true // Path to the uploaded image on server
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CatalogItem', CatalogItemSchema);
