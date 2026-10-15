// renic-automation-backend/models/BookingSession.js
const mongoose = require('mongoose');

const BookingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['WHATSAPP', 'INSTAGRAM'],
    default: 'WHATSAPP'
  },
  step: {
    type: String,
    enum: [
      'IDLE',
      'SELECT_SERVICE',
      'SELECT_STAFF',
      'SELECT_DATE',
      'SELECT_SLOT',
      'CONFIRMATION',
      'MANAGE_OPTIONS',
      'CANCEL_REASON'
    ],
    default: 'IDLE'
  },
  selectedServiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentService'
  },
  selectedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentStaff'
  },
  selectedDate: String, // "YYYY-MM-DD"
  selectedSlot: {
    startTime: String, // "HH:mm"
    endTime: String
  },
  tempData: mongoose.Schema.Types.Mixed,
  lastInteractionAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Auto-expire session after 30 minutes of inactivity
BookingSessionSchema.index({ lastInteractionAt: 1 }, { expireAfterSeconds: 1800 });
BookingSessionSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('BookingSession', BookingSessionSchema);
