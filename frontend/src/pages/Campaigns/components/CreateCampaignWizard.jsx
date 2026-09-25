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

/**
 * MobilePreview Component
 * Realistic WhatsApp Phone Simulator with live message formatting
 */
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
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
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
        height: '460px',
        bgcolor: '#efeae2',
        backgroundImage: 'radial-gradient(#d1d5db 0.75px, transparent 0.75px)',
        backgroundSize: '12px 12px',
        border: '7px solid #0f172a',
        borderRadius: '26px',
        boxShadow: '0 20px 35px -8px rgba(15, 23, 42, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        margin: '0 auto'
      }}
    >
      {/* Top Phone Speaker Notch */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '84px',
          height: '12px',
          bgcolor: '#0f172a',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          zIndex: 5
        }}
      />

      {/* WhatsApp Header Strip */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          pt: 2,
          pb: 1,
          px: 1.25,
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
          sx={{
            width: 26,
            height: 26,
            borderRadius: '6px',
            bgcolor: '#ffffff',
            p: 0.2,
            objectFit: 'contain'
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 800, color: '#ffffff', fontSize: '11px', lineHeight: 1.1 }}
            >
              RENIC TECH Business
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 12, color: '#84cc16' }} />
          </Stack>
          <Typography variant="caption" sx={{ color: '#84cc16', fontSize: '8.5px', display: 'block', lineHeight: 1, fontWeight: 700 }}>
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
        {/* Message bubble */}
        <Box
          sx={{
            alignSelf: 'flex-start',
            maxWidth: '94%',
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
          {/* Media preview */}
          {isImageMode && (
            <Box sx={{ mb: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
              {data.mediaType === 'document' || data.mediaMimeType === 'application/pdf' || (data.mediaFileName && data.mediaFileName.toLowerCase().endsWith('.pdf')) ? (
                <Box sx={{ p: 1.25, display: 'flex', alignItems: 'center', gap: 1.2, bgcolor: '#f8fafc', borderLeft: '4px solid #ef4444' }}>
                  <PictureAsPdfIcon sx={{ fontSize: 30, color: '#ef4444', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '11px', color: '#0f172a' }}>
                      {data.mediaFileName || 'Document.pdf'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748b', fontWeight: 600, display: 'block' }}>
                      PDF DOCUMENT • READY TO SEND
                    </Typography>
                  </Box>
                </Box>
              ) : data.mediaPreviewData || data.mediaUrl ? (
                <Box
                  component="img"
                  src={data.mediaPreviewData || data.mediaUrl}
                  alt="Campaign Media Banner"
                  sx={{ width: '100%', maxHeight: '110px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ height: '85px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', color: '#94a3b8' }}>
                  <ImageIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ fontSize: '9px', mt: 0.5, fontWeight: 600 }}>Image / PDF Media Preview</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Text Content */}
          <Box sx={{ pb: 0.5 }}>
            {formatMessageText(content)}
          </Box>

          {/* Timestamp & read receipts */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.3, mt: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '8px', color: '#64748b' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 900, fontSize: '10px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const defaultFormData = {
  name: '',
  type: 'ONE_TIME',
  targetSegment: 'ALL',
  messageType: 'TEXT',
  mediaType: 'none',
  mediaUrl: '',
  mediaPreviewData: '',
  mediaMimeType: '',
  mediaFileName: '',
  messageContent: '',
  metaTemplateName: '',
  metaTemplateLanguage: 'en_US',
  messageTemplate: ''
};

const CreateCampaignWizard = React.memo(({
  open = false,
  onClose = () => {},
  onComplete = () => {},
  loading = false
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [templateMode, setTemplateMode] = useState('CUSTOM'); // 'PREDEFINED' | 'CUSTOM'
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [metaTemplates, setMetaTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(defaultFormData);
      setTemplateMode('CUSTOM');
      setErrors({});
      loadAvailableTemplates();
    }
  }, [open]);

  const loadAvailableTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const [tRes, mRes, shopRes] = await Promise.all([
        apiClient.get('/templates').catch(() => ({ data: [] })),
        apiClient.get('/templates/meta').catch(() => ({ data: [] })),
        apiClient.get('/shop-config/meta').catch(() => ({ data: {} }))
      ]);
      setTemplates(Array.isArray(tRes.data) ? tRes.data : tRes.data?.templates || []);
      setMetaTemplates(Array.isArray(mRes.data) ? mRes.data : []);
      setMetaEnabled(Boolean(shopRes.data?.config?.metaApiEnabled || shopRes.data?.metaApiEnabled));
    } catch (e) {
      console.warn('Templates load note:', e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSelectTemplate = (templateId) => {
    const selectedTpl = templates.find(t => t._id === templateId);
    if (!selectedTpl) {
      setFormData(prev => ({
        ...prev,
        messageTemplate: ''
      }));
      return;
    }

    const tplImage = selectedTpl.mediaUrl || selectedTpl.headerUrl || selectedTpl.imageUrl || selectedTpl.mediaPreviewData || '';
    const hasImage = !!tplImage || selectedTpl.type === 'MEDIA' || selectedTpl.mediaType === 'image';

    setFormData(prev => ({
      ...prev,
      messageTemplate: selectedTpl._id,
      name: prev.name || selectedTpl.name,
      messageContent: selectedTpl.content || '',
      messageType: hasImage ? 'MEDIA' : (selectedTpl.type || 'TEXT'),
      mediaUrl: tplImage,
      mediaPreviewData: selectedTpl.mediaPreviewData || (tplImage.startsWith('data:') ? tplImage : ''),
      mediaType: hasImage ? 'image' : 'none',
      mediaFileName: selectedTpl.mediaFileName || (hasImage ? `${selectedTpl.name || 'template'}-media.png` : '')
    }));
    setErrors({});
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      name: prev.name || preset.name,
      messageContent: preset.content,
      targetSegment: preset.segment || prev.targetSegment
    }));
    setErrors({});
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
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                Create WhatsApp Campaign Broadcast
              </Typography>
              <Chip
                label="SELLER HUB"
                size="small"
                sx={{
                  bgcolor: 'rgba(132, 204, 22, 0.15)',
                  color: '#84cc16',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 20
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Compose rich promotional messages, pick e-commerce presets, and preview live on WhatsApp.
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Quick Presets Strip */}
      <Box
        sx={{
          px: 3,
          py: 1.25,
          bgcolor: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
          ⚡ QUICK PRESETS:
        </Typography>
        {CAMPAIGN_PRESETS.map((preset) => (
          <Chip
            key={preset.name}
            label={preset.name}
            size="small"
            onClick={() => handleApplyPreset(preset)}
            clickable
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: '#0f172a',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: '#0f172a',
                color: '#84cc16',
                borderColor: '#0f172a'
              }
            }}
          />
        ))}
      </Box>

      {/* Main Body Grid */}
      <DialogContent sx={{ p: 3, overflowY: 'auto', bgcolor: '#f8fafc' }}>
        <Grid container spacing={3}>
          {/* Left Column: Form Controls (62%) */}
          <Grid item xs={12} md={7} lg={7.5}>
            <Stack spacing={2.5}>
              {/* Campaign Name & Type */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Campaign Title"
                    required
                    size="small"
                    placeholder="e.g., Weekend Flash Sale 2026"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Broadcast Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Broadcast Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
                    >
                      <MenuItem value="ONE_TIME">⚡ One-Time Blast</MenuItem>
                      <MenuItem value="AUTOMATED">🤖 Automated Drip</MenuItem>
                      <MenuItem value="RECURRING">🔄 Weekly Schedule</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Target Audience Segment */}
              <FormControl fullWidth size="small">
                <InputLabel>Target Customer Audience</InputLabel>
                <Select
                  value={formData.targetSegment}
                  label="Target Customer Audience"
                  onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                  sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">👥 All Customers (Broadcast Blast)</MenuItem>
                  <MenuItem value="VIP">⭐ VIP Customers (Top Spenders)</MenuItem>
                  <MenuItem value="LOYAL">💎 Loyal Customers (Frequent Shoppers)</MenuItem>
                  <MenuItem value="NEW">✨ New Inquiries / Leads</MenuItem>
                  <MenuItem value="AT_RISK">⚠️ At Risk / Abandoned Cart</MenuItem>
                </Select>
              </FormControl>

              {/* Top-Level Mode Selector: Predefined Template vs Custom Campaign */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                    Campaign Message Source:
                  </Typography>
                  <Chip
                    label={!metaEnabled ? '🐳 WhatsApp Direct (Docker Engine)' : '⚡ Meta Cloud API'}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: !metaEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(132, 204, 22, 0.15)',
                      color: !metaEnabled ? '#0284c7' : '#65a30d'
                    }}
                  />
                </Box>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant={templateMode === 'PREDEFINED' ? 'contained' : 'outlined'}
                      onClick={() => setTemplateMode('PREDEFINED')}
                      startIcon={<TemplateIcon />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        py: 1,
                        bgcolor: templateMode === 'PREDEFINED' ? '#0f172a' : '#f8fafc',
                        color: templateMode === 'PREDEFINED' ? '#84cc16' : '#334155',
                        borderColor: templateMode === 'PREDEFINED' ? '#0f172a' : '#cbd5e1',
                        '&:hover': {
                          bgcolor: templateMode === 'PREDEFINED' ? '#1e293b' : '#ffffff',
                          borderColor: '#0f172a'
                        }
                      }}
                    >
                      Predefined Template
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant={templateMode === 'CUSTOM' ? 'contained' : 'outlined'}
                      onClick={() => setTemplateMode('CUSTOM')}
                      startIcon={<AutoAwesomeIcon />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        py: 1,
                        bgcolor: templateMode === 'CUSTOM' ? '#0f172a' : '#f8fafc',
                        color: templateMode === 'CUSTOM' ? '#84cc16' : '#334155',
                        borderColor: templateMode === 'CUSTOM' ? '#0f172a' : '#cbd5e1',
                        '&:hover': {
                          bgcolor: templateMode === 'CUSTOM' ? '#1e293b' : '#ffffff',
                          borderColor: '#0f172a'
                        }
                      }}
                    >
                      Custom Campaign Copy
                    </Button>
                  </Grid>
                </Grid>

                {templateMode === 'PREDEFINED' && (
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Choose Predefined Template</InputLabel>
                      <Select
                        value={formData.messageTemplate}
                        label="Choose Predefined Template"
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
                      >
                        <MenuItem value="">
                          <em>-- Choose an Approved Template --</em>
                        </MenuItem>
                        {templates.map((tpl) => (
                          <MenuItem key={tpl._id} value={tpl._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {tpl.name}
                              </Typography>
                              <Stack direction="row" spacing={0.5}>
                                {(tpl.mediaUrl || tpl.imageUrl || tpl.headerUrl || tpl.type === 'MEDIA') && (
                                  <Chip label="🖼️ Has Image" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }} />
                                )}
                                <Chip label={tpl.category || tpl.type || 'MARKETING'} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                              </Stack>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {formData.messageTemplate && (
                      <Alert severity="success" sx={{ mt: 1.5, borderRadius: '8px', fontSize: '0.78rem', py: 0.5 }}>
                        Template copy {formData.mediaUrl ? 'and promotional image banner ' : ''}auto-appended!
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Message Content & Formatting */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                    WhatsApp Message Copy
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', mr: 0.5 }}>
                      Insert:
                    </Typography>
                    <Chip
                      label="{{customer_name}}"
                      size="small"
                      onClick={() => handleInsertVariable('{{customer_name}}')}
                      sx={{ fontSize: '0.7rem', height: 22, bgcolor: '#e2e8f0', cursor: 'pointer' }}
                    />
                    <Chip
                      label="{{offer_code}}"
                      size="small"
                      onClick={() => handleInsertVariable('{{offer_code}}')}
                      sx={{ fontSize: '0.7rem', height: 22, bgcolor: '#e2e8f0', cursor: 'pointer' }}
                    />
                  </Stack>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Type your WhatsApp message copy here... Use *bold* for emphasis, _italics_ for subtitles, or select an e-commerce preset above."
                  value={formData.messageContent}
                  onChange={(e) => {
                    setFormData({ ...formData, messageContent: e.target.value });
                    if (errors.messageContent) setErrors({ ...errors, messageContent: '' });
                  }}
                  error={!!errors.messageContent}
                  helperText={errors.messageContent || 'Supports standard WhatsApp markdown (*bold*, _italic_, `code`).'}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                />
              </Box>

              {/* Media Attachment (Optional - Image or PDF) */}
              <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.mediaType === 'document' ? (
                      <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                    ) : (
                      <ImageIcon sx={{ color: '#84cc16', fontSize: 20 }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                      Promotional Media / PDF (Optional)
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      formData.messageType === 'MEDIA'
                        ? (formData.mediaType === 'document' ? 'PDF Mode Active' : 'Image Mode Active')
                        : 'Text Only'
                    }
                    size="small"
                    sx={{
                      bgcolor: formData.messageType === 'MEDIA'
                        ? (formData.mediaType === 'document' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(132, 204, 22, 0.15)')
                        : '#f1f5f9',
                      color: formData.messageType === 'MEDIA'
                        ? (formData.mediaType === 'document' ? '#dc2626' : '#4d7c0f')
                        : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>

                {!formData.mediaUrl ? (
                  <Box
                    component="label"
                    sx={{
                      p: 2.5,
                      border: '2px dashed #cbd5e1',
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(132, 204, 22, 0.05)', borderColor: '#84cc16' }
                    }}
                  >
                    <input type="file" accept="image/*,application/pdf" hidden onChange={handleMediaUpload} />
                    <CloudUploadIcon sx={{ color: '#64748b', fontSize: 28 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                        {uploadingMedia ? 'Uploading media...' : 'Click to upload promotional image or PDF'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        PNG, JPG, JPEG or PDF (Max 15MB)
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, bgcolor: '#f8fafc', borderRadius: '10px' }}>
                    {formData.mediaType === 'document' ? (
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 32 }} />
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={formData.mediaPreviewData || formData.mediaUrl}
                        alt="Banner"
                        sx={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                      />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                        {formData.mediaFileName || (formData.mediaType === 'document' ? 'Document.pdf' : 'Uploaded Banner')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block' }}>
                        ✓ Ready to dispatch with WhatsApp message
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        mediaUrl: '',
                        mediaPreviewData: '',
                        mediaType: 'none',
                        messageType: 'TEXT',
                        mediaFileName: '',
                        mediaMimeType: ''
                      }))}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Meta Cloud Template Link - ONLY shown when Meta is configured & enabled */}
              {metaEnabled && (
                <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>
                      ⚡ Meta Cloud API Template Link (Optional)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Meta Cloud Template</InputLabel>
                      <Select
                        value={formData.metaTemplateName}
                        label="Meta Cloud Template"
                        onChange={(e) => setFormData(prev => ({ ...prev, metaTemplateName: e.target.value }))}
                      >
                        <MenuItem value="">None (Direct Broadcast)</MenuItem>
                        {metaTemplates.map(m => (
                          <MenuItem key={m.name} value={m.name}>{m.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          </Grid>

          {/* Right Column: Live Mobile WhatsApp Simulator (38%) */}
          <Grid item xs={12} md={5} lg={4.5}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#84cc16' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                  Live Customer WhatsApp Preview
                </Typography>
              </Box>

              <MobilePreview data={formData} />

              <Box sx={{ mt: 2, p: 1.25, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>
                  🚀 Broadcast Audience: {formData.targetSegment === 'ALL' ? 'All Customers (~1,250 contacts)' : `${formData.targetSegment} Segment`}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '8px',
            color: '#475569',
            px: 2.5,
            height: '38px'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: '#84cc16',
            color: '#0f172a',
            fontWeight: 900,
            fontSize: '0.875rem',
            px: 3.5,
            height: '40px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(132, 204, 22, 0.45)',
            '&:hover': {
              bgcolor: '#65a30d',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(101, 163, 13, 0.55)'
            }
          }}
        >
          {loading ? 'Creating Campaign...' : 'Launch Campaign Broadcast'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateCampaignWizard.displayName = 'CreateCampaignWizard';

export default CreateCampaignWizard;
