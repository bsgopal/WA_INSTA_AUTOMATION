// renic-automation-backend/services/appointmentSlotEngine.js
const AppointmentSettings = require('../models/AppointmentSettings');
const AppointmentService = require('../models/AppointmentService');
const AppointmentStaff = require('../models/AppointmentStaff');
const Appointment = require('../models/Appointment');

/**
 * Convert "HH:mm" string to minutes since midnight (0..1439)
 */
function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes since midnight back to "HH:mm"
 */
function minutesToTime(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format "HH:mm" to "12-hour AM/PM" format
 */
function format12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${mStr} ${ampm}`;
}

/**
 * Check if two time ranges [startA, endA) and [startB, endB) overlap
 */
function isOverlapping(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Calculate Conflict-Free Available Slots for a given staff, service, and date
 */
async function getAvailableSlots({ userId, staffId, serviceId, date }) {
  // 1. Fetch Settings, Service, and Staff
  const [settings, service, staff] = await Promise.all([
    AppointmentSettings.findOne({ userId }),
    AppointmentService.findOne({ _id: serviceId, userId }),
    AppointmentStaff.findOne({ _id: staffId, userId })
  ]);

  if (!service || !service.isActive) {
    return { success: false, message: 'Service not found or inactive', slots: [] };
  }

  if (!staff || !staff.isActive) {
    return { success: false, message: 'Staff member not found or inactive', slots: [] };
  }

  // Check if staff offers this service
  if (staff.servicesOffered && staff.servicesOffered.length > 0) {
    const offersService = staff.servicesOffered.some(sId => sId.toString() === serviceId.toString());
    if (!offersService) {
      return { success: false, message: 'This staff does not offer the requested service', slots: [] };
    }
  }

  // 2. Check Date validity
  const targetDate = new Date(`${date}T00:00:00`);
  if (isNaN(targetDate.getTime())) {
    return { success: false, message: 'Invalid date format (expected YYYY-MM-DD)', slots: [] };
  }

  // Days of week index
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = daysOfWeek[targetDate.getDay()];

  // Check Staff Leave Dates
  if (staff.leaveDates && staff.leaveDates.some(l => l.date === date)) {
    return { success: true, message: 'Staff is on leave for the selected date', slots: [] };
  }

  // Check Business Operating Hours
  const bizSchedule = settings?.operatingSchedule?.[dayName] || { isOpen: true, shifts: [{ startTime: '09:00', endTime: '20:00' }], breaks: [] };
  if (!bizSchedule.isOpen) {
    return { success: true, message: 'Business is closed on this day', slots: [] };
  }

  // Check Staff Weekly Schedule
  const staffSchedule = staff.weeklySchedule?.[dayName] || { isWorking: true, shifts: [{ startTime: '09:00', endTime: '20:00' }], breaks: [] };
  if (!staffSchedule.isWorking) {
    return { success: true, message: 'Staff is not working on this day', slots: [] };
  }

  // Service duration + buffer time
  const bufferMinutes = settings?.bufferMinutesBetweenSlots || 0;
  const slotDuration = service.durationMinutes || settings?.slotIntervalMinutes || 30;
  const totalOccupancyMinutes = slotDuration + bufferMinutes;

  // 3. Collect Breaks (Staff breaks + Business breaks)
  const allBreaks = [
    ...(bizSchedule.breaks || []),
    ...(staffSchedule.breaks || [])
  ].map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime)
  }));

  // 4. Fetch Existing Appointments on that Date for this Staff
  const existingBookings = await Appointment.find({
    userId,
    staffId,
    date,
    status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
  }).lean();

  const bookedIntervals = existingBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime)
  }));

  // 5. Current time threshold for same-day bookings
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === todayStr;
  const minAdvanceHours = settings?.minAdvanceBookingHours || 0;
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes() + (minAdvanceHours * 60);

  // 6. Generate Candidate Slots across all Staff shifts
  const availableSlots = [];
  const shiftsToUse = (staffSchedule.shifts && staffSchedule.shifts.length > 0)
    ? staffSchedule.shifts
    : [{ startTime: '09:00', endTime: '18:00' }];

  for (const shift of shiftsToUse) {
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    let candidateStart = shiftStart;
    while (candidateStart + slotDuration <= shiftEnd) {
      const candidateEnd = candidateStart + slotDuration;

      // Skip past times if today
      if (isToday && candidateStart < currentMinutesToday) {
        candidateStart += (settings?.slotIntervalMinutes || 30);
        continue;
      }

      // Check break collision
      const collidesWithBreak = allBreaks.some(brk =>
        isOverlapping(candidateStart, candidateEnd, brk.start, brk.end)
      );

      // Check existing appointment collision
      const collidesWithBooking = bookedIntervals.some(b =>
        isOverlapping(candidateStart, candidateEnd, b.start, b.end)
      );

      if (!collidesWithBreak && !collidesWithBooking) {
        const startStr = minutesToTime(candidateStart);
        const endStr = minutesToTime(candidateEnd);

        availableSlots.push({
          startTime: startStr,
          endTime: endStr,
          formatted: `${format12h(startStr)} - ${format12h(endStr)}`,
          displayLabel: format12h(startStr),
          durationMinutes: slotDuration
        });
      }

      // Increment by slotIntervalMinutes
      candidateStart += (settings?.slotIntervalMinutes || 30);
    }
  }

  return {
    success: true,
    staffName: staff.name,
    serviceName: service.name,
    date,
    slots: availableSlots
  };
}

module.exports = {
  getAvailableSlots,
  timeToMinutes,
  minutesToTime,
  format12h
};
