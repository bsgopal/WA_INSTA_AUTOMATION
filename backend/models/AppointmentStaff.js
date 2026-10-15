// renic-automation-backend/models/AppointmentStaff.js
const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  startTime: { type: String, default: '09:00' }, // "HH:mm"
  endTime: { type: String, default: '13:00' }
}, { _id: false });

const BreakSchema = new mongoose.Schema({
  startTime: { type: String, default: '13:00' },
  endTime: { type: String, default: '14:00' },
  name: { type: String, default: 'Break' }
}, { _id: false });

const StaffDayScheduleSchema = new mongoose.Schema({
  isWorking: { type: Boolean, default: true },
  shifts: {
    type: [ShiftSchema],
    default: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '16:00', endTime: '20:00' }
    ]
  },
  breaks: {
    type: [BreakSchema],
    default: [
      { startTime: '13:00', endTime: '14:00', name: 'Lunch Break' }
    ]
  }
}, { _id: false });

const AppointmentStaffSchema = new mongoose.Schema({
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
  designation: {
    type: String,
    trim: true,
    default: 'Specialist'
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  whatsappAlertNumber: {
    type: String,
    trim: true
  },
  notifyOnBooking: {
    type: Boolean,
    default: true
  },
  servicesOffered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentService'
  }],
  weeklySchedule: {
    monday: { type: StaffDayScheduleSchema, default: () => ({}) },
    tuesday: { type: StaffDayScheduleSchema, default: () => ({}) },
    wednesday: { type: StaffDayScheduleSchema, default: () => ({}) },
    thursday: { type: StaffDayScheduleSchema, default: () => ({}) },
    friday: { type: StaffDayScheduleSchema, default: () => ({}) },
    saturday: { type: StaffDayScheduleSchema, default: () => ({}) },
    sunday: {
      type: StaffDayScheduleSchema,
      default: () => ({
        isWorking: false,
        shifts: [],
        breaks: []
      })
    }
  },
  leaveDates: [{
    date: { type: String }, // "YYYY-MM-DD"
    reason: { type: String }
  }],
  colorCode: {
    type: String,
    default: '#3b82f6'
  },
  avatarUrl: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

AppointmentStaffSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('AppointmentStaff', AppointmentStaffSchema);
