import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import apiClient from '../api/client';

export default function AIProviderStatus({ compact = false, sx = {} }) {
  const [state, setState] = useState({ loading: true, error: '', settings: null });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiClient.get('/shop-config/ai-settings');
        if (!active) return;
        if (response.data.success) {
          setState({ loading: false, error: '', settings: response.data.settings || {} });
        } else {
          setState({ loading: false, error: 'Could not load AI provider settings.', settings: null });
        }
      } catch (error) {
        if (!active) return;
        setState({ loading: false, error: 'Could not load AI provider settings.', settings: null });
      }
    };

    load();
    return () => { active = false; };
  }, []);

  if (state.loading) {
    return (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={sx}>
        <Skeleton variant="rounded" width={120} height={24} />
        {!compact && <Skeleton variant="text" width={200} />}
      </Stack>
    );
  }

  if (state.error) {
    return (
      <Alert severity="warning" sx={{ ...sx, borderRadius: 2 }}>
        {state.error}
      </Alert>
    );
  }

  const useAnthropic = !!state.settings?.useAnthropic;
  const activeProvider = useAnthropic ? 'Anthropic' : 'Gemini';
  const activeModel = useAnthropic
    ? (state.settings?.anthropicModel || 'claude-3-haiku-20240307')
    : (state.settings?.geminiModel || 'gemini-1.5-flash');

  return (
    <Box sx={sx}>
      <Stack
        direction={compact ? 'column' : 'row'}
        spacing={compact ? 0.5 : 1.5}
        alignItems={compact ? 'flex-start' : 'center'}
        sx={{ p: compact ? 0 : 1.5, borderRadius: 2, bgcolor: compact ? 'transparent' : '#f8fafc', border: compact ? 'none' : '1px solid #e2e8f0' }}
      >
        <Chip
          label={`${activeProvider} active`}
          color={useAnthropic ? 'secondary' : 'primary'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Model: {activeModel}
        </Typography>
      </Stack>
    </Box>
  );
}
