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

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // License Activation state
  const [openLicenseDialog, setOpenLicenseDialog] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');

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
    
    if (!mobile || !password) {
      setError('Please enter both mobile number and password');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { phone: mobile, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
      const response = await apiClient.post('/auth/license/activate', { key: licenseKey });
      if (response.data?.success) {
        setLicenseSuccess('License activated and login created successfully!');
        // Automatically log user in
        setTimeout(() => {
          login(response.data.user, response.data.token);
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setLicenseError(err.response?.data?.error || 'Failed to activate license. Please verify your key.');
    } finally {
      setLicenseLoading(false);
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
          maxWidth: 820,
          minHeight: 520,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        {/* Left Panel: Branding & Gradient (Blue Panel) */}
        <Box sx={{ 
          width: { xs: 'none', md: 360 }, 
          display: { xs: 'none', md: 'flex' }, 
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1e88e5 0%, #1565c0 100%)',
          color: '#ffffff',
          p: 4
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              p: 1, 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <BotIcon sx={{ fontSize: 28, color: '#ffffff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Renic AI
            </Typography>
          </Box>

          {/* Description */}
          <Typography variant="h5" sx={{ fontWeight: 500, lineHeight: 1.4, mb: 'auto', pr: 2 }}>
            Your intelligent CRM platform for smarter customer relationships
          </Typography>

          {/* Pagination indicator dots */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ width: 28, height: 6, borderRadius: 3, bgcolor: '#ffffff' }} />
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.4)' }} />
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.4)' }} />
          </Box>
        </Box>

        {/* Right Panel: Sign In Form */}
        <Box sx={{ 
          flexGrow: 1, 
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
        onClose={() => !licenseLoading && setOpenLicenseDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>🔑 Activate License</DialogTitle>
        <form onSubmit={handleActivateLicense}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Paste your license key to register and create your initial admin account.
            </Typography>
            {licenseError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{licenseError}</Alert>}
            {licenseSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>{licenseSuccess}</Alert>}
            <TextField
              label="License Key"
              fullWidth
              required
              placeholder="e.g., RENIC-LIC-XXXXX-XXXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={licenseLoading || !!licenseSuccess}
              size="small"
              autoFocus
              InputProps={{ sx: { borderRadius: 1.5 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenLicenseDialog(false)} disabled={licenseLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={licenseLoading || !!licenseSuccess} disableElevation sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 5 }}>
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
