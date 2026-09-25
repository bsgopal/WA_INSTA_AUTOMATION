import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import { useNavigate } from 'react-router-dom';

export default function ScreenLocked({ isOauthLock = false }) {
  const navigate = useNavigate();

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      p: 3
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 5 },
        maxWidth: 560,
        textAlign: 'center',
        borderRadius: 4,
        border: '2px solid #84cc16',
        bgcolor: '#f8fafc',
        boxShadow: '0 20px 40px rgba(132, 204, 22, 0.12)'
      }}>
        <Box sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'rgba(132, 204, 22, 0.15)',
          color: '#4d7c0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2.5,
          border: '2px solid #84cc16'
        }}>
          <ShieldIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          OAuth 2.0 Security Enforced
        </Typography>

        <Typography variant="body1" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
          Renic Soft Master HQ has enforced strict <b>OAuth 2.0 Machine-to-Machine Authentication</b> for this tenant. 
          To unlock access to this automation workspace, please enter your assigned <b>Client ID</b> &amp; <b>Client Secret</b> in the Settings screen and verify credentials.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/settings')}
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              px: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            Go to Settings &amp; Configure OAuth
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
