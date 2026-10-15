// renic-automation-backend/services/appointmentBotEngine.js
const AppointmentSettings = require('../models/AppointmentSettings');
const AppointmentService = require('../models/AppointmentService');
const AppointmentStaff = require('../models/AppointmentStaff');
const Appointment = require('../models/Appointment');
const BookingSession = require('../models/BookingSession');
const Customer = require('../models/Customer');
const WhatsAppService = require('./WhatsAppService');
const { getAvailableSlots, format12h } = require('./appointmentSlotEngine');

/**
 * Format string with placeholders like {customerName}, {date}, {time}, {staffLabel}, etc.
 */
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
 * Generate unique Human-Friendly Booking Reference
 */
function generateBookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${rand}`;
}

/**
 * Get next N available days (skipping closed business days)
 */
function getUpcomingDates(maxDays = 5) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < maxDays + 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let label = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
    if (i === 0) label += ' (Today)';
    else if (i === 1) label += ' (Tomorrow)';

    dates.push({ dateStr, label, dayIndex: d.getDay() });
    if (dates.length >= maxDays) break;
  }
  return dates;
}

/**
 * Primary Entry Point for WhatsApp Appointment Bot
 */
async function handleAppointmentMessage({ userId, customer, phoneNumber, messageText, interactiveReply, channel = 'whatsapp' }) {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const text = (messageText || '').trim();
    const lowerText = text.toLowerCase();
    const buttonId = interactiveReply?.id || '';

    // 1. Fetch Tenant Appointment Settings
    let settings = await AppointmentSettings.findOne({ userId });
    if (!settings) {
      settings = await AppointmentSettings.create({ userId });
    }

    if (!settings.botEnabled) {
      return { handled: false };
    }

    const t = settings.terminology || {
      businessTypeName: 'Clinic',
      staffLabel: 'Doctor',
      staffLabelPlural: 'Doctors',
      serviceLabel: 'Treatment',
      serviceLabelPlural: 'Treatments',
      clientLabel: 'Patient',
      clientLabelPlural: 'Patients'
    };

    // 2. Fetch or create conversational session
    let session = await BookingSession.findOne({ userId, phone: cleanPhone });

    // Check Trigger keywords or Cancel/Reset commands
    const isReset = ['reset', 'cancel session', 'start over', 'menu', 'main menu'].includes(lowerText);
    if (isReset && session) {
      await BookingSession.deleteOne({ _id: session._id });
      await WhatsAppService.sendMessage(phoneNumber, `🔄 Booking session cancelled. Reply *BOOK* anytime to start a new appointment.`, { userId });
      return { handled: true };
    }

    // Check "MANAGE" or "MY APPOINTMENTS" intent
    const isManageIntent = ['manage', 'my appointments', 'my bookings', 'cancel booking', 'cancel appointment', 'reschedule'].includes(lowerText);
    if (isManageIntent) {
      return handleManageAppointments({ userId, customer, phoneNumber, cleanPhone, settings, t });
    }

    // Check if message is a booking trigger keyword
    const triggers = settings.botTriggerKeywords || ['book', 'appointment', 'doctor', 'treatment', 'slot', 'booking', 'schedule', 'consult'];
    const isTriggerWord = triggers.some(kw => lowerText.includes(kw.toLowerCase())) || buttonId.startsWith('apt_') || buttonId.startsWith('book_');

    if (!session) {
      if (!isTriggerWord) {
        return { handled: false };
      }
      // Start new booking session
      session = await BookingSession.create({
        userId,
        phone: cleanPhone,
        channel: channel.toUpperCase(),
        step: 'SELECT_SERVICE',
        lastInteractionAt: new Date()
      });
      return promptSelectService({ userId, phoneNumber, settings, t, session });
    }

    // Update last interaction timestamp
    session.lastInteractionAt = new Date();

    // Route based on current state machine step
    switch (session.step) {
      case 'SELECT_SERVICE':
        return handleSelectServiceStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      case 'SELECT_STAFF':
        return handleSelectStaffStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      case 'SELECT_DATE':
        return handleSelectDateStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      case 'SELECT_SLOT':
        return handleSelectSlotStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      case 'CONFIRMATION':
        return handleConfirmationStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      case 'MANAGE_OPTIONS':
        return handleManageOptionsStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session });

      default:
        session.step = 'SELECT_SERVICE';
        await session.save();
        return promptSelectService({ userId, phoneNumber, settings, t, session });
    }
  } catch (error) {
    console.error('❌ Error in handleAppointmentMessage:', error);
    return { handled: false, error: error.message };
  }
}

/**
 * Step 1: Prompt Service Selection
 */
async function promptSelectService({ userId, phoneNumber, settings, t, session }) {
  const services = await AppointmentService.find({ userId, isActive: true }).sort({ orderIndex: 1, name: 1 });
  
  if (services.length === 0) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ We are currently updating our ${t.serviceLabelPlural} list. Please contact support or try again later.`, { userId });
    await BookingSession.deleteOne({ _id: session._id });
    return { handled: true };
  }

  session.tempData = { ...(session.tempData || {}), serviceList: services.map(s => ({ id: s._id.toString(), name: s.name, price: s.price, duration: s.durationMinutes })) };
  await session.save();

  let msg = `👋 *Schedule your ${t.serviceLabel}*\n\nPlease choose a ${t.serviceLabel} by replying with the number:\n\n`;
  services.forEach((s, idx) => {
    const priceStr = s.price > 0 ? ` - ₹${s.price}` : '';
    msg += `*${idx + 1}*. ${s.name} (${s.durationMinutes} mins${priceStr})\n`;
  });
  msg += `\n_Reply with 1-${services.length} or type 'RESET' to cancel._`;

  await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
  return { handled: true };
}

/**
 * Handle Service Selection
 */
async function handleSelectServiceStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const serviceList = session.tempData?.serviceList || [];
  let selected = null;

  const num = parseInt(text.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= serviceList.length) {
    selected = serviceList[num - 1];
  } else {
    // Try matching by name
    selected = serviceList.find(s => s.name.toLowerCase().includes(text.toLowerCase()));
  }

  if (!selected) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ Please select a valid ${t.serviceLabel} number between 1 and ${serviceList.length}.`, { userId });
    return { handled: true };
  }

  session.selectedServiceId = selected.id;
  session.step = 'SELECT_STAFF';
  await session.save();

  return promptSelectStaff({ userId, phoneNumber, settings, t, session, serviceId: selected.id });
}

/**
 * Step 2: Prompt Staff Selection
 */
async function promptSelectStaff({ userId, phoneNumber, settings, t, session, serviceId }) {
  // Find staff offering this service
  const staffMembers = await AppointmentStaff.find({
    userId,
    isActive: true,
    $or: [
      { servicesOffered: { $in: [serviceId] } },
      { servicesOffered: { $exists: true, $size: 0 } } // Offers all
    ]
  }).sort({ name: 1 });

  if (staffMembers.length === 0) {
    // If no specific staff, check any active staff
    const allStaff = await AppointmentStaff.find({ userId, isActive: true }).sort({ name: 1 });
    if (allStaff.length > 0) {
      staffMembers.push(...allStaff);
    }
  }

  if (staffMembers.length === 0) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ No ${t.staffLabelPlural} available for this service right now. Please try another option.`, { userId });
    session.step = 'SELECT_SERVICE';
    await session.save();
    return promptSelectService({ userId, phoneNumber, settings, t, session });
  }

  session.tempData = {
    ...session.tempData,
    staffList: staffMembers.map(st => ({ id: st._id.toString(), name: st.name, designation: st.designation }))
  };
  await session.save();

  let msg = `👨‍⚕️ *Choose your preferred ${t.staffLabel}*\n\n`;
  staffMembers.forEach((st, idx) => {
    msg += `*${idx + 1}*. ${st.name} _(${st.designation || t.staffLabel})_\n`;
  });
  if (staffMembers.length > 1) {
    msg += `*${staffMembers.length + 1}*. Any Available ${t.staffLabel}\n`;
  }
  msg += `\n_Reply with the number (e.g. 1) to proceed._`;

  await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
  return { handled: true };
}

/**
 * Handle Staff Selection
 */
async function handleSelectStaffStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const staffList = session.tempData?.staffList || [];
  let selectedStaff = null;

  const num = parseInt(text.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= staffList.length) {
    selectedStaff = staffList[num - 1];
  } else if (num === staffList.length + 1 && staffList.length > 1) {
    // "Any Available" selected: pick first one
    selectedStaff = staffList[0];
  } else {
    selectedStaff = staffList.find(st => st.name.toLowerCase().includes(text.toLowerCase()));
  }

  if (!selectedStaff) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ Please reply with a valid number (1 to ${staffList.length + (staffList.length > 1 ? 1 : 0)}).`, { userId });
    return { handled: true };
  }

  session.selectedStaffId = selectedStaff.id;
  session.step = 'SELECT_DATE';
  await session.save();

  return promptSelectDate({ userId, phoneNumber, settings, t, session });
}

/**
 * Step 3: Prompt Date Selection
 */
async function promptSelectDate({ userId, phoneNumber, settings, t, session }) {
  const upcomingDates = getUpcomingDates(5);
  session.tempData = {
    ...session.tempData,
    dateList: upcomingDates
  };
  await session.save();

  let msg = `📅 *Select an Appointment Date:*\n\n`;
  upcomingDates.forEach((d, idx) => {
    msg += `*${idx + 1}*. ${d.label}\n`;
  });
  msg += `\n_Or type any date as YYYY-MM-DD (e.g. 2026-10-05)_`;

  await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
  return { handled: true };
}

/**
 * Handle Date Selection
 */
async function handleSelectDateStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const dateList = session.tempData?.dateList || [];
  let chosenDate = null;

  const num = parseInt(text.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= dateList.length) {
    chosenDate = dateList[num - 1].dateStr;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    chosenDate = text;
  }

  if (!chosenDate) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ Please select a valid date number (1-${dateList.length}) or format (YYYY-MM-DD).`, { userId });
    return { handled: true };
  }

  session.selectedDate = chosenDate;
  session.step = 'SELECT_SLOT';
  await session.save();

  return promptSelectSlot({ userId, phoneNumber, settings, t, session, date: chosenDate });
}

/**
 * Step 4: Calculate & Prompt Available Slots
 */
async function promptSelectSlot({ userId, phoneNumber, settings, t, session, date }) {
  const slotRes = await getAvailableSlots({
    userId,
    staffId: session.selectedStaffId,
    serviceId: session.selectedServiceId,
    date
  });

  if (!slotRes.success || !slotRes.slots || slotRes.slots.length === 0) {
    let msg = `😔 *No available slots on ${date}* for ${slotRes.staffName || t.staffLabel}.\n\n`;
    if (slotRes.message) msg += `_${slotRes.message}_\n\n`;
    msg += `Please reply with another date number or date (YYYY-MM-DD).`;
    session.step = 'SELECT_DATE';
    await session.save();
    await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
    return { handled: true };
  }

  // Limit to maximum 12 slots for clean WhatsApp display
  const displaySlots = slotRes.slots.slice(0, 12);
  session.tempData = {
    ...session.tempData,
    slotList: displaySlots,
    staffName: slotRes.staffName,
    serviceName: slotRes.serviceName
  };
  await session.save();

  let msg = `⏰ *Available Time Slots on ${date}*\n`;
  msg += `👨‍⚕️ ${t.staffLabel}: *${slotRes.staffName}*\n`;
  msg += `🩺 ${t.serviceLabel}: *${slotRes.serviceName}*\n\n`;
  msg += `Please reply with the slot number:\n\n`;

  displaySlots.forEach((slot, idx) => {
    msg += `*${idx + 1}*. ${slot.formatted}\n`;
  });

  msg += `\n_Reply 1-${displaySlots.length} to pick a slot._`;
  await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
  return { handled: true };
}

/**
 * Handle Slot Selection
 */
async function handleSelectSlotStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const slotList = session.tempData?.slotList || [];
  const num = parseInt(text.replace(/\D/g, ''), 10);
  let selectedSlot = null;

  if (!isNaN(num) && num >= 1 && num <= slotList.length) {
    selectedSlot = slotList[num - 1];
  }

  if (!selectedSlot) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ Please reply with a valid slot number (1-${slotList.length}).`, { userId });
    return { handled: true };
  }

  session.selectedSlot = {
    startTime: selectedSlot.startTime,
    endTime: selectedSlot.endTime
  };
  session.step = 'CONFIRMATION';
  await session.save();

  const clientName = customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : 'Valued Customer';
  let confirmMsg = `📋 *Please Confirm Your Appointment Details:*\n\n`;
  confirmMsg += `👤 *${t.clientLabel}:* ${clientName} (${phoneNumber})\n`;
  confirmMsg += `👨‍⚕️ *${t.staffLabel}:* ${session.tempData?.staffName}\n`;
  confirmMsg += `🩺 *${t.serviceLabel}:* ${session.tempData?.serviceName}\n`;
  confirmMsg += `📅 *Date:* ${session.selectedDate}\n`;
  confirmMsg += `⏰ *Time:* ${selectedSlot.formatted}\n\n`;
  confirmMsg += `Reply:\n*1*. ✅ Confirm Booking\n*2*. ❌ Cancel`;

  await WhatsAppService.sendMessage(phoneNumber, confirmMsg, { userId });
  return { handled: true };
}

/**
 * Step 5: Finalize Booking & Send Notifications
 */
async function handleConfirmationStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const isConfirm = ['1', 'yes', 'confirm', 'ok', 'sure', 'y'].includes(text.toLowerCase());
  const isCancel = ['2', 'no', 'cancel', 'n'].includes(text.toLowerCase());

  if (isCancel) {
    await BookingSession.deleteOne({ _id: session._id });
    await WhatsAppService.sendMessage(phoneNumber, `❌ Booking cancelled. Whenever you're ready, reply *BOOK* to try again!`, { userId });
    return { handled: true };
  }

  if (!isConfirm) {
    await WhatsAppService.sendMessage(phoneNumber, `Please reply *1* to Confirm or *2* to Cancel.`, { userId });
    return { handled: true };
  }

  // Double check conflict before inserting
  const slotRes = await getAvailableSlots({
    userId,
    staffId: session.selectedStaffId,
    serviceId: session.selectedServiceId,
    date: session.selectedDate
  });

  const isStillFree = slotRes.slots?.some(s => s.startTime === session.selectedSlot.startTime);
  if (!isStillFree) {
    await WhatsAppService.sendMessage(phoneNumber, `⚠️ This time slot was just booked by another customer. Please choose a different slot.`, { userId });
    session.step = 'SELECT_SLOT';
    await session.save();
    return promptSelectSlot({ userId, phoneNumber, settings, t, session, date: session.selectedDate });
  }

  // Create Appointment
  const service = await AppointmentService.findById(session.selectedServiceId);
  const staff = await AppointmentStaff.findById(session.selectedStaffId);
  const bookingRef = generateBookingRef();
  const clientName = customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : 'Valued Customer';

  const appointment = await Appointment.create({
    userId,
    bookingRef,
    customerId: customer?._id,
    customerName: clientName,
    customerPhone: phoneNumber,
    customerEmail: customer?.email || '',
    serviceId: service._id,
    serviceName: service.name,
    staffId: staff._id,
    staffName: staff.name,
    date: session.selectedDate,
    startTime: session.selectedSlot.startTime,
    endTime: session.selectedSlot.endTime,
    durationMinutes: service.durationMinutes,
    price: service.price,
    status: 'CONFIRMED',
    bookingSource: 'WHATSAPP_BOT'
  });

  // Update Customer Metrics
  if (customer) {
    customer.totalAppointments = (customer.totalAppointments || 0) + 1;
    customer.lastAppointmentDate = new Date();
    await customer.save();
  }

  // Clear Booking Session
  await BookingSession.deleteOne({ _id: session._id });

  // 1. Send Customer Confirmation Message
  const formattedTime = `${format12h(appointment.startTime)} - ${format12h(appointment.endTime)}`;
  const confirmationMsg = interpolate(settings.confirmationTemplate, {
    customerName: clientName,
    date: appointment.date,
    time: formattedTime,
    staffLabel: t.staffLabel,
    staffName: staff.name,
    serviceLabel: t.serviceLabel,
    serviceName: service.name,
    bookingRef: appointment.bookingRef,
    businessName: t.businessTypeName || 'Our Clinic',
    address: 'Main Branch',
    contactPhone: staff.phone || ''
  });

  await WhatsAppService.sendMessage(phoneNumber, confirmationMsg, { userId });

  // 2. Send Instant Alert to Staff Member if WhatsApp alert number configured
  if (staff.notifyOnBooking && staff.whatsappAlertNumber) {
    const staffAlertMsg = interpolate(settings.staffAlertTemplate, {
      clientLabel: t.clientLabel,
      customerName: clientName,
      customerPhone: phoneNumber,
      date: appointment.date,
      time: formattedTime,
      serviceLabel: t.serviceLabel,
      serviceName: service.name,
      bookingRef: appointment.bookingRef
    });

    try {
      await WhatsAppService.sendMessage(staff.whatsappAlertNumber, staffAlertMsg, { userId });
      console.log(`✅ Dispatched staff appointment alert to ${staff.name} (${staff.whatsappAlertNumber})`);
    } catch (sErr) {
      console.warn(`Could not deliver WhatsApp alert to staff:`, sErr.message);
    }
  }

  return { handled: true, appointmentId: appointment._id };
}

/**
 * Handle Manage Appointments Intent
 */
async function handleManageAppointments({ userId, customer, phoneNumber, cleanPhone, settings, t }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = await Appointment.find({
    userId,
    customerPhone: phoneNumber,
    date: { $gte: todayStr },
    status: { $in: ['CONFIRMED', 'PENDING'] }
  }).sort({ date: 1, startTime: 1 }).limit(3);

  if (upcoming.length === 0) {
    await WhatsAppService.sendMessage(phoneNumber, `ℹ️ You have no upcoming appointments. Reply *BOOK* to schedule a new visit.`, { userId });
    return { handled: true };
  }

  let session = await BookingSession.findOne({ userId, phone: cleanPhone });
  if (session) await BookingSession.deleteOne({ _id: session._id });

  session = await BookingSession.create({
    userId,
    phone: cleanPhone,
    step: 'MANAGE_OPTIONS',
    tempData: {
      manageList: upcoming.map(u => ({ id: u._id.toString(), ref: u.bookingRef, date: u.date, time: u.startTime, service: u.serviceName, staff: u.staffName }))
    }
  });

  let msg = `📅 *Your Upcoming Appointments:*\n\n`;
  upcoming.forEach((apt, idx) => {
    msg += `*${idx + 1}*. #${apt.bookingRef} - ${apt.serviceName} with ${apt.staffName} on ${apt.date} at ${format12h(apt.startTime)}\n`;
  });
  msg += `\nTo cancel an appointment, reply with *CANCEL 1* (or matching number).\nReply *RESET* to exit.`;

  await WhatsAppService.sendMessage(phoneNumber, msg, { userId });
  return { handled: true };
}

/**
 * Handle Manage Options Step
 */
async function handleManageOptionsStep({ userId, customer, phoneNumber, text, buttonId, settings, t, session }) {
  const list = session.tempData?.manageList || [];
  const lower = text.toLowerCase();

  if (lower.startsWith('cancel')) {
    const num = parseInt(lower.replace(/\D/g, ''), 10) || 1;
    const target = list[num - 1];
    if (target) {
      const apt = await Appointment.findById(target.id);
      if (apt) {
        apt.status = 'CANCELLED';
        apt.cancellationReason = 'Cancelled by customer via WhatsApp';
        apt.cancelledAt = new Date();
        apt.cancelledBy = 'CUSTOMER';
        await apt.save();

        await BookingSession.deleteOne({ _id: session._id });
        await WhatsAppService.sendMessage(phoneNumber, `✅ Appointment #${apt.bookingRef} has been successfully cancelled.`, { userId });
        return { handled: true };
      }
    }
  }

  await BookingSession.deleteOne({ _id: session._id });
  await WhatsAppService.sendMessage(phoneNumber, `Session finished. Reply *BOOK* whenever you'd like to schedule an appointment.`, { userId });
  return { handled: true };
}

module.exports = {
  handleAppointmentMessage
};
