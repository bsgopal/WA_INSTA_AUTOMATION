import React, { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Chip,
  Autocomplete
} from '@mui/material';
import apiClient from '../../../../api/client';

/**
 * MessageStep Component
 * Step 2 of the campaign creation wizard
 * Collects: Message Template, Message Content, Message Type
 */
const MessageStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/templates');
        setTemplates(response.data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const messageTypes = [
    { value: 'TEXT', label: 'Text Only' },
    { value: 'MEDIA', label: 'Media Message' },
    { value: 'TEMPLATE', label: 'Template' },
    { value: 'QUICK_REPLY', label: 'Quick Reply' }
  ];

  const selectedTemplate = templates.find((t) => t._id === data.messageTemplate);

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Select or create the message content for your campaign.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Message Type</InputLabel>
        <Select
          label="Message Type"
          value={data.messageType || 'TEXT'}
          onChange={(e) => onChange({ ...data, messageType: e.target.value })}
        >
          {messageTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {data.messageType === 'TEMPLATE' && (
        <Autocomplete
          fullWidth
          size="small"
          options={templates}
          getOptionLabel={(option) => option.name || ''}
          value={templates.find((t) => t._id === data.messageTemplate) || null}
          onChange={(event, newValue) => {
            const templateId = newValue ? newValue._id : '';
            onChange({
              ...data,
              messageTemplate: templateId,
              messageContent: newValue ? newValue.content : data.messageContent
            });
          }}
          loading={loading}
          renderInput={(params) => {
            const hasSlotProps = !!params.slotProps?.input;
            return (
              <TextField
                {...params}
                label="Select Template"
                variant="outlined"
                error={!!errors.messageTemplate}
                helperText={errors.messageTemplate || 'Choose a message template'}
                slotProps={hasSlotProps ? {
                  ...params.slotProps,
                  input: {
                    ...params.slotProps.input,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.slotProps.input.endAdornment}
                      </React.Fragment>
                    )
                  }
                } : undefined}
                InputProps={!hasSlotProps ? {
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps?.endAdornment}
                    </React.Fragment>
                  )
                } : undefined}
              />
            );
          }}
        />
      )}

      {selectedTemplate && (
        <Paper sx={{ p: 2, bgcolor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', display: 'block', letterSpacing: '0.05em' }}>
              TEMPLATE PREVIEW
            </Typography>
            {selectedTemplate.category && (
              <Chip label={selectedTemplate.category} size="small" variant="outlined" sx={{ fontSize: '10px', height: '18px' }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#1F2937', mb: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
            {selectedTemplate.content}
          </Typography>
          {(() => {
            const getVariables = (text) => {
              if (!text) return [];
              const matches = text.match(/{{([^}]+)}}/g);
              if (!matches) return [];
              return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
            };
            const vars = selectedTemplate.variables?.map(v => typeof v === 'string' ? v : v.name) || getVariables(selectedTemplate.content);
            if (vars.length > 0) {
              return (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#4B5563', display: 'block', mb: 0.5 }}>
                    Variables:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {vars.map((param, idx) => (
                      <Chip key={idx} label={`{{${param}}}`} size="small" sx={{ fontSize: '11px', height: '22px' }} />
                    ))}
                  </Box>
                </Box>
              );
            }
            return null;
          })()}
        </Paper>
      )}

      <TextField
        label="Message Content"
        fullWidth
        multiline
        rows={4}
        value={data.messageContent || ''}
        onChange={(e) => onChange({ ...data, messageContent: e.target.value })}
        error={!!errors.messageContent}
        helperText={errors.messageContent || 'Use {{variable}} for dynamic content'}
        placeholder="Enter your message here. Use {{firstName}}, {{phone}}, etc. for personalization"
        size="small"
      />

      <TextField
        label="Button Label (Optional)"
        fullWidth
        value={data.buttonLabel || ''}
        onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
        placeholder="e.g., View Offer"
        size="small"
      />

      {data.buttonLabel && (
        <TextField
          label="Button URL"
          fullWidth
          value={data.buttonUrl || ''}
          onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
          placeholder="https://example.com"
          size="small"
        />
      )}
    </Stack>
  );
});

MessageStep.displayName = 'MessageStep';

export default MessageStep;
