import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * DeleteConfirmationDialog
 * Confirmation before deleting a campaign
 */
export const DeleteConfirmationDialog = React.memo(({
  open = false,
  campaign,
  loading = false,
  onConfirm = () => {},
  onCancel = () => {}
}) => {
  if (!campaign) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#EF4444', fontSize: '28px' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Delete Campaign
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 1 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this campaign?
          </Typography>

          <Paper sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626', mb: 0.5 }}>
              {campaign.topic || campaign.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7F1D1D' }}>
              This action cannot be undone. All campaign data will be lost.
            </Typography>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <DeleteIcon />}
        >
          {loading ? 'Deleting...' : 'Delete Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

/**
 * LaunchConfirmationDialog
 * Confirmation before launching a campaign
 */
export const LaunchConfirmationDialog = React.memo(({
  open = false,
  campaign,
  estimatedReach = 0,
  loading = false,
  onConfirm = () => {},
  onCancel = () => {}
}) => {
  if (!campaign) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayArrowIcon sx={{ color: '#10B981', fontSize: '28px' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Launch Campaign
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 1 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            You're about to launch your campaign to:
          </Typography>

          <Paper sx={{ p: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBDC90' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', mb: 0.5 }}>
              {estimatedReach.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#166534' }}>
              customers in {campaign.targetSegment || 'your audience'}
            </Typography>
          </Paper>

          <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: '8px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {campaign.topic || campaign.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {campaign.messageContent?.slice(0, 100)}...
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
            {campaign.scheduledAt
              ? `Scheduled for ${new Date(campaign.scheduledAt).toLocaleString()}`
              : 'Will be sent immediately'}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <PlayArrowIcon />}
        >
          {loading ? 'Launching...' : 'Launch Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

LaunchConfirmationDialog.displayName = 'LaunchConfirmationDialog';

/**
 * ScheduleConfirmationDialog
 * Confirmation before scheduling a campaign
 */
export const ScheduleConfirmationDialog = React.memo(({
  open = false,
  campaign,
  estimatedReach = 0,
  scheduledTime = '',
  loading = false,
  onConfirm = () => {},
  onCancel = () => {}
}) => {
  if (!campaign) return null;
  
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#3B82F6', fontSize: '28px' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Confirm Schedule
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 1 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Campaign will be sent at the scheduled time:
          </Typography>

          <Paper sx={{ p: 2.5, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E40AF', mb: 1 }}>
              {formatDate(scheduledTime)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#1E40AF' }}>
              Sending to {estimatedReach.toLocaleString()} customers
            </Typography>
          </Paper>

          <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: '8px' }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {campaign.messageContent?.slice(0, 100)}...
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
        >
          {loading ? 'Scheduling...' : 'Confirm Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ScheduleConfirmationDialog.displayName = 'ScheduleConfirmationDialog';

export default {
  DeleteConfirmationDialog,
  LaunchConfirmationDialog,
  ScheduleConfirmationDialog
};
