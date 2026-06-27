import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Link,
  Tooltip,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkIcon from '@mui/icons-material/Link';
import PhoneIcon from '@mui/icons-material/Phone';
import ListIcon from '@mui/icons-material/List';

/**
 * ListResponseBuilder Component
 * 
 * Features:
 * 1. Create list-format responses (not dropdown)
 * 2. Add/edit rows dynamically
 * 3. Row selection based on user input
 * 4. Button type actions (URL, Call, QuickReply, Custom)
 * 5. URL configuration with validation and preview
 * 6. WAHA integration check
 */

const ListResponseBuilder = ({ onSave, ruleName }) => {
  const [listItems, setListItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    title: '',
    description: '',
    rowNumber: '',
    responseText: '',
    linkedQuickReplyId: null,
    buttonType: 'QUICK_REPLY',
    buttonValue: '',
  });
  const [quickReplies, setQuickReplies] = useState([]);
  const [loadingQuickReplies, setLoadingQuickReplies] = useState(false);
  const [wahaStatus, setWahaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlPreview, setUrlPreview] = useState('');

  // Check WAHA server status on mount
  useEffect(() => {
    checkWahaStatus();
    fetchQuickReplies();
  }, []);

  const checkWahaStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/waha/status');
      const data = await response.json();
      setWahaStatus(data.status === 'running' ? 'running' : 'offline');
    } catch (error) {
      console.log('WAHA status check failed:', error.message);
      setWahaStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickReplies = async () => {
    try {
      setLoadingQuickReplies(true);
      const response = await fetch('/api/quick-replies');
      const data = await response.json();
      setQuickReplies(data.data || data || []);
    } catch (error) {
      console.log('Failed to fetch quick replies:', error.message);
      setQuickReplies([]);
    } finally {
      setLoadingQuickReplies(false);
    }
  };

  // Validate and bind URL
  const validateAndBindUrl = (url) => {
    try {
      // Check if URL is valid
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      setUrlPreview(urlObj.href);
      setCurrentItem({
        ...currentItem,
        buttonValue: urlObj.href
      });
      return true;
    } catch (error) {
      setUrlPreview('');
      alert('Invalid URL. Please enter a valid URL.');
      return false;
    }
  };

  const handleAddRow = () => {
    setEditingIndex(null);
    setCurrentItem({
      title: '',
      description: '',
      rowNumber: '',
      responseText: '',
      linkedQuickReplyId: null,
      buttonType: 'QUICK_REPLY',
      buttonValue: '',
    });
    setUrlPreview('');
    setShowEditDialog(true);
  };

  const handleEditRow = (index) => {
    setEditingIndex(index);
    setCurrentItem({ ...listItems[index] });
    if (listItems[index].buttonType === 'OPEN_URL') {
      setUrlPreview(listItems[index].buttonValue);
    }
    setShowEditDialog(true);
  };

  const handleDeleteRow = (index) => {
    const newItems = listItems.filter((_, i) => i !== index);
    setListItems(newItems);
  };

  const handleSaveItem = () => {
    // Validation
    if (!currentItem.title.trim()) {
      alert('Title is required');
      return;
    }

    if (!currentItem.rowNumber || currentItem.rowNumber <= 0) {
      alert('Row number is required and must be greater than 0');
      return;
    }

    // Check if either responseText or linkedQuickReplyId is set
    if (!currentItem.responseText.trim() && !currentItem.linkedQuickReplyId) {
      alert('Either response text or a linked quick reply is required');
      return;
    }

    // Validate button value based on button type
    if (currentItem.buttonType === 'OPEN_URL') {
      if (!currentItem.buttonValue.trim()) {
        alert('URL is required');
        return;
      }
      if (!currentItem.buttonValue.startsWith('http')) {
        alert('URL must start with http or https');
        return;
      }
    }

    if (currentItem.buttonType === 'CALL_PHONE') {
      if (!currentItem.buttonValue.trim()) {
        alert('Phone number is required');
        return;
      }
      if (!currentItem.buttonValue.match(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)) {
        alert('Invalid phone number format');
        return;
      }
    }

    // Add or update item
    if (editingIndex !== null) {
      const newItems = [...listItems];
      newItems[editingIndex] = currentItem;
      setListItems(newItems);
    } else {
      setListItems([...listItems, currentItem]);
    }

    setShowEditDialog(false);
  };

  const handleButtonTypeChange = (type) => {
    setCurrentItem({
      ...currentItem,
      buttonType: type,
      buttonValue: ''
    });
    setUrlPreview('');
  };

  const getButtonTypeLabel = (type) => {
    const labels = {
      'QUICK_REPLY': '⚡ Quick Reply',
      'OPEN_URL': '🔗 Open URL',
      'CALL_PHONE': '☎️ Call Phone',
      'CUSTOM_TRIGGER': '🎯 Custom Trigger'
    };
    return labels[type] || type;
  };

  const getButtonTypeIcon = (type) => {
    switch (type) {
      case 'OPEN_URL':
        return <LinkIcon />;
      case 'CALL_PHONE':
        return <PhoneIcon />;
      default:
        return <ListIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* WAHA Status Alert */}
      <Alert
        severity={wahaStatus === 'running' ? 'success' : 'warning'}
        sx={{ mb: 3 }}
      >
        {wahaStatus === 'running' ? (
          '✅ WAHA Server is Running - Ready to send responses'
        ) : (
          '⚠️ WAHA Server is Offline - Please start WAHA server to enable message sending'
        )}
        <Button size="small" onClick={checkWahaStatus} sx={{ ml: 2 }}>
          {loading ? <CircularProgress size={20} /> : 'Refresh'}
        </Button>
      </Alert>

      {/* List Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          📋 List Format Response - {ruleName}
        </Typography>
        <Box display="flex" gap={1}>
          {listItems.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => setShowPreviewDialog(true)}
              sx={{ borderColor: '#4ECDC4', color: '#4ECDC4' }}
            >
              Preview
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            sx={{ backgroundColor: '#4ECDC4' }}
          >
            Add Row
          </Button>
        </Box>
      </Box>

      {/* List Items Table - Simplified */}
      {listItems.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#4ECDC4' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Message Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Select by typing</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Button</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItems.map((item, index) => (
                <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '40px' }}>{item.rowNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: '600' }}>
                      {item.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Type "${item.rowNumber}"`}
                      size="small" 
                      variant="outlined"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getButtonTypeIcon(item.buttonType)}
                      <Typography variant="caption">
                        {getButtonTypeLabel(item.buttonType)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRow(index)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(index)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No rows added yet. Click "Add Row" to create your first message.
        </Alert>
      )}

      {/* Simple List Preview - No Complex Preview */}

      {/* Save Button */}
      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={() => onSave(listItems)}
          disabled={listItems.length === 0}
          sx={{ backgroundColor: '#4ECDC4' }}
        >
          Save List Response
        </Button>
        <Button variant="outlined">
          Cancel
        </Button>
      </Box>

      {/* Edit Dialog - Full Width */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: '90%',
            maxWidth: '800px'
          }
        }}
      >
        <DialogTitle>
          {editingIndex !== null ? 'Edit Row' : 'Add New Row'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 2 }}>
            {/* Left Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* 1. Message Title */}
              <TextField
                fullWidth
                label="1. Message Title"
                placeholder="e.g., Gold Rates, Call Shop"
                value={currentItem.title}
                onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                helperText="Short name for this message"
                size="small"
              />

              {/* 2. Select by Typing (Row Number) */}
              <TextField
                fullWidth
                label="2. User types this number"
                placeholder="e.g., 1, 2, 3"
                type="number"
                inputProps={{ min: 1 }}
                value={currentItem.rowNumber}
                onChange={(e) => setCurrentItem({ ...currentItem, rowNumber: parseInt(e.target.value) || '' })}
                helperText="When user types this number in chat"
                size="small"
              />

              {/* 3. Link Quick Reply or Write Message */}
              <FormControl fullWidth size="small">
                <InputLabel>3. Use Quick Reply or Custom?</InputLabel>
                <Select
                  value={currentItem.linkedQuickReplyId ? 'quickreply' : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'quickreply') {
                      setCurrentItem({ ...currentItem, linkedQuickReplyId: null });
                    }
                  }}
                  label="3. Use Quick Reply or Custom?"
                >
                  <MenuItem value="custom">✍️ Write Custom</MenuItem>
                  <MenuItem value="quickreply">📎 Use Quick Reply</MenuItem>
                </Select>
              </FormControl>

              {/* Quick Reply Selector */}
              {currentItem.linkedQuickReplyId !== null && (
                <FormControl fullWidth size="small">
                  <InputLabel>Select Quick Reply</InputLabel>
                  <Select
                    value={currentItem.linkedQuickReplyId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedReply = quickReplies.find(qr => qr._id === selectedId);
                      setCurrentItem({
                        ...currentItem,
                        linkedQuickReplyId: selectedId || null,
                        responseText: selectedReply ? selectedReply.content : currentItem.responseText
                      });
                    }}
                    label="Select Quick Reply"
                  >
                    <MenuItem value="">-- Select --</MenuItem>
                    {quickReplies.map((qr) => (
                      <MenuItem key={qr._id} value={qr._id}>
                        📝 {qr.name || 'Unnamed'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Right Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Custom Message Text */}
              {currentItem.linkedQuickReplyId === null && (
                <TextField
                  fullWidth
                  label="4. Your Response Message"
                  placeholder="Type the message here..."
                  value={currentItem.responseText}
                  onChange={(e) => setCurrentItem({ ...currentItem, responseText: e.target.value })}
                  multiline
                  rows={4}
                  helperText="Use {{customer_name}}, {{gold_rate_22k}}, etc."
                  size="small"
                />
              )}

              {/* 5. Add a Button (Optional) */}
              <FormControl fullWidth size="small">
                <InputLabel>5. Add Button (Optional)</InputLabel>
                <Select
                  value={currentItem.buttonType}
                  onChange={(e) => handleButtonTypeChange(e.target.value)}
                  label="5. Add Button"
                >
                  <MenuItem value="QUICK_REPLY">⚡ Quick Reply</MenuItem>
                  <MenuItem value="OPEN_URL">🔗 Open Link</MenuItem>
                  <MenuItem value="CALL_PHONE">☎️ Call Phone</MenuItem>
                  <MenuItem value="CUSTOM_TRIGGER">🎯 Custom Action</MenuItem>
                </Select>
              </FormControl>

              {/* Button Value - OPEN_URL */}
              {currentItem.buttonType === 'OPEN_URL' && (
                <Box>
                  <TextField
                    fullWidth
                    label="Website Link"
                    placeholder="https://example.com"
                    value={currentItem.buttonValue}
                    onChange={(e) => setCurrentItem({ ...currentItem, buttonValue: e.target.value })}
                    onBlur={(e) => validateAndBindUrl(e.target.value)}
                    size="small"
                  />
                  {urlPreview && (
                    <Typography variant="caption" sx={{ color: '#4ECDC4', display: 'block', mt: 0.5 }}>
                      ✓ Valid
                    </Typography>
                  )}
                </Box>
              )}

              {/* Button Value - CALL_PHONE */}
              {currentItem.buttonType === 'CALL_PHONE' && (
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  value={currentItem.buttonValue}
                  onChange={(e) => setCurrentItem({ ...currentItem, buttonValue: e.target.value })}
                  size="small"
                />
              )}

              {/* Button Value - QUICK_REPLY */}
              {currentItem.buttonType === 'QUICK_REPLY' && (
                <TextField
                  fullWidth
                  label="Button Text"
                  placeholder="e.g., OK, Send Me"
                  value={currentItem.buttonValue}
                  onChange={(e) => setCurrentItem({ ...currentItem, buttonValue: e.target.value })}
                  size="small"
                />
              )}

              {/* Button Value - CUSTOM_TRIGGER */}
              {currentItem.buttonType === 'CUSTOM_TRIGGER' && (
                <TextField
                  fullWidth
                  label="Trigger Name"
                  placeholder="e.g., notify_admin"
                  value={currentItem.buttonValue}
                  onChange={(e) => setCurrentItem({ ...currentItem, buttonValue: e.target.value })}
                  size="small"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            sx={{ backgroundColor: '#4ECDC4' }}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Row
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog Modal */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          📱 List Preview
          <IconButton
            onClick={() => setShowPreviewDialog(false)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
            {listItems.map((item, index) => (
              <Card key={index} sx={{ backgroundColor: 'white', border: '2px solid #4ECDC4' }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Row Number Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 35,
                        height: 35,
                        borderRadius: '50%',
                        backgroundColor: '#4ECDC4',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {item.rowNumber}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.8 }}>
                        {item.description && item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={getButtonTypeIcon(item.buttonType)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          {getButtonTypeLabel(item.buttonType)}
                        </Button>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Type <strong>{item.rowNumber}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListResponseBuilder;
