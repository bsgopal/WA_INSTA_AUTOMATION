import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import apiClient from '../../../api/client';

/**
 * MobilePreview Component
 * Renders a simulated WhatsApp screen for message content verification
 */
const MobilePreview = ({ data }) => {
  let content = data.messageContent || '';

  // Simple formatting helper: *bold* -> <strong>, _italic_ -> <em>
  const formatMessageText = (text) => {
    if (!text) return 'Type a message to preview...';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Italics: _text_
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Monospace: `text`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '300px',
      height: '520px',
      bgcolor: '#efeae2',
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      backgroundSize: 'cover',
      border: '10px solid #1e293b',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      margin: '0 auto'
    }}>
      {/* Notch */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100px',
        height: '14px',
        bgcolor: '#1e293b',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        zIndex: 5
      }} />

      {/* WhatsApp Header */}
      <Box sx={{
        bgcolor: '#075E54',
        color: '#FFFFFF',
        pt: 2,
        pb: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 2
      }}>
        <Box sx={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          bgcolor: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '11px',
          color: '#ffffff'
        }}>
          WA
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '11.5px', lineHeight: 1.1 }}>
            WhatsApp Business
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '9px', display: 'block', lineHeight: 1 }}>
            online
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box sx={{
        flex: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflowY: 'auto'
      }}>
        {/* Message bubble */}
        <Box sx={{
          alignSelf: 'flex-start',
          maxWidth: '90%',
          bgcolor: '#E2F9CB',
          color: '#1f2937',
          borderRadius: '8px',
          borderTopLeftRadius: 0,
          p: 1.2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative',
          mb: 1
        }}>
          {/* Media preview */}
          {data.mediaUrl && (
            <Box sx={{ mb: 1, borderRadius: '4px', overflow: 'hidden', border: '1px solid #C0DFB0', bgcolor: '#F3F4F6' }}>
              {data.mediaType === 'image' ? (
                <Box
                  component="img"
                  src={data.mediaUrl}
                  alt="Media upload"
                  sx={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }}
                />
              ) : data.mediaType === 'video' ? (
                <Box sx={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000000', color: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontSize: '10px' }}>▶ Video Preview</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '16px' }}>📄</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '10px', wordBreak: 'break-all' }}>
                    {data.mediaFileName || 'Document.pdf'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Text Content */}
          <Typography variant="body2" sx={{ fontSize: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', pb: 0.5, lineHeight: 1.35 }}>
            {formatMessageText(content)}
          </Typography>

          {/* Timestamp & receipt */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0.2,
            mt: -0.2
          }}>
            <Typography variant="caption" sx={{ fontSize: '8px', color: '#6b7280' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#34B7F1', fontWeight: 700, fontSize: '10px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        {data.buttonLabel && (
          <Box sx={{
            alignSelf: 'flex-start',
            width: '90%',
            bgcolor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E4E4E4',
            textAlign: 'center',
            py: 0.6,
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            mb: 1
          }}>
            <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '11px', fontWeight: 600 }}>
              🔗 {data.buttonLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * EditCampaignForm Component
 * Modular edit form with collapsible sections and Google/Microsoft-level design
 */
const EditCampaignForm = React.memo(({
  campaign,
  open = false,
  onClose = () => {},
  onSave = () => {},
  loading = false
}) => {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [metaTemplates, setMetaTemplates] = useState([]);
  const [metaTemplatesLoading, setMetaTemplatesLoading] = useState(false);
  const [templateSynced, setTemplateSynced] = useState(false);

  const buildFormData = (campaignData) => {
    const data = campaignData || {};
    return {
      name: data.name || '',
      topic: data.topic || '',
      description: data.description || '',
      type: data.type || 'PROMOTIONAL',
      channels: data.channels || [],
      messageTemplate: data.messageTemplate?._id || data.messageTemplate || '',
      metaTemplateName: data.metaTemplateName || '',
      metaTemplateLanguage: data.metaTemplateLanguage || 'en_US',
      messageType: data.messageType || 'TEXT',
      messageContent: data.messageContent || '',
      buttonLabel: data.buttonLabel || '',
      buttonUrl: data.buttonUrl || '',
      mediaType: data.mediaType || 'none',
      mediaUrl: data.mediaUrl || '',
      mediaPreviewData: data.mediaPreviewData || '',
      mediaMimeType: data.mediaMimeType || '',
      mediaFileName: data.mediaFileName || '',
      scheduledAt: data.scheduledAt || ''
    };
  };

  const [formData, setFormData] = useState(buildFormData(campaign));

  // Fetch templates and customers when dialog is opened
  useEffect(() => {
    if (open) {
      const fetchTemplates = async () => {
        try {
          setTemplatesLoading(true);
          const response = await apiClient.get('/templates');
          setTemplates(response.data || []);
        } catch (error) {
          console.error('Error fetching templates:', error);
          setTemplates([]);
        } finally {
          setTemplatesLoading(false);
        }
      };
      const fetchMetaTemplates = async () => {
        try {
          setMetaTemplatesLoading(true);
          const response = await apiClient.get('/templates/meta');
          setMetaTemplates(response.data || []);
        } catch (error) {
          console.error('Error fetching Meta templates:', error);
          setMetaTemplates([]);
        } finally {
          setMetaTemplatesLoading(false);
        }
      };
      fetchTemplates();
      fetchMetaTemplates();
      setFormData(buildFormData(campaign));
      setTemplateSynced(false);
    }
  }, [campaign, open]);

  const selectedTemplate = templates.find((t) => t._id === formData.messageTemplate) || null;

  useEffect(() => {
    if (!templateSynced && open && selectedTemplate) {
      setFormData((prevState) => {
        const shouldSyncContent = prevState.messageContent === campaign.messageContent || !prevState.messageContent;
        return {
          ...prevState,
          messageContent: shouldSyncContent ? selectedTemplate.content || prevState.messageContent : prevState.messageContent,
          mediaType: selectedTemplate.mediaType || prevState.mediaType,
          mediaUrl: selectedTemplate.mediaUrl || prevState.mediaUrl,
          mediaPreviewData: selectedTemplate.mediaPreviewData || prevState.mediaPreviewData,
          mediaMimeType: selectedTemplate.mediaMimeType || prevState.mediaMimeType,
          mediaFileName: selectedTemplate.mediaFileName || prevState.mediaFileName
        };
      });
      setTemplateSynced(true);
    }
  }, [selectedTemplate, templateSynced, open, campaign]);

  if (!campaign) return null;

  const handleSave = () => {
    onSave(formData);
  };

  const handleClose = () => {
    onClose();
  };

  const isRunning = campaign.status === 'RUNNING';

  const messageTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'MEDIA', label: 'Image' }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)'
        }
      }}
    >
      <DialogTitle sx={{
        fontWeight: 700,
        fontSize: '20px',
        p: 2.5,
        borderBottom: '1px solid #E5E7EB',
        bgcolor: '#F9FAFB'
      }}>
        Edit Campaign
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={7.5}>
            <Stack spacing={3}>
              <TextField
                label="Campaign Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isRunning || loading}
                size="small"
              />

              <Autocomplete
                fullWidth
                options={metaTemplates}
                getOptionLabel={(option) => option.name || ''}
                value={metaTemplates.find((t) => t.name === formData.metaTemplateName) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    metaTemplateName: newValue?.name || '',
                    metaTemplateLanguage: newValue?.language || 'en_US'
                  });
                }}
                loading={metaTemplatesLoading}
                disabled={isRunning || loading || metaTemplatesLoading}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      label="Meta Template"
                      variant="outlined"
                      helperText="Choose the Meta WhatsApp template to send"
                      InputProps={{
                        ...inputProps,
                        endAdornment: (
                          <>
                            {metaTemplatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {inputProps.endAdornment}
                          </>
                        )
                      }}
                      size="small"
                    />
                  );
                }}
              />

              <Autocomplete
                fullWidth
                options={templates}
                getOptionLabel={(option) => option.name || ''}
                value={templates.find((t) => t._id === formData.messageTemplate) || null}
                onChange={(event, newValue) => {
                  const hasTemplateMedia = !!(newValue && (newValue.mediaPreviewData || newValue.mediaUrl));
                  setFormData({
                    ...formData,
                    messageTemplate: newValue ? newValue._id : '',
                    messageContent: newValue ? newValue.content : formData.messageContent,
                    ...(hasTemplateMedia
                      ? {
                          mediaType: newValue.mediaType || 'image',
                          mediaUrl: newValue.mediaUrl || '',
                          mediaPreviewData: newValue.mediaPreviewData || '',
                          mediaMimeType: newValue.mediaMimeType || '',
                          mediaFileName: newValue.mediaFileName || (newValue.name ? `${newValue.name}.jpg` : 'template-media')
                        }
                      : {})
                  });
                }}
                loading={templatesLoading}
                disabled={isRunning || loading || templatesLoading}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      label="App Template"
                      variant="outlined"
                      helperText="Choose the local template format for this campaign"
                      InputProps={{
                        ...inputProps,
                        endAdornment: (
                          <>
                            {templatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {inputProps.endAdornment}
                          </>
                        )
                      }}
                      size="small"
                    />
                  );
                }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Template Type</InputLabel>
                <Select
                  label="Template Type"
                  value={formData.messageType || 'TEXT'}
                  onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                  disabled={isRunning || loading}
                >
                  {messageTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTemplate && (
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#111827' }}>
                    Selected App Template Preview
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedTemplate.content || 'No preview available for this template.'}
                  </Typography>
                </Box>
              )}

              <TextField
                label="Message Content"
                fullWidth
                multiline
                rows={5}
                value={formData.messageContent}
                onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                disabled={isRunning || loading}
                size="small"
                helperText="This content will be sent dynamically through Meta using the selected template."
              />

              {formData.messageType === 'MEDIA' && (
                <TextField
                  label="Media URL"
                  fullWidth
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  disabled={isRunning || loading}
                  size="small"
                  placeholder="https://example.com/image.jpg"
                  helperText="Provide an image URL if this campaign sends media."
                />
              )}

              <TextField
                label="Button Label (Optional)"
                fullWidth
                value={formData.buttonLabel}
                onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                disabled={isRunning || loading}
                size="small"
                placeholder="e.g. View Offer"
              />

              {formData.buttonLabel && (
                <TextField
                  label="Button URL"
                  fullWidth
                  value={formData.buttonUrl}
                  onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                  disabled={isRunning || loading}
                  size="small"
                  placeholder="https://example.com"
                />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'sticky', top: '10px' }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1.5, fontWeight: 700, color: '#4B5563' }}>
                Live WhatsApp Preview
              </Typography>
              <MobilePreview data={formData} />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{
        p: 2.5,
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1.5,
        bgcolor: '#F9FAFB'
      }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || isRunning}
          startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '8px' }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

EditCampaignForm.displayName = 'EditCampaignForm';

export default EditCampaignForm;
