import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Divider, FormControl, InputLabel,
  Select, CircularProgress, Alert, Tooltip, Checkbox,
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
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';
import renicIcon from '../../assets/logo-icon.jpeg';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('CARDS');
  const [openDialog, setOpenDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [openCSVDialog, setOpenCSVDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const fileInputRef = useRef(null);
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
  const [editActiveLangTab, setEditActiveLangTab] = useState('en');
  const [editTranslating, setEditTranslating] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
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

  const buttonActionOptions = [
    { value: 'SEND_MESSAGE', label: 'Send Message' },
    { value: 'OPEN_LINK', label: 'Open Link' },
    { value: 'CALL_PHONE', label: 'Call Phone' },
    { value: 'TRIGGER_WORKFLOW', label: 'Trigger Workflow' },
    { value: 'QUICK_REPLY', label: 'Quick Reply' }
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
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch templates',
        severity: 'error'
      });
    }
  };



  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name || '';
    if (!fileName.toLowerCase().endsWith('.csv')) {
      setSnackbar({
        open: true,
        message: 'Please upload a CSV file only.',
        severity: 'warning'
      });
      e.target.value = '';
      return;
    }

    try {
      setCsvLoading(true);
      const text = await file.text();

      const response = await apiClient.post('/templates/ai/generate-from-csv', {
        csvContent: text
      });

      if (response.data.success && response.data.templates.length > 0) {
        setSnackbar({
          open: true,
          message: `CSV imported successfully. ${response.data.count} templates ready for review.`,
          severity: 'success'
        });

        setFormData(prev => ({
          ...prev,
          csvTemplates: response.data.templates
        }));

        setOpenCSVPreviewDialog(true);
      } else {
        setSnackbar({
          open: true,
          message: 'No valid templates found in the CSV file.',
          severity: 'warning'
        });
      }

      setOpenCSVDialog(false);
      fileInputRef.current.value = '';
    } catch (error) {
      console.error('CSV processing error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to process CSV file',
        severity: 'error'
      });
    } finally {
      setCsvLoading(false);
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
      setSnackbar({
        open: true,
        message: 'Please select both a message and action',
        severity: 'warning'
      });
      return;
    }

    try {
      await apiClient.put(`/templates/${linkingTemplateId}`, {
        linkedMessageId: selectedMessage,
        linkedAction: selectedButtonAction
      });

      setSnackbar({
        open: true,
        message: 'Message link created successfully!',
        severity: 'success'
      });

      setOpenLinkDialog(false);
      setLinkingTemplateId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save link:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create link. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCreateFromCSVPreview = async () => {
    try {
      setCreatingFromCSV(true);
      
      // Get templates from formData
      const templateToCreate = formData.csvTemplates;
      
      if (!templateToCreate || templateToCreate.length === 0) {
        setSnackbar({
          open: true,
          message: 'No templates to create',
          severity: 'warning'
        });
        return;
      }

      // Call bulk create endpoint
      const response = await apiClient.post('/templates/bulk-create', {
        templates: templateToCreate
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `✅ Created ${response.data.created} templates! ${response.data.failed > 0 ? `${response.data.failed} failed` : ''}`,
          severity: response.data.failed > 0 ? 'warning' : 'success'
        });

        setOpenCSVPreviewDialog(false);
        setFormData(prev => ({ ...prev, csvTemplates: [] }));
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to create templates:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to create templates',
        severity: 'error'
      });
    } finally {
      setCreatingFromCSV(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      TEXT: 'primary',
      IMAGE: 'success',
      VIDEO: 'error',
      DOCUMENT: 'warning',
      INTERACTIVE: 'info'
    };
    return colors[type] || 'default';
  };

  const handleSnackbarAction = () => {
    if (snackbar.action === 'confirm_delete') {
      handleDeleteTemplate();
    }
  };

  const downloadCSVTemplate = () => {
    const csvHeader = 'name,keywords,content,category\n';
    const exampleRow = '"Welcome Message","hello,hi,greet","Hey! Welcome to our store 👋","GREETING"\n';
    const csvContent = csvHeader + exampleRow;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_example.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({
      open: true,
      message: 'CSV template downloaded successfully!',
      severity: 'success'
    });
  };

  const handleOpenAddDialog = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'TEXT',
      content: '',
      category: 'CUSTOM',
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

      if (editingTemplate) {
        setEditingTemplate({ ...editingTemplate, ...media, type: 'IMAGE' });
      } else {
        setFormData(prev => ({ ...prev, ...media, type: 'IMAGE' }));
      }

      setSnackbar({ open: true, message: 'Image attached to template successfully!', severity: 'success' });
    } catch (error) {
      console.error('Template media upload error:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to upload image', severity: 'error' });
    } finally {
      setMediaUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveTemplateMedia = () => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        mediaUrl: '',
        mediaType: '',
        mediaPreviewData: '',
        mediaMimeType: '',
        mediaFileName: ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        mediaUrl: '',
        mediaType: '',
        mediaPreviewData: '',
        mediaMimeType: '',
        mediaFileName: ''
      }));
    }
  };

  const handleRequestDelete = async (template) => {
    setDeleteTarget(template);
    setUsageLoading(true);
    setUsageData(null);
    try {
      const res = await apiClient.get(`/templates/${template._id}/usage`);
      setUsageData(res.data);
    } catch (err) {
      console.warn('Could not fetch template usage details:', err);
      setUsageData({ inUse: false, totalUsages: 0, usages: { campaigns: [], workflows: [], responseRules: [], quickReplies: [] } });
    } finally {
      setUsageLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/templates/${deleteTarget._id}?cascade=true`);
      setSnackbar({
        open: true,
        message: usageData?.inUse
          ? `Template deleted and unlinked from ${usageData.totalUsages} location(s) successfully!`
          : 'Template deleted successfully!',
        severity: 'success'
      });
      setDeleteTarget(null);
      setUsageData(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete template',
        severity: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedTemplateIds.length === 0) return;
    try {
      setSubmitting(true);
      let deleted = 0;
      let failed = 0;
      for (const id of selectedTemplateIds) {
        try {
          await apiClient.delete(`/templates/${id}`);
          deleted++;
        } catch {
          failed++;
        }
      }
      setSnackbar({
        open: true,
        message: `Deleted ${deleted} template${deleted !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
        severity: failed > 0 ? 'warning' : 'success'
      });
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

  // Multi-select toggle handlers
  const handleToggleSelectTemplate = (id) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllTemplates = (e) => {
    if (e.target.checked) {
      setSelectedTemplateIds(templates.map(t => t._id));
    } else {
      setSelectedTemplateIds([]);
    }
  };

  const handleEditTemplate = (idx) => {
    const template = formData.csvTemplates[idx];
    setEditingTemplate({
      ...template,
      blocks: template.messageBlocks || []
    });
    setEditingTemplateIdx(idx);
  };

  const handleAutoTranslate = async (isEditing = false) => {
    const textToTranslate = isEditing ? editingTemplate?.content : formData?.content;
    if (!textToTranslate?.trim()) {
      setSnackbar({ open: true, message: 'Please enter primary template content first', severity: 'warning' });
      return;
    }
    try {
      if (isEditing) setEditTranslating(true); else setTranslating(true);
      const res = await apiClient.post('/templates/translate', {
        text: textToTranslate,
        targetLanguages: ['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ur']
      });
      if (res.data?.translations) {
        if (isEditing) {
          setEditingTemplate(prev => ({
            ...prev,
            translations: { ...(prev?.translations || {}), ...res.data.translations }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            translations: { ...(prev?.translations || {}), ...res.data.translations }
          }));
        }
        setSnackbar({ open: true, message: '✨ Auto-translated to all Indian languages successfully!', severity: 'success' });
      }
    } catch (err) {
      console.error('Auto-translate error:', err);
      setSnackbar({ open: true, message: 'Failed to auto-translate template', severity: 'error' });
    } finally {
      if (isEditing) setEditTranslating(false); else setTranslating(false);
    }
  };

  // Opens the edit dialog for a saved DB template
  const handleEditDbTemplate = (template) => {
    setEditingTemplate({
      _id: template._id,
      name: template.name,
      content: template.content || '',
      language: template.language || 'en',
      translations: template.translations || {},
      category: template.category || 'CUSTOM',
      type: template.type || 'TEXT',
      keywords: template.keywords || '',
      blocks: template.messageBlocks || [],
      mediaUrl: template.mediaUrl || '',
      mediaType: template.mediaType || '',
      mediaPreviewData: template.mediaPreviewData || '',
      mediaMimeType: template.mediaMimeType || '',
      mediaFileName: template.mediaFileName || ''
    });
    setEditActiveLangTab('en');
    setEditingTemplateIdx(null); // null = DB template, not CSV preview
  };

  const handleSaveEditedTemplate = async () => {
    if (!editingTemplate) return;

    // If the template has an _id it is a DB template – save via API
    if (editingTemplate._id) {
      try {
        setSubmitting(true);
        await apiClient.put(`/templates/${editingTemplate._id}`, {
          name: editingTemplate.name,
          content: editingTemplate.content,
          language: editingTemplate.language || 'en',
          translations: editingTemplate.translations || {},
          category: editingTemplate.category,
          type: editingTemplate.type,
          keywords: editingTemplate.keywords || '',
          mediaUrl: editingTemplate.mediaUrl || '',
          mediaType: editingTemplate.mediaType || '',
          mediaPreviewData: editingTemplate.mediaPreviewData || '',
          mediaMimeType: editingTemplate.mediaMimeType || '',
          mediaFileName: editingTemplate.mediaFileName || ''
        });
        setSnackbar({ open: true, message: 'Template updated successfully!', severity: 'success' });
        setEditingTemplate(null);
        fetchTemplates();
      } catch (error) {
        console.error('Failed to update template:', error);
        setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update template', severity: 'error' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Otherwise it is a CSV-preview template – update local state only
    if (editingTemplateIdx !== null) {
      const updatedTemplates = [...formData.csvTemplates];
      updatedTemplates[editingTemplateIdx] = {
        ...editingTemplate,
        messageBlocks: editingTemplate.blocks
      };
      setFormData(prev => ({ ...prev, csvTemplates: updatedTemplates }));
      setEditingTemplate(null);
      setEditingTemplateIdx(null);
      setSnackbar({ open: true, message: 'Template updated!', severity: 'success' });
    }
  };

  const handleAddButtonToTemplate = () => {
    if (editingTemplate && editingTemplate.blocks) {
      const newBlocks = [...editingTemplate.blocks];
      const buttonBlock = {
        type: 'BUTTONS',
        config: {
          buttons: [
            {
              label: 'View More',
              type: 'QUICK_REPLY',
              actionValue: 'view_more'
            }
          ]
        }
      };
      newBlocks.push(buttonBlock);
      setEditingTemplate({
        ...editingTemplate,
        blocks: newBlocks
      });
    }
  };

  const handleUpdateButton = (blockIdx, btnIdx, field, value) => {
    if (editingTemplate && editingTemplate.blocks) {
      const newBlocks = [...editingTemplate.blocks];
      if (!newBlocks[blockIdx].config.buttons) {
        newBlocks[blockIdx].config.buttons = [];
      }
      newBlocks[blockIdx].config.buttons[btnIdx] = {
        ...newBlocks[blockIdx].config.buttons[btnIdx],
        [field]: value
      };
      setEditingTemplate({
        ...editingTemplate,
        blocks: newBlocks
      });
    }
  };

  const handleDeleteButton = (blockIdx, btnIdx) => {
    if (editingTemplate && editingTemplate.blocks) {
      const newBlocks = [...editingTemplate.blocks];
      if (newBlocks[blockIdx].type === 'BUTTONS') {
        newBlocks[blockIdx].config.buttons = newBlocks[blockIdx].config.buttons.filter((_, idx) => idx !== btnIdx);
        if (newBlocks[blockIdx].config.buttons.length === 0) {
          newBlocks.splice(blockIdx, 1);
        }
      }
      setEditingTemplate({
        ...editingTemplate,
        blocks: newBlocks
      });
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

  const templateStats = [
    { label: 'Total Templates', value: templates.length, icon: '📋', color: '#84cc16', accent: '#0f172a' },
    { label: 'Text Messages', value: templates.filter(t => (t.type || 'TEXT') === 'TEXT').length, icon: '📝', color: '#0ea5e9', accent: '#0369a1' },
    { label: 'Rich Media Banners', value: templates.filter(t => t.type === 'IMAGE').length, icon: '🖼️', color: '#a855f7', accent: '#7e22ce' },
    { label: 'Interactive Buttons', value: templates.filter(t => t.type === 'INTERACTIVE').length, icon: '🔘', color: '#f59e0b', accent: '#b45309' }
  ];

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      {/* ── Sleek Compact Header Bar ── */}
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
                label="WhatsApp Ready"
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
            {/* Inline Stat Pills */}
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
              <Chip
                label={`Interactive: ${templates.filter(t => t.type === 'INTERACTIVE').length}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }}
              />
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AssessmentIcon sx={{ fontSize: 16, color: '#4d7c0f' }} />}
            onClick={() => {
              if (templates.length > 0) {
                handleOpenTemplateLogs(templates[0]);
              } else {
                setSnackbar({ open: true, message: 'Create a template first to view sent history', severity: 'info' });
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '34px',
              borderRadius: '8px',
              color: '#0f172a',
              borderColor: '#84cc16',
              bgcolor: 'rgba(132, 204, 22, 0.08)',
              '&:hover': { bgcolor: 'rgba(132, 204, 22, 0.16)', borderColor: '#65a30d' }
            }}
          >
            Sent History
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenHelpDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '34px',
              borderRadius: '8px',
              color: '#475569',
              borderColor: '#cbd5e1',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            Guidelines
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={downloadCSVTemplate}
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '34px',
              borderRadius: '8px',
              color: '#475569',
              borderColor: '#cbd5e1',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            CSV Sample
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenCSVDialog(true)}
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '34px',
              borderRadius: '8px',
              color: '#475569',
              borderColor: '#cbd5e1',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
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
              '&:hover': {
                bgcolor: '#65a30d',
                color: '#ffffff'
              }
            }}
          >
            New Template
          </Button>
        </Stack>
      </Card>

      {/* ── Filter, Search & View Toggle Toolbar ── */}
      <Card elevation={0} sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <TextField
            size="small"
            placeholder="Search templates by name, message copy, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
            }}
            sx={{ minWidth: { xs: '100%', md: 320 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          {/* Category Filter Pills */}
          <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', py: 0.5 }} alignItems="center">
            {['ALL', 'WELCOME', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'DISCOUNT_OFFER', 'CART_ABANDONMENT', 'CUSTOM'].map((cat) => (
              <Chip
                key={cat}
                label={cat.replace(/_/g, ' ')}
                size="small"
                onClick={() => setSelectedCategoryFilter(cat)}
                clickable
                sx={{
                  fontWeight: selectedCategoryFilter === cat ? 800 : 600,
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  bgcolor: selectedCategoryFilter === cat ? '#0f172a' : '#f1f5f9',
                  color: selectedCategoryFilter === cat ? '#84cc16' : '#475569',
                  border: selectedCategoryFilter === cat ? '1px solid #0f172a' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: selectedCategoryFilter === cat ? '#0f172a' : '#e2e8f0'
                  }
                }}
              />
            ))}
          </Stack>

          {/* View Toggle */}
          <Stack direction="row" spacing={0.5} alignItems="center" alignSelf={{ xs: 'flex-end', md: 'center' }}>
            <Tooltip title="Cards Grid View">
              <IconButton
                size="small"
                onClick={() => setViewMode('CARDS')}
                sx={{
                  bgcolor: viewMode === 'CARDS' ? '#0f172a' : '#f1f5f9',
                  color: viewMode === 'CARDS' ? '#84cc16' : '#64748b',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: viewMode === 'CARDS' ? '#1e293b' : '#e2e8f0' }
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Data Grid Table View">
              <IconButton
                size="small"
                onClick={() => setViewMode('TABLE')}
                sx={{
                  bgcolor: viewMode === 'TABLE' ? '#0f172a' : '#f1f5f9',
                  color: viewMode === 'TABLE' ? '#84cc16' : '#64748b',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: viewMode === 'TABLE' ? '#1e293b' : '#e2e8f0' }
                }}
              >
                <TableRowsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>

      {/* ── Elevated 2-Column Template Creation / Edit Modal ── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            maxHeight: '90vh',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)'
          }
        }}
      >
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
              sx={{ width: 28, height: 28, bgcolor: '#ffffff', p: 0.2, borderRadius: '6px', objectFit: 'contain' }}
            />
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                  {editingId ? 'Edit WhatsApp Template' : 'Compose New WhatsApp Template'}
                </Typography>
                <Chip
                  label="TEMPLATE DESIGNER"
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
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Design reusable message templates with dynamic variable tokens and live WhatsApp preview.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenDialog(false)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, overflowY: 'auto', bgcolor: '#f8fafc' }}>
          <Grid container spacing={3}>
            {/* Form Fields (62%) */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Template Name"
                  placeholder="e.g. Welcome VIP Customer, Abandoned Cart Offer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  size="small"
                  required
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
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
                        sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
                      >
                        <MenuItem value="TEXT">📝 Text Message</MenuItem>
                        <MenuItem value="IMAGE">🖼️ With Image Banner</MenuItem>
                        <MenuItem value="INTERACTIVE">🔘 With Action Buttons</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {formData.type === 'IMAGE' && (
                  <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: '12px', p: 2, bgcolor: '#ffffff' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#0f172a', fontSize: '0.825rem' }}>
                      Attach Promotional Banner
                    </Typography>
                    {formData.mediaPreviewData ? (
                      <Stack spacing={1} alignItems="flex-start">
                        <Box component="img"
                          src={formData.mediaPreviewData}
                          alt="Template preview"
                          sx={{ maxWidth: '100%', maxHeight: 150, borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {formData.mediaFileName}
                        </Typography>
                        <Button size="small" color="error" onClick={handleRemoveTemplateMedia} sx={{ textTransform: 'none', fontWeight: 700 }}>
                          Remove Image
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={mediaUploading}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                      >
                        {mediaUploading ? 'Uploading...' : 'Choose Image File'}
                        <input hidden type="file" accept="image/*" onChange={handleTemplateMediaUpload} />
                      </Button>
                    )}
                  </Box>
                )}

                {/* Multi-Language Indian Languages & Content Editor */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 2, bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                        🇮🇳 Indian Multi-Language Message
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                        Write in any Indian language or use 1-click Auto-Translate
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAutoTranslate(false)}
                      disabled={translating || !formData.content?.trim()}
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

                  {/* Indian Language Tabs */}
                  <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 1.5, overflowX: 'auto', display: 'flex', gap: 0.5, pb: 0.5 }}>
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
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: isSelected ? '#1e293b' : '#f1f5f9' }
                          }}
                        >
                          {lang.native} {hasTranslation ? '✓' : ''}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Variable Token Helper Chips */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                      {INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.native} ({INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.name}) Text:
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Insert:</Typography>
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
                          sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#f1f5f9', cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    placeholder={
                      activeLangTab === 'en'
                        ? "Type English template message text... e.g. 'Hello {{firstName}}, welcome to our store!'"
                        : `Type ${INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.native} (${INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.name}) translation or click '✨ Auto-Translate'...`
                    }
                    value={activeLangTab === 'en' ? (formData.content || '') : (formData.translations?.[activeLangTab] || '')}
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
                    rows={5}
                    size="small"
                    required={activeLangTab === 'en'}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', borderRadius: '8px' } }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Keywords (Optional)"
                  placeholder="e.g. price, order, catalog (comma-separated)"
                  value={formData.keywords || ''}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  size="small"
                  helperText="Optional shortcut keywords for triggering this template"
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                />
              </Stack>
            </Grid>

            {/* Live WhatsApp Preview (38%) */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, textAlign: 'center', fontSize: '0.85rem' }}>
                  Live WhatsApp Preview
                </Typography>

                <Box
                  sx={{
                    bgcolor: '#efeae2',
                    p: 2,
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    minHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#ffffff',
                      p: 1.5,
                      borderRadius: '10px',
                      borderTopLeftRadius: 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      mb: 1
                    }}
                  >
                    {formData.type === 'IMAGE' && formData.mediaPreviewData && (
                      <Box
                        component="img"
                        src={formData.mediaPreviewData}
                        alt="Preview"
                        sx={{ width: '100%', maxHeight: 110, objectFit: 'cover', borderRadius: '6px', mb: 1 }}
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Chip
                        label={INDIAN_LANGUAGES.find(l => l.code === activeLangTab)?.native || 'English'}
                        size="small"
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#e2e8f0', color: '#0f172a' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                      {(activeLangTab === 'en' ? formData.content : formData.translations?.[activeLangTab]) || formData.content || 'Type message text to see live preview...'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748b' }}>
                        Just now ✓✓
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', gap: 1.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
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
                setFormData({
                  name: '',
                  type: 'TEXT',
                  content: '',
                  language: 'en',
                  translations: {},
                  category: 'CUSTOM',
                  linkedMessageId: null,
                  linkedAction: null,
                  csvTemplates: [],
                  mediaUrl: '',
                  mediaType: '',
                  mediaPreviewData: '',
                  mediaMimeType: '',
                  mediaFileName: ''
                });
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
            }}
            disabled={submitting}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 900,
              borderRadius: '10px',
              px: 3,
              boxShadow: '0 4px 14px rgba(132, 204, 22, 0.45)',
              '&:hover': { bgcolor: '#65a30d', color: '#ffffff' }
            }}
          >
            {submitting ? 'Saving...' : editingId ? 'Update Template' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Templates Views: Cards vs Table ── */}
      {filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px' }} elevation={0}>
          <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: 'rgba(132, 204, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, fontSize: '28px' }}>
            📋
          </Box>
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
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              borderRadius: '10px',
              px: 3
            }}
          >
            Create First Template
          </Button>
        </Paper>
      ) : viewMode === 'CARDS' ? (
        <Grid container spacing={2.5}>
          {filteredTemplates.map((template, idx) => (
            <Grid item xs={12} sm={6} md={4} key={template._id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.1)',
                    borderColor: '#84cc16'
                  }
                }}
              >
                {/* Card Top Strip */}
                <Box sx={{ p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                  <Chip
                    label={template.category || 'CUSTOM'}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(132, 204, 22, 0.15)',
                      color: '#3f6212',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      height: 22
                    }}
                  />
                  <Chip
                    label={template.type || 'TEXT'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                  />
                </Box>

                {/* Card Body with WhatsApp Bubble Preview */}
                <CardContent sx={{ flex: 1, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '0.95rem' }}>
                    {template.name}
                  </Typography>

                  <Box
                    sx={{
                      bgcolor: '#efeae2',
                      p: 1.5,
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      mb: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: '#ffffff',
                        p: 1.25,
                        borderRadius: '8px',
                        borderTopLeftRadius: 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.45
                        }}
                      >
                        {template.content}
                      </Typography>
                    </Box>
                  </Box>

                  {template.keywords && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                      🔑 {template.keywords}
                    </Typography>
                  )}
                </CardContent>

                <Divider sx={{ borderColor: '#f1f5f9' }} />

                {/* Card Footer Actions */}
                <CardActions sx={{ px: 2, py: 1.25, justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Edit Template">
                      <IconButton size="small" onClick={() => handleEditDbTemplate(template)} sx={{ color: '#0f172a' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Link to Action">
                      <IconButton size="small" onClick={() => handleOpenLinkDialog(template._id)} sx={{ color: '#0ea5e9' }}>
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Tooltip title="Delete Template">
                    <IconButton size="small" color="error" onClick={() => handleRequestDelete(template)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* ── Modern Table View ── */
        <Box component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {selectedTemplateIds.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, px: 2, bgcolor: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                {selectedTemplateIds.length} template{selectedTemplateIds.length !== 1 ? 's' : ''} selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setSelectedTemplateIds([])} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Clear
                </Button>
                <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setBulkDeleteConfirm(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Delete Selected
                </Button>
              </Stack>
            </Box>
          )}

          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 800 }}>
              {/* Header Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '48px 60px 1fr 120px 160px 180px',
                gap: 2,
                p: 2,
                bgcolor: '#0f172a',
                color: '#ffffff',
                alignItems: 'center',
                borderBottom: '2px solid #84cc16'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    size="small"
                    checked={templates.length > 0 && selectedTemplateIds.length === templates.length}
                    indeterminate={selectedTemplateIds.length > 0 && selectedTemplateIds.length < templates.length}
                    onChange={handleSelectAllTemplates}
                    sx={{ color: '#ffffff', '&.Mui-checked': { color: '#84cc16' } }}
                  />
                </Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>#</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Template Name & Content Preview</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Type</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Category</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right', pr: 2 }}>Actions</Box>
              </Box>

              {/* Data Rows */}
              {filteredTemplates.map((template, idx) => (
                <Box
                  key={template._id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '48px 60px 1fr 120px 160px 180px',
                    gap: 2,
                    p: 2,
                    borderBottom: '1px solid #f1f5f9',
                    alignItems: 'center',
                    bgcolor: selectedTemplateIds.includes(template._id) ? 'rgba(132, 204, 22, 0.08)' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': { bgcolor: selectedTemplateIds.includes(template._id) ? 'rgba(132, 204, 22, 0.15)' : '#f1f5f9' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      size="small"
                      checked={selectedTemplateIds.includes(template._id)}
                      onChange={() => handleToggleSelectTemplate(template._id)}
                      sx={{ '&.Mui-checked': { color: '#84cc16' } }}
                    />
                  </Box>
                  <Box sx={{ fontWeight: 800, color: '#64748b' }}>{idx + 1}</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {template.content}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip label={template.type || 'TEXT'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                  </Box>
                  <Box>
                    <Chip label={template.category || 'CUSTOM'} size="small" sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#3f6212', fontWeight: 800, fontSize: '0.7rem' }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center', pr: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditDbTemplate(template)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Link Action">
                      <IconButton size="small" onClick={() => handleOpenLinkDialog(template._id)} sx={{ color: '#0ea5e9' }}>
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleRequestDelete(template)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* CSV Preview Dialog */}
      <Dialog open={openCSVPreviewDialog} onClose={() => setOpenCSVPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon color="success" />
          <Typography variant="h6">Preview Imported CSV Templates</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <Alert severity="success" sx={{ fontSize: '0.9rem' }}>
              CSV import complete. {formData.csvTemplates?.length || 0} templates are ready for review.
            </Alert>
            
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {formData.csvTemplates?.map((template, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', flex: 1 }}>
                      {idx + 1}. {template.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={template.category}
                        size="small"
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditTemplate(idx)}
                      >
                        Edit
                      </Button>
                    </Stack>
                  </Stack>
                  
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#ffffff',
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}
                  >
                    {template.content}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCSVPreviewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disableElevation
            onClick={handleCreateFromCSVPreview}
            disabled={creatingFromCSV}
            startIcon={<AddIcon />}
          >
            {creatingFromCSV ? 'Creating...' : `Create All ${formData.csvTemplates?.length || 0}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editingTemplate !== null} onClose={() => setEditingTemplate(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingTemplate?._id ? `Edit Template — ${editingTemplate?.name}` : `Preview Edit — ${editingTemplate?.name}`}
        </DialogTitle>
        <DialogContent>
          {editingTemplate && (
            <Stack spacing={3} mt={2}>
              {/* Template Name */}
              <TextField
                label="Template Name"
                fullWidth
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                size="small"
              />

              {/* Category */}
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingTemplate.category || 'CUSTOM'}
                  label="Category"
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Type (only for DB templates) */}
              {editingTemplate._id && (
                <FormControl fullWidth size="small">
                  <InputLabel>Template Type</InputLabel>
                  <Select
                    value={editingTemplate.type || 'TEXT'}
                    label="Template Type"
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                  >
                    <MenuItem value="TEXT">📝 Text Only</MenuItem>
                    <MenuItem value="IMAGE">🖼️ With Image</MenuItem>
                    <MenuItem value="INTERACTIVE">🔘 With Buttons</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Image Attachment for IMAGE type templates */}
              {editingTemplate._id && (
                <Box sx={{ border: '1px dashed #CBD5E1', borderRadius: 2, p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Attach Image (will be sent along with the message)
                  </Typography>
                  {editingTemplate.mediaPreviewData ? (
                    <Stack spacing={1} alignItems="flex-start">
                      <Box component="img"
                        src={editingTemplate.mediaPreviewData}
                        alt="Template image preview"
                        sx={{ maxWidth: '100%', maxHeight: 180, borderRadius: 1, border: '1px solid #E5E7EB' }}
                      />
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {editingTemplate.mediaFileName}
                      </Typography>
                      <Button size="small" color="error" onClick={handleRemoveTemplateMedia}>
                        Remove Image
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={mediaUploading}
                      size="small"
                    >
                      {mediaUploading ? 'Uploading...' : 'Choose Image'}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={handleTemplateMediaUpload}
                      />
                    </Button>
                  )}
                </Box>
              )}

              {/* Indian Multi-Language Translations for DB templates */}
              {editingTemplate._id && (
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 2, bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                        🇮🇳 Indian Multi-Language Message
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                        Customize messages in Tamil, Hindi, Telugu, Kannada, etc., or use 1-click Auto-Translate
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAutoTranslate(true)}
                      disabled={editTranslating || !editingTemplate?.content?.trim()}
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
                      {editTranslating ? 'Translating...' : '✨ Auto-Translate to Indian Languages'}
                    </Button>
                  </Box>

                  {/* Indian Language Tabs */}
                  <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 1.5, overflowX: 'auto', display: 'flex', gap: 0.5, pb: 0.5 }}>
                    {INDIAN_LANGUAGES.map(lang => {
                      const hasTranslation = lang.code === 'en' 
                        ? !!editingTemplate?.content?.trim() 
                        : !!editingTemplate?.translations?.[lang.code]?.trim();
                      const isSelected = editActiveLangTab === lang.code;

                      return (
                        <Button
                          key={lang.code}
                          size="small"
                          onClick={() => setEditActiveLangTab(lang.code)}
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
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: isSelected ? '#1e293b' : '#f1f5f9' }
                          }}
                        >
                          {lang.native} {hasTranslation ? '✓' : ''}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Variable Helper Chips */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                      {INDIAN_LANGUAGES.find(l => l.code === editActiveLangTab)?.native} ({INDIAN_LANGUAGES.find(l => l.code === editActiveLangTab)?.name}) Text:
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Insert:</Typography>
                      {['{{customer_name}}', '{{firstName}}', '{{order_id}}', '{{discount}}'].map(v => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          onClick={() => {
                            if (editActiveLangTab === 'en') {
                              setEditingTemplate(prev => ({ ...prev, content: (prev.content || '') + ' ' + v }));
                            } else {
                              setEditingTemplate(prev => ({
                                ...prev,
                                translations: {
                                  ...(prev.translations || {}),
                                  [editActiveLangTab]: ((prev.translations?.[editActiveLangTab] || '') + ' ' + v).trim()
                                }
                              }));
                            }
                          }}
                          sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#f1f5f9', cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    placeholder={
                      editActiveLangTab === 'en'
                        ? "Type English template message text... e.g. 'Hello {{firstName}}, welcome to our store!'"
                        : `Type ${INDIAN_LANGUAGES.find(l => l.code === editActiveLangTab)?.native} (${INDIAN_LANGUAGES.find(l => l.code === editActiveLangTab)?.name}) translation or click '✨ Auto-Translate'...`
                    }
                    value={editActiveLangTab === 'en' ? (editingTemplate.content || '') : (editingTemplate.translations?.[editActiveLangTab] || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editActiveLangTab === 'en') {
                        setEditingTemplate(prev => ({ ...prev, content: val }));
                      } else {
                        setEditingTemplate(prev => ({
                          ...prev,
                          translations: {
                            ...(prev.translations || {}),
                            [editActiveLangTab]: val
                          }
                        }));
                      }
                    }}
                    multiline
                    rows={5}
                    size="small"
                    required={editActiveLangTab === 'en'}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', borderRadius: '8px' } }}
                  />
                </Box>
              )}

              {/* Keywords */}
              {editingTemplate._id && (
                <TextField
                  label="Keywords (Optional)"
                  fullWidth
                  value={editingTemplate.keywords || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, keywords: e.target.value })}
                  placeholder="e.g., rates, price, quote (comma-separated)"
                  helperText="Keywords to trigger this template"
                  size="small"
                />
              )}

              {/* Message Blocks — only for CSV preview templates */}
              {!editingTemplate._id && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Message Blocks
                </Typography>
                <Stack spacing={2}>
                  {editingTemplate.blocks?.map((block, blockIdx) => (
                    <Paper key={blockIdx} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Block {blockIdx + 1}: {block.type}
                      </Typography>

                      {block.type === 'TEXT' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={block.config?.text || ''}
                          onChange={(e) => {
                            const newBlocks = [...editingTemplate.blocks];
                            newBlocks[blockIdx].config.text = e.target.value;
                            setEditingTemplate({ ...editingTemplate, blocks: newBlocks });
                          }}
                        />
                      )}

                      {block.type === 'BUTTONS' && (
                        <Stack spacing={1.5}>
                          {block.config?.buttons?.map((btn, btnIdx) => (
                            <Stack key={btnIdx} direction="row" spacing={1} alignItems="flex-start">
                              <TextField
                                label="Label"
                                size="small"
                                value={btn.label}
                                onChange={(e) => handleUpdateButton(blockIdx, btnIdx, 'label', e.target.value)}
                              />
                              <Select
                                size="small"
                                value={btn.type}
                                onChange={(e) => handleUpdateButton(blockIdx, btnIdx, 'type', e.target.value)}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="QUICK_REPLY">Quick Reply</MenuItem>
                                <MenuItem value="URL">Open Link</MenuItem>
                                <MenuItem value="CALL">Call Phone</MenuItem>
                              </Select>
                              <TextField
                                label="Action Value"
                                size="small"
                                value={btn.actionValue}
                                onChange={(e) => handleUpdateButton(blockIdx, btnIdx, 'actionValue', e.target.value)}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteButton(blockIdx, btnIdx)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              const newBlocks = [...editingTemplate.blocks];
                              if (!newBlocks[blockIdx].config.buttons) {
                                newBlocks[blockIdx].config.buttons = [];
                              }
                              newBlocks[blockIdx].config.buttons.push({
                                label: 'New Button',
                                type: 'QUICK_REPLY',
                                actionValue: 'action'
                              });
                              setEditingTemplate({ ...editingTemplate, blocks: newBlocks });
                            }}
                          >
                            Add Button
                          </Button>
                        </Stack>
                      )}
                    </Paper>
                  ))}
                </Stack>

                <Button
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleAddButtonToTemplate}
                  sx={{ mt: 2 }}
                  variant="outlined"
                >
                  Add Button Block
                </Button>
              </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingTemplate(null)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSaveEditedTemplate}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Template Usage & Cascade Deletion Dialog ── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
          }
        }}
      >
        <Box
          sx={{
            p: 2.5,
            px: 3,
            bgcolor: usageData?.inUse ? '#FEF2F2' : '#FFFBEB',
            borderBottom: `1px solid ${usageData?.inUse ? '#FECACA' : '#FDE68A'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: usageData?.inUse ? '#FEE2E2' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: usageData?.inUse ? '#DC2626' : '#D97706'
              }}
            >
              <WarningAmberIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: usageData?.inUse ? '#991B1B' : '#92400E' }}>
                {usageData?.inUse ? 'Template In Active Use — Cascade Delete' : 'Delete WhatsApp Template'}
              </Typography>
              <Typography variant="caption" sx={{ color: usageData?.inUse ? '#B91C1C' : '#B45309', fontWeight: 600 }}>
                {deleteTarget?.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => !deleting && setDeleteTarget(null)} size="small" disabled={deleting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
          {usageLoading ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={32} sx={{ color: '#DC2626' }} />
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                Checking where this template is currently in use...
              </Typography>
            </Box>
          ) : usageData?.inUse ? (
            <Stack spacing={2.5}>
              <Alert severity="error" sx={{ borderRadius: '10px', '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
                <strong>Warning:</strong> This template is actively referenced across <strong>{usageData.totalUsages}</strong> location(s). Deleting it will safely unlink and remove references across these campaigns, workflows, and rules.
              </Alert>

              <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, fontSize: '0.85rem' }}>
                  Locations where template is in use:
                </Typography>

                <Stack spacing={1.5}>
                  {usageData.usages?.campaigns?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        📢 Campaigns ({usageData.usages.campaigns.length})
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {usageData.usages.campaigns.map(c => (
                          <Chip key={c._id} label={`${c.name} (${c.status || 'DRAFT'})`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 700, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {usageData.usages?.workflows?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        ⚡ Workflows ({usageData.usages.workflows.length})
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {usageData.usages.workflows.map(w => (
                          <Chip key={w._id} label={`${w.name} (${w.triggerType || 'TRIGGER'})`} size="small" sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {usageData.usages?.responseRules?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        🤖 Response Rules ({usageData.usages.responseRules.length})
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {usageData.usages.responseRules.map(r => (
                          <Chip key={r._id} label={r.name || r.trigger || 'Rule'} size="small" sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 700, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {usageData.usages?.quickReplies?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        💬 Quick Replies ({usageData.usages.quickReplies.length})
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {usageData.usages.quickReplies.map(qr => (
                          <Chip key={qr._id} label={qr.shortcut || qr.text} size="small" sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 700, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>

              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>
                If you proceed, this template will be permanently deleted, and its reference will be safely unlinked from all campaigns, workflows, and response rules above.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete template <strong>"{deleteTarget?.name}"</strong>?
              </Typography>
              <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '0.8rem' }}>
                This template is not currently active in any campaigns, workflows, or response rules. This action cannot be undone.
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTemplate}
            disabled={deleting || usageLoading}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '10px',
              px: 2.5,
              bgcolor: '#DC2626',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              '&:hover': { bgcolor: '#B91C1C' }
            }}
          >
            {deleting
              ? 'Deleting Everywhere...'
              : usageData?.inUse
                ? 'Confirm & Delete Everywhere'
                : 'Delete Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>
          Delete {selectedTemplateIds.length} Template{selectedTemplateIds.length !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#374151' }}>
            Are you sure you want to delete <strong>{selectedTemplateIds.length}</strong> selected template{selectedTemplateIds.length !== 1 ? 's' : ''}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteConfirm(false)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
            disableElevation
          >
            {submitting ? 'Deleting...' : `Delete ${selectedTemplateIds.length} Template${selectedTemplateIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help / Guidelines Dialog */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 File Format Guidelines</span>
          <IconButton onClick={() => setOpenHelpDialog(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Learn how to properly format your CSV files before uploading:
            </Typography>

            <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                📄 CSV Format (Recommended)
              </Typography>
              <Stack spacing={1.5} sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#1f2937', fontWeight: 600 }}>
                  Header (Required): name,keywords,content,category
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {`Example:
"Welcome","hello,hi,greet","Hey! Welcome to our store 👋","GREETING"
"Product Info","price,cost,rates","We have necklaces from Rs.2000-5000","PRODUCTS"
"Multi-line","faq,help","Question?\\n\\nAnswer text\\nWith multiple lines","FAQ"`}
                </Typography>
              </Stack>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>✓ Rules:</Typography>
                <Typography variant="caption" sx={{ color: '#4b5563' }}>• Always quote text containing commas</Typography>
                <Typography variant="caption" sx={{ color: '#4b5563' }}>• Use \\n for newlines inside quotes: "Line1\\nLine2"</Typography>
                <Typography variant="caption" sx={{ color: '#4b5563' }}>• name and content are required; keywords and category are optional</Typography>
                <Typography variant="caption" sx={{ color: '#4b5563' }}>• Save as UTF-8 encoding</Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHelpDialog(false)} variant="contained" color="primary" disableElevation>Got it</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
