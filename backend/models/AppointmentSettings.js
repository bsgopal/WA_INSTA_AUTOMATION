// renic-automation-backend/models/AppointmentSettings.js
const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  startTime: { type: String, default: '09:00' }, // "HH:mm" 24h format
  endTime: { type: String, default: '13:00' }
}, { _id: false });

const BreakSchema = new mongoose.Schema({
  startTime: { type: String, default: '13:00' },
  endTime: { type: String, default: '14:00' },
  name: { type: String, default: 'Lunch Break' }
}, { _id: false });

const DayScheduleSchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: true },
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

const AppointmentSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Custom business terminology (Dynamic labels)
  terminology: {
    businessType: { type: String, default: 'HEALTHCARE' }, // e.g., 'HEALTHCARE', 'SALON_SPA', 'AUTO_WORKSHOP', 'CONSULTANCY', 'CUSTOM'
    businessTypeName: { type: String, default: 'Clinic / Hospital' },
    staffLabel: { type: String, default: 'Doctor' }, // e.g. "Doctor", "Stylist", "Therapist", "Mechanic", "Consultant"
    staffLabelPlural: { type: String, default: 'Doctors' },
    serviceLabel: { type: String, default: 'Treatment / Consultation' }, // e.g. "Treatment", "Haircut & Spa", "Service", "Session"
    serviceLabelPlural: { type: String, default: 'Treatments / Services' },
    clientLabel: { type: String, default: 'Patient' }, // e.g. "Patient", "Guest", "Client", "Vehicle Owner"
    clientLabelPlural: { type: String, default: 'Patients' }
  },

  // Operating Schedule
  operatingSchedule: {
    monday: { type: DayScheduleSchema, default: () => ({}) },
    tuesday: { type: DayScheduleSchema, default: () => ({}) },
    wednesday: { type: DayScheduleSchema, default: () => ({}) },
    thursday: { type: DayScheduleSchema, default: () => ({}) },
    friday: { type: DayScheduleSchema, default: () => ({}) },
    saturday: { type: DayScheduleSchema, default: () => ({}) },
    sunday: {
      type: DayScheduleSchema,
      default: () => ({
        isOpen: false,
        shifts: [],
        breaks: []
      })
    }
  },

  // Slot Calculation & Rules
  slotIntervalMinutes: { type: Number, default: 30, enum: [15, 20, 30, 45, 60, 90, 120] },
  bufferMinutesBetweenSlots: { type: Number, default: 5 },
  maxAdvanceBookingDays: { type: Number, default: 30 },
  minAdvanceBookingHours: { type: Number, default: 1 },
  allowSameDayBooking: { type: Boolean, default: true },
  autoConfirmOnlineBookings: { type: Boolean, default: true },

  // WhatsApp Bot Settings
  botEnabled: { type: Boolean, default: true },
  botTriggerKeywords: {
    type: [String],
    default: ['book', 'appointment', 'doctor', 'treatment', 'slot', 'booking', 'schedule', 'consult']
  },
  welcomeMessage: {
    type: String,
    default: '👋 Welcome to {businessName}! I can help you schedule your appointment with our {staffLabelPlural}. Please choose an option below:'
  },
  confirmationTemplate: {
    type: String,
    default: '✅ *Appointment Confirmed!*\n\n📅 Date: {date}\n⏰ Time: {time}\n👨‍⚕️ {staffLabel}: {staffName}\n🩺 {serviceLabel}: {serviceName}\n🆔 Booking ID: #{bookingRef}\n\n📍 Address: {address}\n\nTo cancel or reschedule, reply *MANAGE* or call {contactPhone}.'
  },
  staffAlertTemplate: {
    type: String,
    default: '🔔 *New Appointment Booked!*\n\n👤 {clientLabel}: {customerName} ({customerPhone})\n📅 Date: {date}\n⏰ Time: {time}\n🩺 {serviceLabel}: {serviceName}\n🆔 Ref: #{bookingRef}'
  },
  reminder24hEnabled: { type: Boolean, default: true },
  reminder24hTemplate: {
    type: String,
    default: '⏰ *Reminder:* Your appointment is scheduled for tomorrow!\n\n📅 Date: {date}\n⏰ Time: {time}\n👨‍⚕️ {staffLabel}: {staffName}\n🩺 {serviceLabel}: {serviceName}\n\nSee you soon at {businessName}!'
  },
  reminder2hEnabled: { type: Boolean, default: true },
  reminder2hTemplate: {
    type: String,
    default: '⏰ *Reminder:* Your appointment is in 2 hours!\n\n⏰ Time: {time}\n👨‍⚕️ {staffLabel}: {staffName}\n📍 {businessName}'
  },

  // Cancellation & Reschedule Rules
  cancellationAllowed: { type: Boolean, default: true },
  minHoursBeforeCancellation: { type: Number, default: 2 },
  
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AppointmentSettings', AppointmentSettingsSchema);
