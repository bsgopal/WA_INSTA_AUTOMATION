import { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, Alert, CssBaseline,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  InputAdornment, IconButton, Chip
} from '@mui/material';
import { 
  Phone as PhoneIcon,
  Lock as LockIcon,
  Star as StarIcon,
  FlashOn as FlashOnIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingBag as ShoppingBagIcon
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import renicLogo from '../../assets/logo.jpeg';
import renicIcon from '../../assets/logo-icon.jpeg';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // License Activation state
  const [openLicenseDialog, setOpenLicenseDialog] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');
  const [extractedDetails, setExtractedDetails] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [licenseOtpDialog, setLicenseOtpDialog] = useState(false);
  const [licenseOtp, setLicenseOtp] = useState('');
  const [licenseOtpLoading, setLicenseOtpLoading] = useState(false);
  const [licenseOtpError, setLicenseOtpError] = useState('');

  // Forgot Password state
  const [openForgotDialog, setOpenForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [testResetLink, setTestResetLink] = useState('');

  // Login OTP state
  const [openLoginOtpDialog, setOpenLoginOtpDialog] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpLoading, setLoginOtpLoading] = useState(false);
  const [loginOtpError, setLoginOtpError] = useState('');
  const [loginOtpEmail, setLoginOtpEmail] = useState('');

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleQuickFillAdmin = () => {
    setMobile('9345578103');
    setPassword('123456');
    setError('');
  };

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

  const handleExtractLicense = async () => {
    setLicenseError('');
    setLicenseSuccess('');
    setExtractedDetails(null);

    if (!licenseKey.trim()) {
      setLicenseError('Please enter a license key');
      return;
    }

    try {
      setExtracting(true);
      const response = await apiClient.post('/auth/license/extract', { key: licenseKey });
      if (response.data?.success) {
        setExtractedDetails(response.data.details);
      }
    } catch (err) {
      setLicenseError(err.response?.data?.error || 'Failed to extract license details. Please verify your key.');
    } finally {
      setExtracting(false);
    }
  };

  const handleActivateLicense = async (e) => {
    e.preventDefault();
    setLicenseError('');
    setLicenseSuccess('');
    
    if (!licenseKey.trim()) {
      setLicenseError('Please enter a license key');
      return;
    }

    try {
      setLicenseLoading(true);
      const response = await apiClient.post('/auth/license/send-otp', { key: licenseKey });
      if (response.data?.success) {
        setLicenseSuccess('OTP sent to license owner email. Please enter OTP to verify.');
        setLicenseOtpDialog(true);
      }
    } catch (err) {
      setLicenseError(err.response?.data?.error || 'Failed to request license OTP.');
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleVerifyLicenseOtp = async () => {
    setLicenseOtpError('');
    if (!licenseOtp.trim()) {
      setLicenseOtpError('Please enter the OTP');
      return;
    }
    try {
      setLicenseOtpLoading(true);
      const res = await apiClient.post('/auth/license/verify-otp', { key: licenseKey, otp: licenseOtp.trim() });
      if (res.data?.success) {
        setLicenseOtpDialog(false);
        setOpenLicenseDialog(false);
        setLicenseSuccess('');
        setExtractedDetails(null);
        setLicenseKey('');
        setLicenseOtp('');
        setError('');
        setSuccessMessage('License activated successfully! Please login with your credentials.');
      }
    } catch (err) {
      setLicenseOtpError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLicenseOtpLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (emailForOtp) => {
    setLoginOtpError('');
    if (!loginOtp.trim()) {
      setLoginOtpError('Please enter the OTP');
      return;
    }
    try {
      setLoginOtpLoading(true);
      const res = await apiClient.post('/auth/verify-login-otp', { email: emailForOtp || '', otp: loginOtp.trim() });
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
    setTestResetLink('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      if (response.data?.success) {
        setForgotSuccess('A reset link has been sent to your email.');
        if (response.data.resetLink) {
          setTestResetLink(response.data.resetLink);
        }
      }
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f1f3f6',
      p: { xs: 1.5, sm: 3 }
    }}>
      <CssBaseline />
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: 820,
          minHeight: 520,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* Left Panel: Obsidian Slate Banner */}
        <Box sx={{ 
          width: { xs: '100%', md: '40%' }, 
          bgcolor: '#0f172a',
          background: 'radial-gradient(ellipse at top left, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          p: { xs: 3, md: 4.5 },
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <Box>
            {/* Official Brand Logo Mark */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: '10px',
                  p: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
                  width: 52,
                  height: 52,
                  flexShrink: 0
                }}
              >
                <Box
                  component="img"
                  src={renicIcon}
                  alt="Renic Tech Logo Icon"
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </Box>
              <Box>
                <Typography sx={{ 
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  fontWeight: 900, 
                  fontSize: '1.35rem', 
                  letterSpacing: '0.4px',
                  color: '#ffffff',
                  lineHeight: 1.1
                }}>
                  RENIC <span style={{ color: '#84cc16' }}>TECH</span>
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mt: 0.3 }}>
                  Automation Platform
                </Typography>
              </Box>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 2, fontSize: '1.75rem', letterSpacing: '-0.3px' }}>
              Sign In
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Enterprise WhatsApp & Instagram CRM, AI Smart Automation & Marketing Suite
            </Typography>

            {/* Feature Highlights */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CheckCircleIcon sx={{ color: '#84cc16', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem' }}>
                  Full Platform Admin & Role Access
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CheckCircleIcon sx={{ color: '#84cc16', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem' }}>
                  Unified WhatsApp & Instagram CRM
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CheckCircleIcon sx={{ color: '#84cc16', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem' }}>
                  AI Automation, Flows & Catalog Hub
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Super Admin Badge at Bottom Left */}
          <Box sx={{ 
            mt: 4, 
            pt: 2, 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1 
          }}>
            <StarIcon sx={{ color: '#84cc16', fontSize: 22 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#84cc16', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Renic Full Access
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Super Admin Privileges Active
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel: Clean White Form */}
        <Box sx={{ 
          width: { xs: '100%', md: '60%' }, 
          p: { xs: 3, sm: 5 }, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: '#ffffff'
        }}>
          <Box>
            {/* Mobile Header Logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: '8px',
                  p: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  width: 36,
                  height: 36,
                  border: '1px solid #e2e8f0'
                }}
              >
                <Box
                  component="img"
                  src={renicIcon}
                  alt="Renic Icon"
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>
                RENIC <span style={{ color: '#65a30d' }}>TECH</span>
              </Typography>
            </Box>

            {/* Quick Fill Admin Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleQuickFillAdmin}
                startIcon={<FlashOnIcon sx={{ color: '#0f172a' }} />}
                sx={{
                  bgcolor: '#84cc16',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                  '&:hover': { bgcolor: '#65a30d' }
                }}
              >
                Auto-Fill Admin (9345578103)
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: '4px' }}>
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: '4px' }}>
                {successMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              {/* Phone Number Field */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5, fontSize: '0.75rem', letterSpacing: '0.4px' }}>
                  ENTER MOBILE NUMBER
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="mobile"
                  name="mobile"
                  autoComplete="tel"
                  autoFocus
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9345578103"
                  size="small"
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: '#84cc16', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '6px' } 
                  }}
                />
              </Box>

              {/* Password Field */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.4px' }}>
                    ENTER PASSWORD
                  </Typography>
                  <Button 
                    variant="text" 
                    onClick={() => {
                      setForgotError('');
                      setForgotSuccess('');
                      setTestResetLink('');
                      setForgotEmail('');
                      setOpenForgotDialog(true);
                    }}
                    sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#4d7c0f' }}
                  >
                    Forgot?
                  </Button>
                </Box>
                <TextField
                  required
                  fullWidth
                  name="password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  size="small"
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#84cc16', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '6px' } 
                  }}
                />
              </Box>

              {/* Terms note */}
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem', mb: 3 }}>
                By continuing, you agree to Renic's Terms of Use and Privacy Policy.
              </Typography>

              {/* Primary CTA Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ 
                  bgcolor: '#84cc16',
                  color: '#0f172a',
                  py: 1.2,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  borderRadius: '6px',
                  boxShadow: '0 4px 14px rgba(132, 204, 22, 0.35)',
                  letterSpacing: '0.5px',
                  '&:hover': {
                    bgcolor: '#65a30d',
                    boxShadow: '0 4px 18px rgba(132, 204, 22, 0.45)'
                  }
                }}
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </Button>
            </Box>
          </Box>

          {/* Footer - License Activation Link */}
          <Box sx={{ 
            mt: 4, 
            pt: 2.5, 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Button
              variant="text"
              onClick={() => {
                setLicenseError('');
                setLicenseSuccess('');
                setLicenseKey('');
                setExtractedDetails(null);
                setExtracting(false);
                setOpenLicenseDialog(true);
              }}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', p: 0, color: '#4d7c0f' }}
            >
              🔑 Activate License Key
            </Button>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Renic Automation © 2026
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* License Activation Dialog */}
      <Dialog 
        open={openLicenseDialog} 
        onClose={() => !licenseLoading && !extracting && setOpenLicenseDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '6px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          🔑 Activate License Key
        </DialogTitle>
        <form onSubmit={handleActivateLicense}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Paste your license key to verify and activate your platform account.
            </Typography>
            {licenseError && <Alert severity="error" sx={{ mb: 2, borderRadius: '4px' }}>{licenseError}</Alert>}
            {licenseSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '4px' }}>{licenseSuccess}</Alert>}
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                label="License Key"
                fullWidth
                required
                placeholder="Paste license key..."
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  if (extractedDetails) setExtractedDetails(null);
                }}
                disabled={licenseLoading || !!licenseSuccess || extracting}
                size="small"
                autoFocus
                InputProps={{ sx: { borderRadius: '4px' } }}
              />
              <Button 
                variant="contained" 
                onClick={handleExtractLicense}
                disabled={licenseLoading || !!licenseSuccess || extracting || !licenseKey.trim()}
                sx={{ 
                  bgcolor: '#0f172a', 
                  color: '#ffffff', 
                  textTransform: 'none', 
                  fontWeight: 700, 
                  borderRadius: '4px',
                  '&:hover': { bgcolor: '#1e293b' }
                }}
              >
                {extracting ? 'Checking...' : 'Verify'}
              </Button>
            </Box>

            {extractedDetails && (
              <Box sx={{ 
                bgcolor: 'rgba(132, 204, 22, 0.08)', 
                borderRadius: '6px', 
                p: 2, 
                border: '1px solid rgba(132, 204, 22, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3f6212', mb: 0.5 }}>
                  📋 License Details
                </Typography>
                <Typography variant="body2"><b>Company:</b> {extractedDetails.name}</Typography>
                <Typography variant="body2"><b>Tier:</b> {extractedDetails.planTier}</Typography>
                <Typography variant="body2"><b>Owner:</b> {extractedDetails.firstName} {extractedDetails.lastName} ({extractedDetails.phone})</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenLicenseDialog(false)} disabled={licenseLoading || extracting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={licenseLoading || !extractedDetails || extractedDetails.isUsed} 
              sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#65a30d' } }}
            >
              {licenseLoading ? 'Activating...' : 'Activate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={openForgotDialog} 
        onClose={() => !forgotLoading && setOpenForgotDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '6px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>Reset Password</DialogTitle>
        <form onSubmit={handleForgotPassword}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter your registered email address to receive password reset instructions.
            </Typography>
            {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
            {forgotSuccess && <Alert severity="success" sx={{ mb: 2 }}>{forgotSuccess}</Alert>}
            <TextField
              label="Email Address"
              fullWidth
              required
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              size="small"
              autoFocus
            />
            {testResetLink && (
              <Box sx={{ mt: 2, p: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <Typography variant="caption" sx={{ color: '#0f172a', wordBreak: 'break-all' }}>
                  Reset link: {testResetLink}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenForgotDialog(false)} disabled={forgotLoading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={forgotLoading} sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#65a30d' } }}>
              {forgotLoading ? 'Sending...' : 'Send Link'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Login OTP Dialog (if triggered) */}
      <Dialog open={openLoginOtpDialog} onClose={() => !loginOtpLoading && setOpenLoginOtpDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '6px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>Enter Verification OTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            An OTP was sent to <b>{loginOtpEmail}</b>. Enter it below to complete login.
          </Typography>
          {loginOtpError && <Alert severity="error" sx={{ mb: 2 }}>{loginOtpError}</Alert>}
          <TextField
            label="6-Digit OTP"
            fullWidth
            value={loginOtp}
            onChange={(e) => setLoginOtp(e.target.value)}
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenLoginOtpDialog(false)} disabled={loginOtpLoading}>Cancel</Button>
          <Button onClick={() => handleVerifyLoginOtp(loginOtpEmail)} variant="contained" disabled={loginOtpLoading} sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#65a30d' } }}>
            {loginOtpLoading ? 'Verifying...' : 'Verify & Sign In'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}