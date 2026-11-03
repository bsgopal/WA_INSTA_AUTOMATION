import React, { useEffect, useState } from 'react';
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
  Autocomplete,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CampaignIcon from '@mui/icons-material/Campaign';
import apiClient from '../../../api/client';

/**
 * MobilePreview Component
 * Renders an enterprise simulated WhatsApp screen with realistic header, bubble, and interactive buttons
 */
const MobilePreview = ({ data }) => {
  const content = data.messageContent || '';

  const formatMessageText = (text) => {
    if (!text) return 'Type a message to preview live...';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

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
    <Box
      sx={{
        width: '100%',
        maxWidth: '310px',
        height: '470px',
        bgcolor: '#efeae2',
        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        backgroundSize: 'cover',
        border: '10px solid #0f172a',
        borderRadius: '28px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        margin: '0 auto'
      }}
    >
      {/* Notch */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '12px',
          bgcolor: '#0f172a',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          zIndex: 5
        }}
      />

      {/* WhatsApp Business Header */}
      <Box
        sx={{
          bgcolor: '#075E54',
          color: '#FFFFFF',
          pt: 2.2,
          pb: 1,
          px: 1.8,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          zIndex: 2
        }}
      >
        <Box
          sx={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            bgcolor: '#128C7E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '11px',
            color: '#ffffff'
          }}
        >
          WA
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '12px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Renic Official Store
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '9.5px', display: 'block', lineHeight: 1 }}>
            Verified WhatsApp Business
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflowY: 'auto'
        }}
      >
        {/* Message bubble */}
        <Box
          sx={{
            alignSelf: 'flex-start',
            maxWidth: '92%',
            bgcolor: '#E2F9CB',
            color: '#1f2937',
            borderRadius: '10px',
            borderTopLeftRadius: 0,
            p: 1.2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            position: 'relative',
            mb: 1
          }}
        >
          {/* Media preview */}
          {data.mediaUrl && (
            <Box sx={{ mb: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid #C0DFB0', bgcolor: '#F3F4F6' }}>
              {data.mediaType === 'image' ? (
                <Box
                  component="img"
                  src={data.mediaUrl}
                  alt="Media preview"
                  sx={{ width: '100%', maxHeight: '110px', objectFit: 'cover', display: 'block' }}
                />
              ) : data.mediaType === 'video' ? (
                <Box sx={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000000', color: '#FFFFFF' }}>
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
          <Typography variant="body2" sx={{ fontSize: '11.5px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', pb: 0.5, lineHeight: 1.35 }}>
            {formatMessageText(content)}
          </Typography>

          {/* Timestamp & double blue checkmark */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 0.4,
              mt: -0.2
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '8.5px', color: '#6b7280' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#34B7F1', fontWeight: 800, fontSize: '10px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>

        {/* Amazon/Flipkart Style Action Button */}
        {data.buttonLabel && (
          <Box
            sx={{
              alignSelf: 'flex-start',
              width: '92%',
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              py: 0.8,
              px: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.6
            }}
          >
            <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '11px', fontWeight: 700 }}>
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
 * Enterprise edit modal with zero layout clipping, clean label clearance, and live simulator.
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

  const isRunning = campaign.status === 'RUNNING';

  const messageTypes = [
    { value: 'TEXT', label: '📝 Plain Text Message' },
    { value: 'MEDIA', label: '🖼️ Image / Banner Media' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          bgcolor: '#ffffff'
        }
      }}
    >
      {/* Enterprise Obsidian Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(132, 204, 22, 0.15)',
              color: '#84cc16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CampaignIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Edit Campaign Broadcast
              </Typography>
              <Chip
                label={campaign.status || 'DRAFT'}
                size="small"
                sx={{
                  bgcolor: campaign.status === 'RUNNING' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: campaign.status === 'RUNNING' ? '#22c55e' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Modify message content, Meta template bindings, and promotional buttons
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Main Content Area with Strict Max-Height and Smooth Scrolling */}
      <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
        <Grid container spacing={3} alignItems="flex-start">
          {/* Left Column: Form Controls */}
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {/* Campaign Basic Info */}
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                  📌 Campaign Information
                </Typography>
                <TextField
                  label="Campaign Broadcast Name *"
                  fullWidth
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isRunning || loading}
                  placeholder="e.g. Festival Gold Rush 50% Off Blast"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Paper>

              {/* Template Bindings */}
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                  ⚡ WhatsApp Template Bindings
                </Typography>
                <Stack spacing={2}>
                  {/* Meta Template Selector */}
                  <Autocomplete
                    fullWidth
                    size="small"
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Meta WhatsApp Cloud API Template"
                        variant="outlined"
                        helperText="Required when broadcasting via Meta Cloud API"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    )}
                  />

                  {/* Local App Template Selector */}
                  <Autocomplete
                    fullWidth
                    size="small"
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Local Store Template"
                        variant="outlined"
                        helperText="Used for local Docker QR dispatch"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    )}
                  />
                </Stack>
              </Paper>

              {/* Message Content & Format */}
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                  💬 Message Composition
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Message Format</InputLabel>
                    <Select
                      label="Message Format"
                      value={formData.messageType || 'TEXT'}
                      onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                      disabled={isRunning || loading}
                      sx={{ borderRadius: '10px' }}
                    >
                      {messageTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Message Content *"
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.messageContent}
                    onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                    disabled={isRunning || loading}
                    size="small"
                    placeholder="Enter promotional copy... Use {{customerName}} for personalized name!"
                    helperText="Dynamic variables supported: {{customerName}}, {{shop_name}}, {{today_date}}"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  {formData.messageType === 'MEDIA' && (
                    <TextField
                      label="Media Banner URL"
                      fullWidth
                      size="small"
                      value={formData.mediaUrl}
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                      disabled={isRunning || loading}
                      placeholder="https://example.com/banner.jpg"
                      helperText="Paste direct public image URL to display as header banner."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  )}
                </Stack>
              </Paper>

              {/* Interactive Amazon/Flipkart Style Call-To-Action Button */}
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                  🛍️ Amazon / Flipkart Style Interactive CTA Button
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Button Label (Optional)"
                      fullWidth
                      size="small"
                      value={formData.buttonLabel}
                      onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                      disabled={isRunning || loading}
                      placeholder="e.g. View Festive Offer"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Button Destination URL"
                      fullWidth
                      size="small"
                      value={formData.buttonUrl}
                      onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                      disabled={isRunning || loading || !formData.buttonLabel}
                      placeholder="https://renic.in/offer"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column: Sticky Live WhatsApp Preview */}
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'sticky', top: '12px' }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.5, textAlign: 'center' }}>
                  📱 Real-Time WhatsApp Simulator
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block', textAlign: 'center', mb: 1.5 }}>
                  Shows exactly how this message appears on customer's phone
                </Typography>
                <MobilePreview data={formData} />
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Enterprise Dialog Actions */}
      <DialogActions
        sx={{
          p: 2.2,
          px: 3,
          borderTop: '1px solid #E5E7EB',
          bgcolor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
          {isRunning ? '⚠️ Campaign is active. Pause campaign before editing.' : 'Draft changes will apply immediately to next broadcast.'}
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 700, borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || isRunning}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              textTransform: 'none',
              fontWeight: 800,
              px: 3,
              borderRadius: '8px',
              '&:hover': { bgcolor: '#65a30d', color: '#ffffff' }
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
});

EditCampaignForm.displayName = 'EditCampaignForm';

export default EditCampaignForm;
