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
  Avatar
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
import ImageIcon from '@mui/icons-material/Image';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StatusBadge from './StatusBadge';
import SkeletonCard from './SkeletonCard';

const typeMeta = {
  ONE_TIME: { label: 'One-time', icon: CampaignIcon, color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
  RECURRING: { label: 'Recurring', icon: RepeatIcon, color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  AUTOMATED: { label: 'Automated', icon: AutoAwesomeIcon, color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  TRIGGERED: { label: 'Triggered', icon: FlashOnIcon, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' }
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

  const type = typeMeta[campaign.type] || typeMeta.ONE_TIME;
  const TypeIcon = type.icon;

  const lastUpdate = campaign.updatedAt
    ? new Date(campaign.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  const mediaPreview = campaign.mediaPreviewData || campaign.mediaUrl;

  const initial = (campaign.name || campaign.topic || '?').charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <Card
        sx={{
          height: 288,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: '6px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          animation: 'fadeInScale 220ms ease-out',
          border: '1px solid #D9D9D9',
          bgcolor: '#FFFFFF',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 10px 24px -8px rgba(15, 23, 42, 0.18)',
            borderColor: '#0A6ED1'
          }
        }}
        onClick={() => onView(campaign)}
      >
        {/* SAP DMS-style thumbnail strip */}
        <Box sx={{ position: 'relative', height: '92px', flexShrink: 0 }}>
          <Box
            sx={{
              height: '92px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 55%, #3b82f6 100%)'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '92px',
                backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.22) 0%, transparent 50%)'
              }}
            />
          </Box>

          {mediaPreview && (
            <Box
              component="img"
              src={mediaPreview}
              alt={campaign.mediaFileName || 'campaign media'}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '92px',
                objectFit: 'cover',
                opacity: 0.5
              }}
            />
          )}

          {/* Type badge over thumbnail (SAP tile style) */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.35,
              borderRadius: '4px',
              bgcolor: 'rgba(255,255,255,0.92)',
              color: type.color,
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <TypeIcon sx={{ fontSize: 13 }} />
            {type.label}
          </Box>

          {/* Avatar overlapping */}
          <Avatar
            sx={{
              position: 'absolute',
              bottom: -18,
              left: 14,
              width: 42,
              height: 42,
              bgcolor: type.color,
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
              border: '2px solid #fff'
            }}
          >
            {initial}
          </Avatar>
        </Box>

        {/* Body */}
        <CardContent sx={{ flexGrow: 1, minHeight: 0, px: 2.5, pt: 2.5, pb: 1.25 }}>
          <Stack spacing={0.75}>
            {/* Title - always clamped to keep tiles uniform */}
            <Typography
              variant="h6"
              sx={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
                wordBreak: 'break-word',
                lineHeight: 1.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '40px'
              }}
            >
              {campaign.name || campaign.topic || 'Unnamed Campaign'}
            </Typography>

            {/* Message excerpt - always 2 lines reserved */}
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '12.5px',
                lineHeight: 1.45,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '36px'
              }}
            >
              {campaign.messageContent || (campaign.messageTemplate && campaign.messageTemplate.content) || 'No message preview available'}
            </Typography>

            {/* Metrics row - always rendered so every tile is identical */}
            <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                  SENT
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', lineHeight: 1.2 }}>
                  {campaign.totalSent || 0}
                  <Box component="span" sx={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 500 }}>
                    {' '}/ {campaign.totalTargets || 0}
                  </Box>
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                  DELIVERED
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '14px', lineHeight: 1.2 }}>
                  {campaign.totalDelivered || 0}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10.5px', fontWeight: 600 }}>
                  READ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#6366f1', fontSize: '14px', lineHeight: 1.2 }}>
                  {campaign.totalRead || 0}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>

        <Divider sx={{ borderColor: '#F0F0F0' }} />

        {/* Footer actions */}
        <Box sx={{ px: 1.25, py: 1, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onManualSend(campaign);
            }}
            sx={{
              flex: 1,
              height: '32px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderRadius: '4px',
              textTransform: 'none',
              bgcolor: '#0A6ED1',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#0854A0', boxShadow: 'none' }
            }}
          >
            Send
          </Button>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onView(campaign);
            }}
            sx={{
              width: 32,
              height: 32,
              color: '#475569',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.10)', color: '#4338ca' }
            }}
          >
            <VisibilityIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(campaign);
            }}
            sx={{
              width: 32,
              height: 32,
              color: '#475569',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.10)', color: '#4338ca' }
            }}
          >
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              width: 32,
              height: 32,
              color: '#475569',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.10)', color: '#4338ca' }
            }}
          >
            <MoreVertIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 12px 32px rgba(15,23,42,0.14)' } }}
          >
            <MenuItem sx={{ fontWeight: 500 }} onClick={() => onView(campaign)}>
              <VisibilityIcon sx={{ mr: 1.5, fontSize: 18 }} /> View Details
            </MenuItem>
            {campaign.status === 'DRAFT' && (
              <MenuItem sx={{ fontWeight: 500 }} onClick={() => handleMenuItemClick(() => onLaunch(campaign))}>
                <PlayArrowIcon sx={{ mr: 1.5, fontSize: 18 }} /> Launch Now
              </MenuItem>
            )}
            {campaign.status === 'RUNNING' && (
              <MenuItem sx={{ fontWeight: 500 }} onClick={() => handleMenuItemClick(() => onPause(campaign))}>
                <PauseIcon sx={{ mr: 1.5, fontSize: 18 }} /> Pause
              </MenuItem>
            )}
            {campaign.status === 'PAUSED' && (
              <MenuItem sx={{ fontWeight: 500 }} onClick={() => handleMenuItemClick(() => onResume(campaign))}>
                <PlayArrowIcon sx={{ mr: 1.5, fontSize: 18 }} /> Resume
              </MenuItem>
            )}
            {campaign.status === 'DRAFT' && campaign.scheduledAt && (
              <MenuItem sx={{ fontWeight: 500 }} onClick={() => handleMenuItemClick(() => onSchedule(campaign))}>
                <ScheduleIcon sx={{ mr: 1.5, fontSize: 18 }} /> Schedule
              </MenuItem>
            )}
            {campaign.status !== 'COMPLETED' && (
              <MenuItem sx={{ fontWeight: 500 }} onClick={() => handleMenuItemClick(() => onComplete(campaign))}>
                <CheckCircleIcon sx={{ mr: 1.5, fontSize: 18 }} /> Mark Complete
              </MenuItem>
            )}
            <Divider sx={{ my: 0.5 }} />
            <MenuItem sx={{ fontWeight: 500, color: '#dc2626' }} onClick={() => handleMenuItemClick(() => onDelete(campaign))}>
              <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} /> Delete
            </MenuItem>
          </Menu>
        </Box>
      </Card>
    </>
  );
});

CampaignCard.displayName = 'CampaignCard';

export default CampaignCard;