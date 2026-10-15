import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  FilterAltOff as ClearFilterIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';

const STATUS_COLORS = {
  CONFIRMED: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  PENDING: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  IN_PROGRESS: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  COMPLETED: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  CANCELLED: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  NO_SHOW: { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' }
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalForm, setModalForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceId: '',
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    notes: '',
    sendWhatsAppNotification: true
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [statusActionOpen, setStatusActionOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const terminology = {
    staffLabel: settings?.customTerminology?.staffLabel || settings?.terminology?.staffLabel || 'Doctor',
    staffLabelPlural: settings?.customTerminology?.staffLabelPlural || settings?.terminology?.staffLabelPlural || 'Doctors',
    serviceLabel: settings?.customTerminology?.serviceLabel || settings?.terminology?.serviceLabel || 'Treatment',
    serviceLabelPlural: settings?.customTerminology?.serviceLabelPlural || settings?.terminology?.serviceLabelPlural || 'Treatments',
    clientLabel: settings?.customTerminology?.clientLabel || settings?.terminology?.clientLabel || 'Patient',
    clientLabelPlural: settings?.customTerminology?.clientLabelPlural || settings?.terminology?.clientLabelPlural || 'Patients',
    bookingActionLabel: settings?.customTerminology?.bookingActionLabel || settings?.terminology?.bookingActionLabel || 'New Walk-In Booking',
    addServiceBtnText: settings?.customTerminology?.addServiceBtnText || settings?.terminology?.addServiceBtnText,
    addStaffBtnText: settings?.customTerminology?.addStaffBtnText || settings?.terminology?.addStaffBtnText,
  };

  const fetchMeta = useCallback(async () => {
    try {
      const [settRes, srvRes, stfRes] = await Promise.all([
        apiClient.get('/appointment-settings'),
        apiClient.get('/appointment-settings/services'),
        apiClient.get('/appointment-settings/staff')
      ]);
      setSettings(settRes.data.settings || {});
      setServices(srvRes.data.services || []);
      setStaffList(stfRes.data.staff || []);
    } catch (err) {
      console.error('Failed to load appointment metadata:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date: filterDate || undefined,
        staffId: filterStaff !== 'ALL' ? filterStaff : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: searchQuery || undefined
      };
      const [aptRes, statsRes] = await Promise.all([
        apiClient.get('/appointments', { params }),
        apiClient.get('/appointments/stats')
      ]);
      setAppointments(aptRes.data.appointments || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStaff, filterStatus, searchQuery]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (modalForm.serviceId && modalForm.staffId && modalForm.date) {
      const loadSlots = async () => {
        try {
          setSlotsLoading(true);
          const res = await apiClient.get('/appointments/slots', {
            params: {
              staffId: modalForm.staffId,
              serviceId: modalForm.serviceId,
              date: modalForm.date
            }
          });
          setAvailableSlots(res.data.slots || []);
        } catch (e) {
          setAvailableSlots([]);
        } finally {
          setSlotsLoading(false);
        }
      };
      loadSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [modalForm.serviceId, modalForm.staffId, modalForm.date]);

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setModalForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      serviceId: services[0]?._id || '',
      staffId: staffList[0]?._id || '',
      date: today,
      startTime: '',
      notes: '',
      sendWhatsAppNotification: true
    });
    setModalOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!modalForm.customerName || !modalForm.customerPhone || !modalForm.serviceId || !modalForm.staffId || !modalForm.startTime) {
      alert('Please fill in all required fields and select an available time slot.');
      return;
    }

    try {
      setFormSubmitting(true);
      await apiClient.post('/appointments', modalForm);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedAppointment) return;
    try {
      await apiClient.put(`/appointments/${selectedAppointment._id}/status`, {
        status,
        cancellationReason: status === 'CANCELLED' ? cancelReason : undefined
      });
      setStatusActionOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResetFilters = () => {
    setFilterDate(new Date().toISOString().split('T')[0]);
    setFilterStaff('ALL');
    setFilterStatus('ALL');
    setSearchQuery('');
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Compact Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
              📅 Live Appointments &amp; Calendar
            </Typography>
            <Chip
              label={`${terminology.staffLabel} Schedules`}
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.7rem', height: 20 }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Manage {terminology.clientLabelPlural} visits, schedules, and walk-in bookings.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={fetchData}
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.5, borderRadius: 1.5 }}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleOpenModal}
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.5, px: 2, borderRadius: 1.5 }}
          >
            {terminology.bookingActionLabel || '+ New Booking'}
          </Button>
        </Stack>
      </Box>

      {/* Sleek High-Density KPI Ribbon */}
      <Paper sx={{ mb: 2, p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Grid container spacing={1} alignItems="center">
          {[
            { label: "Today's Bookings", val: stats.todayCount || 0, color: '#3b82f6', bg: '#eff6ff', icon: '📅' },
            { label: 'Confirmed / In-Progress', val: stats.todayConfirmed || 0, color: '#10b981', bg: '#ecfdf5', icon: '✅' },
            { label: 'Completed Visits', val: stats.todayCompleted || 0, color: '#8b5cf6', bg: '#f5f3ff', icon: '🌟' },
            { label: 'Upcoming (30 Days)', val: stats.upcomingTotal || 0, color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
          ].map((kpi, idx) => (
            <Grid item xs={6} sm={3} key={idx}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                px: 1.8,
                bgcolor: '#ffffff',
                borderRadius: 1.5,
                border: '1px solid #e2e8f0',
                '&:hover': { borderColor: '#cbd5e1' }
              }}>
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {kpi.label}
                  </Typography>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>
                    {kpi.val}
                  </Typography>
                </Box>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {kpi.icon}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Streamlined Inline Filter Bar */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              type="date"
              label="Select Date"
              fullWidth
              size="small"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label={`Filter by ${terminology.staffLabel}`}
              fullWidth
              size="small"
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              sx={{ '& .MuiSelect-select': { py: 0.8, fontSize: '0.85rem' } }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.85rem' }}>All {terminology.staffLabelPlural}</MenuItem>
              {staffList.map((st) => (
                <MenuItem key={st._id} value={st._id} sx={{ fontSize: '0.85rem' }}>{st.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ '& .MuiSelect-select': { py: 0.8, fontSize: '0.85rem' } }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.85rem' }}>All Statuses</MenuItem>
              <MenuItem value="CONFIRMED" sx={{ fontSize: '0.85rem' }}>Confirmed</MenuItem>
              <MenuItem value="IN_PROGRESS" sx={{ fontSize: '0.85rem' }}>In-Progress</MenuItem>
              <MenuItem value="COMPLETED" sx={{ fontSize: '0.85rem' }}>Completed</MenuItem>
              <MenuItem value="CANCELLED" sx={{ fontSize: '0.85rem' }}>Cancelled</MenuItem>
              <MenuItem value="NO_SHOW" sx={{ fontSize: '0.85rem' }}>No-Show</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              placeholder={`Search ${terminology.clientLabel} or Ref...`}
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 0.8, fontSize: 18 }} />
              }}
              sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
            />
          </Grid>
          <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Reset all filters">
              <IconButton
                size="small"
                onClick={handleResetFilters}
                sx={{ border: '1px solid #cbd5e1', borderRadius: 1.5, p: 0.8 }}
              >
                <ClearFilterIcon sx={{ fontSize: 18, color: '#64748b' }} />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* High-Density Compact Appointments Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>REF / TIME</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>{terminology.clientLabel.toUpperCase()}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>{terminology.serviceLabel.toUpperCase()}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>{terminology.staffLabel.toUpperCase()}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>SOURCE</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#475569', py: 1.2 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1 }}>Loading appointments...</Typography>
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.95rem' }}>No Appointments Found</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    No bookings match your current filter criteria for {filterDate}.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => {
                const sColor = STATUS_COLORS[apt.status] || STATUS_COLORS.CONFIRMED;
                return (
                  <TableRow key={apt._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ py: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                        #{apt.bookingRef}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        ⏰ {apt.startTime} - {apt.endTime} ({apt.durationMinutes}m)
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                        {apt.customerName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                        📞 {apt.customerPhone}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                        {apt.serviceName}
                      </Typography>
                      {apt.price > 0 && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                          ₹{apt.price}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                        {apt.staffName}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Chip
                        label={apt.status}
                        size="small"
                        sx={{
                          bgcolor: sColor.bg,
                          color: sColor.text,
                          border: `1px solid ${sColor.border}`,
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 22
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 1 }}>
                      <Chip
                        label={apt.bookingSource === 'WHATSAPP_BOT' ? '🤖 WhatsApp Bot' : '🏢 Walk-In'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.68rem', fontWeight: 600, height: 22 }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setStatusActionOpen(true);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: '0.72rem', py: 0.3, px: 1.5 }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Walk-In Booking Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <span>+ Create {terminology.bookingActionLabel || 'Walk-In Booking'}</span>
          <IconButton onClick={() => setModalOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateAppointment}>
          <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={`${terminology.clientLabel} Full Name *`}
                  fullWidth
                  size="small"
                  required
                  value={modalForm.customerName}
                  onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="WhatsApp Phone Number *"
                  fullWidth
                  size="small"
                  required
                  value={modalForm.customerPhone}
                  onChange={(e) => setModalForm({ ...modalForm, customerPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label={`Select ${terminology.serviceLabel} *`}
                  fullWidth
                  size="small"
                  required
                  value={modalForm.serviceId}
                  onChange={(e) => setModalForm({ ...modalForm, serviceId: e.target.value })}
                >
                  {services.map((srv) => (
                    <MenuItem key={srv._id} value={srv._id} sx={{ fontSize: '0.85rem' }}>
                      {srv.name} ({srv.durationMinutes}m) - ₹{srv.price}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label={`Select ${terminology.staffLabel} *`}
                  fullWidth
                  size="small"
                  required
                  value={modalForm.staffId}
                  onChange={(e) => setModalForm({ ...modalForm, staffId: e.target.value })}
                >
                  {staffList.map((st) => (
                    <MenuItem key={st._id} value={st._id} sx={{ fontSize: '0.85rem' }}>
                      {st.name} ({st.designation || 'Specialist'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Appointment Date *"
                  fullWidth
                  size="small"
                  required
                  value={modalForm.date}
                  onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Available Slot *"
                  fullWidth
                  size="small"
                  required
                  value={modalForm.startTime}
                  onChange={(e) => setModalForm({ ...modalForm, startTime: e.target.value })}
                  disabled={slotsLoading || availableSlots.length === 0}
                >
                  {slotsLoading ? (
                    <MenuItem disabled sx={{ fontSize: '0.85rem' }}>Loading slots...</MenuItem>
                  ) : availableSlots.length === 0 ? (
                    <MenuItem disabled sx={{ fontSize: '0.85rem' }}>No slots available</MenuItem>
                  ) : (
                    availableSlots.map((slot) => (
                      <MenuItem key={slot.startTime} value={slot.startTime} sx={{ fontSize: '0.85rem' }}>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes / Special Requests (Optional)"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
            >
              {formSubmitting ? 'Confirming...' : 'Confirm Appointment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Management Modal */}
      <Dialog open={statusActionOpen} onClose={() => setStatusActionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
          Manage Booking #{selectedAppointment?.bookingRef}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 2 }}>
            Update consultation status for <b>{selectedAppointment?.customerName}</b>:
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="contained"
              onClick={() => handleUpdateStatus('CONFIRMED')}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✓ Mark as Confirmed
            </Button>
            <Button
              variant="contained"
              onClick={() => handleUpdateStatus('IN_PROGRESS')}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ⏳ In-Progress / In-Consultation
            </Button>
            <Button
              variant="contained"
              onClick={() => handleUpdateStatus('COMPLETED')}
              sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
            >
              🌟 Mark as Completed
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleUpdateStatus('CANCELLED')}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✕ Cancel Appointment
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setStatusActionOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
