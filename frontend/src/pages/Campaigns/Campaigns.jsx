import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, LinearProgress, Tooltip, Menu, Stack, Card, CardContent,
  FormControl, InputLabel, Select, Tabs, Tab, Alert
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    type: 'ONE_TIME',
    channels: [],
    targetSegment: 'ALL',
    messageTemplate: '',
    messageType: 'TEXT',
    mediaType: 'none',
    mediaUrl: '',
    mediaPreviewData: '',
    mediaMimeType: '',
    mediaFileName: '',
    buttonLabel: '',
    buttonUrl: '',
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
  const [templates, setTemplates] = useState([]);

  // Manual send dialog states
  const [openManualSendDialog, setOpenManualSendDialog] = useState(false);
  const [manualSendCustomers, setManualSendCustomers] = useState([]);
  const [manualSendLoading, setManualSendLoading] = useState(false);
  const [manualSendSending, setManualSendSending] = useState(false);
  const [manualSendSelected, setManualSendSelected] = useState([]);
  const [selectedManualCampaignId, setSelectedManualCampaignId] = useState('');
  const [manualSendSearch, setManualSendSearch] = useState('');
  const [manualSendFilter, setManualSendFilter] = useState('');
  const [manualSendSelectAllFiltered, setManualSendSelectAllFiltered] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [campaignMediaFile, setCampaignMediaFile] = useState(null);
  const [editCampaignMediaFile, setEditCampaignMediaFile] = useState(null);

  // View & Edit dialog states
  const [detailsTab, setDetailsTab] = useState(0);
  const [campaignTargets, setCampaignTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    topic: '',
    description: '',
    type: 'ONE_TIME',
    channels: [],
    targetSegment: 'ALL',
    messageTemplate: '',
    messageType: 'TEXT',
    mediaType: 'none',
    mediaUrl: '',
    mediaPreviewData: '',
    mediaMimeType: '',
    mediaFileName: '',
    buttonLabel: '',
    buttonUrl: '',
    scheduledAt: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchCampaignTargets = async (campaignId) => {
    try {
      setLoadingTargets(true);
      const res = await apiClient.get(`/campaigns/${campaignId}/targets`);
      setCampaignTargets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch campaign targets:', err);
    } finally {
      setLoadingTargets(false);
    }
  };

  const fetchManualSendCustomers = async (overrides = {}) => {
    const searchValue = overrides.search ?? manualSendSearch;
    const filterValue = overrides.filter ?? manualSendFilter;
    try {
      setManualSendLoading(true);
      const params = {
        page: 1,
        limit: 100
      };
      if (filterValue) params.segment = filterValue;
      if (searchValue) params.search = searchValue;
      const res = await apiClient.get('/customers', { params });
      setManualSendCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers for manual send:', err);
    } finally {
      setManualSendLoading(false);
    }
  };

  const openManualSendForCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setManualSendCustomers([]);
    setManualSendSelected([]);
    setManualSendSearch('');
    setManualSendFilter('');
    setManualSendSelectAllFiltered(false);
    setOpenManualSendDialog(true);
    await fetchManualSendCustomers({ search: '', filter: '' });
  };

  const closeManualSendDialog = () => {
    setOpenManualSendDialog(false);
    setManualSendSelected([]);
    setManualSendCustomers([]);
    setManualSendSearch('');
    setManualSendFilter('');
    setManualSendSelectAllFiltered(false);
  };

  const handleManualSend = async () => {
    if (!manualSendSelectAllFiltered && (!manualSendSelected || manualSendSelected.length === 0)) {
      alert('Please select at least one customer');
      return;
    }
    try {
      setManualSendSending(true);
      const response = await apiClient.post(`/campaigns/${selectedCampaign._id}/manual-send`, {
        customerIds: manualSendSelectAllFiltered ? [] : manualSendSelected,
        sendToAll: manualSendSelectAllFiltered,
        segmentFilter: manualSendFilter || null,
        searchTerm: manualSendSearch || null
      });
      const { successCount = 0, failCount = 0 } = response.data || {};
      setSnackbar({
        open: true,
        message: response.data?.message || `Manual send request queued successfully`,
        severity: failCount > 0 ? 'warning' : 'success'
      });
      closeManualSendDialog();
    } catch (error) {
      console.error('Failed to send manual message:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to send message',
        severity: 'error'
      });
    } finally {
      setManualSendSending(false);
    }
  };

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

  const uploadCampaignMedia = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    setMediaUploading(true);
    try {
      const response = await apiClient.post('/campaigns/media/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } finally {
      setMediaUploading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.topic || !formData.messageTemplate || formData.channels.length === 0) {
      alert('Please fill in all required fields (Name, Topic, Message Template, and Channels)');
      return;
    }

    try {
      setSubmitting(true);
      let uploadedMedia = null;
      if (formData.mediaType !== 'none') {
        if (campaignMediaFile) {
          uploadedMedia = await uploadCampaignMedia(campaignMediaFile);
        } else if (!formData.mediaUrl) {
          alert('Please upload a media file for this campaign.');
          return;
        }
      }

      const payload = {
        name: formData.name,
        topic: formData.topic,
        description: formData.description,
        type: 'ONE_TIME',
        channels: formData.channels,
        messageTemplate: formData.messageTemplate,
        messageType: formData.messageType || 'TEXT',
        mediaType: uploadedMedia?.mediaType || formData.mediaType || 'none',
        mediaUrl: uploadedMedia?.mediaUrl || formData.mediaUrl || '',
        mediaPreviewData: uploadedMedia?.mediaPreviewData || formData.mediaPreviewData || '',
        mediaMimeType: uploadedMedia?.mediaMimeType || formData.mediaMimeType || '',
        mediaFileName: uploadedMedia?.mediaFileName || formData.mediaFileName || '',
        buttonLabel: formData.buttonLabel || '',
        buttonUrl: formData.buttonUrl || '',
        targetAudience: {
          segments: formData.targetSegment === 'ALL' ? [] : [formData.targetSegment],
          languages: [],
          loyaltyTiers: []
        },
        scheduledAt: formData.scheduledAt || undefined
      };

      await apiClient.post('/campaigns', payload);
      setSnackbar({
        open: true,
        message: 'Campaign created successfully!',
        severity: 'success'
      });
      setTimeout(() => {
        setOpenDialog(false);
        setFormData({
          name: '',
          topic: '',
          description: '',
          type: 'ONE_TIME',
          channels: [],
          targetSegment: 'ALL',
          messageTemplate: '',
          messageType: 'TEXT',
          mediaType: 'none',
          mediaUrl: '',
          mediaPreviewData: '',
          mediaMimeType: '',
          mediaFileName: '',
          buttonLabel: '',
          buttonUrl: '',
          scheduledAt: ''
        });
        setCampaignMediaFile(null);
        fetchCampaigns();
      }, 1500);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editFormData.name || !editFormData.topic || !editFormData.messageTemplate || editFormData.channels.length === 0) {
      alert('Please fill in all required fields (Name, Topic, Message Template, and Channels)');
      return;
    }

    try {
      setSubmitting(true);
      let uploadedMedia = null;
      if (editFormData.mediaType !== 'none' && editCampaignMediaFile) {
        uploadedMedia = await uploadCampaignMedia(editCampaignMediaFile);
      } else if (editFormData.mediaType !== 'none' && !editFormData.mediaUrl) {
        alert('Please upload a media file for this campaign.');
        return;
      }

      const payload = {
        name: editFormData.name,
        topic: editFormData.topic,
        description: editFormData.description,
        type: 'ONE_TIME',
        channels: editFormData.channels,
        messageTemplate: editFormData.messageTemplate,
        messageType: editFormData.messageType || 'TEXT',
        mediaType: uploadedMedia?.mediaType || editFormData.mediaType || 'none',
        mediaUrl: uploadedMedia?.mediaUrl || editFormData.mediaUrl || '',
        mediaPreviewData: uploadedMedia?.mediaPreviewData || editFormData.mediaPreviewData || '',
        mediaMimeType: uploadedMedia?.mediaMimeType || editFormData.mediaMimeType || '',
        mediaFileName: uploadedMedia?.mediaFileName || editFormData.mediaFileName || '',
        buttonLabel: editFormData.buttonLabel || '',
        buttonUrl: editFormData.buttonUrl || '',
        targetAudience: {
          segments: editFormData.targetSegment === 'ALL' ? [] : [editFormData.targetSegment],
          languages: [],
          loyaltyTiers: []
        },
        scheduledAt: editFormData.scheduledAt || undefined
      };

      await apiClient.put(`/campaigns/${selectedCampaign._id}`, payload);
      setSnackbar({
        open: true,
        message: 'Campaign updated successfully!',
        severity: 'success'
      });
      setOpenDetailsDialog(false);
      setEditCampaignMediaFile(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign:', error);
      alert(error.response?.data?.error || 'Failed to update campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEditChannel = (channel) => {
    setEditFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
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

  const renderCampaignMediaPreview = (mediaUrl, mediaType, mediaFileName) => {
    if (!mediaUrl || mediaType === 'none') return null;

    if (mediaType === 'image') {
      return (
        <Box
          component="img"
          src={mediaUrl}
          alt={mediaFileName || 'Campaign media'}
          sx={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 2, border: '1px solid #e2e8f0' }}
        />
      );
    }

    if (mediaType === 'video') {
      return (
        <Box
          component="video"
          src={mediaUrl}
          controls
          sx={{ width: '100%', maxHeight: 260, borderRadius: 2, border: '1px solid #e2e8f0' }}
        />
      );
    }

    if (mediaType === 'document') {
      return (
        <Box
          component="iframe"
          src={mediaUrl}
          title={mediaFileName || 'Campaign document'}
          sx={{ width: '100%', height: 320, border: '1px solid #e2e8f0', borderRadius: 2 }}
        />
      );
    }

    return null;
  };

  const loadFileAsDataUrl = (file, onLoad) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLoad(reader.result);
    };
    reader.readAsDataURL(file);
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
          onClick={() => {
            setCampaignMediaFile(null);
            setOpenDialog(true);
          }}
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
      <Paper elevation={0} sx={{ overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e5e7eb' }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Campaign List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select one campaign to send its message manually.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {selectedManualCampaignId && (
              <Chip
                label={campaigns.find(item => item._id === selectedManualCampaignId)?.name || '1 selected'}
                color="primary"
                variant="outlined"
              />
            )}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SendIcon />}
              disabled={!selectedManualCampaignId}
              onClick={() => {
                const campaign = campaigns.find(item => item._id === selectedManualCampaignId);
                if (campaign) {
                  openManualSendForCampaign(campaign);
                }
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 2.5 }}
            >
              Manual Send
            </Button>
          </Stack>
        </Stack>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 72 }}>Select</TableCell>
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
                <TableCell colSpan={11}>
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No campaigns yet. Create your first campaign to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow
                  key={campaign._id}
                  hover
                  selected={selectedManualCampaignId === campaign._id}
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setDetailsTab(0);
                    setEditFormData({
                      name: campaign.name,
                      topic: campaign.topic || '',
                      description: campaign.description || '',
                      type: campaign.type || 'ONE_TIME',
                      channels: campaign.channels || [],
                      targetSegment: campaign.targetAudience?.segments?.[0] || 'ALL',
                      messageTemplate: campaign.messageTemplate?._id || campaign.messageTemplate || '',
                      messageType: campaign.messageType || 'TEXT',
                      mediaType: campaign.mediaType || 'none',
                      mediaUrl: campaign.mediaUrl || '',
                      mediaPreviewData: campaign.mediaPreviewData || '',
                      mediaMimeType: campaign.mediaMimeType || '',
                      mediaFileName: campaign.mediaFileName || '',
                      buttonLabel: campaign.buttonLabel || '',
                      buttonUrl: campaign.buttonUrl || '',
                      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
                    });
                    setEditCampaignMediaFile(null);
                    setOpenDetailsDialog(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': {
                      backgroundColor: '#eef6ff'
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: '#e3f0ff'
                    }
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Radio
                      checked={selectedManualCampaignId === campaign._id}
                      onChange={(e) => {
                        setSelectedManualCampaignId(e.target.checked ? campaign._id : '');
                      }}
                      value={campaign._id}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {campaign.name}
                    </Typography>
                    {campaign.topic && (
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.primary' }}>
                        Topic: {campaign.topic}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchCampaign(campaign._id);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePauseCampaign(campaign._id);
                            }}
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(campaign);
                            setDetailsTab(0);
                            setEditFormData({
                              name: campaign.name,
                              topic: campaign.topic || '',
                              description: campaign.description || '',
                              type: campaign.type || 'ONE_TIME',
                              channels: campaign.channels || [],
                              targetSegment: campaign.targetAudience?.segments?.[0] || 'ALL',
                              messageTemplate: campaign.messageTemplate?._id || campaign.messageTemplate || '',
                              messageType: campaign.messageType || 'TEXT',
                              mediaType: campaign.mediaType || 'none',
                              mediaUrl: campaign.mediaUrl || '',
                              mediaPreviewData: campaign.mediaPreviewData || '',
                              mediaMimeType: campaign.mediaMimeType || '',
                              mediaFileName: campaign.mediaFileName || '',
                              buttonLabel: campaign.buttonLabel || '',
                              buttonUrl: campaign.buttonUrl || '',
                              scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
                            });
                            setEditCampaignMediaFile(null);
                            setOpenDetailsDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign._id);
                          }}
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
      </Paper>

      {/* Create Campaign Dialog */}
      <Dialog open={openDialog} onClose={() => { setCampaignMediaFile(null); setOpenDialog(false); }} maxWidth="lg" fullWidth>
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
              label="Campaign Topic *"
              fullWidth
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Seasonal Discount, Product Launch, Customer Support"
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
            <FormControl fullWidth>
              <InputLabel id="template-select-label">Select Message Template *</InputLabel>
              <Select
                labelId="template-select-label"
                value={formData.messageTemplate}
                label="Select Message Template *"
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedTpl = templates.find(t => t._id === selectedId);
                  setFormData({
                    ...formData,
                    messageTemplate: selectedId,
                    messageType: selectedTpl ? (selectedTpl.type || 'TEXT') : 'TEXT'
                  });
                }}
              >
                {templates.map(tpl => (
                  <MenuItem key={tpl._id} value={tpl._id}>
                    {tpl.name} ({tpl.category})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.messageTemplate && (
              <TextField
                label="Template Content Preview (Read Only)"
                fullWidth
                multiline
                rows={4}
                value={templates.find(t => t._id === formData.messageTemplate)?.content || ''}
                InputProps={{
                  readOnly: true,
                }}
                variant="filled"
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Media Type</InputLabel>
              <Select
                value={formData.mediaType}
                label="Media Type"
                onChange={(e) => {
                  const nextType = e.target.value;
                  setFormData({
                    ...formData,
                    mediaType: nextType,
                    mediaUrl: nextType === 'none' ? '' : formData.mediaUrl,
                    mediaPreviewData: nextType === 'none' ? '' : formData.mediaPreviewData,
                    mediaMimeType: nextType === 'none' ? '' : formData.mediaMimeType,
                    mediaFileName: nextType === 'none' ? '' : formData.mediaFileName
                  });
                  if (nextType === 'none') {
                    setCampaignMediaFile(null);
                  }
                }}
              >
                <MenuItem value="none">No media</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="document">PDF / Document</MenuItem>
              </Select>
            </FormControl>
            {formData.mediaType !== 'none' && (
              <Stack spacing={1}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                >
                  {formData.mediaType === 'document' ? 'Upload PDF' : 'Upload File'}
                  <input
                    hidden
                    type="file"
                    accept={formData.mediaType === 'document' ? 'application/pdf' : formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCampaignMediaFile(file);
                      if (file) {
                        loadFileAsDataUrl(file, (dataUrl) => {
                          setFormData(prev => ({
                            ...prev,
                            mediaPreviewData: dataUrl
                          }));
                        });
                        setFormData(prev => ({
                          ...prev,
                          mediaFileName: file.name,
                          mediaMimeType: file.type
                        }));
                      }
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {campaignMediaFile?.name || formData.mediaFileName || 'No file selected'}
                </Typography>
                {(formData.mediaPreviewData || formData.mediaUrl) && renderCampaignMediaPreview(formData.mediaPreviewData || formData.mediaUrl, formData.mediaType, formData.mediaFileName)}
              </Stack>
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Button Label (Optional)"
                fullWidth
                placeholder="Visit Website"
                value={formData.buttonLabel}
                onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
              />
              <TextField
                label="Button URL (Optional)"
                fullWidth
                placeholder="https://example.com"
                value={formData.buttonUrl}
                onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
              />
            </Stack>
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
          <Button onClick={() => { setCampaignMediaFile(null); setOpenDialog(false); }}>Cancel</Button>
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

      {/* Campaign Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => { setEditCampaignMediaFile(null); setOpenDetailsDialog(false); }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        {selectedCampaign && (
          <>
            {/* Header Banner - Google/Microsoft style */}
            <Box sx={{
              background: 'linear-gradient(90deg, #1e88e5 0%, #1565c0 100%)',
              color: '#ffffff',
              p: 3,
              boxSizing: 'border-box'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', mb: 0.5 }}>
                    {selectedCampaign.name}
                  </Typography>
                  {selectedCampaign.topic && (
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      Topic: {selectedCampaign.topic}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={selectedCampaign.status}
                  size="small"
                  sx={{ fontWeight: 600, px: 1, bgcolor: '#ffffff', color: '#1565c0' }}
                />
              </Stack>
            </Box>

            {/* View & Edit Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
              <Tabs
                value={detailsTab}
                onChange={(e, newValue) => setDetailsTab(newValue)}
                variant="fullWidth"
              >
                <Tab label="View Details" sx={{ textTransform: 'none', fontWeight: 600 }} />
                <Tab label="Edit Settings" sx={{ textTransform: 'none', fontWeight: 600 }} />
              </Tabs>
            </Box>

            {detailsTab === 0 && (
              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Description */}
                  {selectedCampaign.description && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 0.5 }}>
                        DESCRIPTION
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCampaign.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Campaign Settings Grid */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 0.5 }}>
                        CAMPAIGN TYPE
                      </Typography>
                      <Chip label={selectedCampaign.type} size="small" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 0.5 }}>
                        CHANNELS
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        {selectedCampaign.channels.map(ch => (
                          <Chip key={ch} label={ch} size="small" />
                        ))}
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 0.5 }}>
                        TARGET AUDIENCE
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {selectedCampaign.targetAudience?.segments?.length > 0
                          ? `Segments: ${selectedCampaign.targetAudience.segments.join(', ')}`
                          : 'All opted-in customers'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 0.5 }}>
                        CREATED AT
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {formatDate(selectedCampaign.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Delivery Stats & Progress bar */}
                  <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 1.5 }}>
                      DELIVERY PROGRESS
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={3}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#202124' }}>
                          {selectedCampaign.totalTargets || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Targets</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e88e5' }}>
                          {selectedCampaign.totalSent || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Sent</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#4caf50' }}>
                          {selectedCampaign.totalDelivered || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Delivered</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336' }}>
                          {selectedCampaign.totalFailed || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Failed</Typography>
                      </Grid>
                    </Grid>

                    {/* Progress Bar */}
                    {selectedCampaign.totalTargets > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Execution Progress
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {(((selectedCampaign.totalSent + selectedCampaign.totalFailed) / selectedCampaign.totalTargets) * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (((selectedCampaign.totalSent + selectedCampaign.totalFailed) / selectedCampaign.totalTargets) * 100))}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Message Template details */}
                  <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 1 }}>
                      MESSAGE TEMPLATE CONTENT
                    </Typography>
                  <Box sx={{
                      p: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                        {selectedCampaign.messageTemplate?.content || 'No template content loaded'}
                      </Typography>
                    </Box>
                    {(selectedCampaign.mediaUrl || selectedCampaign.buttonUrl) && (
                      <Stack spacing={1} sx={{ mt: 1.5 }}>
                        {selectedCampaign.mediaUrl && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Media: {selectedCampaign.mediaFileName || selectedCampaign.mediaType || 'file'}
                            </Typography>
                            {renderCampaignMediaPreview(
                              selectedCampaign.mediaPreviewData || selectedCampaign.mediaUrl,
                              selectedCampaign.mediaType,
                              selectedCampaign.mediaFileName
                            )}
                          </>
                        )}
                        {selectedCampaign.buttonUrl && (
                          <Typography variant="body2" color="text.secondary">
                            Button: {(selectedCampaign.buttonLabel || 'Open Link')} - {selectedCampaign.buttonUrl}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </DialogContent>
            )}

            {detailsTab === 1 && (
              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  {selectedCampaign.status === 'RUNNING' && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Cannot edit a running campaign. Please pause it first.
                    </Alert>
                  )}

                  <TextField
                    label="Campaign Name *"
                    fullWidth
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    disabled={selectedCampaign.status === 'RUNNING' || submitting}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <TextField
                    label="Campaign Topic *"
                    fullWidth
                    value={editFormData.topic}
                    onChange={(e) => setEditFormData({ ...editFormData, topic: e.target.value })}
                    disabled={selectedCampaign.status === 'RUNNING' || submitting}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    disabled={selectedCampaign.status === 'RUNNING' || submitting}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#5f6368' }}>
                      Channels *
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {['whatsapp', 'instagram'].map(channel => (
                        <Chip
                          key={channel}
                          label={channel.charAt(0).toUpperCase() + channel.slice(1)}
                          onClick={() => selectedCampaign.status !== 'RUNNING' && handleToggleEditChannel(channel)}
                          color={editFormData.channels.includes(channel) ? 'primary' : 'default'}
                          variant={editFormData.channels.includes(channel) ? 'filled' : 'outlined'}
                          disabled={selectedCampaign.status === 'RUNNING' || submitting}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>Target Segment</InputLabel>
                    <Select
                      value={editFormData.targetSegment}
                      label="Target Segment"
                      onChange={(e) => setEditFormData({ ...editFormData, targetSegment: e.target.value })}
                      disabled={selectedCampaign.status === 'RUNNING' || submitting}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="ALL">All Customers</MenuItem>
                      <MenuItem value="VIP">VIP Customers</MenuItem>
                      <MenuItem value="LOYAL">Loyal Customers</MenuItem>
                      <MenuItem value="NEW">New Customers</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="edit-template-select-label">Select Message Template *</InputLabel>
                    <Select
                      labelId="edit-template-select-label"
                      value={editFormData.messageTemplate}
                      label="Select Message Template *"
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedTpl = templates.find(t => t._id === selectedId);
                        setEditFormData({
                          ...editFormData,
                          messageTemplate: selectedId,
                          messageType: selectedTpl ? (selectedTpl.type || 'TEXT') : 'TEXT'
                        });
                      }}
                      disabled={selectedCampaign.status === 'RUNNING' || submitting}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {templates.map(tpl => (
                        <MenuItem key={tpl._id} value={tpl._id}>
                          {tpl.name} ({tpl.category})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {editFormData.messageTemplate && (
                    <Box sx={{
                      p: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                        TEMPLATE CONTENT PREVIEW:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                        {templates.find(t => t._id === editFormData.messageTemplate)?.content || ''}
                      </Typography>
                    </Box>
                  )}

                  <FormControl fullWidth>
                    <InputLabel>Media Type</InputLabel>
                    <Select
                      value={editFormData.mediaType}
                      label="Media Type"
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          mediaType: nextType,
                          mediaUrl: nextType === 'none' ? '' : editFormData.mediaUrl,
                          mediaPreviewData: nextType === 'none' ? '' : editFormData.mediaPreviewData,
                          mediaMimeType: nextType === 'none' ? '' : editFormData.mediaMimeType,
                          mediaFileName: nextType === 'none' ? '' : editFormData.mediaFileName
                        });
                        if (nextType === 'none') {
                          setEditCampaignMediaFile(null);
                        }
                      }}
                      disabled={selectedCampaign.status === 'RUNNING' || submitting}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="none">No media</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="video">Video</MenuItem>
                      <MenuItem value="document">PDF / Document</MenuItem>
                    </Select>
                  </FormControl>

                  {editFormData.mediaType !== 'none' && (
                    <Stack spacing={1}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        disabled={selectedCampaign.status === 'RUNNING' || submitting}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                      >
                        {editFormData.mediaType === 'document' ? 'Upload PDF' : 'Upload File'}
                        <input
                          hidden
                          type="file"
                          accept={editFormData.mediaType === 'document' ? 'application/pdf' : editFormData.mediaType === 'video' ? 'video/*' : 'image/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setEditCampaignMediaFile(file);
                            if (file) {
                              loadFileAsDataUrl(file, (dataUrl) => {
                                setEditFormData(prev => ({
                                  ...prev,
                                  mediaPreviewData: dataUrl
                                }));
                              });
                              setEditFormData(prev => ({
                                ...prev,
                                mediaFileName: file.name,
                                mediaMimeType: file.type
                              }));
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        {editCampaignMediaFile?.name || editFormData.mediaFileName || 'No file selected'}
                      </Typography>
                      {(editFormData.mediaPreviewData || editFormData.mediaUrl) && renderCampaignMediaPreview(editFormData.mediaPreviewData || editFormData.mediaUrl, editFormData.mediaType, editFormData.mediaFileName)}
                    </Stack>
                  )}

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Button Label (Optional)"
                      fullWidth
                      value={editFormData.buttonLabel}
                      onChange={(e) => setEditFormData({ ...editFormData, buttonLabel: e.target.value })}
                      disabled={selectedCampaign.status === 'RUNNING' || submitting}
                      InputProps={{ sx: { borderRadius: 1.5 } }}
                    />
                    <TextField
                      label="Button URL (Optional)"
                      fullWidth
                      value={editFormData.buttonUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, buttonUrl: e.target.value })}
                      disabled={selectedCampaign.status === 'RUNNING' || submitting}
                      InputProps={{ sx: { borderRadius: 1.5 } }}
                    />
                  </Stack>

                  <TextField
                    label="Schedule (Optional)"
                    type="datetime-local"
                    fullWidth
                    value={editFormData.scheduledAt}
                    onChange={(e) => setEditFormData({ ...editFormData, scheduledAt: e.target.value })}
                    disabled={selectedCampaign.status === 'RUNNING' || submitting}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />
                </Stack>
              </DialogContent>
            )}

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                onClick={() => { setEditCampaignMediaFile(null); setOpenDetailsDialog(false); }}
                variant="outlined"
                sx={{
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 0.8,
                  '&:hover': {
                    borderColor: '#dadce0',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                {detailsTab === 0 ? 'Close' : 'Cancel'}
              </Button>

              {detailsTab === 0 ? (
                /* View mode action buttons */
                <Stack direction="row" spacing={1.5}>
                  {selectedCampaign.status === 'DRAFT' && (
                    <Button
                      variant="contained"
                      color="success"
                      disableElevation
                      onClick={() => {
                        handleLaunchCampaign(selectedCampaign._id);
                        setOpenDetailsDialog(false);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                    >
                      Launch Campaign
                    </Button>
                  )}
                  {selectedCampaign.status === 'RUNNING' && (
                    <Button
                      variant="contained"
                      color="warning"
                      disableElevation
                      onClick={() => {
                        handlePauseCampaign(selectedCampaign._id);
                        setOpenDetailsDialog(false);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                    >
                      Pause Campaign
                    </Button>
                  )}
                </Stack>
              ) : (

                /* Edit mode action buttons */
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  disabled={selectedCampaign.status === 'RUNNING' || submitting}
                  onClick={handleUpdateCampaign}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
      <Dialog open={openManualSendDialog} onClose={closeManualSendDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Select Customers for Manual Send</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedCampaign?.messageTemplate?.content && (
              <Alert severity="info">
                Sending campaign message: {selectedCampaign.messageTemplate.content}
              </Alert>
            )}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Search Customer"
                size="small"
                fullWidth
                value={manualSendSearch}
                onChange={(e) => setManualSendSearch(e.target.value)}
                sx={{ minWidth: 220 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={manualSendFilter}
                  label="Customer Type"
                  onChange={(e) => {
                    const nextFilter = e.target.value;
                    setManualSendFilter(nextFilter);
                    setManualSendSelected([]);
                    fetchManualSendCustomers({ filter: nextFilter });
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="LOYAL">Loyal</MenuItem>
                  <MenuItem value="REGULAR">Regular</MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="AT_RISK">At Risk</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="LOST">Lost</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setManualSendSelected([]);
                  fetchManualSendCustomers();
                }}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
              >
                Search
              </Button>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Select one customer, multiple customers, or all customers in the current filter.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  checked={manualSendSelectAllFiltered}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setManualSendSelectAllFiltered(checked);
                    if (checked) {
                      setManualSendSelected([]);
                    }
                  }}
                />
                <Typography variant="body2">Send to all filtered</Typography>
              </Stack>
            </Stack>

            {manualSendLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          disabled={manualSendSelectAllFiltered}
                          indeterminate={manualSendSelected.length > 0 && manualSendSelected.length < manualSendCustomers.length}
                          checked={manualSendCustomers.length > 0 && manualSendSelected.length === manualSendCustomers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualSendSelected(manualSendCustomers.map(c => c._id));
                            } else {
                              setManualSendSelected([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Customer Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualSendCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" sx={{ py: 2, color: '#64748b' }}>
                            No customers found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      manualSendCustomers.map((customer) => (
                        <TableRow key={customer._id} hover selected={manualSendSelected.includes(customer._id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              disabled={manualSendSelectAllFiltered}
                              checked={manualSendSelected.includes(customer._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setManualSendSelected([...manualSendSelected, customer._id]);
                                } else {
                                  setManualSendSelected(manualSendSelected.filter(id => id !== customer._id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{customer.firstName} {customer.lastName || ''}</TableCell>
                          <TableCell>{customer.whatsappNumber || customer.phone || '-'}</TableCell>
                          <TableCell>{customer.rfmSegment || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={closeManualSendDialog}
            variant="outlined"
            sx={{
              borderColor: '#dadce0',
              color: '#202124',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 0.8,
              '&:hover': {
                borderColor: '#dadce0',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={handleManualSend}
            disabled={manualSendSending || (!manualSendSelectAllFiltered && manualSendSelected.length === 0)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
          >
            {manualSendSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

