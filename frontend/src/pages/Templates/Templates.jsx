import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Divider, FormControl, InputLabel,
  Select, CircularProgress, Alert, Tooltip
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
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [openCSVDialog, setOpenCSVDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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
    category: 'CUSTOM',
    linkedMessageId: null,
    linkedAction: null,
    csvTemplates: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

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
      csvTemplates: []
    });
    setOpenDialog(true);
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirmId) return;

    try {
      await apiClient.delete(`/templates/${deleteConfirmId}`);
      setSnackbar({
        open: true,
        message: 'Template deleted successfully!',
        severity: 'success'
      });
      setDeleteConfirmId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete template',
        severity: 'error'
      });
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

  const handleSaveEditedTemplate = () => {
    if (editingTemplateIdx !== null && editingTemplate) {
      const updatedTemplates = [...formData.csvTemplates];
      updatedTemplates[editingTemplateIdx] = {
        ...editingTemplate,
        messageBlocks: editingTemplate.blocks
      };
      setFormData(prev => ({
        ...prev,
        csvTemplates: updatedTemplates
      }));
      setEditingTemplate(null);
      setEditingTemplateIdx(null);
      setSnackbar({
        open: true,
        message: 'Template updated!',
        severity: 'success'
      });
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

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Message Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage reusable message templates
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="info"
            onClick={() => setOpenHelpDialog(true)}
            size="small"
          >
            Help / Guidelines
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadCSVTemplate}
            size="small"
          >
            Download CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenCSVDialog(true)}
            size="small"
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            disableElevation
          >
            New Template
          </Button>
        </Stack>
      </Box>

      {/* Main Template Creation/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={2}>
            {/* 1. Template Name */}
            <TextField
              fullWidth
              label="1. Template Name"
              placeholder="e.g., Welcome Message, Price Quote"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Short name for this template"
              size="small"
            />

            {/* 2. Template Type */}
            <FormControl fullWidth size="small">
              <InputLabel>2. Template Type</InputLabel>
              <Select
                value={formData.type}
                label="2. Template Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="TEXT">📝 Text Only</MenuItem>
                <MenuItem value="IMAGE">🖼️ With Image</MenuItem>
                <MenuItem value="INTERACTIVE">🔘 With Buttons</MenuItem>
              </Select>
            </FormControl>

            {/* 3. Category */}
            <FormControl fullWidth size="small">
              <InputLabel>3. Category</InputLabel>
              <Select
                value={formData.category}
                label="3. Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categoryOptions.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 4. Template Content */}
            <TextField
              fullWidth
              label="4. Template Content"
              placeholder="Type your message here... You can use {{customer_name}}, {{gold_rate_22k}}, etc."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              multiline
              rows={4}
              helperText="Supports dynamic variables with {{variable_name}} format"
              size="small"
            />

            {/* 5. Keywords (Optional) */}
            <TextField
              fullWidth
              label="5. Keywords (Optional)"
              placeholder="e.g., rates, price, quote (comma-separated)"
              value={formData.keywords || ''}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              helperText="Keywords to trigger this template"
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
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
                  category: formData.category,
                  keywords: formData.keywords || ''
                };

                if (editingId) {
                  await apiClient.put(`/templates/${editingId}`, payload);
                  setSnackbar({
                    open: true,
                    message: 'Template updated successfully!',
                    severity: 'success'
                  });
                } else {
                  await apiClient.post('/templates', payload);
                  setSnackbar({
                    open: true,
                    message: 'Template created successfully!',
                    severity: 'success'
                  });
                }

                setOpenDialog(false);
                setFormData({
                  name: '',
                  type: 'TEXT',
                  content: '',
                  category: 'CUSTOM',
                  linkedMessageId: null,
                  linkedAction: null,
                  csvTemplates: []
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
            disableElevation
          >
            {submitting ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={openCSVDialog} onClose={() => setOpenCSVDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Import CSV Templates</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity="info">
              Upload a CSV file with name and content columns. TXT and PDF imports are no longer supported.
            </Alert>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={csvLoading}
              sx={{ alignSelf: 'flex-start' }}
            >
              {csvLoading ? 'Processing...' : 'Choose CSV File'}
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCSVDialog(false)} disabled={csvLoading}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Link Template Dialog */}
      <Dialog open={openLinkDialog} onClose={() => setOpenLinkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Link Template to Action/Message</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Message/Quick Reply</InputLabel>
              <Select
                value={selectedMessage}
                label="Select Message/Quick Reply"
                onChange={(e) => setSelectedMessage(e.target.value)}
              >
                {availableMessages.map((msg) => (
                  <MenuItem key={`${msg.type}-${msg.id}`} value={msg.id}>
                    [{msg.type}] {msg.name?.substring(0, 50)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Select Button Action</InputLabel>
              <Select
                value={selectedButtonAction}
                label="Select Button Action"
                onChange={(e) => setSelectedButtonAction(e.target.value)}
              >
                <MenuItem value="QUICK_REPLY">💬 Quick Reply</MenuItem>
                <MenuItem value="OPEN_URL">🔗 Open Website URL</MenuItem>
                <MenuItem value="CALL_PHONE">📞 Call Phone Number</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLinkDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLink}>Save Link</Button>
        </DialogActions>
      </Dialog>

      {/* Templates List - Grid Table Layout */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          📋 Your Templates ({templates.length})
        </Typography>
        
        {templates.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed #cbd5e1', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No templates created yet. Start by creating your first template!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              disableElevation
            >
              Create First Template
            </Button>
          </Paper>
        ) : (
          <Box component={Paper} sx={{ mb: 3 }} elevation={0} border="1px solid #e0e0e0">
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 800 }}>
                {/* Header Row */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '60px 1fr 120px 150px 150px',
                  gap: 2,
                  p: 2,
                  backgroundColor: '#1976d2',
                  color: 'white',
                  fontWeight: 'bold',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>#</Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Template Name & Content</Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Type</Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Category</Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right', pr: 2 }}>Actions</Box>
                </Box>

                {/* Data Rows */}
                {templates.map((template, idx) => (
                  <Box key={template._id} sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '60px 1fr 120px 150px 150px',
                    gap: 2,
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    alignItems: 'center',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    width: '100%',
                    boxSizing: 'border-box',
                    '&:hover': { backgroundColor: '#f1f5f9' },
                  }}>
                    {/* Index */}
                    <Box sx={{ fontWeight: 'bold', color: '#1976d2' }}>{idx + 1}</Box>

                    {/* Name + Preview */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {template.content?.substring(0, 80)}...
                      </Typography>
                    </Box>

                    {/* Type */}
                    <Box>
                      <Chip 
                        label={template.type || 'TEXT'} 
                        size="small" 
                        color={getTypeColor(template.type || 'TEXT')}
                        variant="outlined"
                      />
                    </Box>

                    {/* Category */}
                    <Box>
                      <Chip 
                        label={template.category || 'CUSTOM'} 
                        size="small"
                        variant="filled"
                        sx={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}
                      />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => {
                            setEditingId(template._id);
                            setFormData({
                              name: template.name,
                              type: template.type,
                              content: template.content,
                              category: template.category,
                              keywords: template.keywords || '',
                              linkedMessageId: null,
                              linkedAction: null,
                              csvTemplates: []
                            });
                            setOpenDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Link Template">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenLinkDialog(template._id)}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteConfirmId(template._id)}
                        >
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
      </Box>

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
          Edit Template - {editingTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {editingTemplate && (
            <Stack spacing={3} mt={2}>
              <TextField
                label="Template Name"
                fullWidth
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingTemplate.category}
                  label="Category"
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                >
                  {['WELCOME', 'ORDER_CONFIRMATION', 'PRODUCT_RECOMMENDATION', 'DISCOUNT_OFFER', 'FEEDBACK_REQUEST', 'CUSTOM'].map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>

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
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingTemplate(null)}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSaveEditedTemplate}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Snackbar with Action */}
      {snackbar.open && snackbar.action === 'confirm_delete' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: '#fff3cd',
            borderLeft: '4px solid #ff9800',
            borderRadius: 1,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000
          }}
        >
          <Typography variant="body2" sx={{ flex: 1, color: '#000' }}>
            {snackbar.message}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleSnackbarAction}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      )}

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
    </Box>
  );
}
