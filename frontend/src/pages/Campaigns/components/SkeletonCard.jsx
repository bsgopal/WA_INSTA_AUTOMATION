import React from 'react';
import { Card, CardContent, Box, Stack, Skeleton } from '@mui/material';

/**
 * SkeletonCard Component
 * Displays a loading skeleton for campaign cards
 * Shows animated placeholder while data is loading
 */
const SkeletonCard = React.memo(() => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '1px solid #E5E7EB',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      {/* Status Badge Placeholder - Top Right */}
      <Box sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1
      }}>
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>

      {/* Main Content */}
      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        {/* Title */}
        <Stack spacing={0.5} mb={2.5}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="40%" height={16} />
        </Stack>

        {/* Metrics */}
        <Stack spacing={1.5} mb={2.5}>
          <Skeleton variant="rectangular" height={6} />
          <Skeleton variant="rectangular" height={6} />
          <Skeleton variant="rectangular" height={6} />
        </Stack>

        {/* Last Update */}
        <Skeleton variant="text" width="30%" height={12} />
      </CardContent>

      {/* Action Buttons */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          borderTop: '1px solid #E5E7EB',
          pt: 2,
          display: 'flex',
          gap: 1
        }}
      >
        <Skeleton variant="rectangular" height={32} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={32} sx={{ flex: 1 }} />
        <Skeleton variant="circular" width={40} height={40} />
      </Box>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Card>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;
