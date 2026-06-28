import React, { useState } from 'react';
import {
  Stack,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Paper,
  Grid,
  Button
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * ScheduleStep Component
 * Step 5 of the campaign creation wizard
 * Allows scheduling when to send the campaign
 */
const ScheduleStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const [immediateMode, setImmediateMode] = useState(!data.scheduledAt);

  const handleToggleImmediate = (e) => {
    setImmediateMode(e.target.checked);
    if (e.target.checked) {
      onChange({ ...data, scheduledAt: '' });
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (data.scheduledTime) {
      const datetime = `${date}T${data.scheduledTime}`;
      onChange({ ...data, scheduledAt: datetime });
    } else {
      onChange({ ...data, scheduledAt: `${date}T12:00` });
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    if (data.scheduledAt) {
      const date = data.scheduledAt.split('T')[0];
      const datetime = `${date}T${time}`;
      onChange({ ...data, scheduledAt: datetime });
    }
    onChange({ ...data, scheduledTime: time });
  };

  const formatScheduledDateTime = () => {
    if (!data.scheduledAt) return '';
    try {
      const date = new Date(data.scheduledAt);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return data.scheduledAt;
    }
  };

  const extractDate = () => {
    if (data.scheduledAt) {
      return data.scheduledAt.split('T')[0];
    }
    return '';
  };

  const extractTime = () => {
    if (data.scheduledAt) {
      const time = data.scheduledAt.split('T')[1];
      return time ? time.slice(0, 5) : '12:00';
    }
    return data.scheduledTime || '12:00';
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Choose when to send your campaign.
      </Typography>

      {/* Immediate vs Scheduled Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={immediateMode}
            onChange={handleToggleImmediate}
          />
        }
        label={
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Send Immediately
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Campaign will be sent right away
            </Typography>
          </Box>
        }
      />

      {!immediateMode && (
        <>
          {/* Date and Time Inputs */}
          <Box sx={{ bgcolor: '#F3F4F6', p: 2.5, borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Schedule Campaign
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={extractDate()}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0]
                  }}
                  size="small"
                  error={!!errors.scheduledAt}
                  helperText={errors.scheduledAt}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  value={extractTime()}
                  onChange={handleTimeChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  inputProps={{
                    step: '300' // 5 minute intervals
                  }}
                />
              </Grid>
            </Grid>

            {/* Timezone Info */}
            <Typography variant="caption" sx={{ color: '#6B7280', mt: 1, display: 'block' }}>
              Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </Typography>
          </Box>

          {/* Scheduled DateTime Display */}
          {data.scheduledAt && (
            <Paper sx={{ p: 2.5, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', mb: 1, display: 'block' }}>
                SCHEDULED FOR
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarTodayIcon sx={{ color: '#3B82F6', fontSize: '20px' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatScheduledDateTime()}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                Campaign will be sent at the scheduled time
              </Typography>
            </Paper>
          )}

          {/* Quick Schedule Options */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280', mb: 1, display: 'block' }}>
              QUICK OPTIONS
            </Typography>
            <Stack direction="row" spacing={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { label: 'In 5 min', minutes: 5 },
                { label: 'In 1 hour', minutes: 60 },
                { label: 'In 24 hours', minutes: 1440 },
                { label: 'Tomorrow', minutes: 1440 }
              ].map((option) => (
                <Button
                  key={option.label}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + option.minutes);
                    const dateStr = now.toISOString().split('T')[0];
                    const timeStr = now.toISOString().split('T')[1].slice(0, 5);
                    onChange({ ...data, scheduledAt: `${dateStr}T${timeStr}` });
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </>
      )}

      {immediateMode && (
        <Paper sx={{ p: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBDC90', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: '#166534', fontWeight: 500 }}>
            ✓ Your campaign will be sent to all targeted customers immediately upon launch.
          </Typography>
        </Paper>
      )}
    </Stack>
  );
});

ScheduleStep.displayName = 'ScheduleStep';

export default ScheduleStep;
