import React from 'react';
import { Box, Stack, Typography, LinearProgress, Tooltip } from '@mui/material';

/**
 * MetricsBar Component
 * Displays a progress bar with label, percentage, and count
 * Features:
 * - Smooth animations and transitions
 * - Responsive styling
 * - Color-coded bars
 * - Tooltip on hover
 * 
 * Props:
 * - label: string - Display label (e.g., "Sent", "Delivered", "Read")
 * - value: number - Current value
 * - max: number - Maximum value (for calculating percentage)
 * - color: 'primary' | 'success' | 'info' | 'warning' - Bar color
 * - showPercentage: boolean - Whether to show percentage
 */
const MetricsBar = React.memo(({
  label = 'Metric',
  value = 0,
  max = 100,
  color = 'primary',
  showPercentage = true
}) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const colorMap = {
    primary: '#3B82F6',
    success: '#10B981',
    info: '#8B5CF6',
    warning: '#F59E0B',
    error: '#EF4444'
  };

  const barColor = colorMap[color] || colorMap.primary;

  return (
    <Tooltip title={`${value} of ${max}`} arrow>
      <Stack spacing={0.75}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              minWidth: '70px'
            }}
          >
            {label}
          </Typography>
          {showPercentage && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                ml: 'auto'
              }}
            >
              {percentage}%
            </Typography>
          )}
        </Box>
        <Box sx={{ position: 'relative', width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: '8px',
              borderRadius: '4px',
              backgroundColor: '#E5E7EB',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: '4px',
                backgroundColor: barColor,
                boxShadow: `0 0 8px ${barColor}40`,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }
            }}
          />
        </Box>
      </Stack>
    </Tooltip>
  );
});

MetricsBar.displayName = 'MetricsBar';

export default MetricsBar;
