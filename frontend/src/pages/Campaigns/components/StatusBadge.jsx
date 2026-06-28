import React from 'react';
import { Chip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * StatusBadge Component
 * Displays campaign status with color coding and icons
 * 
 * Status mapping:
 * - DRAFT: Gray (not started)
 * - SCHEDULED: Blue (scheduled for later)
 * - RUNNING: Green (actively running)
 * - PAUSED: Yellow (paused)
 * - COMPLETED: Green with checkmark (finished successfully)
 * - FAILED: Red (failed)
 */
const StatusBadge = React.memo(({ status = 'DRAFT', size = 'medium' }) => {
  const statusConfig = {
    DRAFT: {
      label: 'Draft',
      color: '#9CA3AF',
      bgColor: '#F3F4F6',
      icon: null,
      textColor: '#6B7280'
    },
    SCHEDULED: {
      label: 'Scheduled',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      icon: EventIcon,
      textColor: '#1E40AF'
    },
    RUNNING: {
      label: 'Running',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: PlayArrowIcon,
      textColor: '#065F46'
    },
    PAUSED: {
      label: 'Paused',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      icon: PauseIcon,
      textColor: '#92400E'
    },
    COMPLETED: {
      label: 'Completed',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: CheckCircleIcon,
      textColor: '#065F46'
    },
    FAILED: {
      label: 'Failed',
      color: '#EF4444',
      bgColor: '#FEF2F2',
      icon: CancelIcon,
      textColor: '#7F1D1D'
    }
  };

  const config = statusConfig[status] || statusConfig.DRAFT;
  const Icon = config.icon;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        px: size === 'small' ? 1 : 1.25,
        py: size === 'small' ? 0.5 : 0.75,
        borderRadius: '12px',
        backgroundColor: config.bgColor,
        fontSize: size === 'small' ? '12px' : '13px',
        fontWeight: 500,
        color: config.textColor,
        whiteSpace: 'nowrap'
      }}
    >
      {Icon && <Icon sx={{ width: size === 'small' ? 16 : 18, height: size === 'small' ? 16 : 18 }} />}
      {config.label}
    </Box>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
