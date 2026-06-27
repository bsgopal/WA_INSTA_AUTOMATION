import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import { getResponseRules, getTemplates, getQuickReplies } from '../../api/workflowApi';

/**
 * Right Panel: Quick Message Configuration
 * Configures the response message for a selected condition
 */
const QuickMessageConfig = ({
  workflow,
  selectedId,
  onSave,
}) => {
  const [config, setConfig] = useState({
    title: '',
    type: 'SEND_MESSAGE',
    message: '',
    ruleId: '',
    templateId: '',
    quickReplyId: '',
    mediaUrl: '',
    buttonUrl: '',
    buttonLabel: '',
  });

  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingQuickReplies, setLoadingQuickReplies] = useState(false);

  const [previewMessage, setPreviewMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch response rules, templates, and quick replies on mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoadingRules(true);
        const allRules = await getResponseRules();
        setRules(allRules);
      } catch (err) {
        console.error('Failed to load response rules in config panel:', err);
      } finally {
        setLoadingRules(false);
      }
    };

    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const allTemplates = await getTemplates();
        setTemplates(allTemplates);
      } catch (err) {
        console.error('Failed to load templates in config panel:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    const fetchQuickReplies = async () => {
      try {
        setLoadingQuickReplies(true);
        const allQuickReplies = await getQuickReplies();
        setQuickReplies(allQuickReplies);
      } catch (err) {
        console.error('Failed to load quick replies in config panel:', err);
      } finally {
        setLoadingQuickReplies(false);
      }
    };

    fetchRules();
    fetchTemplates();
    fetchQuickReplies();
  }, []);

  // Load selected card config
  useEffect(() => {
    if (!selectedId) {
      setConfig({ title: '', type: 'SEND_MESSAGE', message: '', ruleId: '', templateId: '', quickReplyId: '', mediaUrl: '', buttonUrl: '', buttonLabel: '' });
      return;
    }

    let card = null;

    if (selectedId === 'default') {
      card = workflow.defaultCard;
    } else {
      card = workflow.responseCards?.find((c) => c.id === selectedId);
    }

    if (card) {
      setConfig({
        title: card.title || '',
        type: card.type || 'SEND_MESSAGE',
        message: card.config?.message || '',
        ruleId: card.config?.ruleId || '',
        templateId: card.config?.templateId || '',
        quickReplyId: card.config?.quickReplyId || '',
        mediaUrl: card.config?.mediaUrl || '',
        buttonUrl: card.config?.buttonUrl || '',
        buttonLabel: card.config?.buttonLabel || '',
      });
    } else {
      setConfig({ title: '', type: 'SEND_MESSAGE', message: '', ruleId: '', templateId: '', quickReplyId: '', mediaUrl: '', buttonUrl: '', buttonLabel: '' });
    }
  }, [selectedId, workflow]);

  const handleSave = () => {
    if (!config.title.trim()) {
      alert('Please enter a card title');
      return;
    }

    if (config.type === 'SEND_MESSAGE' && !config.message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (config.type === 'RESPONSE_RULE' && !config.ruleId) {
      alert('Please select a response rule');
      return;
    }

    if (config.type === 'SEND_TEMPLATE' && !config.templateId) {
      alert('Please select a message template');
      return;
    }

    if (config.type === 'QUICK_REPLY' && !config.quickReplyId) {
      alert('Please select a quick reply');
      return;
    }

    const matchedRule = rules.find((r) => r._id === config.ruleId);
    const matchedTemplate = templates.find((t) => t._id === config.templateId);
    const matchedQuickReply = quickReplies.find((q) => q._id === config.quickReplyId);

    let displayMessage = config.message;
    if (config.type === 'RESPONSE_RULE') {
      displayMessage = matchedRule?.name || 'Send Response Rule';
    } else if (config.type === 'SEND_TEMPLATE') {
      displayMessage = matchedTemplate?.name || 'Send Template';
    } else if (config.type === 'QUICK_REPLY') {
      displayMessage = matchedQuickReply?.title || 'Send Quick Reply';
    }

    onSave(selectedId, {
      title: config.title,
      type: config.type,
      config: {
        message: displayMessage,
        ruleId: config.type === 'RESPONSE_RULE' ? config.ruleId : '',
        templateId: config.type === 'SEND_TEMPLATE' ? config.templateId : '',
        quickReplyId: config.type === 'QUICK_REPLY' ? config.quickReplyId : '',
        mediaUrl: config.type === 'SEND_MESSAGE' ? config.mediaUrl : '',
        buttonUrl: config.type === 'SEND_MESSAGE' ? config.buttonUrl : '',
        buttonLabel: config.type === 'SEND_MESSAGE' ? config.buttonLabel : '',
      },
    });
  };

  const handlePreview = () => {
    setPreviewMessage(config.message);
    setShowPreview(true);
  };

  const AVAILABLE_VARIABLES = [
    { var: '{{customer_name}}', desc: 'Customer name' },
    { var: '{{customer_phone}}', desc: 'Customer phone' },
    { var: '{{selected_item}}', desc: 'Selected LIST item' },
    { var: '{{selected_description}}', desc: 'Item description' },
    { var: '{{current_date}}', desc: 'Current date' },
    { var: '{{shop_name}}', desc: 'Shop name' },
  ];

  if (!selectedId) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: '#F9FAFB',
          border: '2px dashed #e0e0e0',
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: '#999', fontWeight: 600 }}>
            Select a Card to Configure
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
            Click on a condition or response card to edit
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Card Configuration
          </Typography>

          {/* Title */}
          <TextField
            fullWidth
            label="Card Title"
            placeholder="e.g., Send Rings Catalog"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* Type Selection */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Response Type</InputLabel>
            <Select
              value={config.type}
              label="Response Type"
              onChange={(e) => setConfig({ ...config, type: e.target.value, ruleId: '', templateId: '', quickReplyId: '' })}
            >
              <MenuItem value="SEND_MESSAGE">💬 Quick Message</MenuItem>
              <MenuItem value="RESPONSE_RULE">🤖 Send Response Rule</MenuItem>
              <MenuItem value="SEND_TEMPLATE">📋 Message Template</MenuItem>
              <MenuItem value="QUICK_REPLY">⚡ Quick Reply</MenuItem>
              <MenuItem value="TRIGGER_WORKFLOW">🔀 Trigger Workflow</MenuItem>
              <MenuItem value="HUMAN_HANDOVER">📞 Human Handover</MenuItem>
            </Select>
          </FormControl>

          {/* Message Editor */}
          {config.type === 'SEND_MESSAGE' && (
            <>
              <TextField
                fullWidth
                label="Message Text"
                placeholder="Enter message or use variables below..."
                multiline
                rows={6}
                value={config.message}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Variable Suggestions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#666' }}>
                  Available Variables:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Button
                      key={v.var}
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setConfig({
                          ...config,
                          message: config.message + v.var,
                        })
                      }
                      title={v.desc}
                      sx={{
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1,
                        textTransform: 'none',
                        fontFamily: 'monospace',
                      }}
                    >
                      {v.var}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Media Image URL */}
              <TextField
                fullWidth
                label="Media Image URL (Optional)"
                placeholder="https://example.com/image.jpg"
                value={config.mediaUrl || ''}
                onChange={(e) => setConfig({ ...config, mediaUrl: e.target.value })}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Action Button Link (Optional) */}
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Button Label (Optional)"
                  placeholder="e.g. Visit Website"
                  value={config.buttonLabel || ''}
                  onChange={(e) => setConfig({ ...config, buttonLabel: e.target.value })}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Button URL Link (Optional)"
                  placeholder="https://example.com"
                  value={config.buttonUrl || ''}
                  onChange={(e) => setConfig({ ...config, buttonUrl: e.target.value })}
                  size="small"
                />
              </Stack>

              {/* Preview Button */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
                sx={{ mb: 2 }}
              >
                Preview Message
              </Button>

              {/* Preview Box */}
              {showPreview && (
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#E3F2FD',
                    border: '1px solid #90CAF9',
                    mb: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1976D2' }}>
                    Preview:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: '#333', whiteSpace: 'pre-wrap' }}
                  >
                    {previewMessage}
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {config.type === 'RESPONSE_RULE' && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Response Rule</InputLabel>
              <Select
                value={config.ruleId || ''}
                label="Select Response Rule"
                onChange={(e) => setConfig({ ...config, ruleId: e.target.value })}
              >
                {loadingRules ? (
                  <MenuItem disabled>Loading rules...</MenuItem>
                ) : rules.length === 0 ? (
                  <MenuItem disabled>No rules available</MenuItem>
                ) : (
                  rules.map((r) => (
                    <MenuItem key={r._id} value={r._id}>
                      {r.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {config.type === 'SEND_TEMPLATE' && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Message Template</InputLabel>
              <Select
                value={config.templateId || ''}
                label="Select Message Template"
                onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
              >
                {loadingTemplates ? (
                  <MenuItem disabled>Loading templates...</MenuItem>
                ) : templates.length === 0 ? (
                  <MenuItem disabled>No templates available</MenuItem>
                ) : (
                  templates.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {config.type === 'QUICK_REPLY' && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Quick Reply</InputLabel>
              <Select
                value={config.quickReplyId || ''}
                label="Select Quick Reply"
                onChange={(e) => setConfig({ ...config, quickReplyId: e.target.value })}
              >
                {loadingQuickReplies ? (
                  <MenuItem disabled>Loading quick replies...</MenuItem>
                ) : quickReplies.length === 0 ? (
                  <MenuItem disabled>No quick replies available</MenuItem>
                ) : (
                  quickReplies.map((q) => (
                    <MenuItem key={q._id} value={q._id}>
                      {q.title} ({q.category})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {config.type === 'TRIGGER_WORKFLOW' && (
            <Alert severity="info">Workflow selection coming soon</Alert>
          )}

          {config.type === 'HUMAN_HANDOVER' && (
            <Alert severity="info">Handover configuration coming soon</Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Save Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disableElevation
          >
            Save Card Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card elevation={0} sx={{ border: '1px solid #E8E8E8', backgroundColor: '#F5F5F5' }}>
        <CardContent>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#666' }}>
            💡 Tip
          </Typography>
          <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
            Use variables to personalize messages with customer data. Messages are sent via WhatsApp with full support for emojis and formatting.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuickMessageConfig;
