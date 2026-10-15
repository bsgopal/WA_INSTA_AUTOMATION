import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Switch,
  FormControlLabel, CircularProgress, Stack, MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  MedicalServices as ServiceIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';

export const formatDurationDisplay = (totalMinutes) => {
  const mins = parseInt(totalMinutes, 10) || 0;
  if (mins <= 0) return '0 mins';
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0 && remainingMins > 0) {
    return `${hrs} hr ${remainingMins} mins`;
  } else if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  }
  return `${mins} mins`;
};

const DURATION_PRESETS = [
  { label: '15 mins', minutes: 15 },
  { label: '30 mins', minutes: 30 },
  { label: '45 mins', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '1 hr 30m', minutes: 90 },
  { label: '2 Hours', minutes: 120 },
  { label: '3 Hours', minutes: 180 }
];

export default function AppointmentServices() {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'General',
    durationMinutes: 30,
    price: 0,
    currency: 'INR',
    isActive: true,
    colorCode: '#10b981'
  });

  const terminology = {
    serviceLabel: settings?.customTerminology?.serviceLabel || settings?.terminology?.serviceLabel || 'Treatment / Service',
    serviceLabelPlural: settings?.customTerminology?.serviceLabelPlural || settings?.terminology?.serviceLabelPlural || 'Treatments / Services',
    addServiceBtnText: settings?.customTerminology?.addServiceBtnText || settings?.terminology?.addServiceBtnText,
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [srvRes, settRes] = await Promise.all([
        apiClient.get('/appointment-settings/services'),
        apiClient.get('/appointment-settings')
      ]);
      setServices(srvRes.data.services || []);
      setSettings(settRes.data.settings || {});
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setForm({
      name: '',
      description: '',
      category: 'General',
      durationMinutes: 30,
      price: 0,
      currency: 'INR',
      isActive: true,
      colorCode: '#10b981'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setForm({
      name: srv.name || '',
      description: srv.description || '',
      category: srv.category || 'General',
      durationMinutes: srv.durationMinutes !== undefined ? srv.durationMinutes : 30,
      price: srv.price !== undefined ? srv.price : 0,
      currency: srv.currency || 'INR',
      isActive: srv.isActive !== false,
      colorCode: srv.colorCode || '#10b981'
    });
    setModalOpen(true);
  };

  const currentHours = Math.floor((parseInt(form.durationMinutes, 10) || 0) / 60);
  const currentMinutes = (parseInt(form.durationMinutes, 10) || 0) % 60;

  const handleSetHoursAndMinutes = (newHrs, newMins) => {
    const total = (Math.max(0, parseInt(newHrs, 10) || 0) * 60) + Math.max(0, parseInt(newMins, 10) || 0);
    setForm(prev => ({ ...prev, durationMinutes: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const payload = {
        ...form,
        durationMinutes: Math.max(1, parseInt(form.durationMinutes, 10) || 15),
        price: Math.max(0, parseFloat(form.price) || 0)
      };
      if (editingService) {
        await apiClient.put(`/appointment-settings/services/${editingService._id}`, payload);
      } else {
        await apiClient.post('/appointment-settings/services', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${terminology.serviceLabel} "${name}"?`)) return;
    try {
      await apiClient.delete(`/appointment-settings/services/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            🩺 {terminology.serviceLabelPlural} Catalog
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Create and manage available procedures, durations, and pricing offered to your clients.
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
            {terminology.addServiceBtnText || `Add ${terminology.serviceLabel}`}
          </Button>
        </Stack>
      </Box>

      {/* Services Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>SERVICE NAME</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>CATEGORY</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>DURATION</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>PRICE</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>Loading services...</Typography>
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700 }}>No Services Registered</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    Click "+ Add {terminology.serviceLabel}" to create your first offering.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              services.map((srv) => (
                <TableRow key={srv._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: srv.colorCode || '#10b981' }} />
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                          {srv.name}
                        </Typography>
                        {srv.description && (
                          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {srv.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ py: 1 }}>
                    <Chip label={srv.category || 'General'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                  </TableCell>

                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: '0.8rem !important', color: '#0284c7' }} />}
                      label={formatDurationDisplay(srv.durationMinutes)}
                      size="small"
                      sx={{ bgcolor: '#f0f9ff', color: '#0369a1', fontWeight: 700, fontSize: '0.72rem', height: 24, border: '1px solid #bae6fd' }}
                    />
                  </TableCell>

                  <TableCell sx={{ py: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: srv.price > 0 ? '#059669' : '#64748b' }}>
                      {srv.price > 0 ? `₹${srv.price}` : 'Free / Quote'}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={srv.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: srv.isActive ? '#ecfdf5' : '#f1f5f9',
                        color: srv.isActive ? '#065f46' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 22
                      }}
                    />
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1 }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(srv)} sx={{ color: '#64748b' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(srv._id, srv.name)} sx={{ color: '#ef4444' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <span>{editingService ? `Edit ${terminology.serviceLabel}` : `+ Add New ${terminology.serviceLabel}`}</span>
          <IconButton onClick={() => setModalOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Service Name */}
            <TextField
              label={`${terminology.serviceLabel} Name`}
              fullWidth
              required
              size="small"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Teeth Whitening, Hair Spa, Full Body Checkup"
            />

            {/* Category & Color */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Category"
                  fullWidth
                  size="small"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Dental, Consultation, Diagnostics"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Color Tag"
                  type="color"
                  fullWidth
                  size="small"
                  value={form.colorCode}
                  onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                  sx={{ '& input': { height: 23, cursor: 'pointer' } }}
                />
              </Grid>
            </Grid>

            {/* DURATION CONFIGURATION SECTION */}
            <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ScheduleIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                    Procedure Duration
                  </Typography>
                </Box>
                <Chip
                  label={`⏱️ Total: ${formatDurationDisplay(form.durationMinutes)} (${form.durationMinutes || 0} mins)`}
                  size="small"
                  sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #a7f3d0' }}
                />
              </Box>

              {/* Hours & Minutes Dual Controls */}
              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Hours"
                    size="small"
                    fullWidth
                    value={currentHours}
                    onChange={(e) => handleSetHoursAndMinutes(e.target.value, currentMinutes)}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 8].map((h) => (
                      <MenuItem key={h} value={h}>
                        {h} {h === 1 ? 'Hour' : 'Hours'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    select
                    label="Minutes"
                    size="small"
                    fullWidth
                    value={currentMinutes}
                    onChange={(e) => handleSetHoursAndMinutes(currentHours, e.target.value)}
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 40, 45, 50, 55].map((m) => (
                      <MenuItem key={m} value={m}>
                        {m} Minutes
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Quick Preset Buttons */}
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', mb: 0.75, textTransform: 'uppercase' }}>
                  Quick Preset Durations:
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected = parseInt(form.durationMinutes, 10) === preset.minutes;
                    return (
                      <Chip
                        key={preset.minutes}
                        label={preset.label}
                        onClick={() => setForm(prev => ({ ...prev, durationMinutes: preset.minutes }))}
                        size="small"
                        sx={{
                          cursor: 'pointer',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.72rem',
                          bgcolor: isSelected ? '#0f172a' : '#ffffff',
                          color: isSelected ? '#ffffff !important' : '#334155',
                          border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                          '&:hover': {
                            bgcolor: isSelected ? '#1e293b' : '#f1f5f9'
                          }
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>

              {/* Direct Total Minutes Input */}
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Or enter exact minutes:
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={form.durationMinutes === '' ? '' : form.durationMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      durationMinutes: val === '' ? '' : Math.max(0, parseInt(val, 10) || 0)
                    }));
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                  sx={{ width: 120, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 } }}
                />
              </Box>
            </Paper>

            {/* Price */}
            <TextField
              type="number"
              label="Price (₹)"
              fullWidth
              size="small"
              value={form.price === '' ? '' : form.price}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => ({
                  ...prev,
                  price: val === '' ? '' : parseFloat(val) || 0
                }));
              }}
              placeholder="0 for Free Consultation"
            />

            {/* Description */}
            <TextField
              label="Description & Instructions"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Instructions provided to patient regarding preparation or details"
            />

            {/* Active Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  color="success"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Active (Available for WhatsApp Booking)</Typography>}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, textTransform: 'none', px: 2.5 }}
            >
              {formSubmitting ? 'Saving...' : 'Save Service'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
