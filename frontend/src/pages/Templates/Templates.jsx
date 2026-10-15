import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Divider, FormControl, InputLabel,
  Select, CircularProgress, Alert, Tooltip, Checkbox, InputAdornment,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';
import renicIcon from '../../assets/logo-icon.jpeg';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('TABLE');
  const [openDialog, setOpenDialog] = useState(false);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [openCSVDialog, setOpenCSVDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [whereUsedTarget, setWhereUsedTarget] = useState(null);
  const [whereUsedData, setWhereUsedData] = useState(null);
  const [whereUsedLoading, setWhereUsedLoading] = useState(false);
  const fileInputRef = useRef(null);
  const detailScrollRef = useRef(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [linkingTemplateId, setLinkingTemplateId] = useState(null);
  const [availableMessages, setAvailableMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [selectedButtonAction, setSelectedButtonAction] = useState('');
  const [openCSVPreviewDialog, setOpenCSVPreviewDialog] = useState(false);
  const [creatingFromCSV, setCreatingFromCSV] = useState(false);
  const [editingTemplateIdx, setEditingTemplateIdx] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'TEXT',
    content: '',
    language: 'en',
    translations: {},
    category: 'CUSTOM',
    keywords: '',
    linkedMessageId: null,
    linkedAction: null,
    csvTemplates: [],
    mediaUrl: '',
    mediaType: '',
    mediaPreviewData: '',
    mediaMimeType: '',
    mediaFileName: ''
  });

  const [activeLangTab, setActiveLangTab] = useState('en');
  const [translating, setTranslating] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeAnchorSection, setActiveAnchorSection] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const INDIAN_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳' }
  ];

  const categoryOptions = [
    'WELCOME',
    'ORDER_CONFIRMATION',
    'SHIPPING_UPDATE',
    'DELIVERY_NOTIFICATION',
    'PRODUCT_RECOMMENDATION',
    'DISCOUNT_OFFER',
    'BIRTHDAY_WISH',
    'RE_ENGAGEMENT',
    'FEEDBACK_REQUEST',
    'CART_ABANDONMENT',
    'CUSTOM'
  ];

  const ANCHOR_SECTIONS = [
    { id: 'sec-basics', label: '1. Basics & Category', icon: '📝' },
    { id: 'sec-content', label: '2. Multi-Language Content', icon: '🇮🇳' },
    { id: 'sec-media', label: '3. Media & Attachment', icon: '🖼️' },
    { id: 'sec-actions', label: '4. Interactive Links', icon: '🔘' }
  ];

  useEffect(() => {
    fetchTemplates();
    fetchAvailableMessages();
  }, []);

  const fetchAvailableMessages = async () => {
    try {
      const quickRepliesRes = await apiClient.get('/quick-replies');
      const templatesRes = await apiClient.get('/templates');
      const allMessages = [
        ...quickRepliesRes.data.map(qr => ({ id: qr._id, name: qr.text, type: 'QUICK_REPLY' })),
        ...templatesRes.data.map(t => ({ id: t._id, name: t.name, type: 'TEMPLATE' }))
      ];
      setAvailableMessages(allMessages);
    } catch (error) {
      console.error('Failed to fetch available messages:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch templates',
        severity: 'error'
      });
    }
  };

  const handleScrollToSection = (idx, secId) => {
    setActiveAnchorSection(idx);
    const el = document.getElementById(secId);
    if (el && detailScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenAddDialog = () => {
    setEditingId(null);
    setEditingTemplate(null);
    setActiveLangTab('en');
    setActiveAnchorSection(0);
    setFormData({
      name: '',
      type: 'TEXT',
      content: '',
      language: 'en',
      translations: {},
      category: 'CUSTOM',
      keywords: '',
      linkedMessageId: null,
      linkedAction: null,
      csvTemplates: [],
      mediaUrl: '',
      mediaType: '',
      mediaPreviewData: '',
      mediaMimeType: '',
      mediaFileName: ''
    });
    setOpenDialog(true);
  };

  const handleEditDbTemplate = (template) => {
    setEditingId(template._id);
    setEditingTemplate(null);
    setActiveLangTab('en');
    setActiveAnchorSection(0);
    setFormData({
      name: template.name || '',
      type: template.type || 'TEXT',
      content: template.content || '',
      language: template.language || 'en',
      translations: template.translations || {},
      category: template.category || 'CUSTOM',
      keywords: template.keywords || '',
      linkedMessageId: template.linkedMessageId || null,
      linkedAction: template.linkedAction || null,
      csvTemplates: [],
      mediaUrl: template.mediaUrl || '',
      mediaType: template.mediaType || '',
      mediaPreviewData: template.mediaPreviewData || '',
      mediaMimeType: template.mediaMimeType || '',
      mediaFileName: template.mediaFileName || ''
    });
    setOpenDialog(true);
  };

  const handleAutoTranslate = async () => {
    const textToTranslate = formData?.content;
    if (!textToTranslate?.trim()) {
      setSnackbar({ open: true, message: 'Please enter primary template content first', severity: 'warning' });
      return;
    }
    try {
      setTranslating(true);
      const res = await apiClient.post('/templates/translate', {
        text: textToTranslate,
        targetLanguages: ['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ur']
      });
      if (res.data?.translations) {
        setFormData(prev => ({
          ...prev,
          translations: { ...(prev?.translations || {}), ...res.data.translations }
        }));
        setSnackbar({ open: true, message: '✨ Auto-translated to all Indian languages successfully!', severity: 'success' });
      }
    } catch (err) {
      console.error('Auto-translate error:', err);
      setSnackbar({ open: true, message: 'Failed to auto-translate template', severity: 'error' });
    } finally {
      setTranslating(false);
    }
  };

  const handleTemplateMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      setMediaUploading(true);
      const response = await apiClient.post('/templates/media/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const media = {
        mediaUrl: response.data.mediaUrl,
        mediaType: response.data.mediaType,
        mediaPreviewData: response.data.mediaPreviewData,
        mediaMimeType: response.data.mediaMimeType,
        mediaFileName: response.data.mediaFileName
      };

      setFormData(prev => ({ ...prev, ...media, type: 'IMAGE' }));
      setSnackbar({ open: true, message: 'Image attached to template successfully!', severity: 'success' });
    } catch (error) {
      console.error('Template media upload error:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to upload image', severity: 'error' });
    } finally {
      setMediaUploading(false);
    }
  };

  const handleRemoveTemplateMedia = () => {
    setFormData(prev => ({
      ...prev,
      mediaUrl: '',
      mediaType: '',
      mediaPreviewData: '',
      mediaMimeType: '',
      mediaFileName: '',
      type: 'TEXT'
    }));
    setSnackbar({ open: true, message: 'Attached image removed', severity: 'info' });
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in template name and content',
        severity: 'warning'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        type: formData.type,
        content: formData.content,
        language: formData.language || 'en',
        translations: formData.translations || {},
        category: formData.category,
        keywords: formData.keywords || '',
        mediaUrl: formData.mediaUrl || '',
        mediaType: formData.mediaType || '',
        mediaPreviewData: formData.mediaPreviewData || '',
        mediaMimeType: formData.mediaMimeType || '',
        mediaFileName: formData.mediaFileName || ''
      };

      if (editingId) {
        await apiClient.put(`/templates/${editingId}`, payload);
        setSnackbar({ open: true, message: 'Template updated successfully!', severity: 'success' });
      } else {
        await apiClient.post('/templates', payload);
        setSnackbar({ open: true, message: 'Template created successfully!', severity: 'success' });
      }

      setOpenDialog(false);
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save template',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDelete = (template) => {
    setDeleteTarget(template);
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/templates/${deleteTarget._id}`);
      setSnackbar({ open: true, message: 'Template deleted successfully!', severity: 'success' });
      if (editingId === deleteTarget._id) {
        setOpenDialog(false);
        setEditingId(null);
      }
      setDeleteTarget(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSnackbar({ open: true, message: 'Failed to delete template', severity: 'error' });
    }
  };

  const handleOpenWhereUsed = async (template) => {
    setWhereUsedTarget(template);
    setWhereUsedLoading(true);
    try {
      const res = await apiClient.get(`/templates/${template._id}/where-used`);
      setWhereUsedData(res.data);
    } catch (err) {
      console.error('Failed to fetch where-used data:', err);
      setWhereUsedData(null);
    } finally {
      setWhereUsedLoading(false);
    }
  };

  const handleOpenLinkDialog = (templateId) => {
    setLinkingTemplateId(templateId);
    setSelectedMessage('');
    setSelectedButtonAction('');
    setOpenLinkDialog(true);
  };

  const handleSaveLink = async () => {
    if (!selectedMessage || !selectedButtonAction) {
      setSnackbar({ open: true, message: 'Please select both a message and action', severity: 'warning' });
      return;
    }
    try {
      await apiClient.put(`/templates/${linkingTemplateId}`, {
        linkedMessageId: selectedMessage,
        linkedAction: selectedButtonAction
      });
      setSnackbar({ open: true, message: 'Message link created successfully!', severity: 'success' });
      setOpenLinkDialog(false);
      setLinkingTemplateId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save link:', error);
      setSnackbar({ open: true, message: 'Failed to create link', severity: 'error' });
    }
  };

  const downloadCSVTemplate = () => {
    const csvHeader = 'name,keywords,content,category\n';
    const exampleRow = '"Welcome Message","hello,hi,greet","Hey! Welcome to our store 👋","GREETING"\n';
    const blob = new Blob([csvHeader + exampleRow], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_sample.csv';
    link.click();
    setSnackbar({ open: true, message: 'CSV sample downloaded!', severity: 'success' });
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCsvLoading(true);
      const text = await file.text();
      const response = await apiClient.post('/templates/ai/generate-from-csv', { csvContent: text });
      if (response.data.success && response.data.templates.length > 0) {
        setFormData(prev => ({ ...prev, csvTemplates: response.data.templates }));
        setOpenCSVPreviewDialog(true);
        setSnackbar({ open: true, message: `Imported ${response.data.count} templates from CSV!`, severity: 'success' });
      }
      setOpenCSVDialog(false);
    } catch (error) {
      console.error('CSV upload error:', error);
      setSnackbar({ open: true, message: 'Failed to process CSV', severity: 'error' });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleCreateFromCSVPreview = async () => {
    try {
      setCreatingFromCSV(true);
      const templatesToCreate = formData.csvTemplates || [];
      const res = await apiClient.post('/templates/bulk-create', { templates: templatesToCreate });
      if (res.data.success) {
        setSnackbar({ open: true, message: `✅ Created ${res.data.created} templates!`, severity: 'success' });
        setOpenCSVPreviewDialog(false);
        fetchTemplates();
      }
    } catch (err) {
      console.error('Bulk create error:', err);
      setSnackbar({ open: true, message: 'Bulk create failed', severity: 'error' });
    } finally {
      setCreatingFromCSV(false);
    }
  };

  const handleToggleSelectTemplate = (id) => {
    setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllTemplates = (e) => {
    setSelectedTemplateIds(e.target.checked ? templates.map(t => t._id) : []);
  };

  const handleBulkDelete = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.post('/templates/bulk-delete', { templateIds: selectedTemplateIds });
      setSnackbar({ open: true, message: `Deleted ${res.data.deletedCount || selectedTemplateIds.length} templates`, severity: 'success' });
      setSelectedTemplateIds([]);
      setBulkDeleteConfirm(false);
      fetchTemplates();
    } catch (error) {
      console.error('Bulk delete error:', error);
      setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesCat = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
    const matchesSearch = !searchQuery.trim() ||
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.content && t.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.keywords && t.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      {/* ── Compact Header Bar ── */}
      <Card
        elevation={0}
        sx={{
          p: 1.75,
          mb: 1.5,
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src={renicIcon}
            alt="Renic"
            sx={{
              width: 38,
              height: 38,
              bgcolor: '#ffffff',
              p: 0.3,
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              objectFit: 'contain'
            }}
          />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                Message Templates
              </Typography>
              <Chip
                label="Two-Column Mode"
                size="small"
                sx={{
                  bgcolor: 'rgba(132, 204, 22, 0.15)',
                  color: '#4d7c0f',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 20
                }}
              />
            </Box>
            <Stack direction="row" spacing={0.8} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${templates.length}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
              />
              <Chip
                label={`Text: ${templates.filter(t => (t.type || 'TEXT') === 'TEXT').length}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(14, 165, 233, 0.12)', color: '#0284c7' }}
              />
              <Chip
                label={`Media: ${templates.filter(t => t.type === 'IMAGE').length}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(168, 85, 247, 0.12)', color: '#7e22ce' }}
              />
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenHelpDialog(true)}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', height: '34px', borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }}
          >
            Guidelines
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={downloadCSVTemplate}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', height: '34px', borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }}
          >
            CSV Sample
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenCSVDialog(true)}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', height: '34px', borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleOpenAddDialog}
            size="small"
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.825rem',
              px: 2,
              height: '34px',
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
              '&:hover': { bgcolor: '#65a30d', color: '#ffffff' }
            }}
          >
            New Template
          </Button>
        </Stack>
      </Card>

      {/* ── Filter & Search Toolbar ── */}
      <Card elevation={0} sx={{ p: 1.75, mb: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <TextField
            size="small"
            placeholder="Search templates by title, content, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center" overflow="auto">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategoryFilter}
                label="Category"
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories ({templates.length})</MenuItem>
                {categoryOptions.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={0.5} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 0.3 }}>
              <IconButton size="small" onClick={() => setViewMode('TABLE')} sx={{ bgcolor: viewMode === 'TABLE' ? '#0f172a' : 'transparent', color: viewMode === 'TABLE' ? '#ffffff' : '#64748b', borderRadius: '6px' }}>
                <TableRowsIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setViewMode('CARDS')} sx={{ bgcolor: viewMode === 'CARDS' ? '#0f172a' : 'transparent', color: viewMode === 'CARDS' ? '#ffffff' : '#64748b', borderRadius: '6px' }}>
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* ── TWO-COLUMN MID-SPLIT LAYOUT CONTAINER ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: TEMPLATES FLEET LIST */}
        <Box
          sx={{
            width: openDialog ? (isPanelMaximized ? '0%' : { xs: '100%', lg: '42%', xl: '40%' }) : '100%',
            display: openDialog && isPanelMaximized ? 'none' : 'block',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
          }}
        >
          {filteredTemplates.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px' }} elevation={0}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                No Templates Found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {searchQuery ? 'Try adjusting your search query or category filter.' : 'Create your first WhatsApp approved message template.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
              >
                Create Template
              </Button>
            </Paper>
          ) : viewMode === 'CARDS' ? (
            <Grid container spacing={2}>
              {filteredTemplates.map((template) => {
                const isSelected = openDialog && editingId === template._id;
                return (
                  <Grid item xs={12} sm={openDialog ? 12 : 6} md={openDialog ? 12 : 4} key={template._id}>
                    <Card
                      elevation={0}
                      onClick={() => handleEditDbTemplate(template)}
                      sx={{
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #84cc16' : '1px solid #e2e8f0',
                        bgcolor: isSelected ? 'rgba(132, 204, 22, 0.05)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', borderColor: '#84cc16' }
                      }}
                    >
                      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                        <Chip
                          label={template.category || 'CUSTOM'}
                          size="small"
                          sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#3f6212', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip label={template.type || 'TEXT'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                      </Box>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, fontSize: '0.85rem' }}>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {template.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#0f172a' }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>TEMPLATE &amp; CONTENT</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>CATEGORY</TableCell>
                    {!openDialog && <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>TYPE</TableCell>}
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTemplates.map((template, idx) => {
                    const isSelected = openDialog && editingId === template._id;
                    return (
                      <TableRow
                        key={template._id}
                        hover
                        onClick={() => handleEditDbTemplate(template)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(132, 204, 22, 0.12)' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                          borderLeft: isSelected ? '4px solid #84cc16' : 'none'
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                            {template.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {template.content}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            label={template.category || 'CUSTOM'}
                            size="small"
                            sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#3f6212', fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                          />
                        </TableCell>
                        {!openDialog && (
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip label={template.type || 'TEXT'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ py: 1.5 }} onClick={e => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditDbTemplate(template)} sx={{ color: '#0f172a', p: 0.6 }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Where Used">
                              <IconButton size="small" onClick={() => handleOpenWhereUsed(template)} sx={{ color: '#8b5cf6', p: 0.6 }}>
                                <AltRouteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleRequestDelete(template)} sx={{ p: 0.6 }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* RIGHT COLUMN: SAP DM OBJECT PAGE & LIVE WHATSAPP SIMULATOR */}
        {openDialog && (
          <Box
            sx={{
              flex: 1,
              width: '100%',
              minWidth: 0,
              bgcolor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            {/* Sticky Action Header */}
            <Box
              sx={{
                bgcolor: '#0f172a',
                color: '#ffffff',
                p: 2,
                px: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                borderBottom: '1px solid #1e293b'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#84cc16',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900
                  }}
                >
                  📝
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                      {editingId ? `Edit Template: ${formData.name || ''}` : 'Create Message Template'}
                    </Typography>
                    <Chip
                      label={formData.category || 'CUSTOM'}
                      size="small"
                      sx={{ bgcolor: 'rgba(132, 204, 22, 0.2)', color: '#84cc16', fontWeight: 800, height: 20, fontSize: '0.68rem' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Multi-lingual Indian WhatsApp message template
                  </Typography>
                </Box>
              </Box>

              {/* Action Toolbar */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={isPanelMaximized ? "Restore split layout" : "Maximize view"}>
                  <IconButton
                    size="small"
                    onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                    sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  >
                    {isPanelMaximized ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTemplate}
                  disabled={submitting}
                  size="small"
                  sx={{
                    backgroundColor: '#84cc16',
                    color: '#0f172a',
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '8px',
                    px: 2,
                    height: 32,
                    '&:hover': { backgroundColor: '#65a30d', color: '#ffffff' }
                  }}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </Button>

                <IconButton
                  size="small"
                  onClick={() => setOpenDialog(false)}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Sticky Anchor Navigation Tabs */}
            <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 1, overflowX: 'auto' }}>
              {ANCHOR_SECTIONS.map((sec, idx) => {
                const isActive = activeAnchorSection === idx;
                return (
                  <Button
                    key={sec.id}
                    size="small"
                    onClick={() => handleScrollToSection(idx, sec.id)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      bgcolor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#84cc16' : '#64748b',
                      border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{sec.icon}</span> <span style={{ marginLeft: 4 }}>{sec.label}</span>
                  </Button>
                );
              })}
            </Box>

            {/* Single Scrollable Form Container */}
            <Box
              ref={detailScrollRef}
              sx={{ p: 2.5, flex: 1, minHeight: 0, overflowY: 'auto' }}
            >
              <Stack spacing={3}>
                {/* 1. Basics & Category Card */}
                <Paper id="sec-basics" elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>📝</span> Section 1: Template Basics &amp; Category
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Template Name *"
                        fullWidth
                        size="small"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Welcome New Customer"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={formData.category}
                          label="Category"
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categoryOptions.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat.replace(/_/g, ' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Template Type</InputLabel>
                        <Select
                          value={formData.type}
                          label="Template Type"
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                          <MenuItem value="TEXT">📝 Text Only</MenuItem>
                          <MenuItem value="IMAGE">🖼️ With Image Banner</MenuItem>
                          <MenuItem value="INTERACTIVE">🔘 With Buttons</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Keywords (Comma separated)"
                        fullWidth
                        size="small"
                        value={formData.keywords || ''}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        placeholder="e.g., hi, hello, rates"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* 2. Indian Multi-Language Content & Simulator Split Grid */}
                <Paper id="sec-content" elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🇮🇳</span> Section 2: Multi-Language Content &amp; AI Indian Translation
                    </Typography>

                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAutoTranslate}
                      disabled={translating || !formData?.content?.trim()}
                      startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                        bgcolor: '#6366f1',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        '&:hover': { bgcolor: '#4f46e5' }
                      }}
                    >
                      {translating ? 'Translating...' : '✨ Auto-Translate to Indian Languages'}
                    </Button>
                  </Box>

                  {/* Language Selector Pills */}
                  <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 2, overflowX: 'auto', display: 'flex', gap: 0.5, pb: 0.5 }}>
                    {INDIAN_LANGUAGES.map(lang => {
                      const hasTranslation = lang.code === 'en' 
                        ? !!formData.content?.trim() 
                        : !!formData.translations?.[lang.code]?.trim();
                      const isSelected = activeLangTab === lang.code;

                      return (
                        <Button
                          key={lang.code}
                          size="small"
                          onClick={() => setActiveLangTab(lang.code)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1.2,
                            py: 0.4,
                            borderRadius: '6px',
                            bgcolor: isSelected ? '#0f172a' : hasTranslation ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                            color: isSelected ? '#84cc16' : hasTranslation ? '#16a34a' : '#64748b',
                            border: isSelected ? '1px solid #0f172a' : hasTranslation ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #e2e8f0',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {lang.native} {hasTranslation ? '✓' : ''}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Variable Helper Chips */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                      {INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.native} Text:
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Insert Tag:</Typography>
                      {['{{customer_name}}', '{{firstName}}', '{{order_id}}', '{{discount}}'].map(v => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          onClick={() => {
                            if (activeLangTab === 'en') {
                              setFormData(prev => ({ ...prev, content: (prev.content || '') + ' ' + v }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                translations: {
                                  ...(prev.translations || {}),
                                  [activeLangTab]: ((prev.translations?.[activeLangTab] || '') + ' ' + v).trim()
                                }
                              }));
                            }
                          }}
                          sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#f1f5f9', cursor: 'pointer', fontFamily: 'monospace' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* 2-Column Split inside Section: Text Area + Live Simulator */}
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={7}>
                      <TextField
                        fullWidth
                        placeholder={
                          activeLangTab === 'en'
                            ? "Type English template message text... e.g. 'Hello {{firstName}}, welcome to our store!'"
                            : `Type ${INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.native} translation or click '✨ Auto-Translate'...`
                        }
                        value={activeLangTab === 'en' ? formData.content : (formData.translations?.[activeLangTab] || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === 'en') {
                            setFormData(prev => ({ ...prev, content: val }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              translations: {
                                ...(prev.translations || {}),
                                [activeLangTab]: val
                              }
                            }));
                          }
                        }}
                        multiline
                        rows={6}
                        size="small"
                        required={activeLangTab === 'en'}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', borderRadius: '8px' } }}
                      />
                    </Grid>

                    {/* WhatsApp Bubble Output Simulator */}
                    <Grid item xs={12} md={5}>
                      <Box sx={{ p: 2, bgcolor: '#efeae2', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#075e54', fontSize: '0.72rem' }}>
                            📱 WhatsApp Live Chat Output
                          </Typography>
                          <Chip label="LIVE PREVIEW" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, bgcolor: '#84cc16', color: '#0f172a' }} />
                        </Box>

                        <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: '8px', borderTopLeftRadius: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                          {formData.mediaPreviewData && (
                            <Box component="img" src={formData.mediaPreviewData} alt="Preview" sx={{ width: '100%', maxHeight: 110, objectFit: 'cover', borderRadius: '6px', mb: 1 }} />
                          )}
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                            {(activeLangTab === 'en' ? formData.content : formData.translations?.[activeLangTab]) || formData.content || 'Type message text on the left to preview...'}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#667781' }}>10:45 AM</Typography>
                            <span style={{ color: '#53bdeb', fontSize: '0.65rem' }}>✓✓</span>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* 3. Media & Attachments Card */}
                <Paper id="sec-media" elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🖼️</span> Section 3: Media Banner Attachment
                  </Typography>

                  {formData.mediaPreviewData ? (
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <Box component="img" src={formData.mediaPreviewData} alt="Attached" sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{formData.mediaFileName || 'Attached Banner'}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Image will be sent along with text over WhatsApp API</Typography>
                      </Box>
                      <Button size="small" color="error" onClick={handleRemoveTemplateMedia} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Remove
                      </Button>
                    </Stack>
                  ) : (
                    <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '10px', p: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />} disabled={mediaUploading} size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
                        {mediaUploading ? 'Uploading...' : 'Attach Image Banner'}
                        <input hidden type="file" accept="image/*" onChange={handleTemplateMediaUpload} />
                      </Button>
                      <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1 }}>
                        PNG, JPG, or WEBP up to 5MB
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* 4. Interactive Links & Action Buttons */}
                <Paper id="sec-actions" elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🔘</span> Section 4: Interactive Quick Replies &amp; Links
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', mb: 2 }}>
                    Add WhatsApp CTA buttons or link to existing Quick Replies / Catalog workflows.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Linked Action Message</InputLabel>
                        <Select
                          value={formData.linkedMessageId || ''}
                          label="Linked Action Message"
                          onChange={(e) => setFormData({ ...formData, linkedMessageId: e.target.value })}
                        >
                          <MenuItem value="">None</MenuItem>
                          {availableMessages.map((msg) => (
                            <MenuItem key={msg.id} value={msg.id}>
                              {msg.name} ({msg.type})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Action Trigger Type</InputLabel>
                        <Select
                          value={formData.linkedAction || ''}
                          label="Action Trigger Type"
                          onChange={(e) => setFormData({ ...formData, linkedAction: e.target.value })}
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="SEND_MESSAGE">Send Message</MenuItem>
                          <MenuItem value="OPEN_LINK">Open Link</MenuItem>
                          <MenuItem value="CALL_PHONE">Call Phone</MenuItem>
                          <MenuItem value="TRIGGER_WORKFLOW">Trigger Workflow</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Stack>
            </Box>

            {/* Permanent Sticky Action Footer */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                zIndex: 10
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {editingId
                  ? `Category: ${formData.category || 'CUSTOM'} · Type: ${formData.type || 'TEXT'}`
                  : 'New Multi-Lingual WhatsApp Template'}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenDialog(false)}
                  sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 15 }} />}
                  onClick={handleSaveTemplate}
                  disabled={submitting}
                  sx={{
                    backgroundColor: '#84cc16',
                    color: '#0f172a',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    px: 3,
                    '&:hover': { backgroundColor: '#65a30d', color: '#ffffff' }
                  }}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Template' : 'Save Template'}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Help / Guidelines Dialog ── */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          📖 Template Formatting Guidelines
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} mt={1}>
            <Alert severity="info" sx={{ borderRadius: '10px' }}>
              WhatsApp formatting shortcuts: <b>*bold*</b>, <i>_italic_</i>, <code>`monospace`</code>.
            </Alert>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              • Use <b>{"{{customer_name}}"}</b> or <b>{"{{order_id}}"}</b> tags for dynamic recipient personalization.
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              • Click <b>✨ Auto-Translate</b> to instantly localize your English message into 12 Indian languages including Tamil, Telugu, Hindi, and Kannada.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHelpDialog(false)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Where Used Dialog ── */}
      <Dialog open={!!whereUsedTarget} onClose={() => setWhereUsedTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          🧭 Template Dependencies: {whereUsedTarget?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {whereUsedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : whereUsedData ? (
            <Stack spacing={2} mt={1}>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Campaigns: <b>{whereUsedData.campaigns?.length || 0}</b> | Workflows: <b>{whereUsedData.workflows?.length || 0}</b> | Rules: <b>{whereUsedData.rules?.length || 0}</b>
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No active dependencies found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWhereUsedTarget(null)} sx={{ fontWeight: 700 }}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          ⚠️ Delete Template: {deleteTarget?.name}?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete this template? Any automated workflows using it will require updating.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteTemplate} sx={{ fontWeight: 800 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Delete Confirmation ── */}
      <Dialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          ⚠️ Delete {selectedTemplateIds.length} Templates?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            This action cannot be undone. Are you sure you want to delete all selected templates?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteConfirm(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleBulkDelete} sx={{ fontWeight: 800 }}>Delete All</Button>
        </DialogActions>
      </Dialog>

      {/* ── CSV Import Dialog ── */}
      <Dialog open={openCSVDialog} onClose={() => setOpenCSVDialog(false)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          📤 Import Templates from CSV
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2, mt: 1 }}>
            Upload a CSV file containing columns: <code>name, keywords, content, category</code>.
          </Typography>
          <Button variant="contained" component="label" startIcon={<UploadIcon />} disabled={csvLoading} fullWidth sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800 }}>
            {csvLoading ? 'Processing...' : 'Choose CSV File'}
            <input hidden type="file" accept=".csv" onChange={handleCSVUpload} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCSVDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── CSV Preview & Bulk Creation Dialog ── */}
      <Dialog open={openCSVPreviewDialog} onClose={() => setOpenCSVPreviewDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, fontWeight: 800 }}>
          ✨ Review {formData.csvTemplates?.length || 0} Imported Templates
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} mt={1}>
            {formData.csvTemplates?.map((t, i) => (
              <Paper key={i} elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>{i + 1}. {t.name}</Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', mt: 0.5 }}>{t.content}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCSVPreviewDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFromCSVPreview} disabled={creatingFromCSV} sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800 }}>
            {creatingFromCSV ? 'Creating...' : `Create All ${formData.csvTemplates?.length || 0}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}
