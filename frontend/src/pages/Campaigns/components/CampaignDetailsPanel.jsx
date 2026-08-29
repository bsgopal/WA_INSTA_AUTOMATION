import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
  Grid,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import RepeatIcon from '@mui/icons-material/Repeat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PeopleIcon from '@mui/icons-material/People';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import LanguageIcon from '@mui/icons-material/Language';
import StatusBadge from './StatusBadge';

const typeMeta = {
  ONE_TIME: { label: 'One-time', icon: CampaignIcon, color: '#6366f1' },
  RECURRING: { label: 'Recurring', icon: RepeatIcon, color: '#8b5cf6' },
  AUTOMATED: { label: 'Automated', icon: AutoAwesomeIcon, color: '#10b981' },
  TRIGGERED: { label: 'Triggered', icon: FlashOnIcon, color: '#f59e0b' }
};

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
  onManualSend = () => {},
  loading = false
}) => {
  if (!campaign) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Campaign Details</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">Select a campaign to view details.</Typography>
        </DialogContent>
      </Dialog>
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

  const type = typeMeta[campaign.type] || typeMeta.ONE_TIME;
  const TypeIcon = type.icon;

  const content =
    campaign.messageContent ||
    (campaign.messageTemplate && campaign.messageTemplate.content) ||
    '';

  const mediaPreview = campaign.mediaPreviewData || campaign.mediaUrl;
  const total = campaign.totalTargets || 0;
  const delivered = campaign.totalDelivered || 0;
  const read = campaign.totalRead || 0;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const readRate = total > 0 ? Math.round((read / total) * 100) : 0;

  const initial = (campaign.name || campaign.topic || '?').charAt(0).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Hero header */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{
          height: 92,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)'
        }}>
          {mediaPreview && (
            <Box
              component="img"
              src={mediaPreview}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
            />
          )}
        </Box>

        <DialogTitle
          sx={{
            pt: 3,
            pb: 2,
            px: 3,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mt: -5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: type.color,
                color: '#fff',
                fontWeight: 700,
                fontSize: 22,
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)',
                border: '3px solid #fff'
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem', lineHeight: 1.3 }}>
                {campaign.name || campaign.topic || 'Unnamed Campaign'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  icon={<TypeIcon sx={{ fontSize: 14 }} />}
                  label={type.label}
                  sx={{ bgcolor: `${type.color}14`, color: type.color, fontWeight: 700, fontSize: '11px', height: 24 }}
                />
                <StatusBadge status={campaign.status} size="small" />
              </Stack>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      </Box>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 2.5, px: 3 }}>
        <Stack spacing={3}>
          {/* Description / message content */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 0.75, display: 'block', letterSpacing: '0.04em', fontSize: '11px' }}>
              MESSAGE
            </Typography>
            <Box
              sx={{
                p: 1.75,
                bgcolor: campaign.messageContent ? '#f5f7ff' : '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {content || <Box component="span" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No message content set.</Box>}
              </Typography>
            </Box>

            {campaign.mediaPreviewData && (
              <Box
                sx={{
                  mt: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1,
                  py: 0.5,
                  borderRadius: '8px',
                  bgcolor: 'rgba(99,102,241,0.10)',
                  color: '#4338ca'
                }}
              >
                <SendIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Attached media
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Stats */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.25, display: 'block', letterSpacing: '0.04em', fontSize: '11px' }}>
              PERFORMANCE
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <PeopleIcon sx={{ color: '#64748b', fontSize: 20, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem', lineHeight: 1.1 }}>
                    {total}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Targets</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <SendRoundedIcon sx={{ color: '#6366f1', fontSize: 20, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem', lineHeight: 1.1 }}>
                    {campaign.totalSent || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Sent</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <DoneAllIcon sx={{ color: '#10b981', fontSize: 20, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', fontSize: '1.25rem', lineHeight: 1.1 }}>
                    {delivered}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Delivered</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <VisibilityIcon sx={{ color: '#8b5cf6', fontSize: 20, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.25rem', lineHeight: 1.1 }}>
                    {read}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Read</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Rates */}
            <Grid container spacing={1.5} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: '10px', border: '1px solid #d1fae5', bgcolor: '#ecfdf5' }}>
                  <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, display: 'block', mb: 0.25 }}>
                    Delivery Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>{deliveryRate}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: '10px', border: '1px solid #e0e7ff', bgcolor: '#eef2ff' }}>
                  <Typography variant="caption" sx={{ color: '#4338ca', fontWeight: 700, display: 'block', mb: 0.25 }}>
                    Read Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#312e81' }}>{readRate}%</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Details */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.25, display: 'block', letterSpacing: '0.04em', fontSize: '11px' }}>
              CAMPAIGN DETAILS
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CampaignIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Type</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {campaign.type || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Created</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatDate(campaign.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UpdateIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Updated</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatDate(campaign.updatedAt)}
                </Typography>
              </Box>
              {campaign.scheduledAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Scheduled</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {formatDate(campaign.scheduledAt)}
                  </Typography>
                </Box>
              )}
              {campaign.language && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Language</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {(campaign.language || 'en').toUpperCase()}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      {/* Action Buttons */}
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="text" size="small" onClick={onClose} disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#475569' }}>
          Close
        </Button>

        {campaign.status === 'DRAFT' && (
          <>
            <Button variant="contained" size="medium" startIcon={<PlayArrowIcon />}
              onClick={() => onLaunch(campaign)} disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
              Launch
            </Button>
            {campaign.scheduledAt && (
              <Button variant="contained" color="info" size="medium" startIcon={<ScheduleIcon />}
                onClick={() => onSchedule(campaign)} disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
                Schedule
              </Button>
            )}
          </>
        )}

        {campaign.status === 'RUNNING' && (
          <>
            <Button variant="outlined" size="medium" startIcon={<PauseIcon />}
              onClick={() => onPause(campaign)} disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
              Pause
            </Button>
            <Button variant="contained" color="success" size="medium" startIcon={<CheckCircleIcon />}
              onClick={() => onComplete(campaign)} disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
              Complete
            </Button>
          </>
        )}

        {campaign.status === 'PAUSED' && (
          <Button variant="contained" size="medium" startIcon={<PlayArrowIcon />}
            onClick={() => onResume(campaign)} disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
            Resume
          </Button>
        )}

        <Button variant="outlined" size="medium" startIcon={<SendIcon />}
          onClick={() => onManualSend(campaign)} disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Send Manually
        </Button>

        <Button variant="outlined" color="error" size="medium" startIcon={<DeleteIcon />}
          onClick={() => onDelete(campaign)} disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Delete
        </Button>

        <Button variant="contained" color="secondary" size="medium" startIcon={<EditIcon />}
          onClick={() => onEdit(campaign)} disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CampaignDetailsPanel.displayName = 'CampaignDetailsPanel';

export default CampaignDetailsPanel;