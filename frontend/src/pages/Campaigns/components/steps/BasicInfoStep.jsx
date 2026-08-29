import React from 'react';
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Box,
  Paper
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';

/**
 * Combined Campaign Details & Audience Step
 * Displays basic campaign fields and interactive segment cards
 */
const BasicInfoStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const campaignTypes = [
    { value: 'ONE_TIME', label: 'One-Time Campaign' },
    { value: 'RECURRING', label: 'Recurring Campaign' },
    { value: 'AUTOMATED', label: 'Automated Campaign' },
    { value: 'TRIGGERED', label: 'Triggered Campaign' }
  ];

  const segments = [
    { value: 'ALL', label: 'All Customers', icon: <PeopleIcon />, desc: 'Send to your entire contact list.' },
    { value: 'VIP', label: 'VIP Customers', icon: <StarIcon sx={{ color: '#F59E0B' }} />, desc: 'High frequency and high spend.' },
    { value: 'LOYAL', label: 'Loyal Customers', icon: <FavoriteIcon sx={{ color: '#EF4444' }} />, desc: 'Regular and repeat shoppers.' },
    { value: 'NEW', label: 'New Customers', icon: <FiberNewIcon sx={{ color: '#10B981' }} />, desc: 'Recently added contacts.' },
    { value: 'AT_RISK', label: 'At Risk', icon: <WarningAmberIcon sx={{ color: '#F59E0B' }} />, desc: 'Customers inactive for a while.' },
    { value: 'LOST', label: 'Lost Customers', icon: <BlockIcon sx={{ color: '#6B7280' }} />, desc: 'Lapsed or churned accounts.' }
  ];

  const activeSegment = data.targetSegment || 'ALL';

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1F2937' }}>
          Campaign Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Give your campaign a name and select your target audience.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Campaign Info */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2.5}>
            <TextField
              label="Campaign Name"
              fullWidth
              required
              value={data.name || ''}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g., Sunday Grand Opening Promo"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <TextField
              label="Campaign Topic"
              fullWidth
              required
              value={data.topic || ''}
              onChange={(e) => onChange({ ...data, topic: e.target.value })}
              error={!!errors.topic}
              helperText={errors.topic}
              placeholder="e.g., Marketing"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <FormControl fullWidth size="small" required>
              <InputLabel>Campaign Type</InputLabel>
              <Select
                label="Campaign Type"
                value={data.type || 'ONE_TIME'}
                onChange={(e) => onChange({ ...data, type: e.target.value })}
                sx={{ borderRadius: '8px' }}
              >
                {campaignTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={data.description || ''}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              placeholder="Add details about what this campaign is for..."
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Stack>
        </Grid>

        {/* Audience Selection */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#374151', display: 'block' }}>
            Who are you targeting?
          </Typography>
          <Grid container spacing={1.5}>
            {segments.map((seg) => {
              const isSelected = activeSegment === seg.value;
              return (
                <Grid item xs={12} sm={6} key={seg.value}>
                  <Paper
                    onClick={() => onChange({ ...data, targetSegment: seg.value })}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                      borderRadius: '12px',
                      bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: isSelected ? '#2563EB' : '#9CA3AF',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {seg.icon}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSelected ? '#1E40AF' : '#1F2937' }}>
                        {seg.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1, lineHeight: 1.3 }}>
                      {seg.desc}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    </Stack>
  );
});

BasicInfoStep.displayName = 'BasicInfoStep';

export default BasicInfoStep;
