import React from 'react';
import { Box, CircularProgress, Typography, Stack, Grid, Button } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import CampaignCard from './CampaignCard';
import SkeletonCard from './SkeletonCard';

/**
 * CampaignList Component
 * Responsive grid of campaign cards with loading skeletons and an engaging empty state.
 */
const CampaignList = React.memo(({
  campaigns = [],
  loading = false,
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