const express = require('express');
const router = express.Router();
const AppointmentSettings = require('../models/AppointmentSettings');
const AppointmentService = require('../models/AppointmentService');
const AppointmentStaff = require('../models/AppointmentStaff');
const ShopConfig = require('../models/ShopConfig');
const { getModel } = require('../middlewares/tenantContext');

// Helper to get tenant-scoped models
function getModels() {
  try {
    return {
      AppointmentSettingsModel: getModel('AppointmentSettings'),
      AppointmentServiceModel: getModel('AppointmentService'),
      AppointmentStaffModel: getModel('AppointmentStaff'),
      ShopConfigModel: getModel('ShopConfig')
    };
  } catch (e) {
    return {
      AppointmentSettingsModel: AppointmentSettings,
      AppointmentServiceModel: AppointmentService,
      AppointmentStaffModel: AppointmentStaff,
      ShopConfigModel: ShopConfig
    };
  }
}

// ================= APPOINTMENT SETTINGS & TERMINOLOGY =================

/**
 * GET /api/appointment-settings - Fetch settings for current tenant
 */
router.get('/', async (req, res) => {
  try {
    const { AppointmentSettingsModel, ShopConfigModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    
    let shopConfig = await ShopConfigModel.findOne({});
    let settings = await AppointmentSettingsModel.findOne({ userId });
    
    if (!settings) {
      const bType = String(shopConfig?.businessType || 'healthcare').toLowerCase();
      let defaultTerminology = {
        businessType: 'HEALTHCARE',
        businessTypeName: 'Clinic / Hospital',
        staffLabel: 'Doctor',
        staffLabelPlural: 'Doctors',
        serviceLabel: 'Treatment / Consultation',
        serviceLabelPlural: 'Treatments / Procedures',
        clientLabel: 'Patient',
        clientLabelPlural: 'Patients'
      };

      if (bType.includes('salon') || bType.includes('spa') || bType.includes('beauty')) {
        defaultTerminology = {
          businessType: 'SALON_SPA',
          businessTypeName: 'Salon / Beauty Parlor / Spa',
          staffLabel: 'Stylist',
          staffLabelPlural: 'Stylists',
          serviceLabel: 'Haircut & Spa',
          serviceLabelPlural: 'Services',
          clientLabel: 'Client',
          clientLabelPlural: 'Clients'
        };
      } else if (bType.includes('auto') || bType.includes('garage') || bType.includes('workshop')) {
        defaultTerminology = {
          businessType: 'AUTO_WORKSHOP',
          businessTypeName: 'Automobile Workshop / Garage',
          staffLabel: 'Mechanic',
          staffLabelPlural: 'Technicians',
          serviceLabel: 'Service / Repair',
          serviceLabelPlural: 'Services',
          clientLabel: 'Vehicle Owner',
          clientLabelPlural: 'Owners'
        };
      } else if (bType.includes('consult') || bType.includes('legal') || bType.includes('ca')) {
        defaultTerminology = {
          businessType: 'CONSULTANCY',
          businessTypeName: 'Legal / CA / Consulting Firm',
          staffLabel: 'Advisor',
          staffLabelPlural: 'Consultants',
          serviceLabel: 'Consultation Session',
          serviceLabelPlural: 'Sessions',
          clientLabel: 'Client',
          clientLabelPlural: 'Clients'
        };
      }

      if (shopConfig?.customTerminology && Object.keys(shopConfig.customTerminology).length > 0) {
        defaultTerminology = { ...defaultTerminology, ...shopConfig.customTerminology };
      }

      settings = await AppointmentSettingsModel.create({
        userId,
        terminology: defaultTerminology
      });
    }

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching appointment settings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/appointment-settings - Update runtime settings and shifts
 */
router.put('/', async (req, res) => {
  try {
    const { AppointmentSettingsModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const updateData = { ...req.body };

    // Strict Governance: Core business configuration is governed strictly by Renic Soft Master HQ
    delete updateData.solutionMode;
    delete updateData.solutionModes;
    delete updateData.customerCode;

    let settings = await AppointmentSettingsModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ success: true, settings, message: 'Settings saved successfully.' });
  } catch (err) {
    console.error('Error saving appointment settings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SERVICES CATALOG =================

/**
 * GET /api/appointment-settings/services - List services
 */
router.get('/services', async (req, res) => {
  try {
    const { AppointmentServiceModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const services = await AppointmentServiceModel.find({ userId }).sort({ orderIndex: 1, createdAt: -1 });
    res.json({ success: true, services });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/appointment-settings/services - Create new service
 */
router.post('/services', async (req, res) => {
  try {
    const { AppointmentServiceModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const { name, description, category, durationMinutes, price, currency, isActive, colorCode } = req.body;

    if (!name || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Service name and duration are required.' });
    }

    const service = await AppointmentServiceModel.create({
      userId,
      name,
      description,
      category: category || 'General',
      durationMinutes: parseInt(durationMinutes, 10),
      price: parseFloat(price) || 0,
      currency: currency || 'INR',
      isActive: isActive !== false,
      colorCode: colorCode || '#10b981'
    });

    res.status(201).json({ success: true, service, message: 'Service created successfully.' });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/appointment-settings/services/:id - Update service
 */
router.put('/services/:id', async (req, res) => {
  try {
    const { AppointmentServiceModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const updated = await AppointmentServiceModel.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.json({ success: true, service: updated, message: 'Service updated successfully.' });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/appointment-settings/services/:id - Delete service
 */
router.delete('/services/:id', async (req, res) => {
  try {
    const { AppointmentServiceModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const deleted = await AppointmentServiceModel.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= STAFF DIRECTORY =================

/**
 * GET /api/appointment-settings/staff - List staff
 */
router.get('/staff', async (req, res) => {
  try {
    const { AppointmentStaffModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const staff = await AppointmentStaffModel.find({ userId })
      .populate('servicesOffered', 'name durationMinutes price category')
      .sort({ name: 1 });
    res.json({ success: true, staff });
  } catch (err) {
    console.error('Error fetching staff list:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/appointment-settings/staff - Create staff member
 */
router.post('/staff', async (req, res) => {
  try {
    const { AppointmentStaffModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const {
      name,
      designation,
      email,
      phone,
      whatsappAlertNumber,
      notifyOnBooking,
      servicesOffered,
      weeklySchedule,
      leaveDates,
      colorCode,
      isActive
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Staff name is required.' });
    }

    const newStaff = await AppointmentStaffModel.create({
      userId,
      name,
      designation: designation || 'Specialist',
      email,
      phone,
      whatsappAlertNumber,
      notifyOnBooking: notifyOnBooking !== false,
      servicesOffered: Array.isArray(servicesOffered) ? servicesOffered : [],
      weeklySchedule: weeklySchedule || undefined,
      leaveDates: Array.isArray(leaveDates) ? leaveDates : [],
      colorCode: colorCode || '#3b82f6',
      isActive: isActive !== false
    });

    res.status(201).json({ success: true, staff: newStaff, message: 'Staff member added successfully.' });
  } catch (err) {
    console.error('Error creating staff member:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/appointment-settings/staff/:id - Update staff member
 */
router.put('/staff/:id', async (req, res) => {
  try {
    const { AppointmentStaffModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const updated = await AppointmentStaffModel.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: req.body },
      { new: true }
    ).populate('servicesOffered', 'name durationMinutes price category');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    res.json({ success: true, staff: updated, message: 'Staff member updated successfully.' });
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/appointment-settings/staff/:id - Delete staff member
 */
router.delete('/staff/:id', async (req, res) => {
  try {
    const { AppointmentStaffModel } = getModels();
    const userId = req.user?.id || req.user?._id;
    const deleted = await AppointmentStaffModel.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    res.json({ success: true, message: 'Staff member deleted successfully.' });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
