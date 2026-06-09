import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, LinearProgress, Tooltip, Menu, Stack, Card, CardContent,
  FormControl, InputLabel, Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SendIcon from '@mui/icons-material/Send';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PROMOTIONAL',
    channels: [],
    targetSegment: 'ALL',
    message: '',
    scheduledAt: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    draft: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/campaigns');
      setCampaigns(response.data.campaigns);
      
      // Calculate stats
      const total = response.data.campaigns.length;
      const active = response.data.campaigns.filter(c => c.status === 'RUNNING').length;
      const completed = response.data.campaigns.filter(c => c.status === 'COMPLETED').length;
      const draft = response.data.campaigns.filter(c => c.status === 'DRAFT').length;
      
      setStats({ total, active, completed, draft });
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async (campaignId) => {
    try {
      await apiClient.post(`/campaigns/${campaignId}/launch`);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to launch campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaignId) => {
    try {
      await apiClient.post(`/campaigns/${campaignId}/pause`);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }
    try {
      await apiClient.delete(`/campaigns/${campaignId}`);
      setSnackbar({
        open: true,
        message: 'Campaign deleted successfully!',
        severity: 'success'
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete campaign. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.message || formData.channels.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/campaigns', formData);
      setSnackbar({
        open: true,
        message: 'Campaign created successfully!',
        severity: 'success'
      });
      setTimeout(() => {
        setOpenDialog(false);
        setFormData({
          name: '',
          description: '',
          type: 'PROMOTIONAL',
          channels: [],
          targetSegment: 'ALL',
          message: '',
          scheduledAt: ''
        });
        fetchCampaigns();
      }, 1500);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SCHEDULED: 'info',
      RUNNING: 'success',
      PAUSED: 'warning',
      COMPLETED: 'primary',
      FAILED: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage your marketing campaigns
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disableElevation
        >
          New Campaign
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Campaigns
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: '50%' }}>
                  <TrendingUpIcon color="primary" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Active
                  </Typography>
                  <Typography variant="h4" color="success.main">{stats.active}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'success.50', p: 1.5, borderRadius: '50%' }}>
                  <PlayArrowIcon color="success" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4">{stats.completed}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'info.50', p: 1.5, borderRadius: '50%' }}>
                  <SendIcon color="info" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Draft
                  </Typography>
                  <Typography variant="h4">{stats.draft}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: '50%' }}>
                  <PeopleIcon color="action" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Campaigns Table */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Channels</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="right">Sent</TableCell>
              <TableCell align="right">Delivered</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No campaigns yet. Create your first campaign to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {campaign.name}
                    </Typography>
                    {campaign.description && (
                      <Typography variant="caption" color="text.secondary">
                        {campaign.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={campaign.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={campaign.status}
                      size="small"
                      color={getStatusColor(campaign.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {campaign.channels.map((channel) => (
                        <Chip key={channel} label={channel} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{campaign.totalTargets || 0}</TableCell>
                  <TableCell align="right">{campaign.totalSent || 0}</TableCell>
                  <TableCell align="right">{campaign.totalDelivered || 0}</TableCell>
                  <TableCell align="right">
                    {campaign.deliveryRate ? `${campaign.deliveryRate.toFixed(1)}%` : '0%'}
                  </TableCell>
                  <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {campaign.status === 'DRAFT' && (
                        <Tooltip title="Launch">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleLaunchCampaign(campaign._id)}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {campaign.status === 'RUNNING' && (
                        <Tooltip title="Pause">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handlePauseCampaign(campaign._id)}
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Campaign Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Create New Campaign</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Campaign Name *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Sale 2024"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Campaign description"
            />
            <FormControl fullWidth>
              <InputLabel>Campaign Type</InputLabel>
              <Select
                value={formData.type}
                label="Campaign Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="PROMOTIONAL">Promotional</MenuItem>
                <MenuItem value="TRANSACTIONAL">Transactional</MenuItem>
                <MenuItem value="NEWSLETTER">Newsletter</MenuItem>
                <MenuItem value="REMINDER">Reminder</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Channels *
              </Typography>
              <Stack direction="row" spacing={1}>
                {['whatsapp', 'instagram'].map(channel => (
                  <Chip
                    key={channel}
                    label={channel.charAt(0).toUpperCase() + channel.slice(1)}
                    onClick={() => handleToggleChannel(channel)}
                    color={formData.channels.includes(channel) ? 'primary' : 'default'}
                    variant={formData.channels.includes(channel) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Target Segment</InputLabel>
              <Select
                value={formData.targetSegment}
                label="Target Segment"
                onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
              >
                <MenuItem value="ALL">All Customers</MenuItem>
                <MenuItem value="VIP">VIP Customers</MenuItem>
                <MenuItem value="LOYAL">Loyal Customers</MenuItem>
                <MenuItem value="NEW">New Customers</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Message *"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your campaign message"
            />
            <TextField
              label="Schedule (Optional)"
              type="datetime-local"
              fullWidth
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={handleCreateCampaign}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
