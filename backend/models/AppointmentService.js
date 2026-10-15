// renic-automation-backend/models/AppointmentService.js
const mongoose = require('mongoose');

const AppointmentServiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 30,
    min: 5,
    max: 480
  },
  bufferAfterMinutes: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  colorCode: {
    type: String,
    default: '#10b981'
  }
}, { timestamps: true });

AppointmentServiceSchema.index({ userId: 1, isActive: 1 });
AppointmentServiceSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('AppointmentService', AppointmentServiceSchema);
