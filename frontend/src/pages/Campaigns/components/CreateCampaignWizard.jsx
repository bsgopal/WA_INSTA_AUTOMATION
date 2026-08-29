import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../../../api/client';

/**
 * MobilePreview Component
 * Renders a simulated WhatsApp screen for message content verification
 */
const TEMPLATE_TYPE_TEXT_VALUE = 'TEXT';
const TEMPLATE_TYPE_MEDIA_VALUE = 'MEDIA';
const MEDIA_TYPE_IMAGE = 'image';
const MEDIA_TYPE_NONE = 'none';
const DEFAULT_CAMPAIGN_TYPE = 'ONE_TIME';
const DEFAULT_CHANNELS = ['whatsapp'];
const UPLOAD_ACCEPT = 'image/*';
const CREATE_CAMPAIGN_LABEL = 'Create Campaign';
const WIZARD_DESCRIPTION = 'Select a Meta template, choose a message type, and enter the dynamic content to send.';
const CAMPAIGN_NAME_LABEL = 'Campaign Name';
const CAMPAIGN_NAME_PLACEHOLDER = 'e.g. Weekend Announcement';
const META_TEMPLATE_LABEL = 'Meta Template';
const TEMPLATE_FORMAT_LABEL = 'App Template';
const TEMPLATE_TYPE_LABEL = 'Template Type';
const MESSAGE_CONTENT_LABEL = 'Message Content';
const MESSAGE_CONTENT_PLACEHOLDER = 'Type the message text to send...';
const MESSAGE_CONTENT_HELPER = 'This content will be sent dynamically through Meta using the selected template.';
const META_TEMPLATE_HELPER = 'Choose the Meta WhatsApp template to send to customers.';
const TEMPLATE_FORMAT_HELPER = 'Choose a local application template for campaign content.';
const META_TEMPLATE_PREVIEW_TITLE = 'Selected Meta Template Preview';
const TEMPLATE_PREVIEW_TITLE = 'Selected Template Preview';
const EMPTY_TEMPLATE_PREVIEW = 'This template does not include preview text.';
const UPLOAD_PROMPT = 'Upload campaign image';
const UPLOAD_HINT = 'PNG, JPG, JPEG. Max 15MB.';
const UPLOADING_IMAGE_TEXT = 'Uploading image...';
const CANCEL_LABEL = 'Cancel';
const CAMPAIGN_NAME_ERROR = 'Campaign name is required';
const META_TEMPLATE_SELECTION_ERROR = 'Please select a Meta template';
const TEMPLATE_SELECTION_ERROR = 'Please select a template format';
const MESSAGE_CONTENT_ERROR = 'Message content is required';
const MEDIA_URL_ERROR = 'Upload an image for this campaign';

const TEMPLATE_TYPE_OPTION_TEXT_LABEL = 'Text';
const TEMPLATE_TYPE_OPTION_IMAGE_LABEL = 'Image';
const TEMPLATE_TYPE_OPTIONS = [
  { value: TEMPLATE_TYPE_TEXT_VALUE, label: TEMPLATE_TYPE_OPTION_TEXT_LABEL },
  { value: TEMPLATE_TYPE_MEDIA_VALUE, label: TEMPLATE_TYPE_OPTION_IMAGE_LABEL }
];
const TEMPLATES_ENDPOINT = '/templates';
const META_TEMPLATES_ENDPOINT = '/templates/meta';
const CAMPAIGN_MEDIA_UPLOAD_ENDPOINT = '/campaigns/media/upload';
const UPLOAD_IMAGE_ALT = 'Campaign media';
const PREVIEW_UPLOAD_ALT = 'Media upload';
const PREVIEW_NO_MESSAGE_TEXT = 'Type a message to preview...';
const PREVIEW_UPLOAD_BANNER_TEXT = 'Upload image banner';
const UPLOAD_SUCCESS_IMAGE_LABEL = 'Uploaded image';
const CREATE_CAMPAIGN_LOADING_TEXT = `${CREATE_CAMPAIGN_LABEL}...`;
const FIX_ERRORS_BEFORE_CREATING = 'Please fix the errors before creating the campaign';
const TEMPLATES_LOAD_ERROR = 'Unable to load template formats. Please try again later.';
const UPLOAD_FAILED_ERROR = 'Failed to upload media';
const LIVE_WHATSAPP_PREVIEW_TITLE = 'Live WhatsApp Preview';
const WHATSAPP_HEADER_TITLE = 'WhatsApp Business';
const ONLINE_STATUS_LABEL = 'online';
const PREVIEW_IMAGE_READY_TEXT = 'Image is ready to send with this campaign.';
const PREVIEW_IMAGE_UPLOAD_ALT = 'Media upload';

const MobilePreview = ({ data }) => {
  let content = data.messageContent || '';
  const isImageMode = data.messageType === TEMPLATE_TYPE_MEDIA_VALUE;

  // Simple formatting helper: *bold* -> <strong>, _italic_ -> <em>
  const formatMessageText = (text) => {
    if (!text) {
      return PREVIEW_NO_MESSAGE_TEXT;
    }
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
      maxWidth: '280px',
      height: '470px',
      bgcolor: '#efeae2',
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      backgroundSize: 'cover',
      border: '8px solid #1e293b',
      borderRadius: '20px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
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
        width: '90px',
        height: '12px',
        bgcolor: '#1e293b',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        zIndex: 5
      }} />

      {/* WhatsApp Header */}
      <Box sx={{
        bgcolor: '#075E54',
        color: '#FFFFFF',
        pt: 1.8,
        pb: 0.8,
        px: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 2
      }}>
        <Box sx={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          bgcolor: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '10px',
          color: '#ffffff'
        }}>
          WA
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '11px', lineHeight: 1.1 }}>
            {WHATSAPP_HEADER_TITLE}
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '8px', display: 'block', lineHeight: 1 }}>
            {ONLINE_STATUS_LABEL}
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box sx={{
        flex: 1,
        p: 1.2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflowY: 'auto'
      }}>
        {/* Message bubble */}
        <Box sx={{
          alignSelf: 'flex-start',
          maxWidth: '92%',
          bgcolor: '#E2F9CB',
          color: '#1f2937',
          borderRadius: '8px',
          borderTopLeftRadius: 0,
          p: 1,
          boxShadow: '0 1px 1.5px rgba(0,0,0,0.1)',
          position: 'relative',
          mb: 0.8
        }}>
          {/* Media preview */}
          {isImageMode && (
            <Box sx={{ mb: 0.8, borderRadius: '4px', overflow: 'hidden', border: '1px solid #C0DFB0', bgcolor: '#F3F4F6' }}>
              {data.mediaUrl || data.mediaPreviewData ? (
                <Box
                  component="img"
                  src={data.mediaPreviewData || data.mediaUrl}
                  alt={PREVIEW_IMAGE_UPLOAD_ALT}
                  sx={{ width: '100%', maxHeight: '110px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#E5E7EB', color: '#6B7280' }}>
                  <ImageIcon fontSize="medium" />
                  <Typography variant="caption" sx={{ fontSize: '8px', mt: 0.5 }}>{PREVIEW_UPLOAD_BANNER_TEXT}</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Text Content */}
          <Typography variant="body2" sx={{ fontSize: '11px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', pb: 0.4, lineHeight: 1.3 }}>
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
            <Typography variant="caption" sx={{ fontSize: '7.5px', color: '#6b7280' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#34B7F1', fontWeight: 700, fontSize: '9px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        {data.buttonLabel && (
          <Box sx={{
            alignSelf: 'flex-start',
            width: '92%',
            bgcolor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #E4E4E4',
            textAlign: 'center',
            py: 0.5,
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            mb: 0.8
          }}>
            <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '10px', fontWeight: 600 }}>
              🔗 {data.buttonLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * CreateCampaignWizard Component
 * Step-by-step campaign creation wizard (3 steps)
 * Consolidates Details, Message Content & Media, and Schedule details into a premium look.
 */
const defaultFormData = {
  name: '',
  metaTemplateName: '',
  metaTemplateLanguage: 'en_US',
  messageTemplate: '',
  messageType: TEMPLATE_TYPE_TEXT_VALUE,
  mediaType: MEDIA_TYPE_NONE,
  mediaUrl: '',
  mediaPreviewData: '',
  mediaMimeType: '',
  mediaFileName: '',
  messageContent: ''
};

const CreateCampaignWizard = React.memo(({
  open = false,
  onClose = () => {},
  onComplete = () => {},
  loading = false
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [stepError, setStepError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState('');
  const [metaTemplates, setMetaTemplates] = useState([]);
  const [metaTemplatesLoading, setMetaTemplatesLoading] = useState(false);
  const [metaTemplateLoadError, setMetaTemplateLoadError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setTemplateLoadError('');
    setTemplatesLoading(true);

    try {
      const response = await apiClient.get(TEMPLATES_ENDPOINT);
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplateLoadError(TEMPLATES_LOAD_ERROR);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchMetaTemplates = useCallback(async () => {
    setMetaTemplateLoadError('');
    setMetaTemplatesLoading(true);

    try {
      const response = await apiClient.get(META_TEMPLATES_ENDPOINT);
      setMetaTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load Meta templates:', error);
      setMetaTemplateLoadError(TEMPLATES_LOAD_ERROR);
    } finally {
      setMetaTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setFormData(defaultFormData);
      setErrors({});
      setStepError('');
      fetchTemplates();
      fetchMetaTemplates();
    }
  }, [open, fetchTemplates, fetchMetaTemplates]);

  const validateStep = useCallback(() => {
    const newErrors = {};
    setStepError('');

    if (!formData.name?.trim()) {
      newErrors.name = CAMPAIGN_NAME_ERROR;
    }
    if (!formData.metaTemplateName) {
      newErrors.metaTemplateName = META_TEMPLATE_SELECTION_ERROR;
    }
    if (!formData.messageTemplate) {
      newErrors.messageTemplate = TEMPLATE_SELECTION_ERROR;
    }
    if (!formData.messageContent?.trim()) {
      newErrors.messageContent = MESSAGE_CONTENT_ERROR;
    }
    if (formData.messageType === TEMPLATE_TYPE_MEDIA_VALUE && !formData.mediaUrl) {
      newErrors.mediaUrl = MEDIA_URL_ERROR;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleComplete = useCallback(async () => {
    if (!validateStep()) {
      setStepError(FIX_ERRORS_BEFORE_CREATING);
      return;
    }

    onComplete({
      ...formData,
      channels: DEFAULT_CHANNELS,
      type: DEFAULT_CAMPAIGN_TYPE
    });
  }, [formData, onComplete, validateStep]);

  const handleClose = useCallback(() => {
    setFormData(defaultFormData);
    setErrors({});
    setStepError('');
    onClose();
  }, [onClose]);

  const handleFormDataChange = useCallback((newData) => {
    setFormData(newData);
    setErrors({});
    setStepError('');
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === formData.messageTemplate) || null,
    [templates, formData.messageTemplate]
  );

  const selectedMetaTemplate = useMemo(
    () => metaTemplates.find((t) => t.name === formData.metaTemplateName) || null,
    [metaTemplates, formData.metaTemplateName]
  );

  const handleTemplateTypeChange = useCallback((value) => {
    setFormData((prev) => ({
      ...prev,
      messageType: value,
      mediaType: value === TEMPLATE_TYPE_MEDIA_VALUE ? MEDIA_TYPE_IMAGE : MEDIA_TYPE_NONE,
      ...(value === TEMPLATE_TYPE_TEXT_VALUE
        ? {
            mediaUrl: '',
            mediaPreviewData: '',
            mediaMimeType: '',
            mediaFileName: ''
          }
        : {})
    }));
  }, []);

  const handleMediaUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append('file', file);
      setUploadingMedia(true);

      const response = await apiClient.post(CAMPAIGN_MEDIA_UPLOAD_ENDPOINT, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleFormDataChange({
        ...formData,
        mediaUrl: response.data.mediaUrl,
        mediaPreviewData: response.data.mediaPreviewData,
        mediaMimeType: response.data.mediaMimeType,
        mediaFileName: response.data.mediaFileName,
        mediaType: MEDIA_TYPE_IMAGE,
        messageType: TEMPLATE_TYPE_MEDIA_VALUE
      });
    } catch (error) {
      console.error('Upload error:', error);
      setStepError(error.response?.data?.error || UPLOAD_FAILED_ERROR);
    } finally {
      setUploadingMedia(false);
    }
  }, [formData, handleFormDataChange]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          width: 'calc(100% - 64px)',
          height: 'calc(100% - 64px)',
          maxHeight: 'calc(100vh - 64px)',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{
        p: 2.5,
        px: 4,
        borderBottom: '1px solid #D9D9D9',
        bgcolor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
      }}>
        <DialogTitle sx={{ p: 0, fontSize: '18px', fontWeight: 700, color: '#1F2937', letterSpacing: '0.2px' }}>
          {CREATE_CAMPAIGN_LABEL}
        </DialogTitle>
        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
          {WIZARD_DESCRIPTION}
        </Typography>
      </Box>

      <DialogContent sx={{
        flex: 1,
        overflowY: 'auto',
        py: 4,
        px: { xs: 3, md: 6 },
        bgcolor: '#F7F7F7'
      }}>
        {(stepError || templateLoadError) && (
          <Alert severity={templateLoadError ? 'warning' : 'error'} sx={{ mb: 3.5, borderRadius: '8px' }}>
            {templateLoadError || stepError}
          </Alert>
        )}

        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <TextField
                label={CAMPAIGN_NAME_LABEL}
                fullWidth
                required
                value={formData.name}
                onChange={(e) => handleFormDataChange({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
                placeholder={CAMPAIGN_NAME_PLACEHOLDER}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <Autocomplete
                fullWidth
                options={metaTemplates}
                getOptionLabel={(option) => option.name || ''}
                value={selectedMetaTemplate}
                onChange={(event, newValue) => {
                  handleFormDataChange({
                    ...formData,
                    metaTemplateName: newValue?.name || '',
                    metaTemplateLanguage: newValue?.language || 'en_US'
                  });
                }}
                loading={metaTemplatesLoading}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      label={META_TEMPLATE_LABEL}
                      required
                      error={!!errors.metaTemplateName}
                      helperText={errors.metaTemplateName || META_TEMPLATE_HELPER}
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
                value={selectedTemplate}
                onChange={(event, newValue) => {
                  handleFormDataChange({
                    ...formData,
                    messageTemplate: newValue?._id || '',
                    messageContent: formData.messageContent || newValue?.content || ''
                  });
                }}
                loading={templatesLoading}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      label={TEMPLATE_FORMAT_LABEL}
                      required
                      error={!!errors.messageTemplate}
                      helperText={errors.messageTemplate || TEMPLATE_FORMAT_HELPER}
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
                <InputLabel>{TEMPLATE_TYPE_LABEL}</InputLabel>
                <Select
                  label={TEMPLATE_TYPE_LABEL}
                  value={formData.messageType}
                  onChange={(e) => handleTemplateTypeChange(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {TEMPLATE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTemplate && (
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#111827' }}>
                    {TEMPLATE_PREVIEW_TITLE}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedTemplate.content || EMPTY_TEMPLATE_PREVIEW}
                  </Typography>
                </Box>
              )}

              <TextField
                label={MESSAGE_CONTENT_LABEL}
                fullWidth
                required
                multiline
                rows={5}
                value={formData.messageContent}
                onChange={(e) => handleFormDataChange({ ...formData, messageContent: e.target.value })}
                error={!!errors.messageContent}
                helperText={errors.messageContent || MESSAGE_CONTENT_HELPER}
                placeholder={MESSAGE_CONTENT_PLACEHOLDER}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              {formData.messageType === TEMPLATE_TYPE_MEDIA_VALUE && (
                <Box>
                  {!formData.mediaUrl ? (
                    <Box
                      component="label"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        p: 3,
                        border: '2px dashed #2563EB',
                        borderRadius: '12px',
                        bgcolor: '#EFF6FF',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                              <input
                          type="file"
                          accept={UPLOAD_ACCEPT}
                          hidden
                          onChange={handleMediaUpload}
                        />
                        <CloudUploadIcon sx={{ fontSize: 36, color: '#2563EB' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1D4ED8' }}>
                          {uploadingMedia ? UPLOADING_IMAGE_TEXT : UPLOAD_PROMPT}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                          {UPLOAD_HINT}
                        </Typography>
                      </Box>
                    ) : (
                    <Box sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box
                          component="img"
                          src={formData.mediaPreviewData || formData.mediaUrl}
                          alt={UPLOAD_IMAGE_ALT}
                          sx={{ width: 100, height: 100, borderRadius: '12px', objectFit: 'cover' }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                            {formData.mediaFileName || UPLOAD_SUCCESS_IMAGE_LABEL}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#475569' }}>
                            {PREVIEW_IMAGE_READY_TEXT}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          onClick={() => handleFormDataChange({
                            ...formData,
                            mediaUrl: '',
                            mediaPreviewData: '',
                            mediaMimeType: '',
                            mediaFileName: ''
                          })}
                          sx={{ textTransform: 'none', borderRadius: '8px' }}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  )}
                  {errors.mediaUrl && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                      {errors.mediaUrl}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{
              position: 'sticky',
              top: '15px',
              p: 2,
              borderRadius: '8px',
              border: '1px solid #D9D9D9',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 2, fontWeight: 700, color: '#4B5563' }}>
                {LIVE_WHATSAPP_PREVIEW_TITLE}
              </Typography>
              <MobilePreview data={formData} />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{
        px: 4,
        py: 1.75,
        borderTop: '1px solid #D9D9D9',
        justifyContent: 'flex-end',
        bgcolor: '#FAFAFA',
        gap: 1.5
      }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            textTransform: 'none',
            color: '#0A6ED1',
            fontWeight: 600,
            border: '1px solid #D9D9D9',
            borderRadius: '4px',
            px: 3,
            bgcolor: '#FFFFFF',
            '&:hover': {
              bgcolor: '#F0F7FF',
              borderColor: '#0A6ED1'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={loading || templatesLoading}
          startIcon={loading && <CircularProgress size={18} color="inherit" />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            borderRadius: '4px',
            bgcolor: '#0A6ED1',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#0854A0',
              boxShadow: 'none'
            }
          }}
        >
          {loading ? CREATE_CAMPAIGN_LOADING_TEXT : CREATE_CAMPAIGN_LABEL}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateCampaignWizard.displayName = 'CreateCampaignWizard';

export default CreateCampaignWizard;
