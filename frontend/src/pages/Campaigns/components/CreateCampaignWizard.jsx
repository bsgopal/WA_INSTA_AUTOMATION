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
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TemplateIcon from '@mui/icons-material/ViewQuilt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';

import apiClient from '../../../api/client';
import renicIcon from '../../../assets/logo-icon.jpeg';

const CAMPAIGN_PRESETS = [
  {
    name: 'Mega Flash Sale Blast',
    content: '🔥 *EXCLUSIVE MEGA FLASH SALE!*\n\nGet up to *50% OFF* on all trending collections! Use code: *RENIC50* at checkout.\n\n⚡ Offer valid for the next 24 hours only. Tap below to shop now!',
    segment: 'ALL'
  },
  {
    name: 'Abandoned Cart Recovery',
    content: '👋 *Hey there!*\n\nYou left your favorite items in your cart. Complete your purchase now and get an extra *10% OFF* with code: *SAVENOW*.\n\n🛍️ Click the link to complete your order!',
    segment: 'AT_RISK'
  },
  {
    name: 'New Catalog Arrival Drop',
    content: '✨ *JUST DROPPED: NEW CATALOG COLLECTION*\n\nExplore our latest premium catalog with exclusive introductory pricing.\n\n📦 Free shipping on all prepaid orders today!',
    segment: 'LOYAL'
  },
  {
    name: 'VIP Customer Special Offer',
    content: '🎉 *VIP EXCLUSIVE OFFER JUST FOR YOU!*\n\nAs our valued VIP member, enjoy an extra *20% OFF* + a surprise gift on every order above ₹999!\n\n🎁 Limited festival stock available.',
    segment: 'VIP'
  }
];

const MobilePreview = ({ data }) => {
  const content = data.messageContent || '';
  const isImageMode = data.messageType === 'MEDIA';

  const formatMessageText = (text) => {
    if (!text) {
      return (
        <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11.5px' }}>
          Your message preview will appear here in real-time as you type...
        </Typography>
      );
    }
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    return (
      <span
        dangerouslySetInnerHTML={{ __html: formatted }}
        style={{ fontSize: '11.5px', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
      />
    );
  };

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '280px',
        height: '440px',
        bgcolor: '#efeae2',
        backgroundImage: 'radial-gradient(#d1d5db 0.75px, transparent 0.75px)',
        backgroundSize: '12px 12px',
        border: '6px solid #0f172a',
        borderRadius: '24px',
        boxShadow: '0 16px 30px -8px rgba(15, 23, 42, 0.35)',
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
          width: '75px',
          height: '10px',
          bgcolor: '#0f172a',
          borderBottomLeftRadius: '6px',
          borderBottomRightRadius: '6px',
          zIndex: 5
        }}
      />

      {/* Header Strip */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          pt: 1.5,
          pb: 0.8,
          px: 1.2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          zIndex: 2,
          borderBottom: '1px solid rgba(132, 204, 22, 0.25)'
        }}
      >
        <Box
          component="img"
          src={renicIcon}
          alt="Renic"
          sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: '#ffffff', p: 0.2, objectFit: 'contain' }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: '#ffffff', fontSize: '10.5px', lineHeight: 1.1 }}>
              RENIC TECH Business
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 11, color: '#84cc16' }} />
          </Stack>
          <Typography variant="caption" sx={{ color: '#84cc16', fontSize: '8px', display: 'block', lineHeight: 1, fontWeight: 700 }}>
            online • official business account
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          p: 1.25,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflowY: 'auto'
        }}
      >
        <Box
          sx={{
            alignSelf: 'flex-start',
            maxWidth: '95%',
            bgcolor: '#ffffff',
            color: '#0f172a',
            borderRadius: '10px',
            borderTopLeftRadius: 0,
            p: 1.25,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            mb: 1
          }}
        >
          {isImageMode && (
            <Box sx={{ mb: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
              {data.mediaType === 'document' || data.mediaMimeType === 'application/pdf' || (data.mediaFileName && data.mediaFileName.toLowerCase().endsWith('.pdf')) ? (
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', borderLeft: '4px solid #ef4444' }}>
                  <PictureAsPdfIcon sx={{ fontSize: 24, color: '#ef4444', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '10px', color: '#0f172a' }}>
                      {data.mediaFileName || 'Document.pdf'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '8px', color: '#64748b', fontWeight: 600, display: 'block' }}>
                      PDF DOCUMENT • READY TO SEND
                    </Typography>
                  </Box>
                </Box>
              ) : data.mediaPreviewData || data.mediaUrl ? (
                <Box
                  component="img"
                  src={data.mediaPreviewData || data.mediaUrl}
                  alt="Banner"
                  sx={{ width: '100%', maxHeight: '100px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ height: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', color: '#94a3b8' }}>
                  <ImageIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ fontSize: '8px', mt: 0.5, fontWeight: 600 }}>Media Preview</Typography>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ pb: 0.5 }}>
            {formatMessageText(content)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.3, mt: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '8px', color: '#64748b' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 900, fontSize: '9px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default function CreateCampaignWizard({
  open,
  onClose,
  onComplete,
  loading = false,
  asPanel = false,
  isMaximized = false,
  onToggleMaximize = () => {}
}) {
  const [formData, setFormData] = useState({
    name: '',
    targetSegment: 'ALL',
    messageType: 'TEXT',
    messageContent: '',
    mediaUrl: '',
    mediaPreviewData: '',
    mediaType: 'none',
    mediaMimeType: '',
    mediaFileName: '',
    messageTemplate: '',
    metaTemplateName: '',
    metaTemplateLanguage: 'en_US',
    type: 'ONE_TIME'
  });

  const [templates, setTemplates] = useState([]);
  const [segments, setSegments] = useState([
    { id: 'ALL', name: 'All Customers (Complete Database)', count: 0 },
    { id: 'VIP', name: 'VIP Champions (High Spenders)', count: 0 },
    { id: 'LOYAL', name: 'Loyal Regulars (Frequent Buyers)', count: 0 },
    { id: 'POTENTIAL', name: 'Potential High Value', count: 0 },
    { id: 'AT_RISK', name: 'At-Risk / Cart Abandoners', count: 0 }
  ]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchAudienceSegments();
      setFormData({
        name: '',
        targetSegment: 'ALL',
        messageType: 'TEXT',
        messageContent: '',
        mediaUrl: '',
        mediaPreviewData: '',
        mediaType: 'none',
        mediaMimeType: '',
        mediaFileName: '',
        messageTemplate: '',
        metaTemplateName: '',
        metaTemplateLanguage: 'en_US',
        type: 'ONE_TIME'
      });
      setErrors({});
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchAudienceSegments = async () => {
    try {
      const response = await apiClient.get('/customers/stats/rfm-segments');
      if (response.data && response.data.segments) {
        setSegments(response.data.segments);
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      name: prev.name || preset.name,
      messageContent: preset.content,
      targetSegment: preset.segment || prev.targetSegment
    }));
  };

  const handleInsertVariable = (variableTag) => {
    setFormData(prev => ({
      ...prev,
      messageContent: (prev.messageContent || '') + ' ' + variableTag
    }));
  };

  const handleMediaUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append('file', file);
      setUploadingMedia(true);

      const response = await apiClient.post('/campaigns/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const detectedType = response.data.mediaType || (file.type === 'application/pdf' ? 'document' : 'image');

      setFormData(prev => ({
        ...prev,
        mediaUrl: response.data.mediaUrl,
        mediaPreviewData: response.data.mediaPreviewData,
        mediaMimeType: response.data.mediaMimeType || file.type,
        mediaFileName: response.data.mediaFileName || file.name,
        mediaType: detectedType,
        messageType: 'MEDIA'
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({ ...prev, media: 'Failed to upload promotional media.' }));
    } finally {
      setUploadingMedia(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Please provide a campaign name';
    }
    if (!formData.messageContent?.trim() && formData.messageType !== 'MEDIA') {
      newErrors.messageContent = 'Message content is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      topic: formData.name.trim(),
      type: formData.type || 'ONE_TIME',
      channels: ['whatsapp'],
      messageType: formData.messageType || 'TEXT',
      messageContent: formData.messageContent.trim(),
      mediaUrl: formData.mediaUrl || '',
      mediaPreviewData: formData.mediaPreviewData || '',
      mediaType: formData.mediaType || 'none',
      targetAudience: {
        segments: formData.targetSegment ? [formData.targetSegment] : ['ALL']
      },
      messageTemplate: formData.messageTemplate || undefined,
      metaTemplateName: formData.metaTemplateName || undefined,
      metaTemplateLanguage: formData.metaTemplateLanguage || 'en_US',
      status: 'DRAFT'
    };

    onComplete(payload);
  };

  // Main Wizard Form Content (Rendered either as in-page Panel or Modal Dialog)
  const wizardContent = (
    <Box sx={{ bgcolor: '#ffffff', borderRadius: asPanel ? '16px' : 0, overflow: 'hidden', border: asPanel ? '1px solid #e2e8f0' : 'none', boxShadow: asPanel ? '0 4px 20px rgba(0,0,0,0.06)' : 'none' }}>
      {/* Header Bar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={renicIcon}
            alt="Renic"
            sx={{ width: 30, height: 30, bgcolor: '#ffffff', p: 0.3, borderRadius: '8px', objectFit: 'contain' }}
          />
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
                Create WhatsApp Campaign Broadcast
              </Typography>
              <Chip
                label="Two-Column Mode"
                size="small"
                sx={{
                  bgcolor: 'rgba(132, 204, 22, 0.15)',
                  color: '#84cc16',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Compose rich promotional messages &amp; preview live on WhatsApp simulator
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {asPanel && (
            <Tooltip title={isMaximized ? "Restore split layout" : "Maximize view"}>
              <IconButton
                size="small"
                onClick={onToggleMaximize}
                sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                {isMaximized ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
            size="small"
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '8px',
              px: 2,
              height: 32,
              '&:hover': { bgcolor: '#65a30d', color: '#ffffff' }
            }}
          >
            {loading ? 'Creating...' : 'Save Draft'}
          </Button>

          <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Quick Presets Strip */}
      <Box
        sx={{
          px: 2.5,
          py: 1,
          bgcolor: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          ⚡ 1-Click Presets:
        </Typography>
        <Stack direction="row" spacing={0.8} flexWrap="nowrap">
          {CAMPAIGN_PRESETS.map((preset, index) => (
            <Chip
              key={index}
              label={preset.name}
              size="small"
              onClick={() => handleApplyPreset(preset)}
              clickable
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '0.72rem',
                fontWeight: 700,
                height: 24,
                '&:hover': { bgcolor: '#84cc16', color: '#0f172a', borderColor: '#84cc16' }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Body Grid: Left Controls + Right WhatsApp Simulator */}
      <Box sx={{ p: 2.5, maxHeight: asPanel ? 'calc(100vh - 270px)' : 'calc(80vh - 120px)', overflowY: 'auto' }}>
        <Grid container spacing={3}>
          {/* Left Controls */}
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              {/* Campaign Name */}
              <TextField
                label="Campaign Broadcast Name *"
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Festival Gold Rush 50% Off Blast"
              />

              {/* Target Audience Segment */}
              <FormControl fullWidth size="small">
                <InputLabel>Target Audience Segment</InputLabel>
                <Select
                  value={formData.targetSegment}
                  label="Target Audience Segment"
                  onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                >
                  {segments.map((seg) => (
                    <MenuItem key={seg.id} value={seg.id}>
                      {seg.name} {seg.count ? `(${seg.count} contacts)` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Message Mode Tabs */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.8, textTransform: 'uppercase' }}>
                  Select Broadcast Mode:
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={formData.messageType === 'TEXT' ? 'contained' : 'outlined'}
                    onClick={() => setFormData(prev => ({ ...prev, messageType: 'TEXT' }))}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      bgcolor: formData.messageType === 'TEXT' ? '#0f172a' : 'transparent',
                      color: formData.messageType === 'TEXT' ? '#84cc16' : '#64748b',
                      borderColor: '#cbd5e1'
                    }}
                  >
                    📝 Text Message
                  </Button>
                  <Button
                    size="small"
                    variant={formData.messageType === 'MEDIA' ? 'contained' : 'outlined'}
                    onClick={() => setFormData(prev => ({ ...prev, messageType: 'MEDIA' }))}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      bgcolor: formData.messageType === 'MEDIA' ? '#0f172a' : 'transparent',
                      color: formData.messageType === 'MEDIA' ? '#84cc16' : '#64748b',
                      borderColor: '#cbd5e1'
                    }}
                  >
                    🖼️ Image / PDF Media Banner
                  </Button>
                </Stack>
              </Box>

              {/* Media Upload Area */}
              {formData.messageType === 'MEDIA' && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mb: 1 }}>
                    Attach Promotional Banner / Catalog PDF:
                  </Typography>

                  {formData.mediaPreviewData ? (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box component="img" src={formData.mediaPreviewData} alt="Preview" sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '8px' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{formData.mediaFileName || 'Attached Banner'}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Media will be dispatched with message</Typography>
                      </Box>
                      <Button size="small" color="error" onClick={() => setFormData(prev => ({ ...prev, mediaPreviewData: '', mediaUrl: '', mediaFileName: '' }))}>
                        Remove
                      </Button>
                    </Stack>
                  ) : (
                    <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={uploadingMedia} size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
                      {uploadingMedia ? 'Uploading...' : 'Upload Image / PDF File'}
                      <input hidden type="file" accept="image/*,application/pdf" onChange={handleMediaUpload} />
                    </Button>
                  )}
                </Paper>
              )}

              {/* Variable Tokens Helper */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Personalization Tokens:
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {['{{customer_name}}', '{{discount_code}}', '{{order_id}}'].map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => handleInsertVariable(tag)}
                        clickable
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.68rem',
                          height: 20,
                          bgcolor: '#f1f5f9',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>

                <TextField
                  label="Message Content *"
                  fullWidth
                  multiline
                  rows={6}
                  value={formData.messageContent}
                  onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                  error={!!errors.messageContent}
                  helperText={errors.messageContent || 'Supports WhatsApp formatting: *bold*, _italic_, `monospace`'}
                  placeholder="Type promotional broadcast message..."
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Right Phone Simulator Preview */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'sticky', top: 10 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  📱 Real-Time WhatsApp Simulator
                </Typography>
                <Chip label="LIVE PREVIEW" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#84cc16', color: '#0f172a' }} />
              </Box>

              <MobilePreview data={formData} />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ p: 2, px: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#84cc16',
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '0.85rem',
            borderRadius: '8px',
            px: 3,
            '&:hover': { bgcolor: '#65a30d', color: '#ffffff' }
          }}
        >
          {loading ? 'Creating...' : 'Save & Launch Broadcast'}
        </Button>
      </Box>
    </Box>
  );

  if (asPanel) {
    return wizardContent;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
          overflow: 'hidden'
        }
      }}
    >
      {wizardContent}
    </Dialog>
  );
}
