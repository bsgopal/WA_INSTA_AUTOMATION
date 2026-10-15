// renic-automation-backend/services/appointmentReminderCron.js
const Appointment = require('../models/Appointment');
const AppointmentSettings = require('../models/AppointmentSettings');
const WhatsAppService = require('./WhatsAppService');
const { format12h } = require('./appointmentSlotEngine');

function interpolate(templateStr, vars = {}) {
  if (!templateStr) return '';
  let res = templateStr;
  for (const [k, v] of Object.entries(vars)) {
    const reg = new RegExp(`\\{${k}\\}`, 'gi');
    res = res.replace(reg, v !== undefined && v !== null ? String(v) : '');
  }
  return res;
}

/**
 * Dispatch 24-hour and 2-hour reminder WhatsApp alerts
 */
async function processAppointmentReminders() {
  try {
    const now = new Date();
    
    // Target date string for tomorrow (24h reminder)
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    // Target date string for today (2h reminder)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Process 24-Hour Reminders
    const appointments24h = await Appointment.find({
      date: tomorrowStr,
      status: 'CONFIRMED',
      reminded24h: { $ne: true }
    }).limit(50);

    for (const apt of appointments24h) {
      try {
        const settings = await AppointmentSettings.findOne({ userId: apt.userId });
        if (settings && settings.reminder24hEnabled) {
          const t = settings.terminology || {};
          const msg = interpolate(settings.reminder24hTemplate, {
            customerName: apt.customerName,
            date: apt.date,
            time: `${format12h(apt.startTime)} - ${format12h(apt.endTime)}`,
            staffLabel: t.staffLabel || 'Doctor',
            staffName: apt.staffName,
            serviceLabel: t.serviceLabel || 'Treatment',
            serviceName: apt.serviceName,
            businessName: t.businessTypeName || 'Our Clinic',
            bookingRef: apt.bookingRef
          });

          await WhatsAppService.sendMessage(apt.customerPhone, msg, { userId: apt.userId });
          apt.reminded24h = true;
          await apt.save();
          console.log(`⏰ [24h Reminder] Sent to ${apt.customerName} (${apt.customerPhone}) for #${apt.bookingRef}`);
        }
      } catch (e) {
        console.warn(`Failed sending 24h reminder for #${apt.bookingRef}:`, e.message);
      }
    }

    // 2. Process 2-Hour Reminders
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const appointmentsToday = await Appointment.find({
      date: todayStr,
      status: 'CONFIRMED',
      reminded2h: { $ne: true }
    }).limit(50);

    for (const apt of appointmentsToday) {
      try {
        const [h, m] = apt.startTime.split(':').map(Number);
        const aptStartMins = h * 60 + m;
        const diffMins = aptStartMins - currentMins;

        // Trigger if appointment is in 100 to 140 minutes from now (around 2h window)
        if (diffMins >= 60 && diffMins <= 150) {
          const settings = await AppointmentSettings.findOne({ userId: apt.userId });
          if (settings && settings.reminder2hEnabled) {
            const t = settings.terminology || {};
            const msg = interpolate(settings.reminder2hTemplate, {
              customerName: apt.customerName,
              date: apt.date,
              time: `${format12h(apt.startTime)} - ${format12h(apt.endTime)}`,
              staffLabel: t.staffLabel || 'Doctor',
              staffName: apt.staffName,
              serviceLabel: t.serviceLabel || 'Treatment',
              serviceName: apt.serviceName,
              businessName: t.businessTypeName || 'Our Clinic',
              bookingRef: apt.bookingRef
            });

            await WhatsAppService.sendMessage(apt.customerPhone, msg, { userId: apt.userId });
            apt.reminded2h = true;
            await apt.save();
            console.log(`⏰ [2h Reminder] Sent to ${apt.customerName} (${apt.customerPhone}) for #${apt.bookingRef}`);
          }
        }
      } catch (e) {
        console.warn(`Failed sending 2h reminder for #${apt.bookingRef}:`, e.message);
      }
    }
  } catch (error) {
    console.error('Error in processAppointmentReminders cron:', error.message);
  }
}

/**
 * Start reminder background interval (every 10 minutes)
 */
function initAppointmentReminderCron() {
  setInterval(processAppointmentReminders, 10 * 60 * 1000);
  console.log('⏰ Appointment Reminder Cron Initialized (Running every 10 mins)');
}

module.exports = {
  initAppointmentReminderCron,
  processAppointmentReminders
};
