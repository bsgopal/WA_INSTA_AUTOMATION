import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormGroup, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';

export default function QuickReplies() {
  const [quickReplies, setQuickReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'OTHER',
    shortcut: '',
    platforms: ['WHATSAPP', 'INSTAGRAM']
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const categories = [
    { value: 'GREETING', label: '👋 Greeting' },
    { value: 'INQUIRY', label: '❓ Inquiry' },
    { value: 'PAYMENT', label: '💳 Payment' },
    { value: 'DELIVERY', label: '🚚 Delivery' },
    { value: 'COMPLAINT', label: '⚠️ Complaint' },
    { value: 'FOLLOW_UP', label: '📞 Follow-up' },
    { value: 'CLOSING', label: '👋 Closing' },
    { value: 'OTHER', label: '📝 Other' }
  ];

  useEffect(() => {
    fetchQuickReplies();
  }, [categoryFilter]);

  const fetchQuickReplies = async () => {
    try {
      setLoading(true);
      const params = categoryFilter ? { category: categoryFilter } : {};
      const response = await apiClient.get('/quick-replies', { params });
      setQuickReplies(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch quick replies', severity: 'error' });
      console.error('Failed to fetch quick replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (reply = null) => {
    if (reply) {
      setEditingId(reply._id);
      setFormData({
        title: reply.title,
        content: reply.content,
        category: reply.category,
        shortcut: reply.shortcut || '',
        platforms: reply.platforms
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        category: 'OTHER',
        shortcut: '',
        platforms: ['WHATSAPP', 'INSTAGRAM']
      });
    }
    setOpenDialog(true);
  };

  const handleSaveReply = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setSnackbar({ open: true, message: 'Title and content are required', severity: 'warning' });
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/quick-replies/${editingId}`, formData);
        setSnackbar({ open: true, message: 'Quick reply updated successfully!', severity: 'success' });
      } else {
        await apiClient.post('/quick-replies', formData);
        setSnackbar({ open: true, message: 'Quick reply created successfully!', severity: 'success' });
      }
      setOpenDialog(false);
      fetchQuickReplies();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to save quick reply', 
        severity: 'error' 
      });
      console.error('Failed to save quick reply:', error);
    }
  };

  const confirmDeleteReply = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteReply = async () => {
    try {
      await apiClient.delete(`/quick-replies/${deleteId}`);
      setSnackbar({ open: true, message: 'Quick reply deleted successfully!', severity: 'success' });
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchQuickReplies();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete quick reply', severity: 'error' });
      console.error('Failed to delete quick reply:', error);
    }
  };

  const handleCopyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'success' });
  };

  const getCategoryLabel = (category) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Quick Replies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage quick response templates for common customer inquiries
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disableElevation
        >
          New Quick Reply
        </Button>
      </Box>

      {/* Category Filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Filter by Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Quick Replies Table */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Content Preview</TableCell>
              <TableCell>Shortcut</TableCell>
              <TableCell align="right">Usage</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quickReplies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No quick replies yet. Create your first one!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              quickReplies.map((reply) => (
                <TableRow key={reply._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {reply.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={getCategoryLabel(reply.category)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: 300
                      }}
                    >
                      {reply.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {reply.shortcut ? (
                      <Chip label={reply.shortcut} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{reply.usageCount}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleCopyToClipboard(reply.content)}
                        title="Copy to clipboard"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(reply)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => confirmDeleteReply(reply._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Quick Reply' : 'Create New Quick Reply'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title *"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Welcome Message"
            />
            <TextField
              label="Content *"
              fullWidth
              multiline
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter the quick reply message..."
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Shortcut (Optional)"
              fullWidth
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
              placeholder="e.g., /welcome"
            />
            <FormControl fullWidth>
              <Typography variant="subtitle2" gutterBottom>
                Platforms
              </Typography>
              <FormGroup row>
                {['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'].map((platform) => (
                  <FormControlLabel
                    key={platform}
                    control={
                      <Checkbox
                        checked={formData.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              platforms: [...formData.platforms, platform]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              platforms: formData.platforms.filter(p => p !== platform)
                            });
                          }
                        }}
                      />
                    }
                    label={platform.charAt(0) + platform.slice(1).toLowerCase()}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={handleSaveReply}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Quick Reply</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this quick reply? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disableElevation onClick={handleDeleteReply}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
