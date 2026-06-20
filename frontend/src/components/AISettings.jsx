import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import apiClient from '../api/client';

export default function AISettings() {
  const [settings, setSettings] = useState({
    useAnthropic: false,
    anthropicApiKey: '',
    anthropicModel: 'claude-3-haiku-20240307',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/shop-config/ai-settings');
        if (response.data.success && response.data.settings) {
          setSettings(prev => ({
            ...prev,
            ...response.data.settings
          }));
        }
      } catch (error) {
        console.error('Failed to load AI settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaveStatus('Saving...');
    try {
      await apiClient.post('/shop-config/ai-settings', settings);
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save AI settings', error);
      setSaveStatus('Failed to save settings.');
    }
  };

  if (isLoading) return <div className="p-6">Loading AI settings...</div>;

  return (
    <Box sx={{ p: 3, maxWidth: 640, mx: 'auto', bgcolor: '#ffffff', borderRadius: 4, boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>AI Integrations</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure the provider used for live AI replies and fallback generation.
          </Typography>
        </Box>

        <TextField
          label="Google Gemini API Key"
          fullWidth
          type="password"
          placeholder="AIzaSy..."
          value={settings.geminiApiKey || ''}
          onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
          helperText="Used when Gemini is the active provider or as a fallback."
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.useAnthropic || false}
              onChange={(e) => setSettings({ ...settings, useAnthropic: e.target.checked })}
            />
          }
          label="Enable Anthropic as primary AI provider"
        />

        {settings.useAnthropic && (
          <Stack spacing={2} sx={{ p: 2, border: '1px solid #dbeafe', borderRadius: 3, bgcolor: '#f8fbff' }}>
            <TextField
              label="Anthropic API Key"
              fullWidth
              type="password"
              placeholder="sk-ant-..."
              value={settings.anthropicApiKey || ''}
              onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
              helperText="Required when Anthropic is enabled."
            />
            <TextField
              label="Anthropic Model"
              fullWidth
              value={settings.anthropicModel || ''}
              onChange={(e) => setSettings({ ...settings, anthropicModel: e.target.value })}
              placeholder="claude-3-haiku-20240307"
            />
          </Stack>
        )}

        <TextField
          label="Gemini Model"
          fullWidth
          value={settings.geminiModel || ''}
          onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
          placeholder="gemini-1.5-flash"
          helperText="Fallback model when Gemini is active."
        />

        <Alert severity={settings.useAnthropic ? 'info' : 'success'}>
          {settings.useAnthropic
            ? 'Anthropic will be used first when an API key is available.'
            : 'Gemini is currently the active provider.'}
        </Alert>

        <Button
          onClick={handleSave}
          variant="contained"
          size="large"
          disableElevation
        >
          Save AI Settings
        </Button>

        {saveStatus && (
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', fontWeight: 600, color: saveStatus.includes('Failed') ? 'error.main' : 'success.main' }}
          >
            {saveStatus}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
