import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, CardActions,
  Button, TextField, Stack, Chip, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import apiClient from '../../api/client';
import AIProviderStatus from '../../components/AIProviderStatus';

export default function AIFeatures() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get('/customers?limit=100');
        setCustomers(response.data?.customers || []);
      } catch (err) {
        console.error('Failed to load customers for AI tools:', err);
      }
    };
    fetchCustomers();
  }, []);

  const isInputValid = () => {
    if (!selectedFeature) return false;
    if (['churn', 'ltv', 'optimal-time'].includes(selectedFeature.id)) {
      return !!selectedCustomerId;
    }
    return !!input.trim();
  };

  const features = [
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Analyze customer emotions and urgency',
      icon: <SentimentSatisfiedIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
      action: 'Analyze'
    },
    {
      id: 'churn',
      title: 'Churn Prediction',
      description: 'Identify at-risk customers',
      icon: <TrendingDownIcon sx={{ fontSize: 40 }} />,
      color: 'error',
      action: 'Predict'
    },
    {
      id: 'ltv',
      title: 'Lifetime Value',
      description: 'Forecast customer value',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      action: 'Calculate'
    },
    {
      id: 'optimal-time',
      title: 'Optimal Send Time',
      description: 'Best time to reach customers',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
      action: 'Predict'
    },
    {
      id: 'smart-replies',
      title: 'Smart Replies',
      description: 'AI-generated response suggestions',
      icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
      color: 'info',
      action: 'Generate'
    },
    {
      id: 'categorize',
      title: 'Query Categorization',
      description: 'Auto-classify customer messages',
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      color: 'secondary',
      action: 'Categorize'
    }
  ];

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setOpenDialog(true);
  };

  const handleAnalyze = async () => {
    if (!isInputValid()) return;

    try {
      setLoading(true);
      let response;

      switch (selectedFeature.id) {
        case 'sentiment':
          response = await apiClient.post('/ai/analyze-sentiment', { messageText: input });
          setResult(response?.data || { sentiment: 'NEUTRAL', score: 0.5 });
          break;
        case 'smart-replies':
          response = await apiClient.post('/ai/smart-replies', { messageText: input });
          setResult(response?.data || { replies: ['Response 1', 'Response 2'] });
          break;
        case 'categorize':
          response = await apiClient.post('/ai/categorize-query', { messageText: input });
          setResult(response?.data || { category: 'INQUIRY', confidence: 0.85 });
          break;
        case 'churn':
          response = await apiClient.get(`/ai/churn-risk/${selectedCustomerId}`);
          setResult(response?.data || { risk: 'unknown', score: 0 });
          break;
        case 'ltv':
          response = await apiClient.get(`/ai/lifetime-value/${selectedCustomerId}`);
          setResult(response?.data || { ltv: 0, confidence: 'low' });
          break;
        case 'optimal-time':
          response = await apiClient.get(`/ai/optimal-send-time/${selectedCustomerId}`);
          setResult(response?.data || { hour: 10, minute: 0, confidence: 'low' });
          break;
        default:
          setResult({ message: 'Feature not implemented yet' });
          break;
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setResult({ error: error.message || 'Analysis failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setInput('');
    setSelectedCustomerId('');
    setResult(null);
    setSelectedFeature(null);
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI-Powered Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leverage artificial intelligence for smarter automation
          </Typography>
        </Box>
        <AIProviderStatus compact />
      </Box>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.id}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ color: `${feature.color}.main` }}>
                    {feature.icon}
                  </Box>
                  <AutoAwesomeIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                </Box>

                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {feature.description}
                </Typography>

                <Chip
                  label={feature.action}
                  size="small"
                  color={feature.color}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">{selectedFeature?.title}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} mb={3}>
            <Typography variant="body2" color="text.secondary">
              {selectedFeature?.description}
            </Typography>
            <AIProviderStatus compact />
          </Stack>

          {selectedFeature && ['churn', 'ltv', 'optimal-time'].includes(selectedFeature.id) ? (
            <TextField
              select
              fullWidth
              label="Select Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              disabled={loading}
              SelectProps={{
                native: true,
              }}
              variant="outlined"
              helperText="Select a customer to analyze using predictive AI models"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.firstName} {c.lastName} ({c.phone || c.email})
                </option>
              ))}
            </TextField>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Input"
              placeholder="Enter text to analyze..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          )}

          {result && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Analysis complete
              </Alert>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Result:
                </Typography>
                <Typography variant="body2">
                  {JSON.stringify(result, null, 2)}
                </Typography>
              </Paper>
            </Box>
          )}

          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleAnalyze}
            disabled={!isInputValid() || loading}
            disableElevation
          >
            {loading ? 'Analyzing...' : selectedFeature?.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
