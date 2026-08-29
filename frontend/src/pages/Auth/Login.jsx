import { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Paper, Alert, CssBaseline,
  Dialog, DialogTitle, DialogContent, DialogActions, Link, Stack,
  InputAdornment, IconButton
} from '@mui/material';
import { 
  SmartToy as BotIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  MoreHoriz as MoreHorizIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import logo from '../../assets/logo.jpeg';

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
        // Admin login requires OTP verification
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
      // Use OTP flow: request server to send OTP for this license
      const response = await apiClient.post('/auth/license/send-otp', { key: licenseKey });
      if (response.data?.success) {
        setLicenseSuccess('OTP sent to license owner email (or logged to server). Please enter OTP to verify.');
        setLicenseOtpDialog(true);
      }
    } catch (err) {
      setLicenseError(err.response?.data?.error || 'Failed to request license OTP. Please verify your key.');
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

  // Login OTP dialog state and handlers
  const [openLoginOtpDialog, setOpenLoginOtpDialog] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpLoading, setLoginOtpLoading] = useState(false);
  const [loginOtpError, setLoginOtpError] = useState('');
  const [loginOtpEmail, setLoginOtpEmail] = useState('');

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
      setForgotError(err.response?.data?.error || 'Failed to send reset link. Please check your email.');
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
      backgroundColor: '#f8fafc',
      p: 2
    }}>
      <CssBaseline />
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex', 
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #dadce0',
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '100%',
          minHeight: 520,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        {/* Left Panel: Branding & Gradient (Blue Panel) */}
        <Box sx={{ 
          width: { xs: 'none', md: '50%' }, 
          display: { xs: 'none', md: 'flex' }, 
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1e88e5 0%, #1565c0 100%)',
          color: '#ffffff',
          p: 4
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ 
              bgcolor: '#ffffff', 
              p: 1.5, 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <img src={logo} alt="Company Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                Renic Technology
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                Enterprise SaaS Solutions
              </Typography>
            </Box>
          </Box>

          {/* Description */}
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6, mb: 'auto', textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)', px: 1 }}>
            Unified WhatsApp & Instagram automation, lead management, and intelligent billing for your business growth.
          </Typography>

          {/* Company Details */}
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
              📞 Contact Support:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#ffffff', mb: 1 }}>
              support@renicsoft.com
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
              🌐 Website:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#ffffff' }}>
              www.renicsoft.com
            </Typography>
          </Box>
        </Box>

        {/* Right Panel: Sign In Form */}
        <Box sx={{ 
          width: { xs: '100%', md: '50%' }, 
          p: { xs: 4, sm: 5 }, 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Action dots Menu option */}
          <IconButton sx={{ position: 'absolute', top: 16, right: 16 }}>
            <MoreHorizIcon sx={{ color: '#5f6368' }} />
          </IconButton>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 1, fontSize: '2rem' }}>
              Sign in
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
              Continue to Renic CRM Platform
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', flexGrow: 1 }}>
            {/* Phone Number Field */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 1 }}>
              PHONE NUMBER
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
              placeholder="9876543210"
              InputProps={{ 
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#9aa0a6', fontSize: 20, mr: 0.5 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 } 
              }}
              sx={{ mb: 3 }}
            />

            {/* Password Field */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 1 }}>
              PASSWORD
            </Typography>
            <TextField
              required
              fullWidth
              name="password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              InputProps={{ 
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#9aa0a6', fontSize: 20, mr: 0.5 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 } 
              }}
              sx={{ mb: 4 }}
            />
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setForgotError('');
                  setForgotSuccess('');
                  setTestResetLink('');
                  setForgotEmail('');
                  setOpenForgotDialog(true);
                }}
                sx={{ 
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  '&:hover': {
                    borderColor: '#dadce0',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                Forgot password?
              </Button>
              <Button
                type="submit"
                variant="outlined"
                disabled={loading}
                sx={{ 
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    borderColor: '#dadce0',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Next'}
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          </Box>

          {/* Footer Activation Section */}
          <Box sx={{ 
            width: '100%', 
            borderTop: '1px solid #e8eaed', 
            pt: 3, 
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
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', p: 0, color: '#1a73e8' }}
            >
              Activate license
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Renic CRM © 2026
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
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>🔑 Activate License</DialogTitle>
        <form onSubmit={handleActivateLicense}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Paste your license key to extract details and register your admin account.
            </Typography>
            {licenseError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{licenseError}</Alert>}
            {licenseSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>{licenseSuccess}</Alert>}
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                label="License Key"
                fullWidth
                required
                placeholder="e.g., iv:ciphertext"
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  if (extractedDetails) setExtractedDetails(null);
                }}
                disabled={licenseLoading || !!licenseSuccess || extracting}
                size="small"
                autoFocus
                InputProps={{ sx: { borderRadius: 1.5 } }}
              />
              <Button 
                variant="outlined" 
                onClick={handleExtractLicense}
                disabled={licenseLoading || !!licenseSuccess || extracting || !licenseKey.trim()}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                {extracting ? 'Verifying...' : 'Verify'}
              </Button>
            </Box>

            {extractedDetails && (
              <Box sx={{ 
                bgcolor: 'action.hover', 
                borderRadius: 2, 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                  📋 Extracted License Information
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Company / Business Name</Typography>
                    <Typography variant="body2" fontWeight={600}>{extractedDetails.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Owner Name</Typography>
                    <Typography variant="body2" fontWeight={600}>{extractedDetails.firstName} {extractedDetails.lastName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Owner Email</Typography>
                    <Typography variant="body2" fontWeight={600}>{extractedDetails.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Owner Phone</Typography>
                    <Typography variant="body2" fontWeight={600}>{extractedDetails.phone}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Subscription Plan</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase', color: 'success.main' }}>
                      {extractedDetails.planTier}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Expiry Date</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {extractedDetails.licenseEnd ? new Date(extractedDetails.licenseEnd).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                {extractedDetails.daysRemaining !== undefined && !extractedDetails.expired && (
                  <Box sx={{ mt: 1, borderRadius: 1.5, p: 1.5, bgcolor: extractedDetails.expiringSoon ? 'warning.light' : 'success.light', color: extractedDetails.expiringSoon ? 'warning.dark' : 'success.dark' }}>
                    <Typography variant="caption" fontWeight={700}>
                      {extractedDetails.expiringSoon
                        ? `⚠️ License expires in ${extractedDetails.daysRemaining} day${extractedDetails.daysRemaining === 1 ? '' : 's'} (${new Date(extractedDetails.licenseEnd).toLocaleDateString()}). Please renew before it expires.`
                        : `✅ License valid for ${extractedDetails.daysRemaining} more days (expires ${new Date(extractedDetails.licenseEnd).toLocaleDateString()}).`}
                    </Typography>
                  </Box>
                )}
                {extractedDetails.expired && (
                  <Alert severity="error" sx={{ mt: 1, borderRadius: 1.5 }}>
                    This license has expired. Please contact Renic Technology to renew it.
                  </Alert>
                )}
                {extractedDetails.isUsed && (
                  <Alert severity="warning" sx={{ mt: 1, borderRadius: 1.5 }}>
                    This license key has already been activated.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenLicenseDialog(false)} disabled={licenseLoading || extracting} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={licenseLoading || !!licenseSuccess || extracting || !extractedDetails || extractedDetails.isUsed} 
              disableElevation 
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 5, px: 3 }}
            >
              {licenseLoading ? 'Activating...' : 'Activate & Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* License OTP Dialog */}
      <Dialog open={licenseOtpDialog} onClose={() => !licenseOtpLoading && setLicenseOtpDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter License OTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>An OTP was sent to the license owner's email. Enter it below to verify and create the admin account.</Typography>
          {licenseOtpError && <Alert severity="error" sx={{ mb: 2 }}>{licenseOtpError}</Alert>}
          <TextField
            label="OTP"
            fullWidth
            value={licenseOtp}
            onChange={(e) => setLicenseOtp(e.target.value)}
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLicenseOtpDialog(false)} disabled={licenseOtpLoading}>Cancel</Button>
          <Button onClick={handleVerifyLicenseOtp} disabled={licenseOtpLoading} variant="contained">{licenseOtpLoading ? 'Verifying...' : 'Verify OTP'}</Button>
        </DialogActions>
      </Dialog>

      {/* Login OTP Dialog (Admin) */}
      <Dialog open={openLoginOtpDialog} onClose={() => !loginOtpLoading && setOpenLoginOtpDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Admin Login OTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>An OTP was sent to your registered email. Enter it below to complete login.</Typography>
          {loginOtpError && <Alert severity="error" sx={{ mb: 2 }}>{loginOtpError}</Alert>}
          <TextField
            label="Registered Email"
            fullWidth
            value={loginOtpEmail}
            size="small"
            disabled
            sx={{ mb: 1 }}
          />
          <TextField
            label="OTP"
            fullWidth
            value={loginOtp}
            onChange={(e) => setLoginOtp(e.target.value)}
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginOtpDialog(false)} disabled={loginOtpLoading}>Cancel</Button>
          <Button onClick={() => handleVerifyLoginOtp(loginOtpEmail)} disabled={loginOtpLoading} variant="contained">{loginOtpLoading ? 'Verifying...' : 'Verify OTP'}</Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={openForgotDialog} 
        onClose={() => !forgotLoading && setOpenForgotDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>🔑 Forgot Password</DialogTitle>
        <form onSubmit={handleForgotPassword}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter your email address and we'll send you a password reset link.
            </Typography>
            {forgotError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{forgotError}</Alert>}
            {forgotSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>{forgotSuccess}</Alert>}
            
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              disabled={forgotLoading || !!forgotSuccess}
              size="small"
              autoFocus
              InputProps={{ sx: { borderRadius: 1.5 } }}
            />

            {testResetLink && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', display: 'block', mb: 0.5 }}>
                  LOCAL DEVELOPMENT TOOL (Reset Link):
                </Typography>
                <Link href={testResetLink} target="_blank" sx={{ wordBreak: 'break-all', fontSize: '0.8rem', fontWeight: 600 }}>
                  {testResetLink}
                </Link>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenForgotDialog(false)} disabled={forgotLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={forgotLoading} disableElevation sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 5 }}>
              {forgotLoading ? 'Sending...' : 'Send Link'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}