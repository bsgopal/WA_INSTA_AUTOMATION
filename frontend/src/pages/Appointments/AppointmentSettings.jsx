import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  TextField, MenuItem, Switch, FormControlLabel,
  Paper, Stack, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Translate as TerminologyIcon,
  SmartToy as BotIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  CheckCircle as CheckCircleIcon,
  Code as CodeIcon,
  ViewList as ViewListIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  PhoneAndroid as PhoneIcon,
  Send as SendIcon,
  DoneAll as DoneAllIcon,
  Info as HelpIcon,
  PlayCircleFilled as PlayIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';
import { useTenant } from '../../context/TenantContext';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const DEFAULT_OPERATING_HOURS = {
  monday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }, { open: '17:00', close: '21:00' }] },
  tuesday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }, { open: '17:00', close: '21:00' }] },
  wednesday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }, { open: '17:00', close: '21:00' }] },
  thursday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }, { open: '17:00', close: '21:00' }] },
  friday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }, { open: '17:00', close: '21:00' }] },
  saturday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }] },
  sunday: { isOpen: false, slots: [] }
};

const getIndustryCategory = (businessType, customTerminology = {}) => {
  const bType = String(businessType || '').toLowerCase();

  // Healthcare / Medical domain
  if (
    bType.includes('medical') ||
    bType.includes('clinic') ||
    bType.includes('healthcare') ||
    bType.includes('hospital') ||
    bType.includes('dental') ||
    bType.includes('doctor') ||
    bType.includes('pharma')
  ) {
    return {
      categoryName: 'Medical & Healthcare Domain',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5',
      icon: '🏥',
      presets: [
        {
          type: 'HEALTHCARE_OPD',
          name: 'General Clinic & OPD Practice',
          description: 'Standard OPD consultation & treatment flow for outpatient clinics',
          staff: 'Doctor', staffPlural: 'Doctors',
          service: 'Treatment / Consultation', servicePlural: 'Treatments & Procedures',
          client: 'Patient', clientPlural: 'Patients',
          slotInterval: 15, advanceDays: 30
        },
        {
          type: 'HEALTHCARE_DENTAL',
          name: 'Dental Care & Surgery Clinic',
          description: 'Specialized dental chairs, procedures, cleanings & surgery slots',
          staff: 'Dentist / Dental Surgeon', staffPlural: 'Dentists',
          service: 'Dental Procedure & Checkup', servicePlural: 'Dental Procedures',
          client: 'Patient', clientPlural: 'Patients',
          slotInterval: 30, advanceDays: 45
        },
        {
          type: 'HEALTHCARE_SPECIALTY',
          name: 'Specialized Hospital & Diagnostics',
          description: 'Multi-specialist department scheduling & diagnostic lab checkups',
          staff: 'Consultant Specialist', staffPlural: 'Specialists',
          service: 'Diagnostic & Clinical Procedure', servicePlural: 'Procedures',
          client: 'Patient', clientPlural: 'Patients',
          slotInterval: 20, advanceDays: 60
        },
        {
          type: 'HEALTHCARE_CUSTOM',
          name: 'Custom Medical Terminology',
          description: 'Tenant customized medical terminology & customized workflow tags',
          staff: customTerminology?.staffLabel || 'Doctor',
          staffPlural: customTerminology?.staffLabelPlural || 'Doctors',
          service: customTerminology?.serviceLabel || 'Treatment',
          servicePlural: customTerminology?.serviceLabelPlural || 'Treatments',
          client: customTerminology?.clientLabel || 'Patient',
          clientPlural: customTerminology?.clientLabelPlural || 'Patients',
          slotInterval: 30, advanceDays: 30
        }
      ]
    };
  }

  // Salon & Wellness domain
  if (
    bType.includes('salon') ||
    bType.includes('spa') ||
    bType.includes('beauty') ||
    bType.includes('parlor') ||
    bType.includes('hair')
  ) {
    return {
      categoryName: 'Salon & Wellness Domain',
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      icon: '💇',
      presets: [
        {
          type: 'SALON_HAIR',
          name: 'Hair Studio & Unisex Salon',
          description: 'Haircuts, styling, coloring and beauty salon scheduling',
          staff: 'Stylist / Hairdresser', staffPlural: 'Stylists',
          service: 'Haircut & Grooming', servicePlural: 'Services',
          client: 'Client', clientPlural: 'Clients',
          slotInterval: 30, advanceDays: 14
        },
        {
          type: 'SALON_SPA',
          name: 'Spa & Wellness Center',
          description: 'Ayurvedic treatments, massages, steam & body therapy sessions',
          staff: 'Therapist', staffPlural: 'Therapists',
          service: 'Spa & Massage Therapy', servicePlural: 'Therapies',
          client: 'Guest', clientPlural: 'Guests',
          slotInterval: 60, advanceDays: 30
        },
        {
          type: 'SALON_BEAUTY',
          name: 'Beauty Parlor & Aesthetics',
          description: 'Facials, makeup, skincare and aesthetics appointments',
          staff: 'Beautician / Artist', staffPlural: 'Beauticians',
          service: 'Beauty Treatment & Care', servicePlural: 'Treatments',
          client: 'Client', clientPlural: 'Clients',
          slotInterval: 45, advanceDays: 21
        },
        {
          type: 'SALON_CUSTOM',
          name: 'Custom Salon Terminology',
          description: 'Custom beauty & salon workflow terms and booking rules',
          staff: customTerminology?.staffLabel || 'Stylist',
          staffPlural: customTerminology?.staffLabelPlural || 'Stylists',
          service: customTerminology?.serviceLabel || 'Service',
          servicePlural: customTerminology?.serviceLabelPlural || 'Services',
          client: customTerminology?.clientLabel || 'Client',
          clientPlural: customTerminology?.clientLabelPlural || 'Clients',
          slotInterval: 30, advanceDays: 30
        }
      ]
    };
  }

  // Automobile & Workshop domain
  if (
    bType.includes('auto') ||
    bType.includes('garage') ||
    bType.includes('workshop') ||
    bType.includes('mechanic') ||
    bType.includes('car') ||
    bType.includes('bike')
  ) {
    return {
      categoryName: 'Automobile & Workshop Domain',
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
      icon: '🚗',
      presets: [
        {
          type: 'AUTO_GARAGE',
          name: 'Automobile Workshop & Garage',
          description: 'Vehicle servicing, mechanical repairs and diagnostic slots',
          staff: 'Mechanic / Technician', staffPlural: 'Technicians',
          service: 'Vehicle Repair & Maintenance', servicePlural: 'Services',
          client: 'Vehicle Owner', clientPlural: 'Owners',
          slotInterval: 60, advanceDays: 14
        },
        {
          type: 'AUTO_DETAILING',
          name: 'Car Spa & Detailing Studio',
          description: 'Ceramic coating, interior detailing, foam wash and PPF installations',
          staff: 'Detailing Specialist', staffPlural: 'Detailers',
          service: 'Wash & Ceramic Detailing', servicePlural: 'Services',
          client: 'Car Owner', clientPlural: 'Owners',
          slotInterval: 120, advanceDays: 30
        },
        {
          type: 'AUTO_BIKE',
          name: 'Two-Wheeler Service Center',
          description: 'Motorcycle & scooter periodical inspection, oil change and tuneups',
          staff: 'Bike Technician', staffPlural: 'Technicians',
          service: 'Bike Service & Inspection', servicePlural: 'Services',
          client: 'Customer', clientPlural: 'Customers',
          slotInterval: 45, advanceDays: 14
        },
        {
          type: 'AUTO_CUSTOM',
          name: 'Custom Workshop Terminology',
          description: 'Custom automotive workshop terms and service bay rules',
          staff: customTerminology?.staffLabel || 'Mechanic',
          staffPlural: customTerminology?.staffLabelPlural || 'Technicians',
          service: customTerminology?.serviceLabel || 'Service / Repair',
          servicePlural: customTerminology?.serviceLabelPlural || 'Services',
          client: customTerminology?.clientLabel || 'Vehicle Owner',
          clientPlural: customTerminology?.clientLabelPlural || 'Owners',
          slotInterval: 60, advanceDays: 30
        }
      ]
    };
  }

  // Default Professional domain
  return {
    categoryName: 'Professional Services Domain',
    badgeColor: '#0284c7',
    badgeBg: '#f0f9ff',
    icon: '💼',
    presets: [
      {
        type: 'PROFESSIONAL_CONSULT',
        name: 'Consultancy & Advisory Firm',
        description: 'Client advisory, consultations and strategic planning sessions',
        staff: 'Consultant / Advisor', staffPlural: 'Consultants',
        service: 'Advisory Session', servicePlural: 'Consultations',
        client: 'Client', clientPlural: 'Clients',
        slotInterval: 30, advanceDays: 30
      },
      {
        type: 'PROFESSIONAL_LEGAL',
        name: 'Legal Practice & Law Firm',
        description: 'Case hearings, contract review and legal counsel meetings',
        staff: 'Advocate / Attorney', staffPlural: 'Attorneys',
        service: 'Legal Consultation', servicePlural: 'Consultations',
        client: 'Client', clientPlural: 'Clients',
        slotInterval: 45, advanceDays: 30
      },
      {
        type: 'PROFESSIONAL_CUSTOM',
        name: 'Custom Domain Terminology',
        description: 'Custom enterprise naming terminology and operational rules',
        staff: customTerminology?.staffLabel || 'Staff Member',
        staffPlural: customTerminology?.staffLabelPlural || 'Staff Members',
        service: customTerminology?.serviceLabel || 'Service',
        servicePlural: customTerminology?.serviceLabelPlural || 'Services',
        client: customTerminology?.clientLabel || 'Customer',
        clientPlural: customTerminology?.clientLabelPlural || 'Customers',
        slotInterval: 30, advanceDays: 30
      }
    ]
  };
};

const STEPS = [
  { id: 0, key: 'presets', label: '1. Select Template & Terms', shortDesc: 'Set Doctor, Treatment & Patient labels' },
  { id: 1, key: 'shifts', label: '2. Working Shifts & Days', shortDesc: 'Set clinic opening hours & weekly offs' },
  { id: 2, key: 'rules', label: '3. Booking Slot Limits', shortDesc: 'Set slot duration (15/30m) & notice hours' },
  { id: 3, key: 'messages', label: '4. WhatsApp Auto-Messages', shortDesc: 'Set confirmation & reminder text templates' },
  { id: 4, key: 'simulator', label: '5. Live WhatsApp Bot Test', shortDesc: 'See how client interacts on WhatsApp in real life' }
];

export default function AppointmentSettings() {
  const { tenant } = useTenant();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected Profile Preset Type
  const [selectedPresetType, setSelectedPresetType] = useState('');

  const [settings, setSettings] = useState({
    businessType: 'HEALTHCARE',
    terminology: {
      staffLabel: 'Doctor',
      staffLabelPlural: 'Doctors',
      serviceLabel: 'Treatment / Consultation',
      serviceLabelPlural: 'Treatments & Procedures',
      clientLabel: 'Patient',
      clientLabelPlural: 'Patients',
      addStaffBtnText: 'Add Doctor',
      addServiceBtnText: 'Add Treatment'
    },
    rules: {
      slotIntervalMinutes: 30,
      bufferBetweenSlotsMinutes: 0,
      maxAdvanceBookingDays: 30,
      minNoticeHours: 2,
      cancellationNoticeHours: 4,
      autoConfirm: true,
      allowMultipleStaffSelection: true,
      requireDeposit: false,
      depositAmount: 0
    },
    operatingHours: DEFAULT_OPERATING_HOURS,
    messaging: {
      confirmationMessage: 'Namaste {{customerName}}, your appointment for {{serviceName}} with {{staffName}} is confirmed for {{date}} at {{time}}.',
      reminderMessage: 'Reminder: You have an upcoming appointment for {{serviceName}} with {{staffName}} tomorrow at {{time}}.',
      cancellationMessage: 'Your appointment for {{serviceName}} on {{date}} at {{time}} has been cancelled.',
      rescheduleMessage: 'Your appointment has been rescheduled to {{date}} at {{time}} for {{serviceName}} with {{staffName}}.',
      completedMessage: 'Thank you for visiting us! We hope your {{serviceName}} session was great.'
    }
  });

  const domainCategory = useMemo(() => {
    const rawBusinessType = tenant?.businessType || settings.businessType || 'HEALTHCARE';
    return getIndustryCategory(rawBusinessType, tenant?.customTerminology || {});
  }, [tenant, settings.businessType]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/appointment-settings');
      if (res.data?.settings) {
        const fetched = res.data.settings;
        setSettings(prev => ({
          ...prev,
          ...fetched,
          operatingHours: {
            ...DEFAULT_OPERATING_HOURS,
            ...(fetched.operatingHours || {})
          },
          rules: {
            ...prev.rules,
            ...(fetched.rules || {})
          },
          terminology: {
            ...prev.terminology,
            ...(fetched.terminology || {})
          },
          messaging: {
            ...prev.messaging,
            ...(fetched.messaging || {})
          }
        }));

        const currentStaff = fetched.terminology?.staffLabel || '';
        const matchingPreset = domainCategory.presets.find(p => p.staff.toLowerCase() === currentStaff.toLowerCase());
        if (matchingPreset) {
          setSelectedPresetType(matchingPreset.type);
        } else if (domainCategory.presets.length > 0) {
          setSelectedPresetType(domainCategory.presets[0].type);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setSelectedPresetType(preset.type);
    setSettings(prev => ({
      ...prev,
      terminology: {
        ...prev.terminology,
        staffLabel: preset.staff,
        staffPlural: preset.staffPlural,
        serviceLabel: preset.service,
        serviceLabelPlural: preset.servicePlural,
        clientLabel: preset.client,
        clientPlural: preset.clientPlural,
        addStaffBtnText: `Add ${preset.staff}`,
        addServiceBtnText: `Add ${preset.service}`
      },
      rules: {
        ...prev.rules,
        slotIntervalMinutes: preset.slotInterval || prev.rules.slotIntervalMinutes,
        maxAdvanceBookingDays: preset.advanceDays || prev.rules.maxAdvanceBookingDays
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put('/appointment-settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateOperatingHour = (day, field, value) => {
    setSettings(prev => {
      const prevHours = prev.operatingHours || DEFAULT_OPERATING_HOURS;
      const currentDay = prevHours[day] || { isOpen: true, slots: [] };
      return {
        ...prev,
        operatingHours: {
          ...prevHours,
          [day]: {
            ...currentDay,
            [field]: value
          }
        }
      };
    });
  };

  const updateSlotTime = (day, slotIdx, timeField, value) => {
    setSettings(prev => {
      const prevHours = prev.operatingHours || DEFAULT_OPERATING_HOURS;
      const dayData = { ...(prevHours[day] || { isOpen: true, slots: [] }) };
      const newSlots = [...(dayData.slots || [])];
      if (!newSlots[slotIdx]) {
        newSlots[slotIdx] = { open: '09:00', close: '17:00' };
      }
      newSlots[slotIdx] = { ...newSlots[slotIdx], [timeField]: value };
      return {
        ...prev,
        operatingHours: {
          ...prevHours,
          [day]: { ...dayData, slots: newSlots }
        }
      };
    });
  };

  const addSlotToDay = (day) => {
    setSettings(prev => {
      const prevHours = prev.operatingHours || DEFAULT_OPERATING_HOURS;
      const dayData = { ...(prevHours[day] || { isOpen: true, slots: [] }) };
      const newSlots = [...(dayData.slots || []), { open: '14:00', close: '18:00' }];
      return {
        ...prev,
        operatingHours: {
          ...prevHours,
          [day]: { ...dayData, isOpen: true, slots: newSlots }
        }
      };
    });
  };

  const removeSlotFromDay = (day, slotIdx) => {
    setSettings(prev => {
      const prevHours = prev.operatingHours || DEFAULT_OPERATING_HOURS;
      const dayData = { ...(prevHours[day] || { isOpen: true, slots: [] }) };
      const newSlots = (dayData.slots || []).filter((_, idx) => idx !== slotIdx);
      return {
        ...prev,
        operatingHours: {
          ...prevHours,
          [day]: { ...dayData, slots: newSlots }
        }
      };
    });
  };

  const staffTerm = settings.terminology?.staffLabel || 'Doctor';
  const serviceTerm = settings.terminology?.serviceLabel || 'Treatment';
  const clientTerm = settings.terminology?.clientLabel || 'Patient';

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem' }}>
              🏥 Step-by-Step WhatsApp Booking Setup Wizard
            </Typography>
            <Chip
              label={domainCategory.categoryName}
              size="small"
              sx={{
                bgcolor: domainCategory.badgeBg,
                color: domainCategory.badgeColor,
                fontWeight: 700,
                fontSize: '0.72rem',
                border: `1px solid ${domainCategory.badgeColor}40`
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.25 }}>
            Follow these 5 simple steps to configure your clinic's working hours, naming rules & WhatsApp automated bot responses.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {saveSuccess && (
            <Chip
              icon={<CheckCircleIcon sx={{ '&&': { color: '#059669' } }} />}
              label="Saved Live to Database"
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem' }}
            />
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={<SaveIcon />}
            size="small"
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 2.5,
              py: 0.85,
              textTransform: 'none',
              borderRadius: 1.5,
              boxShadow: '0 1px 3px rgba(16,185,129,0.2)'
            }}
          >
            {saving ? 'Saving...' : 'Save Live Configuration'}
          </Button>
        </Stack>
      </Box>

      {/* 5-STEP VISUAL PROGRESS RIBBON */}
      <Paper sx={{ mb: 2.5, p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#ffffff' }}>
        <Grid container spacing={1}>
          {STEPS.map((s, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = activeStep > idx;
            return (
              <Grid item xs={12} sm={6} md={2.4} key={s.id}>
                <Box
                  onClick={() => setActiveStep(idx)}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: isActive ? '#0f172a' : isCompleted ? '#f0fdf4' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#334155',
                    border: isActive ? '1px solid #0f172a' : isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: isActive ? '#0f172a' : '#f1f5f9'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: isActive ? '#ffffff !important' : isCompleted ? '#059669' : '#0f172a' }}>
                      {s.label}
                    </Typography>
                    {isCompleted && (
                      <CheckCircleIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.68rem', color: isActive ? '#94a3b8' : '#64748b' }}>
                    {s.shortDesc}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* ========================================================================= */}
      {/* STEP 1: Industry Template & Terminology */}
      {/* ========================================================================= */}
      {activeStep === 0 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          
          {/* Why This Matters Box */}
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <HelpIcon sx={{ color: '#2563eb', mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>
                💡 What is this Step for?
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#1e40af', mt: 0.25 }}>
                A dental clinic needs WhatsApp to say <strong>"Select your Dentist & Dental Procedure"</strong>, while a general clinic says <strong>"Select Doctor & Treatment"</strong>. 
                Selecting a profile sets these business terms everywhere across your system and WhatsApp chatbot automatically.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 1 }}>
            1. Select Your Clinic Practice Profile:
          </Typography>

          {/* Master Presets Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>PROFILE TEMPLATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>STAFF ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>SERVICE ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>CLIENT ROLE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>SELECT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {domainCategory.presets.map((preset) => {
                  const isSelected = selectedPresetType === preset.type;
                  return (
                    <TableRow
                      key={preset.type}
                      hover
                      onClick={() => handleApplyPreset(preset)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isSelected ? '#f0fdf4' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #10b981' : '4px solid transparent'
                      }}
                    >
                      <TableCell sx={{ py: 1.2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#065f46' : '#0f172a' }}>
                          {preset.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {preset.description}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={preset.staff} size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={preset.service} size="small" sx={{ bgcolor: '#f5f3ff', color: '#6b21a8', fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={preset.client} size="small" sx={{ bgcolor: '#fffbeb', color: '#92400e', fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.2 }}>
                        {isSelected ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important', color: '#10b981 !important' }} />}
                            label="Active Profile"
                            size="small"
                            sx={{
                              bgcolor: '#0f172a',
                              color: '#ffffff !important',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              height: 24,
                              px: 0.5,
                              '& .MuiChip-label': { color: '#ffffff !important' }
                            }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.72rem',
                              textTransform: 'none',
                              fontWeight: 700,
                              borderColor: '#cbd5e1',
                              color: '#475569',
                              borderRadius: 1.5,
                              py: 0.25,
                              '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                          >
                            Use This Profile
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 1 }}>
            2. Customize Exact Wording (Optional):
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Staff / Provider Title"
                fullWidth
                size="small"
                value={settings.terminology?.staffLabel || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  terminology: { ...settings.terminology, staffLabel: e.target.value }
                })}
                helperText="Appears as: 'Choose your [Doctor]'"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Service / Procedure Title"
                fullWidth
                size="small"
                value={settings.terminology?.serviceLabel || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  terminology: { ...settings.terminology, serviceLabel: e.target.value }
                })}
                helperText="Appears as: 'Select your [Treatment]'"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Customer / Client Title"
                fullWidth
                size="small"
                value={settings.terminology?.clientLabel || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  terminology: { ...settings.terminology, clientLabel: e.target.value }
                })}
                helperText="Appears as: '[Patient] Name'"
              />
            </Grid>
          </Grid>

          {/* Stepper Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon sx={{ color: '#ffffff !important' }} />}
              onClick={() => setActiveStep(1)}
              sx={{
                bgcolor: '#0f172a',
                color: '#ffffff !important',
                '&:hover': { bgcolor: '#1e293b', color: '#ffffff !important' },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 3,
                py: 0.85,
                borderRadius: 1.5,
                boxShadow: '0 2px 5px rgba(15,23,42,0.3)'
              }}
            >
              Next: Set Working Shifts →
            </Button>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Working Shifts & Timetable */}
      {/* ========================================================================= */}
      {activeStep === 1 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <HelpIcon sx={{ color: '#2563eb', mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>
                💡 What is this Step for?
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#1e40af', mt: 0.25 }}>
                When a patient asks for an appointment on WhatsApp, the bot checks these shift hours (e.g. 09:00 AM - 01:00 PM and 05:00 PM - 09:00 PM) to only offer slots when the clinic is open.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 1.5 }}>
            Configure Weekly Shift Hours:
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1, width: 140 }}>DAY</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1, width: 120 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1 }}>OPENING SHIFTS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1, width: 140 }}>ADD SHIFT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DAYS.map((day) => {
                  const dayData = (settings.operatingHours && settings.operatingHours[day.key]) ? settings.operatingHours[day.key] : (DEFAULT_OPERATING_HOURS[day.key] || { isOpen: false, slots: [] });
                  const isOpen = dayData.isOpen;
                  const slots = dayData.slots || [];

                  return (
                    <TableRow key={day.key} hover sx={{ bgcolor: isOpen ? '#ffffff' : '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.82rem', color: isOpen ? '#0f172a' : '#94a3b8', py: 1 }}>
                        {day.label}
                      </TableCell>

                      <TableCell sx={{ py: 1 }}>
                        <Switch
                          size="small"
                          checked={isOpen}
                          onChange={(e) => updateOperatingHour(day.key, 'isOpen', e.target.checked)}
                          color="success"
                        />
                        <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', fontWeight: 700, color: isOpen ? '#059669' : '#94a3b8' }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1 }}>
                        {!isOpen ? (
                          <Chip label="Clinic Closed" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', fontSize: '0.7rem' }} />
                        ) : slots.length === 0 ? (
                          <Typography sx={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                            No shift slots added. Click "+ Add Shift".
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
                            {slots.map((slot, sIdx) => (
                              <Box
                                key={sIdx}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  p: 0.5,
                                  px: 1,
                                  bgcolor: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 1.5
                                }}
                              >
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>
                                  Shift {sIdx + 1}:
                                </Typography>
                                <TextField
                                  type="time"
                                  size="small"
                                  value={slot.open || '09:00'}
                                  onChange={(e) => updateSlotTime(day.key, sIdx, 'open', e.target.value)}
                                  sx={{ width: 100, '& .MuiInputBase-input': { fontSize: '0.75rem', p: 0.4 } }}
                                />
                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>to</Typography>
                                <TextField
                                  type="time"
                                  size="small"
                                  value={slot.close || '17:00'}
                                  onChange={(e) => updateSlotTime(day.key, sIdx, 'close', e.target.value)}
                                  sx={{ width: 100, '& .MuiInputBase-input': { fontSize: '0.75rem', p: 0.4 } }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => removeSlotFromDay(day.key, sIdx)}
                                  sx={{ color: '#ef4444', p: 0.2 }}
                                >
                                  <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ py: 1 }}>
                        {isOpen && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon sx={{ fontSize: '0.85rem' }} />}
                            onClick={() => addSlotToDay(day.key)}
                            sx={{
                              fontSize: '0.7rem',
                              py: 0.25,
                              px: 1,
                              textTransform: 'none',
                              fontWeight: 700,
                              borderColor: '#cbd5e1',
                              color: '#334155'
                            }}
                          >
                            Add Shift
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Stepper Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setActiveStep(0)}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#334155' }}
            >
              ← Back: Template & Terms
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon sx={{ color: '#ffffff !important' }} />}
              onClick={() => setActiveStep(2)}
              sx={{
                bgcolor: '#0f172a',
                color: '#ffffff !important',
                '&:hover': { bgcolor: '#1e293b', color: '#ffffff !important' },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 3,
                py: 0.85,
                borderRadius: 1.5,
                boxShadow: '0 2px 5px rgba(15,23,42,0.3)'
              }}
            >
              Next: Slot Limits →
            </Button>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Booking Slot Limits */}
      {/* ========================================================================= */}
      {activeStep === 2 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <HelpIcon sx={{ color: '#2563eb', mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>
                💡 What is this Step for?
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#1e40af', mt: 0.25 }}>
                Controls how slots are carved out on WhatsApp (e.g. 15 min slots = 9:00, 9:15, 9:30; 30 min slots = 9:00, 9:30, 10:00) and prevents patients from booking too far into the future.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 1.5 }}>
            Booking Timing Rules:
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Slot Interval Duration"
                fullWidth
                size="small"
                value={settings.rules?.slotIntervalMinutes || 30}
                onChange={(e) => setSettings({
                  ...settings,
                  rules: { ...settings.rules, slotIntervalMinutes: Number(e.target.value) }
                })}
                helperText="How long each patient appointment slot lasts on WhatsApp"
              >
                <MenuItem value={15}>15 Minutes (Fast OPD / Quick Checkup)</MenuItem>
                <MenuItem value={20}>20 Minutes (Standard Consultation)</MenuItem>
                <MenuItem value={30}>30 Minutes (Detailed Checkup / Dental)</MenuItem>
                <MenuItem value={45}>45 Minutes (Specialized Procedure)</MenuItem>
                <MenuItem value={60}>60 Minutes (1 Hour Surgery / Therapy)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Max Days in Advance for Booking"
                fullWidth
                size="small"
                value={settings.rules?.maxAdvanceBookingDays || 30}
                onChange={(e) => setSettings({
                  ...settings,
                  rules: { ...settings.rules, maxAdvanceBookingDays: Number(e.target.value) }
                })}
                helperText="Patients cannot book dates beyond this many days ahead"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Minimum Cancellation Notice (Hours)"
                fullWidth
                size="small"
                value={settings.rules?.cancellationNoticeHours || 4}
                onChange={(e) => setSettings({
                  ...settings,
                  rules: { ...settings.rules, cancellationNoticeHours: Number(e.target.value) }
                })}
                helperText="Patient must give at least this many hours notice to cancel"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.rules?.autoConfirm !== false}
                    onChange={(e) => setSettings({
                      ...settings,
                      rules: { ...settings.rules, autoConfirm: e.target.checked }
                    })}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Auto-Confirm WhatsApp Bookings</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Immediately confirm slot on WhatsApp without manual staff click</Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>

          {/* Stepper Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setActiveStep(1)}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#334155' }}
            >
              ← Back: Shifts
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon sx={{ color: '#ffffff !important' }} />}
              onClick={() => setActiveStep(3)}
              sx={{
                bgcolor: '#0f172a',
                color: '#ffffff !important',
                '&:hover': { bgcolor: '#1e293b', color: '#ffffff !important' },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 3,
                py: 0.85,
                borderRadius: 1.5,
                boxShadow: '0 2px 5px rgba(15,23,42,0.3)'
              }}
            >
              Next: WhatsApp Messages →
            </Button>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: WhatsApp Automated Messages */}
      {/* ========================================================================= */}
      {activeStep === 3 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <HelpIcon sx={{ color: '#2563eb', mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>
                💡 What is this Step for?
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#1e40af', mt: 0.25 }}>
                These are the exact WhatsApp messages sent automatically to the patient's phone number upon booking, 24 hours before their visit, or if rescheduled.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 1.5 }}>
            Automated WhatsApp Message Templates:
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                  1. Instant Booking Confirmation Message
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={settings.messaging?.confirmationMessage || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  messaging: { ...settings.messaging, confirmationMessage: e.target.value }
                })}
              />
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.5 }}>
                Tags available: <code>{'{{customerName}}'}</code>, <code>{'{{serviceName}}'}</code>, <code>{'{{staffName}}'}</code>, <code>{'{{date}}'}</code>, <code>{'{{time}}'}</code>
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                  2. 24-Hour Advance Reminder Message
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={settings.messaging?.reminderMessage || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  messaging: { ...settings.messaging, reminderMessage: e.target.value }
                })}
              />
            </Box>

            <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                  3. Cancellation Notification Message
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={settings.messaging?.cancellationMessage || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  messaging: { ...settings.messaging, cancellationMessage: e.target.value }
                })}
              />
            </Box>
          </Stack>

          {/* Stepper Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setActiveStep(2)}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#334155' }}
            >
              ← Back: Slot Limits
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon sx={{ color: '#ffffff !important' }} />}
              onClick={() => setActiveStep(4)}
              sx={{
                bgcolor: '#10b981',
                color: '#ffffff !important',
                '&:hover': { bgcolor: '#059669', color: '#ffffff !important' },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 3,
                py: 0.85,
                borderRadius: 1.5,
                boxShadow: '0 2px 5px rgba(16,185,129,0.3)'
              }}
            >
              Next: Test Live WhatsApp Bot Simulation →
            </Button>
          </Box>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Live WhatsApp Bot Simulator */}
      {/* ========================================================================= */}
      {activeStep === 4 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#ecfdf5', borderRadius: 1.5, border: '1px solid #a7f3d0', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <CheckCircleIcon sx={{ color: '#059669', mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#065f46' }}>
                🎉 Real-Life WhatsApp Client Simulation
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#047857', mt: 0.25 }}>
                Here is the exact real-time demonstration of how a patient interacts with your WhatsApp chatbot using the rules and terminology you just configured!
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            
            {/* Phone Mockup Screen */}
            <Grid item xs={12} sm={8} md={6} lg={5}>
              <Box
                sx={{
                  bgcolor: '#0b141a',
                  p: 1.5,
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  border: '4px solid #1f2c34'
                }}
              >
                {/* Phone Top Header */}
                <Box sx={{ bgcolor: '#202c33', p: 1.5, borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, color: '#ffffff', mb: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    🏥
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                      Clinic Booking Bot
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#25d366' }}>
                      ● Online (Automated)
                    </Typography>
                  </Box>
                </Box>

                {/* WhatsApp Chat Body */}
                <Box sx={{ bgcolor: '#0b141a', minHeight: 420, p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  
                  {/* Message 1: Patient */}
                  <Box sx={{ alignSelf: 'flex-end', bgcolor: '#005c4b', color: '#e9edef', p: 1.2, px: 1.5, borderRadius: '10px 0px 10px 10px', maxWidth: '85%' }}>
                    <Typography sx={{ fontSize: '0.78rem' }}>
                      Hi, I want to book an appointment
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <Typography sx={{ fontSize: '0.62rem', color: '#8696a0' }}>10:14 AM</Typography>
                      <DoneAllIcon sx={{ fontSize: '0.8rem', color: '#53bdeb' }} />
                    </Box>
                  </Box>

                  {/* Message 2: Bot asking for Service */}
                  <Box sx={{ alignSelf: 'flex-start', bgcolor: '#202c33', color: '#e9edef', p: 1.2, px: 1.5, borderRadius: '0px 10px 10px 10px', maxWidth: '88%' }}>
                    <Typography sx={{ fontSize: '0.78rem' }}>
                      Namaste! Welcome to our clinic. Please choose your desired <strong>{serviceTerm}</strong>:
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Box sx={{ p: 0.75, bgcolor: '#2a3942', borderRadius: 1, textAlign: 'center', fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        Teeth Whitening & Cleaning (30m)
                      </Box>
                      <Box sx={{ p: 0.75, bgcolor: '#2a3942', borderRadius: 1, textAlign: 'center', fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        Root Canal Consultation (45m)
                      </Box>
                    </Stack>
                  </Box>

                  {/* Message 3: Bot asking for Staff */}
                  <Box sx={{ alignSelf: 'flex-start', bgcolor: '#202c33', color: '#e9edef', p: 1.2, px: 1.5, borderRadius: '0px 10px 10px 10px', maxWidth: '88%' }}>
                    <Typography sx={{ fontSize: '0.78rem' }}>
                      Please select your preferred <strong>{staffTerm}</strong>:
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      <Box sx={{ flex: 1, p: 0.75, bgcolor: '#2a3942', borderRadius: 1, textAlign: 'center', fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        Dr. Sharma
                      </Box>
                      <Box sx={{ flex: 1, p: 0.75, bgcolor: '#2a3942', borderRadius: 1, textAlign: 'center', fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        Dr. Roy
                      </Box>
                    </Stack>
                  </Box>

                  {/* Message 4: Bot displaying calculated slot interval based on shift hours */}
                  <Box sx={{ alignSelf: 'flex-start', bgcolor: '#202c33', color: '#e9edef', p: 1.2, px: 1.5, borderRadius: '0px 10px 10px 10px', maxWidth: '88%' }}>
                    <Typography sx={{ fontSize: '0.78rem' }}>
                      Available slots for Tomorrow ({settings.rules?.slotIntervalMinutes || 30} min intervals):
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Box sx={{ p: 0.6, px: 1, bgcolor: '#2a3942', borderRadius: 1, fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        09:30 AM
                      </Box>
                      <Box sx={{ p: 0.6, px: 1, bgcolor: '#2a3942', borderRadius: 1, fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        10:00 AM
                      </Box>
                      <Box sx={{ p: 0.6, px: 1, bgcolor: '#2a3942', borderRadius: 1, fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700 }}>
                        11:30 AM
                      </Box>
                    </Stack>
                  </Box>

                  {/* Message 5: Bot sending final confirmation */}
                  <Box sx={{ alignSelf: 'flex-start', bgcolor: '#202c33', color: '#e9edef', p: 1.2, px: 1.5, borderRadius: '0px 10px 10px 10px', maxWidth: '88%', borderLeft: '3px solid #10b981' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#25d366', fontWeight: 800, mb: 0.5 }}>
                      ✅ Booking Confirmed!
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                      {(settings.messaging?.confirmationMessage || '')
                        .replace('{{customerName}}', 'Rajesh')
                        .replace('{{serviceName}}', 'Teeth Whitening')
                        .replace('{{staffName}}', 'Dr. Sharma')
                        .replace('{{date}}', 'Tomorrow')
                        .replace('{{time}}', '10:00 AM')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Explanation Summary Sidebar */}
            <Grid item xs={12} sm={8} md={6} lg={7}>
              <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', mb: 1 }}>
                  📋 How This Directly Benefits Your Business / Client:
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>1</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>Zero Manual Phone Calls</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Patients can self-book on WhatsApp 24/7 without receptionist intervention.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>2</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>Prevents Double Bookings</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>The bot checks real-time slot availability based on your Shift timings & slot durations.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>3</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>Reduces Patient No-Shows by 70%</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Automatic 24h WhatsApp reminders ensure patients never forget their scheduled slot.</Typography>
                    </Box>
                  </Box>
                </Stack>

                <Box sx={{ mt: 3, p: 2, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', mb: 0.5 }}>
                    Ready to Go Live?
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1.5 }}>
                    Click "Save Live Configuration" to publish all your shift rules and WhatsApp responses instantly.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={<SaveIcon />}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, textTransform: 'none', py: 1 }}
                  >
                    {saving ? 'Saving...' : 'Save & Activate WhatsApp Booking Bot'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Stepper Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 3, borderTop: '1px solid #e2e8f0', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setActiveStep(3)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              ← Back: WhatsApp Messages
            </Button>
          </Box>
        </Paper>
      )}

    </Box>
  );
}
