// renic-automation-backend/models/Appointment.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookingRef: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentService',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentStaff',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true,
    index: true
  },
  startTime: {
    type: String, // "HH:mm"
    required: true
  },
  endTime: {
    type: String, // "HH:mm"
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED'],
    default: 'PENDING'
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'CONFIRMED',
    index: true
  },
  bookingSource: {
    type: String,
    enum: ['WHATSAPP_BOT', 'MANUAL_WALK_IN', 'ADMIN_PORTAL', 'WEB_FORM'],
    default: 'WHATSAPP_BOT'
  },
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: String,
  
  reminded24h: {
    type: Boolean,
    default: false
  },
  reminded2h: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

AppointmentSchema.index({ userId: 1, date: 1, staffId: 1 });
AppointmentSchema.index({ userId: 1, bookingRef: 1 }, { unique: true });
AppointmentSchema.index({ userId: 1, status: 1, date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
