import React from 'react';
import { Card, CardContent, Box, Stack, Typography, IconButton, Menu, MenuItem, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import StatusBadge from './StatusBadge';
import MetricsBar from './MetricsBar';
import SkeletonCard from './SkeletonCard';

/**
 * CampaignCard Component
 * Displays a single campaign in card format with metrics and actions
 */
const CampaignCard = React.memo(({
  campaign = {},
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onLaunch = () => {},
  onPause = () => {},
  onResume = () => {},
  onComplete = () => {},
  onSchedule = () => {},
  onManualSend = () => {},
  loading = false
}) => {
  if (loading) {
    return <SkeletonCard />;
  }

  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (callback) => {
    handleMenuClose();
    callback();
  };

  const lastUpdate = campaign.updatedAt
    ? new Date(campaign.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes buttonPress {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 150ms ease-out',
          cursor: 'pointer',
          animation: 'fadeInScale 200ms ease-out',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-4px)'
          },
          border: '1px solid #E5E7EB'
        }}
        onClick={() => onView(campaign)}
      >
        {/* Status Badge - Top Right */}
        <Box sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1
        }}>
          <StatusBadge status={campaign.status} size="small" />
        </Box>

        {/* Main Content */}
        <CardContent sx={{ flexGrow: 1, pb: 2 }}>
          {/* Title & Topic */}
          <Stack spacing={0.5} mb={2.5}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1F2937',
                pr: 6, // Space for status badge
                wordBreak: 'break-word'
              }}
            >
              {campaign.topic || campaign.name || 'Unnamed Campaign'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '12px',
                color: '#6B7280',
                fontStyle: 'italic'
              }}
            >
              ID: {campaign.name || campaign._id?.substring(0, 8) || 'N/A'}
            </Typography>
          </Stack>

          {/* Metrics */}
          <Stack spacing={1.5} mb={2.5}>
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

          {/* Last Update */}
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: '#9CA3AF',
              display: 'block',
              mb: 2
            }}
          >
            Last: {lastUpdate}
          </Typography>
        </CardContent>

        {/* Action Buttons */}
        <Box
          sx={{
            px: 2,
            pb: 2,
            borderTop: '1px solid #E5E7EB',
            pt: 2,
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ width: 16, height: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onView(campaign);
              }}
              sx={{
                fontSize: '11px',
                textTransform: 'none',
                flex: 1,
                minWidth: '0px',
                px: 1,
                transition: 'all 100ms ease-in-out',
                '&:active': {
                  animation: 'buttonPress 150ms ease-in-out'
                }
              }}
            >
              View
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon sx={{ width: 16, height: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(campaign);
              }}
              sx={{
                fontSize: '11px',
                textTransform: 'none',
                flex: 1,
                minWidth: '0px',
                px: 1,
                transition: 'all 100ms ease-in-out',
                '&:active': {
                  animation: 'buttonPress 150ms ease-in-out'
                }
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<SendIcon sx={{ width: 16, height: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onManualSend(campaign);
              }}
              sx={{
                fontSize: '11px',
                textTransform: 'none',
                flex: 1.2,
                minWidth: '0px',
                px: 1,
                bgcolor: '#2563EB',
                transition: 'all 100ms ease-in-out',
                '&:hover': {
                  bgcolor: '#1D4ED8'
                },
                '&:active': {
                  animation: 'buttonPress 150ms ease-in-out'
                }
              }}
            >
              Send
            </Button>
          </Stack>

          {/* More Menu */}
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: '#6B7280' }}
          >
            <MoreVertIcon sx={{ width: 20, height: 20 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {campaign.status === 'DRAFT' && (
              <MenuItem onClick={() => handleMenuItemClick(() => onLaunch(campaign))}>
                <PlayArrowIcon sx={{ mr: 1, width: 18, height: 18 }} />
                Launch
              </MenuItem>
            )}
            {campaign.status === 'RUNNING' && (
              <MenuItem onClick={() => handleMenuItemClick(() => onPause(campaign))}>
                <PauseIcon sx={{ mr: 1, width: 18, height: 18 }} />
                Pause
              </MenuItem>
            )}
            {campaign.status === 'PAUSED' && (
              <MenuItem onClick={() => handleMenuItemClick(() => onResume(campaign))}>
                <PlayArrowIcon sx={{ mr: 1, width: 18, height: 18 }} />
                Resume
              </MenuItem>
            )}
            {campaign.status === 'DRAFT' && campaign.scheduledAt && (
              <MenuItem onClick={() => handleMenuItemClick(() => onSchedule(campaign))}>
                <ScheduleIcon sx={{ mr: 1, width: 18, height: 18 }} />
                Schedule
              </MenuItem>
            )}
            {campaign.status !== 'COMPLETED' && (
              <MenuItem onClick={() => handleMenuItemClick(() => onComplete(campaign))}>
                <CheckCircleIcon sx={{ mr: 1, width: 18, height: 18 }} />
                Mark Complete
              </MenuItem>
            )}
            <MenuItem onClick={() => handleMenuItemClick(() => onManualSend(campaign))}>
              Send Manually
            </MenuItem>
            <MenuItem
              onClick={() => handleMenuItemClick(() => onDelete(campaign))}
              sx={{ color: '#EF4444' }}
            >
              <DeleteIcon sx={{ mr: 1, width: 18, height: 18 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Card>
    </>
  );
});

CampaignCard.displayName = 'CampaignCard';

export default CampaignCard;
