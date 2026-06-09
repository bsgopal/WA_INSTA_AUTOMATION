import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Divider, FormControl, InputLabel,
  Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'TEXT',
    content: '',
    category: 'CUSTOM'
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

  useEffect(() => {
    fetchTemplates();
  }, []);

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

  const handleGenerateAI = async () => {
    try {
      setAiGenerating(true);
      const response = await apiClient.post('/templates/ai/generate', {
        prompt: aiPrompt,
        type: 'TEXT',
        tone: 'friendly',
        language: 'en'
      });

      console.log('AI Generated:', response.data);
      setFormData(prev => ({
        ...prev,
        content: response.data.content
      }));
      setOpenAIDialog(false);
      setAiPrompt('');
      setOpenDialog(true);
      setSnackbar({
        open: true,
        message: 'AI response draft generated! Complete fields to save.',
        severity: 'success'
      });
    } catch (error) {
      console.error('AI Generation failed:', error);
      setSnackbar({ open: true, message: 'AI Generation failed. Check API config.', severity: 'error' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'TEXT',
      content: '',
      category: 'CUSTOM'
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (template) => {
    setEditingId(template._id);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      category: template.category || 'CUSTOM'
    });
    setOpenDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.content) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await apiClient.put(`/templates/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Template updated successfully!',
          severity: 'success'
        });
      } else {
        await apiClient.post('/templates', formData);
        setSnackbar({
          open: true,
          message: 'Template created successfully!',
          severity: 'success'
        });
      }
      setTimeout(() => {
        setOpenDialog(false);
        setEditingId(null);
        setFormData({
          name: '',
          type: 'TEXT',
          content: '',
          category: 'CUSTOM'
        });
        fetchTemplates();
      }, 1500);
    } catch (error) {
      console.error('Failed to save template:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save template. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteTemplate = (templateId) => {
    setDeleteId(templateId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTemplate = async () => {
    try {
      await apiClient.delete(`/templates/${deleteId}`);
      setSnackbar({
        open: true,
        message: 'Template deleted successfully!',
        severity: 'success'
      });
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete template. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCopyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'success' });
  };

  const handlePreviewTemplate = (content) => {
    // Fill basic mock variables for preview
    let preview = content
      .replace(/{{firstName}}/g, 'Priya')
      .replace(/{{lastName}}/g, 'Sharma')
      .replace(/{{productName}}/g, '24K Gold Kundan Necklace')
      .replace(/{{price}}/g, '₹85,000')
      .replace(/{{loyaltyTier}}/g, 'GOLD');
    setPreviewContent(preview);
    setOpenPreviewDialog(true);
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
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setOpenAIDialog(true)}
          >
            AI Generate
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

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {templates.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No templates yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first template to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                disableElevation
              >
                Create Template
              </Button>
            </Paper>
          </Grid>
        ) : (
          templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template._id}>
              <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Chip
                      label={template.type}
                      size="small"
                      color={getTypeColor(template.type)}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {template.content}
                  </Typography>

                  {template.category && (
                    <Chip label={template.category} size="small" variant="outlined" />
                  )}
                </CardContent>

                <Divider />

                <CardActions>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handlePreviewTemplate(template.content)}
                    title="Preview Template"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleCopyToClipboard(template.content)}
                    title="Copy Content"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleOpenEditDialog(template)}
                    title="Edit Template"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => confirmDeleteTemplate(template._id)}
                    title="Delete Template"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Template Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>Create New Template</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <TextField
              label="Template Name *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Message"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="TEXT">Text</MenuItem>
                <MenuItem value="IMAGE">Image</MenuItem>
                <MenuItem value="VIDEO">Video</MenuItem>
                <MenuItem value="DOCUMENT">Document</MenuItem>
                <MenuItem value="INTERACTIVE">Interactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Content *"
              fullWidth
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter your message template here..."
            />
            <FormControl fullWidth>
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={handleSaveTemplate}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disableElevation onClick={handleDeleteTemplate}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Template Live Preview (Mock Customer Priya)</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e0e0e0', minHeight: 120 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>
              {previewContent}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPreviewDialog(false)} variant="contained" disableElevation>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      {/* AI Generate Dialog */}
      <Dialog open={openAIDialog} onClose={() => setOpenAIDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI Generate Template</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Describe what kind of message you want to create, and AI will generate it for you.
          </Typography>
          <TextField
            label="Describe your message"
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Create a friendly welcome message for new customers with a 10% discount offer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAIDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGenerateAI}
            disabled={!aiPrompt || aiGenerating}
            disableElevation
          >
            {aiGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
