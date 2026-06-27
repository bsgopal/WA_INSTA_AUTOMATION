import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Paper, Typography, TextField, Button, Alert, CssBaseline 
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import apiClient from '../../api/client';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !retypePassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== retypePassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(`/auth/reset-password/${token}`, {
        email,
        password,
        retypePassword
      });

      if (response.data?.success) {
        setSuccess('Password reset successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: 'background.default' }}>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 4, sm: 6 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 3,
            border: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Enter your email and choose a new password
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              disabled={loading || !!success}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              disabled={loading || !!success}
              inputProps={{ minLength: 6 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Retype New Password"
              type="password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              size="small"
              disabled={loading || !!success}
              inputProps={{ minLength: 6 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
              disabled={loading || !!success}
              disableElevation
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
