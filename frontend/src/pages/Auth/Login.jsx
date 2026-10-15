import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert,
  CircularProgress, Tabs, Tab,
  InputAdornment, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import HubIcon from '@mui/icons-material/Hub';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeedIcon from '@mui/icons-material/Speed';

import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import renicLogo from '../../assets/logo.jpeg';
import renicIcon from '../../assets/logo-icon.jpeg';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function Login() {
  const [tab, setTab] = useState(0); // 0=Sign In, 1=Forgot Password
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Login OTP state
  const [openLoginOtpDialog, setOpenLoginOtpDialog] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpLoading, setLoginOtpLoading] = useState(false);
  const [loginOtpError, setLoginOtpError] = useState('');
  const [loginOtpEmail, setLoginOtpEmail] = useState('');

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!mobile || !password) {
      setError('Please enter both mobile number and password');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { phone: mobile, password });

      if (response.data?.requiresOtp) {
        setError('');
        setLoginOtpEmail(response.data?.email || '');
        setOpenLoginOtpDialog(true);
        return;
      }

      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    setLoginOtpError('');
    if (!loginOtp.trim()) {
      setLoginOtpError('Please enter the OTP');
      return;
    }
    try {
      setLoginOtpLoading(true);
      const res = await apiClient.post('/auth/verify-login-otp', { email: loginOtpEmail || '', otp: loginOtp.trim() });
      if (res.data?.success && res.data.token) {
        login(res.data.user, res.data.token);
        setOpenLoginOtpDialog(false);
        navigate('/');
      }
    } catch (err) {
      setLoginOtpError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoginOtpLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email, mobile number, or Client ID');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await apiClient.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
        identifier: forgotEmail.trim(),
        phone: forgotEmail.trim(),
        clientId: forgotEmail.trim()
      });
      setForgotSuccess(res.data?.message || 'Password reset link generated successfully.');
    } catch (err) {
      setForgotError(err.response?.data?.error || err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflowX: 'hidden' }}>
      
      {/* ── LEFT PANE: Company Overview & Brand Showcase ── */}
      <Box
        sx={{
          flex: { xs: '0 0 auto', md: '1 1 48%', lg: '1 1 45%' },
          background: 'linear-gradient(150deg, #0b1329 0%, #0f172a 45%, #1e293b 100%)',
          color: '#ffffff',
          p: { xs: 4, sm: 6, lg: 7 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          borderRight: { md: '1px solid #1e293b' }
        }}
      >
        {/* Top Header & Brand */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                bgcolor: '#ffffff',
                p: 1.2,
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box
                component="img"
                src={renicLogo || renicIcon}
                alt="Renic Technology"
                sx={{ height: 42, maxWidth: 130, objectFit: 'contain' }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  RENIC TECHNOLOGY
                </Typography>
                <Chip
                  label="TECH"
                  size="small"
                  sx={{
                    bgcolor: '#84cc16',
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '1px', fontWeight: 600 }}>
                IDEAS | SOLUTIONS | GROWTH
              </Typography>
            </Box>
          </Box>

          <Box sx={{ my: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 1.5, lineHeight: 1.25 }}>
              WhatsApp &amp; Instagram <br />
              <Box component="span" sx={{ color: '#84cc16' }}>Automation CRM Hub</Box>
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500 }}>
              Omnichannel Campaigns, AI Chatbot Triggers, Multi-Engine Dispatch &amp; Real-time Unified Team Inbox.
            </Typography>
          </Box>

          {/* Feature Highlights */}
          <Stack spacing={2.2} sx={{ my: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', p: 1, borderRadius: '10px', color: '#84cc16' }}>
                <HubIcon sx={{ fontSize: '1.25rem' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  Multi-Engine Dispatch Engine
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                  Seamless QR Web session &amp; Official Cloud Meta API dual architecture.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', p: 1, borderRadius: '10px', color: '#84cc16' }}>
                <SmartToyIcon sx={{ fontSize: '1.25rem' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  Visual Bot Builder &amp; Smart Flows
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                  Automated keyword triggers, AI auto-replies, and interactive template buttons.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', p: 1, borderRadius: '10px', color: '#84cc16' }}>
                <SpeedIcon sx={{ fontSize: '1.25rem' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  Dynamic Split-Screen &amp; Fast Billing
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                  Adjustable column workspaces with instant PDF generation and digital signature.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Company Details */}
        <Box sx={{ pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#94a3b8' }}>
              <LocationOnIcon sx={{ fontSize: '1rem', color: '#84cc16' }} />
              <Typography variant="caption">123, Main Road, Gobichettipalayam, Erode - 638452, TN, India</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#94a3b8' }}>
              <EmailIcon sx={{ fontSize: '1rem', color: '#84cc16' }} />
              <Typography variant="caption">info@renictechnology.com · +91 88070 25752</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#94a3b8' }}>
              <LanguageIcon sx={{ fontSize: '1rem', color: '#84cc16' }} />
              <Typography variant="caption">www.renictechnology.com · GSTIN: 33AAAAA0000A1Z5</Typography>
            </Box>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
            © {new Date().getFullYear()} Renic Technology. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* ── RIGHT PANE: Clean Full-Height Login Card ── */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '1 1 52%', lg: '1 1 55%' },
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6, lg: 8 }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            p: { xs: 3.5, sm: 5 }
          }}
        >
          {/* Header Title */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                Account Sign In
              </Typography>
              <Chip
                icon={<SecurityIcon sx={{ fontSize: '0.9rem !important', color: '#15803d !important' }} />}
                label="SSL Secure"
                size="small"
                sx={{
                  bgcolor: '#dcfce7',
                  color: '#15803d',
                  fontWeight: 700,
                  fontSize: '0.7rem'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Enter your authorized credentials to access your dispatch dashboard.
            </Typography>
          </Box>

          {/* Navigation Tabs (Only Sign In & Forgot Password) */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, borderBottom: '1px solid #f1f5f9' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                flexGrow: 1,
                '& .MuiTabs-indicator': { backgroundColor: '#84cc16', height: 3 },
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.88rem', minWidth: 'auto', px: 1.5, '&.Mui-selected': { color: '#0f172a' } }
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Forgot Password" />
            </Tabs>
          </Box>

          {successMessage && <Alert severity="success" sx={{ my: 2, borderRadius: '10px' }}>{successMessage}</Alert>}
          {error && <Alert severity="error" sx={{ my: 2, borderRadius: '10px' }}>{error}</Alert>}

          {/* ── Tab 0: Sign In ── */}
          <TabPanel value={tab} index={0}>
            <form onSubmit={handleLogin}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Registered Mobile Number
                </Typography>
                <TextField
                  fullWidth
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter registered mobile number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#64748b' }} /></InputAdornment>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      '&.Mui-focused': { backgroundColor: '#ffffff' },
                      '&.Mui-focused fieldset': { borderColor: '#84cc16', borderWidth: '2px' }
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#64748b' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      '&.Mui-focused': { backgroundColor: '#ffffff' },
                      '&.Mui-focused fieldset': { borderColor: '#84cc16', borderWidth: '2px' }
                    }
                  }}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                  backgroundColor: '#84cc16',
                  color: '#0f172a',
                  '&:hover': { backgroundColor: '#65a30d' },
                  fontWeight: 800,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.98rem',
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px rgba(132, 204, 22, 0.35)'
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#0f172a' }} /> : 'Sign In to Workspace'}
              </Button>
            </form>
          </TabPanel>

          {/* ── Tab 1: Forgot Password ── */}
          <TabPanel value={tab} index={1}>
            {forgotSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{forgotSuccess}</Alert>}
            {forgotError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{forgotError}</Alert>}
            <form onSubmit={handleForgotPassword}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Enter your registered administrator email address, mobile number, or Client ID to receive a secure recovery code.
              </Typography>
              <TextField
                fullWidth
                label="Registered Email / Mobile / Client ID"
                type="text"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                disabled={forgotLoading}
                placeholder="e.g. admin@renic.ai or 9047647093 or APX-WA01"
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '12px', '&.Mui-focused fieldset': { borderColor: '#84cc16' } } }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={forgotLoading}
                sx={{
                  backgroundColor: '#84cc16',
                  color: '#0f172a',
                  '&:hover': { backgroundColor: '#65a30d' },
                  textTransform: 'none',
                  py: 1.3,
                  fontWeight: 800,
                  borderRadius: '12px'
                }}
              >
                {forgotLoading ? <CircularProgress size={20} sx={{ color: '#0f172a' }} /> : 'Send Recovery Link'}
              </Button>
            </form>
          </TabPanel>

          {/* Card Footer */}
          <Box sx={{ mt: 4, pt: 2.5, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Protected by Renic Soft Enterprise Shield · 256-Bit TLS
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Login OTP Dialog */}
      <Dialog open={openLoginOtpDialog} onClose={() => setOpenLoginOtpDialog(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Verify 2FA Login OTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            A one-time verification code has been sent to <strong>{loginOtpEmail}</strong>.
          </Typography>
          {loginOtpError && <Alert severity="error" sx={{ mb: 2 }}>{loginOtpError}</Alert>}
          <TextField
            fullWidth
            label="6-Digit OTP"
            value={loginOtp}
            onChange={e => setLoginOtp(e.target.value)}
            disabled={loginOtpLoading}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLoginOtpDialog(false)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleVerifyLoginOtp(loginOtpEmail)}
            disabled={loginOtpLoading}
            sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#65a30d' } }}
          >
            {loginOtpLoading ? 'Verifying...' : 'Verify & Login'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
