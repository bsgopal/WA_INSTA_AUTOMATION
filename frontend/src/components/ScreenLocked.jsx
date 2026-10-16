import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Chip, TextField,
  InputAdornment, IconButton, CircularProgress, Alert, Divider
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyIcon from '@mui/icons-material/Key';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import apiClient from '../api/client';

export default function ScreenLocked({ isOauthLock = false, isLicenseLock = false, isForbiddenScreen = false, screenName = '' }) {
  const navigate = useNavigate();
  const { refreshScreens, loading, oauthStatus, customerCode } = useTenant();

  const [inputClientId, setInputClientId] = useState(() => localStorage.getItem('wa_oauth_client_id') || oauthStatus?.clientId || '');
  const [inputClientSecret, setInputClientSecret] = useState(() => localStorage.getItem('wa_oauth_client_secret') || oauthStatus?.clientSecret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (oauthStatus?.clientId && !inputClientId) {
      setInputClientId(oauthStatus.clientId);
      localStorage.setItem('wa_oauth_client_id', oauthStatus.clientId);
    }
    if (oauthStatus?.clientSecret && !inputClientSecret) {
      setInputClientSecret(oauthStatus.clientSecret);
      localStorage.setItem('wa_oauth_client_secret', oauthStatus.clientSecret);
    }
  }, [oauthStatus?.clientId, oauthStatus?.clientSecret]);

  const handleQuickUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!inputClientId.trim() || !inputClientSecret.trim()) {
      setErrorMsg('Please enter both Client ID and Client Secret.');
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg('');
      setSuccessMsg('');

      localStorage.setItem('wa_oauth_client_id', inputClientId.trim());
      localStorage.setItem('wa_oauth_client_secret', inputClientSecret.trim());

      const res = await apiClient.post('/settings/verify-oauth', {
        clientId: inputClientId.trim(),
        clientSecret: inputClientSecret.trim()
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Workspace credentials verified successfully! Unlocking...');
        setTimeout(async () => {
          if (typeof refreshScreens === 'function') {
            await refreshScreens();
          }
        }, 600);
      } else {
        setErrorMsg(res.data?.error || 'Verification failed. Please check credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Verification failed';
      setErrorMsg(msg);
    } finally {
      setVerifying(false);
    }
  };

  const renderInlineUnlockForm = () => (
    <Box component="form" onSubmit={handleQuickUnlock} sx={{ mt: 3, textAlign: 'left', width: '100%' }}>
      <Divider sx={{ mb: 2.5 }}>
        <Chip
          icon={<KeyIcon sx={{ fontSize: 14 }} />}
          label="Activate with Client Credentials"
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: '#f1f5f9' }}
        />
      </Divider>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
          {successMsg}
        </Alert>
      )}

      <Stack spacing={1.8}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
            Client ID
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. renic_apx-wa01_..."
            value={inputClientId}
            onChange={(e) => setInputClientId(e.target.value)}
            disabled={verifying}
            slotProps={{
              input: {
                sx: { fontFamily: 'monospace', fontSize: '0.82rem', bgcolor: '#f8fafc', borderRadius: 2 }
              }
            }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
            Client Secret
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={showSecret ? 'text' : 'password'}
            placeholder="Enter Client Secret from Renic Soft"
            value={inputClientSecret}
            onChange={(e) => setInputClientSecret(e.target.value)}
            disabled={verifying}
            slotProps={{
              input: {
                sx: { fontFamily: 'monospace', fontSize: '0.82rem', bgcolor: '#f8fafc', borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowSecret(!showSecret)} edge="end">
                      {showSecret ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={verifying || !inputClientId.trim() || !inputClientSecret.trim()}
          sx={{
            bgcolor: '#84cc16',
            color: '#0f172a',
            py: 1.1,
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(132, 204, 22, 0.3)',
            '&:hover': { bgcolor: '#65a30d' }
          }}
        >
          {verifying ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} sx={{ color: '#0f172a' }} />
              <span>Verifying & Unlocking...</span>
            </Stack>
          ) : (
            'Verify & Unlock Workspace'
          )}
        </Button>
      </Stack>
    </Box>
  );

  // 1. License Lock / Inactive Subscription
  if (isLicenseLock) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        p: 2
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, sm: 4.5 },
          maxWidth: 580,
          width: '100%',
          textAlign: 'center',
          borderRadius: 4,
          border: '1px solid #fde68a',
          bgcolor: '#ffffff',
          boxShadow: '0 20px 50px rgba(245, 158, 11, 0.08)'
        }}>
          <Box sx={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            bgcolor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: '2px solid #f59e0b',
            animation: 'pulse 2s infinite'
          }}>
            <LockOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>

          <Chip
            label="SUBSCRIPTION INACTIVE"
            size="small"
            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: '0.68rem', mb: 1.5 }}
          />

          <Typography variant="h5" sx={{ fontWeight: 850, color: '#0f172a', mb: 1 }}>
            Subscription Activation Required
          </Typography>

          <Typography variant="body2" sx={{ color: '#475569', mb: 2, lineHeight: 1.5, fontSize: '0.88rem' }}>
            Your workspace subscription is currently pending activation or credentials configuration.
            Paste your Client ID and Client Secret below to unlock immediately, or visit Settings.
          </Typography>

          {/* Quick inline activation form */}
          {renderInlineUnlockForm()}

          <Divider sx={{ my: 2.5 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/settings')}
              sx={{
                borderColor: '#cbd5e1',
                color: '#0f172a',
                px: 2.5,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              Go to Full Settings
            </Button>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={() => refreshScreens()}
              disabled={loading}
              sx={{
                color: '#64748b',
                px: 2,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
              }}
            >
              {loading ? 'Checking Status...' : 'Refresh Status'}
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

          <Stack direction="row" spacing={1.5} justifyContent="center">
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
            <Button
              variant="outlined"
              onClick={() => navigate('/settings')}
              sx={{
                borderColor: '#cbd5e1',
                color: '#0f172a',
                px: 2.5,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Open Settings
            </Button>
          </Stack>
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
      p: 2
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 4.5 },
        maxWidth: 580,
        width: '100%',
        textAlign: 'center',
        borderRadius: 4,
        border: '2px solid #84cc16',
        bgcolor: '#ffffff',
        boxShadow: '0 20px 40px rgba(132, 204, 22, 0.12)'
      }}>
        <Box sx={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          bgcolor: 'rgba(132, 204, 22, 0.15)',
          color: '#4d7c0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          border: '2px solid #84cc16'
        }}>
          <ShieldIcon sx={{ fontSize: 38 }} />
        </Box>

        <Chip
          label="AUTHENTICATION REQUIRED"
          size="small"
          sx={{ bgcolor: '#ecfccb', color: '#3f6212', fontWeight: 800, fontSize: '0.68rem', mb: 1.5 }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          Workspace Authentication Required
        </Typography>

        <Typography variant="body2" sx={{ color: '#475569', mb: 2, lineHeight: 1.5, fontSize: '0.88rem' }}>
          This workspace requires OAuth 2.0 API credentials from Renic Soft Master HQ.
          Enter your Client ID and Client Secret below to authenticate and unlock all features.
        </Typography>

        {/* Quick inline activation form */}
        {renderInlineUnlockForm()}

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/settings')}
            sx={{
              borderColor: '#cbd5e1',
              color: '#0f172a',
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#f8fafc' }
            }}
          >
            Go to Settings
          </Button>
          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={() => refreshScreens()}
            disabled={loading}
            sx={{
              color: '#64748b',
              px: 2,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
