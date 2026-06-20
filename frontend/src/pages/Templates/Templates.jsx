import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Divider, FormControl, InputLabel,
  Select, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import LinkIcon from '@mui/icons-material/Link';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
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
        <Stack direction="row" spacing={2}>
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

      {/* CSV Guidelines & Documentation */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f4f8', border: '1px solid #cbd5e1', borderRadius: 2 }} elevation={0}>
        <Stack spacing={3}>
          {/* Format Tabs */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
              📋 File Format Guidelines
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
              Learn how to properly format your CSV files before uploading
            </Typography>
          </Box>

          {/* CSV FORMAT */}
          <Paper sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
              📄 CSV Format (Recommended)
            </Typography>
            <Stack spacing={1.5} sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#1f2937', fontWeight: 600 }}>
                Header (Required): name,keywords,content,category
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {`Example:
"Welcome","hello,hi,greet","Hey! Welcome to our store 👋","GREETING"
"Product Info","price,cost,rates","We have necklaces from Rs.2000-5000","PRODUCTS"
"Multi-line","faq,help","Question?\n\nAnswer text\nWith multiple lines","FAQ"`}
              </Typography>
            </Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>✓ Rules:</Typography>
              <Typography variant="caption" sx={{ color: '#4b5563' }}>• Always quote text containing commas</Typography>
              <Typography variant="caption" sx={{ color: '#4b5563' }}>• Use \n for newlines inside quotes: "Line1\nLine2"</Typography>
              <Typography variant="caption" sx={{ color: '#4b5563' }}>• name and content are required; keywords and category are optional</Typography>
              <Typography variant="caption" sx={{ color: '#4b5563' }}>• Save as UTF-8 encoding</Typography>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

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
    </Box>
  );
}
