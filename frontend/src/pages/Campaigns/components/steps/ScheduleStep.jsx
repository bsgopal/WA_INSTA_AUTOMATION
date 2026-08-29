import React from 'react';
import {
  Stack,
  TextField,
  Typography,
  Grid,
  Box,
  Paper,
  Divider
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Combined Schedule Options & Final Review Step
 */
const ScheduleStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {},
  estimatedReach = 0
}) => {
  const isImmediate = !data.scheduledAt;

  const handleSelectImmediate = () => {
    onChange({
      ...data,
      scheduledAt: ''
    });
  };

  const handleSelectScheduled = () => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);
    onChange({
      ...data,
      scheduledAt: tomorrowStr
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1F2937' }}>
          Schedule & Review
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose when to send your campaign and do a quick final check.
        </Typography>
      </Box>

      {/* Schedule Selection Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Paper
            onClick={handleSelectImmediate}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              border: isImmediate ? '2px solid #10B981' : '1px solid #E5E7EB',
              borderRadius: '12px',
              bgcolor: isImmediate ? '#ECFDF5' : '#FFFFFF',
              boxShadow: isImmediate ? '0 4px 12px rgba(16,185,129,0.12)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                borderColor: isImmediate ? '#10B981' : '#9CA3AF'
              }
            }}
          >
            <Box sx={{
              p: 1,
              borderRadius: '8px',
              bgcolor: isImmediate ? '#10B981' : '#F3F4F6',
              color: isImmediate ? '#FFFFFF' : '#4B5563',
              display: 'flex'
            }}>
              <FlashOnIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isImmediate ? '#065F46' : '#1F2937' }}>
                Send Immediately
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Delivers right after launching.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper
            onClick={handleSelectScheduled}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              border: !isImmediate ? '2px solid #2563EB' : '1px solid #E5E7EB',
              borderRadius: '12px',
              bgcolor: !isImmediate ? '#EFF6FF' : '#FFFFFF',
              boxShadow: !isImmediate ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                borderColor: !isImmediate ? '#2563EB' : '#9CA3AF'
              }
            }}
          >
            <Box sx={{
              p: 1,
              borderRadius: '8px',
              bgcolor: !isImmediate ? '#2563EB' : '#F3F4F6',
              color: !isImmediate ? '#FFFFFF' : '#4B5563',
              display: 'flex'
            }}>
              <ScheduleIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: !isImmediate ? '#1E40AF' : '#1F2937' }}>
                Schedule for Later
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Delivers at a specific date and time.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Date & Time Selectors */}
      {!isImmediate && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Schedule Date"
              type="date"
              fullWidth
              required
              value={data.scheduledAt || ''}
              onChange={(e) => onChange({ ...data, scheduledAt: e.target.value })}
              error={!!errors.scheduledAt}
              helperText={errors.scheduledAt}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Schedule Time"
              type="time"
              fullWidth
              required
              value={data.scheduledTime || '12:00'}
              onChange={(e) => onChange({ ...data, scheduledTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
        </Grid>
      )}

      {/* Final Campaign Summary Card */}
      <Paper sx={{ p: 2.5, border: '1px solid #E5E7EB', borderRadius: '12px', bgcolor: '#F9FAFB' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937', mb: 2 }}>
          Campaign Summary Checklist
        </Typography>

        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Target Segment:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1F2937' }}>
              {data.targetSegment === 'ALL' ? 'All Customers' : `${data.targetSegment} Segment`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Estimated Audience:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB' }}>
              {estimatedReach} contacts
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Campaign Type:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1F2937' }}>
              {data.messageType === 'MEDIA' ? '📷 Image Campaign' : '💬 Text Only Campaign'}
            </Typography>
          </Box>

          {data.messageType === 'MEDIA' && data.mediaFileName && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Attachment:</Typography>
              <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                📎 {data.mediaFileName}
              </Typography>
            </Box>
          )}

          <Divider />

          <Box sx={{ display: 'flex', gap: 1, color: '#4F46E5', bgcolor: '#EEF2F6', p: 1.5, borderRadius: '8px' }}>
            <InfoOutlinedIcon fontSize="small" sx={{ mt: 0.2 }} />
            <Typography variant="caption" sx={{ lineHeight: 1.4, fontWeight: 600 }}>
              {isImmediate 
                ? 'Ready to send. The campaign will start executing immediately upon clicking Save.'
                : `Scheduled. The campaign will start automatically on ${data.scheduledAt} at ${data.scheduledTime || '12:00'}.`}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
});

ScheduleStep.displayName = 'ScheduleStep';

export default ScheduleStep;
