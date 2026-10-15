// renic-automation-backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const AppointmentSettings = require('../models/AppointmentSettings');
const AppointmentService = require('../models/AppointmentService');
const AppointmentStaff = require('../models/AppointmentStaff');
const Customer = require('../models/Customer');
const WhatsAppService = require('../services/WhatsAppService');
const { getAvailableSlots, format12h } = require('../services/appointmentSlotEngine');

/**
 * GET /api/appointments - List appointments with filters
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { date, startDate, endDate, staffId, serviceId, status, search, page = 1, limit = 50 } = req.query;

    const filter = { userId };

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (staffId) filter.staffId = staffId;
    if (serviceId) filter.serviceId = serviceId;
    if (status && status !== 'ALL') filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { bookingRef: searchRegex },
        { staffName: searchRegex },
        { serviceName: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/appointments/stats - Telemetry and summary KPIs
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const todayStr = new Date().toISOString().split('T')[0];

    const [todayCount, todayConfirmed, todayCompleted, upcomingTotal, allCompleted, allNoShow] = await Promise.all([
      Appointment.countDocuments({ userId, date: todayStr }),
      Appointment.countDocuments({ userId, date: todayStr, status: { $in: ['CONFIRMED', 'IN_PROGRESS'] } }),
      Appointment.countDocuments({ userId, date: todayStr, status: 'COMPLETED' }),
      Appointment.countDocuments({ userId, date: { $gte: todayStr }, status: 'CONFIRMED' }),
      Appointment.countDocuments({ userId, status: 'COMPLETED' }),
      Appointment.countDocuments({ userId, status: 'NO_SHOW' })
    ]);

    res.json({
      success: true,
      stats: {
        todayCount,
        todayConfirmed,
        todayCompleted,
        upcomingTotal,
        allCompleted,
        allNoShow
      }
    });
  } catch (err) {
    console.error('Error fetching appointment stats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/appointments/slots - Calculate conflict-free available slots
 */
router.get('/slots', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { staffId, serviceId, date } = req.query;

    if (!staffId || !serviceId || !date) {
      return res.status(400).json({ success: false, message: 'staffId, serviceId, and date (YYYY-MM-DD) are required.' });
    }

    const result = await getAvailableSlots({ userId, staffId, serviceId, date });
    res.json(result);
  } catch (err) {
    console.error('Error calculating slots:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/appointments - Manual / Walk-In booking creation
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      date,
      startTime,
      notes,
      bookingSource = 'MANUAL_WALK_IN'
    } = req.body;

    if (!customerName || !customerPhone || !serviceId || !staffId || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
    }

    const [service, staff, settings] = await Promise.all([
      AppointmentService.findOne({ _id: serviceId, userId }),
      AppointmentStaff.findOne({ _id: staffId, userId }),
      AppointmentSettings.findOne({ userId })
    ]);

    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    // Calculate endTime
    const [h, m] = startTime.split(':').map(Number);
    const totalStartMins = h * 60 + m;
    const totalEndMins = totalStartMins + (service.durationMinutes || 30);
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Generate reference
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const bookingRef = `BK-${rand}`;

    // Find or create customer
    let customer = await Customer.findOne({ userId, phone: customerPhone });
    if (!customer) {
      const parts = customerName.trim().split(/\s+/);
      customer = await Customer.create({
        userId,
        firstName: parts[0] || customerName,
        lastName: parts.slice(1).join(' ') || '',
        phone: customerPhone,
        whatsappNumber: customerPhone,
        email: customerEmail || undefined,
        totalAppointments: 1,
        lastAppointmentDate: new Date()
      });
    } else {
      customer.totalAppointments = (customer.totalAppointments || 0) + 1;
      customer.lastAppointmentDate = new Date();
      await customer.save();
    }

    const appointment = await Appointment.create({
      userId,
      bookingRef,
      customerId: customer._id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      serviceId: service._id,
      serviceName: service.name,
      staffId: staff._id,
      staffName: staff.name,
      date,
      startTime,
      endTime,
      durationMinutes: service.durationMinutes,
      price: service.price || 0,
      status: 'CONFIRMED',
      bookingSource,
      notes
    });

    // Dispatch WhatsApp confirmation if number provided
    if (customerPhone && req.body.sendWhatsAppNotification !== false) {
      try {
        const t = settings?.terminology || {};
        const confMsg = `✅ *Appointment Confirmed!*\n\n👤 ${t.clientLabel || 'Patient'}: ${customerName}\n👨‍⚕️ ${t.staffLabel || 'Doctor'}: ${staff.name}\n🩺 ${t.serviceLabel || 'Treatment'}: ${service.name}\n📅 Date: ${date}\n⏰ Time: ${format12h(startTime)} - ${format12h(endTime)}\n🆔 Ref: #${bookingRef}\n\nWe look forward to welcoming you!`;
        await WhatsAppService.sendMessage(customerPhone, confMsg, { userId });
      } catch (wErr) {
        console.warn('Could not dispatch walk-in confirmation WhatsApp:', wErr.message);
      }
    }

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    console.error('Error creating manual appointment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/appointments/:id/status - Update appointment status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { status, cancellationReason } = req.body;

    const appointment = await Appointment.findOne({ _id: req.params.id, userId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = status;
    if (status === 'CANCELLED') {
      appointment.cancellationReason = cancellationReason || 'Cancelled by staff';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = 'STAFF';
    } else if (status === 'COMPLETED') {
      if (appointment.customerId) {
        await Customer.findByIdAndUpdate(appointment.customerId, {
          $inc: { completedVisits: 1 }
        });
      }
    } else if (status === 'NO_SHOW') {
      if (appointment.customerId) {
        await Customer.findByIdAndUpdate(appointment.customerId, {
          $inc: { noShowCount: 1 }
        });
      }
    }

    await appointment.save();
    res.json({ success: true, appointment });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/appointments/:id - Delete appointment record
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const deleted = await Appointment.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
