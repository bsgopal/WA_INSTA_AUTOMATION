import React from 'react';
import { Box, Paper, Typography, Button, Stack, Chip } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';

export default function ScreenLocked({ isOauthLock = false, isLicenseLock = false, isForbiddenScreen = false, screenName = '' }) {
  const navigate = useNavigate();
  const { refreshScreens, loading } = useTenant();

  // 1. License Lock / Inactive Subscription
  if (isLicenseLock) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        p: 3
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 560,
          textAlign: 'center',
          borderRadius: 4,
          border: '1px solid #fde68a',
          bgcolor: '#ffffff',
          boxShadow: '0 20px 50px rgba(245, 158, 11, 0.08)'
        }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            border: '2px solid #f59e0b',
            animation: 'pulse 2s infinite'
          }}>
            <LockOutlinedIcon sx={{ fontSize: 38 }} />
          </Box>

          <Chip
            label="SUBSCRIPTION INACTIVE"
            size="small"
            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: '0.68rem', mb: 1.5 }}
          />

          <Typography variant="h5" sx={{ fontWeight: 850, color: '#0f172a', mb: 1.5 }}>
            Subscription Activation Required
          </Typography>

          <Typography variant="body1" sx={{ color: '#475569', mb: 3, lineHeight: 1.6, fontSize: '0.92rem' }}>
            Your workspace subscription is currently inactive or pending activation. Please contact your account administrator or support to activate your service.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center', borderColor: '#e2e8f0' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>
              If your subscription was recently activated or renewed, click the button below to refresh your workspace status immediately.
            </Typography>
          </Paper>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => refreshScreens()}
              disabled={loading}
              sx={{
                bgcolor: '#84cc16',
                color: '#0f172a',
                px: 3,
                py: 1.2,
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#65a30d' }
              }}
            >
              {loading ? 'Checking Status...' : 'Refresh Status'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                borderColor: '#cbd5e1',
                color: '#0f172a',
                px: 2.5,
                py: 1.2,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // 2. Forbidden Screen (Feature disabled for this client license)
  if (isForbiddenScreen) {
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
          maxWidth: 540,
          textAlign: 'center',
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
        }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: '2px solid #f87171'
          }}>
            <BlockIcon sx={{ fontSize: 36 }} />
          </Box>

          <Chip
            label="PLAN UPGRADE REQUIRED"
            size="small"
            sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 800, fontSize: '0.68rem', mb: 1.5 }}
          />

          <Typography variant="h6" sx={{ fontWeight: 850, color: '#0f172a', mb: 1 }}>
            Feature Not Included in Plan
          </Typography>

          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, lineHeight: 1.6 }}>
            The module {screenName ? <b>"{screenName}"</b> : 'you requested'} is not enabled in your current 
            subscription package. To enable this feature, please contact your account administrator or support to upgrade your plan.
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // 3. OAuth 2.0 Lockout
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

        <Chip
          label="AUTHENTICATION REQUIRED"
          size="small"
          sx={{ bgcolor: '#ecfccb', color: '#3f6212', fontWeight: 800, fontSize: '0.68rem', mb: 1.5 }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          Workspace Authentication Required
        </Typography>

        <Typography variant="body1" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
          This workspace requires API authentication credentials to be configured. 
          Please verify your credentials in Settings or contact your system administrator.
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
            Go to Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
