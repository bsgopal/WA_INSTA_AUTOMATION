import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Divider,
  Avatar,
  LinearProgress,
  Chip,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CampaignIcon from '@mui/icons-material/Campaign';
import RepeatIcon from '@mui/icons-material/Repeat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import StatusBadge from './StatusBadge';
import SkeletonCard from './SkeletonCard';

const typeMeta = {
  ONE_TIME: { label: 'One-time', icon: CampaignIcon, color: '#84cc16', bg: 'rgba(132,204,22,0.15)' },
  RECURRING: { label: 'Recurring', icon: RepeatIcon, color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  AUTOMATED: { label: 'Automated', icon: AutoAwesomeIcon, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  TRIGGERED: { label: 'Triggered', icon: FlashOnIcon, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' }
};

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
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  if (loading && !campaign?._id) {
    return <SkeletonCard />;
  }

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

  const type = typeMeta[campaign.type] || typeMeta.ONE_TIME;
  const TypeIcon = type.icon;

  const mediaPreview = campaign.mediaPreviewData || campaign.mediaUrl;
  const initial = (campaign.name || campaign.topic || '?').charAt(0).toUpperCase();

  const totalTargets = campaign.totalTargets || 0;
  const totalSent = campaign.totalSent || 0;
  const totalDelivered = campaign.totalDelivered || 0;
  const totalRead = campaign.totalRead || 0;
  const deliveryPercent = totalTargets > 0 ? Math.min(100, Math.round((totalDelivered / totalTargets) * 100)) : 0;

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <Card
        sx={{
          height: 310,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.22s ease-in-out',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.06)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.16)',
            borderColor: '#84cc16'
          }
        }}
        onClick={() => onView(campaign)}
      >
        {/* Top Header Strip */}
        <Box
          sx={{
            p: 1.75,
            pb: 1.5,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#84cc16',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <Chip
                icon={<TypeIcon sx={{ fontSize: '12px !important', color: `${type.color} !important` }} />}
                label={type.label}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '10px',
                  height: 20
                }}
              />
            </Box>
          </Stack>

          <StatusBadge status={campaign.status} size="small" />
        </Box>

        {/* Card Body */}
        <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '14.5px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '38px'
              }}
            >
              {campaign.name || campaign.topic || 'Unnamed Campaign'}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '12px',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '34px',
                mt: 0.5
              }}
            >
              {campaign.messageContent ||
                (campaign.messageTemplate && campaign.messageTemplate.content) ||
                'No message preview available'}
            </Typography>
          </Box>

          {/* Broadcast Delivery Progress */}
          <Box sx={{ mt: 'auto', pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '10.5px' }}>
                DISPATCH PROGRESS
              </Typography>
              <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 800, fontSize: '11px' }}>
                {deliveryPercent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={deliveryPercent}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#84cc16',
                  borderRadius: 3
                }
              }}
            />

            {/* Performance Numbers */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, display: 'block' }}>
                  TARGETS
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                  {totalTargets}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#059669', fontSize: '10px', fontWeight: 700, display: 'block' }}>
                  DELIVERED
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '13px' }}>
                  {totalDelivered}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#3b82f6', fontSize: '10px', fontWeight: 700, display: 'block' }}>
                  READ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#3b82f6', fontSize: '13px' }}>
                  {totalRead}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        {/* Footer Actions */}
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: '#f8fafc'
          }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<SendIcon sx={{ fontSize: 14 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onManualSend(campaign);
            }}
            sx={{
              flex: 1,
              height: '32px',
              fontSize: '0.8rem',
              fontWeight: 800,
              borderRadius: '8px',
              textTransform: 'none',
              bgcolor: '#0f172a',
              color: '#84cc16',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1e293b',
                color: '#a3e635',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
              }
            }}
          >
            Quick Send
          </Button>

          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView(campaign);
              }}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                color: '#475569',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
              }}
            >
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Campaign">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(campaign);
              }}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                color: '#475569',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
              }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="More Actions">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                color: '#475569',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 12px 32px rgba(15,23,42,0.18)', minWidth: 160 } }}
          >
            <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onView(campaign))}>
              <VisibilityIcon sx={{ mr: 1.2, fontSize: 18, color: '#64748b' }} /> View Details
            </MenuItem>
            {campaign.status === 'DRAFT' && (
              <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onLaunch(campaign))}>
                <PlayArrowIcon sx={{ mr: 1.2, fontSize: 18, color: '#16a34a' }} /> Launch Now
              </MenuItem>
            )}
            {campaign.status === 'RUNNING' && (
              <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onPause(campaign))}>
                <PauseIcon sx={{ mr: 1.2, fontSize: 18, color: '#eab308' }} /> Pause
              </MenuItem>
            )}
            {campaign.status === 'PAUSED' && (
              <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onResume(campaign))}>
                <PlayArrowIcon sx={{ mr: 1.2, fontSize: 18, color: '#16a34a' }} /> Resume
              </MenuItem>
            )}
            {campaign.status === 'DRAFT' && campaign.scheduledAt && (
              <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onSchedule(campaign))}>
                <ScheduleIcon sx={{ mr: 1.2, fontSize: 18, color: '#3b82f6' }} /> Schedule
              </MenuItem>
            )}
            {campaign.status !== 'COMPLETED' && (
              <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => handleMenuItemClick(() => onComplete(campaign))}>
                <CheckCircleIcon sx={{ mr: 1.2, fontSize: 18, color: '#059669' }} /> Mark Complete
              </MenuItem>
            )}
            <Divider sx={{ my: 0.5 }} />
            <MenuItem sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#dc2626' }} onClick={() => handleMenuItemClick(() => onDelete(campaign))}>
              <DeleteIcon sx={{ mr: 1.2, fontSize: 18, color: '#dc2626' }} /> Delete
            </MenuItem>
          </Menu>
        </Box>
      </Card>
    </>
  );
});

CampaignCard.displayName = 'CampaignCard';

export default CampaignCard;