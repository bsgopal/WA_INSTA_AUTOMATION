import { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Paper, Alert, CssBaseline 
} from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
            borderRadius: 2
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <BotIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h5" sx={{ fontWeight: 500 }}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Use your Renic Auto Account
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="mobile"
              label="Mobile Number"
              name="mobile"
              autoComplete="tel"
              autoFocus
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g., 9876543210"
              slotProps={{ input: { sx: { borderRadius: 1.5 } } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 1.5 } } }}
              sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                variant="text" 
                color="primary"
                sx={{ px: 1, fontWeight: 500 }}
              >
                Forgot password?
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                disableElevation
                sx={{ px: 4 }}
              >
                {loading ? 'Signing in...' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
