import React from 'react';
import {
  Drawer,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
  Grid,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StatusBadge from './StatusBadge';
import MetricsBar from './MetricsBar';

/**
 * CampaignDetailsPanel Component
 * Slide-in side panel showing full campaign details
 * 
 * Props:
 * - campaign: object - Campaign data
 * - open: boolean - Whether panel is open
 * - onClose: function - Callback to close panel
 * - onEdit: function - Callback for edit action
 * - onLaunch: function - Callback for launch action
 * - onPause: function - Callback for pause action
 * - onComplete: function - Callback for complete action
 * - onDelete: function - Callback for delete action
 * - loading: boolean - Whether actions are loading
 */
const CampaignDetailsPanel = React.memo(({
  campaign,
  open = false,
  onClose = () => {},
  onEdit = () => {},
  onLaunch = () => {},
  onPause = () => {},
  onResume = () => {},
  onComplete = () => {},
  onDelete = () => {},
  onSchedule = () => {},
  loading = false
}) => {
  if (!campaign) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Campaign Details</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">Select a campaign to view details.</Typography>
        </Box>
      </Drawer>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '400px' },
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#FFFFFF'
      }}>
        {/* Header */}
        <Box sx={{
          p: 2,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Campaign Details
            </Typography>
            <StatusBadge status={campaign.status} size="small" />
          </Box>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: '3px'
          }
        }}>
          <Stack spacing={3}>
            {/* Campaign Title */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 0.5, display: 'block' }}>
                CAMPAIGN NAME
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                {campaign.topic || campaign.name || 'Unnamed'}
              </Typography>
            </Box>

            {/* Description */}
            {campaign.description && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 0.5, display: 'block' }}>
                  DESCRIPTION
                </Typography>
                <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6 }}>
                  {campaign.description}
                </Typography>
              </Box>
            )}

            <Divider sx={{ borderColor: '#E5E7EB' }} />

            {/* Quick Stats Grid */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 1, display: 'block' }}>
                METRICS
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: '8px', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#3B82F6', mb: 0.5 }}>
                      {campaign.totalTargets || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>Targets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: '8px', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', mb: 0.5 }}>
                      {campaign.totalDelivered || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>Delivered</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Metrics Bars */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 1.5, display: 'block' }}>
                DELIVERY PROGRESS
              </Typography>
              <Stack spacing={2}>
                <MetricsBar
                  label="Sent"
                  value={campaign.totalSent || 0}
                  max={campaign.totalTargets || 1}
                  color="primary"
                />
                <MetricsBar
                  label="Delivered"
                  value={campaign.totalDelivered || 0}
                  max={campaign.totalTargets || 1}
                  color="success"
                />
                <MetricsBar
                  label="Read"
                  value={campaign.totalRead || 0}
                  max={campaign.totalTargets || 1}
                  color="info"
                />
              </Stack>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB' }} />

            {/* Campaign Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 1, display: 'block' }}>
                CAMPAIGN INFO
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Type:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    {campaign.type || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Created:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    {formatDate(campaign.createdAt)}
                  </Typography>
                </Box>
                {campaign.scheduledAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>Scheduled:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      {formatDate(campaign.scheduledAt)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Box sx={{
          p: 2,
          borderTop: '1px solid #E5E7EB',
          bgcolor: '#FAFBFC',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<EditIcon />}
            onClick={() => onEdit(campaign)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Edit
          </Button>

          {campaign.status === 'DRAFT' && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={loading ? <CircularProgress size={18} /> : <PlayArrowIcon />}
              onClick={() => onLaunch(campaign)}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Launch Campaign
            </Button>
          )}

          {campaign.status === 'DRAFT' && campaign.scheduledAt && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ScheduleIcon />}
              onClick={() => onSchedule(campaign)}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Schedule Campaign
            </Button>
          )}

          {campaign.status === 'RUNNING' && (
            <>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PauseIcon />}
                onClick={() => onPause(campaign)}
                disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Pause
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CheckCircleIcon />}
                onClick={() => onComplete(campaign)}
                disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Mark Complete
              </Button>
            </>
          )}

          {campaign.status === 'PAUSED' && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={() => onResume(campaign)}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Resume
            </Button>
          )}

          <Button
            variant="outlined"
            fullWidth
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(campaign)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#EF4444',
              borderColor: '#FCA5A5',
              '&:hover': {
                borderColor: '#EF4444',
                backgroundColor: '#FEF2F2'
              }
            }}
          >
            Delete
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
});

CampaignDetailsPanel.displayName = 'CampaignDetailsPanel';

export default CampaignDetailsPanel;
