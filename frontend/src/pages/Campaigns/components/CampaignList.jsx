import React from 'react';
import {
  Box, CircularProgress, Typography, Stack, Grid, Button, Paper,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Tooltip, LinearProgress, Avatar
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CampaignCard from './CampaignCard';
import SkeletonCard from './SkeletonCard';
import StatusBadge from './StatusBadge';

/**
 * CampaignList Component
 * Responsive cards grid or data table with loading skeletons and engaging empty state.
 */
const CampaignList = React.memo(({
  campaigns = [],
  loading = false,
  viewMode = 'CARDS',
  onCreate = () => {},
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onLaunch = () => {},
  onPause = () => {},
  onResume = () => {},
  onComplete = () => {},
  onSchedule = () => {},
  onManualSend = () => {}
}) => {
  const skeletonCount = 6;

  if (loading && campaigns.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, justifyContent: 'center', color: '#94a3b8' }}>
          <CircularProgress size={18} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Loading campaigns...
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={`skeleton-${index}`}>
              <SkeletonCard />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 360,
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          bgcolor: '#fbfcfe'
        }}
      >
        <Stack alignItems="center" spacing={2} sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px -8px rgba(99,102,241,0.5)'
            }}
          >
            <CampaignIcon sx={{ fontSize: 36, color: '#ffffff' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              No campaigns yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Create your first campaign and start reaching your customers on WhatsApp.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{
              mt: 1,
              px: 3,
              height: '40px',
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            New Campaign
          </Button>
        </Stack>
      </Box>
    );
  }

  if (viewMode === 'TABLE') {
    return (
      <Box component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '72vh' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  py: 1.5,
                  borderBottom: '2px solid #84cc16'
                }
              }}>
                <TableCell sx={{ width: 48, color: '#84cc16' }}>#</TableCell>
                <TableCell>CAMPAIGN NAME & TOPIC</TableCell>
                <TableCell>TYPE</TableCell>
                <TableCell>TARGET AUDIENCE</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell sx={{ minWidth: 160 }}>PROGRESS / DELIVERED</TableCell>
                <TableCell>SCHEDULED / DATE</TableCell>
                <TableCell align="right" sx={{ pr: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c, idx) => {
                const total = c.totalTargets || 0;
                const delivered = c.totalDelivered || 0;
                const pct = total > 0 ? Math.min(100, Math.round((delivered / total) * 100)) : 0;
                const dateStr = c.scheduledAt
                  ? `🗓️ ${new Date(c.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : '—';

                return (
                  <TableRow
                    key={c._id}
                    hover
                    onClick={() => onView(c)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '&:hover': { bgcolor: '#f1f5f9' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                        {c.name || c.topic || 'Untitled'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.messageContent || 'No message preview'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.type || 'ONE_TIME'}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#334155' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.targetAudience?.segments?.[0] || 'ALL'}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#365314' }}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#1e293b' }}>
                            {delivered} / {total}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#059669' }}>
                            {pct}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10b981' : '#84cc16' }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>
                        {dateStr}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="Send Manually">
                          <IconButton size="small" color="primary" onClick={() => onManualSend(c)}>
                            <SendIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {c.status === 'DRAFT' && (
                          <Tooltip title="Launch">
                            <IconButton size="small" sx={{ color: '#059669' }} onClick={() => onLaunch(c)}>
                              <PlayArrowIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {c.status === 'RUNNING' && (
                          <Tooltip title="Pause">
                            <IconButton size="small" sx={{ color: '#d97706' }} onClick={() => onPause(c)}>
                              <PauseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit Campaign">
                          <IconButton size="small" onClick={() => onEdit(c)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Campaign">
                          <IconButton size="small" color="error" onClick={() => onDelete(c)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {campaigns.map((campaign) => (
        <Grid item xs={12} sm={6} lg={4} xl={3} key={campaign._id}>
          <CampaignCard
            campaign={campaign}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onLaunch={onLaunch}
            onPause={onPause}
            onResume={onResume}
            onComplete={onComplete}
            onSchedule={onSchedule}
            onManualSend={onManualSend}
          />
        </Grid>
      ))}
    </Grid>
  );
});

CampaignList.displayName = 'CampaignList';

export default CampaignList;