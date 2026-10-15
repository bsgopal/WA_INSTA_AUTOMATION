import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Switch,
  FormControlLabel, CircularProgress, Stack, MenuItem, Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';

export default function AppointmentStaff() {
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    designation: '',
    email: '',
    phone: '',
    whatsappAlertNumber: '',
    notifyOnBooking: true,
    servicesOffered: [],
    isActive: true,
    colorCode: '#3b82f6'
  });

  const terminology = {
    staffLabel: settings?.customTerminology?.staffLabel || settings?.terminology?.staffLabel || 'Doctor / Specialist',
    staffLabelPlural: settings?.customTerminology?.staffLabelPlural || settings?.terminology?.staffLabelPlural || 'Doctors / Specialists',
    serviceLabel: settings?.customTerminology?.serviceLabel || settings?.terminology?.serviceLabel || 'Treatment',
    serviceLabelPlural: settings?.customTerminology?.serviceLabelPlural || settings?.terminology?.serviceLabelPlural || 'Treatments',
    addStaffBtnText: settings?.customTerminology?.addStaffBtnText || settings?.terminology?.addStaffBtnText,
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stfRes, srvRes, settRes] = await Promise.all([
        apiClient.get('/appointment-settings/staff'),
        apiClient.get('/appointment-settings/services'),
        apiClient.get('/appointment-settings')
      ]);
      setStaffList(stfRes.data.staff || []);
      setServices(srvRes.data.services || []);
      setSettings(settRes.data.settings || {});
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setForm({
      name: '',
      designation: '',
      email: '',
      phone: '',
      whatsappAlertNumber: '',
      notifyOnBooking: true,
      servicesOffered: [],
      isActive: true,
      colorCode: '#3b82f6'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStaff(st);
    setForm({
      name: st.name || '',
      designation: st.designation || '',
      email: st.email || '',
      phone: st.phone || '',
      whatsappAlertNumber: st.whatsappAlertNumber || '',
      notifyOnBooking: st.notifyOnBooking !== false,
      servicesOffered: (st.servicesOffered || []).map(s => s._id || s),
      isActive: st.isActive !== false,
      colorCode: st.colorCode || '#3b82f6'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      if (editingStaff) {
        await apiClient.put(`/appointment-settings/staff/${editingStaff._id}`, form);
      } else {
        await apiClient.post('/appointment-settings/staff', form);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${terminology.staffLabel} "${name}"?`)) return;
    try {
      await apiClient.delete(`/appointment-settings/staff/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            👨‍⚕️ {terminology.staffLabelPlural} Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage staff profiles, designated specialties, and configure instant WhatsApp booking alert numbers.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={fetchData}
            startIcon={<RefreshIcon />}
            sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {terminology.addStaffBtnText || `Add ${terminology.staffLabel}`}
          </Button>
        </Stack>
      </Box>

      {/* Staff Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>NAME / DESIGNATION</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>WHATSAPP ALERT NUMBER</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>SERVICES ASSIGNED</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>Loading staff directory...</Typography>
                </TableCell>
              </TableRow>
            ) : staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700 }}>No Staff Registered</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    Click "+ Add {terminology.staffLabel}" to register your first team member.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((st) => (
                <TableRow key={st._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: st.colorCode || '#3b82f6' }} />
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          {st.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {st.designation || terminology.staffLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {st.whatsappAlertNumber ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <WhatsAppIcon sx={{ color: '#25D366', fontSize: 16 }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                          {st.whatsappAlertNumber}
                        </Typography>
                        {st.notifyOnBooking && (
                          <Chip label="Instant Alerts Active" size="small" sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontSize: '0.65rem', fontWeight: 800 }} />
                        )}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>No alert number set</Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {st.servicesOffered && st.servicesOffered.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {st.servicesOffered.map((srv) => (
                          <Chip key={srv._id || srv} label={srv.name || srv} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        ))}
                      </Box>
                    ) : (
                      <Chip label="Offers All Services" size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontSize: '0.7rem', fontWeight: 600 }} />
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={st.isActive ? 'Active' : 'On Leave / Inactive'}
                      size="small"
                      sx={{
                        bgcolor: st.isActive ? '#ecfdf5' : '#f1f5f9',
                        color: st.isActive ? '#065f46' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(st)} sx={{ color: '#64748b' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(st._id, st.name)} sx={{ color: '#ef4444' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Staff Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{editingStaff ? `Edit ${terminology.staffLabel}` : `+ Add New ${terminology.staffLabel}`}</span>
          <IconButton onClick={() => setModalOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={`${terminology.staffLabel} Full Name *`}
                  fullWidth
                  required
                  size="small"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Designation / Role"
                  fullWidth
                  size="small"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Senior Dental Surgeon, Master Stylist"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  size="small"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  size="small"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* WhatsApp Alerts Configuration */}
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsAppIcon sx={{ fontSize: 18 }} /> WhatsApp Instant Booking Notification
              </Typography>
              <TextField
                label="Staff Member WhatsApp Number"
                helperText="New booking details will be sent directly to this number via WhatsApp"
                fullWidth
                size="small"
                value={form.whatsappAlertNumber}
                onChange={(e) => setForm({ ...form, whatsappAlertNumber: e.target.value })}
                placeholder="e.g. 919876543210"
                sx={{ mb: 1, bgcolor: '#ffffff' }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.notifyOnBooking}
                    onChange={(e) => setForm({ ...form, notifyOnBooking: e.target.checked })}
                    color="success"
                  />
                }
                label={<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>Send WhatsApp notification whenever client books an appointment</Typography>}
              />
            </Box>

            {/* Services Assignment */}
            <TextField
              select
              label={`Assigned ${terminology.serviceLabelPlural} (Leave empty for All)`}
              fullWidth
              size="small"
              SelectProps={{
                multiple: true,
                renderValue: (selected) => {
                  if (selected.length === 0) return 'All Services';
                  return services
                    .filter(s => selected.includes(s._id))
                    .map(s => s.name)
                    .join(', ');
                }
              }}
              value={form.servicesOffered}
              onChange={(e) => setForm({ ...form, servicesOffered: e.target.value })}
            >
              {services.map((srv) => (
                <MenuItem key={srv._id} value={srv._id}>
                  <Checkbox checked={form.servicesOffered.indexOf(srv._id) > -1} />
                  <ListItemText primary={`${srv.name} (${srv.durationMinutes}m)`} />
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  color="success"
                />
              }
              label={<Typography sx={{ fontWeight: 700 }}>Active (Accepting WhatsApp Appointments)</Typography>}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
            >
              {formSubmitting ? 'Saving...' : 'Save Staff Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
