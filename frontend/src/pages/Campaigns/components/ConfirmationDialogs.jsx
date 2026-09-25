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
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';

/**
 * DeleteConfirmationDialog
 * SAP DM Styled confirmation before deleting a campaign
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
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)'
        }
      }}
    >
      <Box sx={{
        px: 3,
        py: 2,
        bgcolor: '#FEF2F2',
        borderBottom: '1px solid #FECACA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}>
            <WarningAmberIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#991B1B', lineHeight: 1.2 }}>
              Delete Campaign
            </Typography>
            <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 600 }}>
              Permanent Deletion Action
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onCancel} disabled={loading} sx={{ color: '#991B1B' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Are you sure you want to delete this marketing campaign? All scheduled tasks, recipient tracking, and delivery logs for this broadcast will be removed.
          </Typography>

          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                📢 {campaign.name || campaign.topic || 'Untitled Campaign'}
              </Typography>
              <Chip
                label={campaign.status || 'DRAFT'}
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: '#E2E8F0', color: '#334155' }}
              />
            </Stack>
            {campaign.messageContent && (
              <Typography variant="body2" sx={{
                color: '#64748B', fontSize: '0.8rem', bgcolor: '#FFFFFF', p: 1.25, borderRadius: '8px',
                border: '1px solid #E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {campaign.messageContent}
              </Typography>
            )}
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '10px',
            px: 2.5,
            bgcolor: '#DC2626',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            '&:hover': { bgcolor: '#B91C1C' }
          }}
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
 * SAP DM Styled confirmation before launching a campaign
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
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)'
        }
      }}
    >
      <Box sx={{
        px: 3,
        py: 2,
        bgcolor: '#ECFDF5',
        borderBottom: '1px solid #A7F3D0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <PlayArrowIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#065F46', lineHeight: 1.2 }}>
              Launch Broadcast Campaign
            </Typography>
            <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
              Immediate WhatsApp Broadcast
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onCancel} disabled={loading} sx={{ color: '#065F46' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target Audience Reach
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#047857', my: 0.5 }}>
              {estimatedReach.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#15803D', fontWeight: 600 }}>
              Recipients matching segment: {campaign.targetAudience?.segments?.[0] || 'ALL'}
            </Typography>
          </Paper>

          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              📢 {campaign.name || campaign.topic}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
              {campaign.messageContent?.slice(0, 120)}...
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '10px',
            px: 2.5,
            bgcolor: '#059669',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            '&:hover': { bgcolor: '#047857' }
          }}
        >
          {loading ? 'Launching...' : 'Launch Broadcast Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

LaunchConfirmationDialog.displayName = 'LaunchConfirmationDialog';

/**
 * ScheduleConfirmationDialog
 * SAP DM Styled confirmation before scheduling a campaign
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
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)'
        }
      }}
    >
      <Box sx={{
        px: 3,
        py: 2,
        bgcolor: '#EFF6FF',
        borderBottom: '1px solid #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB'
          }}>
            <ScheduleIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1E40AF', lineHeight: 1.2 }}>
              Schedule Campaign Broadcast
            </Typography>
            <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600 }}>
              Automated Future Dispatch
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onCancel} disabled={loading} sx={{ color: '#1E40AF' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>
              Scheduled Execution Time
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284C7', my: 0.5 }}>
              🗓️ {formatDate(scheduledTime)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600 }}>
              Sending to approximately {estimatedReach.toLocaleString()} customers
            </Typography>
          </Paper>

          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              📢 {campaign.name || campaign.topic}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
              {campaign.messageContent?.slice(0, 120)}...
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '10px',
            px: 2.5,
            bgcolor: '#2563EB',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            '&:hover': { bgcolor: '#1D4ED8' }
          }}
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

