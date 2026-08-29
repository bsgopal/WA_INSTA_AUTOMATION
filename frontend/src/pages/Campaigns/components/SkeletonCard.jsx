import React from 'react';
import { Card, CardContent, Box, Stack, Skeleton } from '@mui/material';

const SkeletonCard = React.memo(() => {
  return (
    <Card
      sx={{
        height: 288,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #D9D9D9',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      {/* Media header */}
      <Skeleton variant="rectangular" height={92} width="100%" />

      <CardContent sx={{ flexGrow: 1, px: 2.5, pt: 2.5, pb: 1.25 }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="75%" height={22} />
          <Skeleton variant="text" width="95%" height={16} />
          <Skeleton variant="text" width="60%" height={16} />
          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
            <Skeleton variant="text" width="30%" height={26} />
            <Skeleton variant="text" width="30%" height={26} />
            <Skeleton variant="text" width="30%" height={26} />
          </Stack>
        </Stack>
      </CardContent>

      {/* Footer actions */}
      <Box sx={{ px: 1.25, py: 1, display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" height={32} sx={{ flex: 1, borderRadius: '4px' }} />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </Card>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;