import React, { useCallback } from 'react';
import { Box, CircularProgress, Typography, Stack, Grid } from '@mui/material';
import CampaignCard from './CampaignCard';
import SkeletonCard from './SkeletonCard';

/**
 * CampaignList Component
 * Renders campaigns in a responsive grid with smooth animations
 * 
 * Features:
 * - Responsive grid layout (1 column mobile, 2 tablet, 3+ desktop)
 * - Smooth animations on cards
 * - Optimized for performance
 * - Memoized for preventing unnecessary re-renders
 * 
 * Props:
 * - campaigns: array - List of campaigns to display
 * - loading: boolean - Whether campaigns are loading
 * - onView: function - Callback for view action
 * - onEdit: function - Callback for edit action
 * - onDelete: function - Callback for delete action
 * - onLaunch: function - Callback for launch action
 * - onPause: function - Callback for pause action
 * - onComplete: function - Callback for complete action
 * - onManualSend: function - Callback for manual send action
 */
const CampaignList = React.memo(({
  campaigns = [],
  loading = false,
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
  // Show loading skeletons
  const skeletonCount = 6;

  if (loading && campaigns.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
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
          minHeight: '400px',
          p: 3
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <Typography variant="body1" fontWeight={600} color="text.primary">
            No campaigns yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first campaign to get started
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        scrollBehavior: 'smooth',
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#D1D5DB',
          borderRadius: '4px',
          '&:hover': {
            background: '#9CA3AF'
          }
        }
      }}
    >
      <Grid container spacing={2}>
        {campaigns.map((campaign) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={campaign._id}>
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
    </Box>
  );
});

CampaignList.displayName = 'CampaignList';

export default CampaignList;
