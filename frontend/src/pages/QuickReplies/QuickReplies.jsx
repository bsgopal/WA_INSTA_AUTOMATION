import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormGroup, FormControlLabel, Tooltip, Avatar, InputAdornment,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';

export default function QuickReplies() {
  const [quickReplies, setQuickReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'OTHER',
    shortcut: '',
    platforms: ['WHATSAPP', 'INSTAGRAM']
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const scrollRef = useRef(null);

  const categories = [
    { value: 'GREETING', label: '👋 Greeting', color: '#84cc16' },
    { value: 'INQUIRY', label: '❓ Inquiry', color: '#2563eb' },
    { value: 'PAYMENT', label: '💳 Payment', color: '#16a34a' },
    { value: 'DELIVERY', label: '🚚 Delivery', color: '#ea580c' },
    { value: 'COMPLAINT', label: '⚠️ Complaint', color: '#ef4444' },
    { value: 'FOLLOW_UP', label: '📞 Follow-up', color: '#9333ea' },
    { value: 'CLOSING', label: '👋 Closing', color: '#06b6d4' },
    { value: 'OTHER', label: '📝 Other', color: '#64748b' }
  ];

  const sellerPresets = [
    {
      label: '⚡ Price & Offers',
      title: 'Product Pricing & Current Offers',
      category: 'INQUIRY',
      shortcut: '/price',
      content: 'Hello! All our certified jewelry pieces come with BIS 916 Hallmark certification, lifetime buyback guarantee, and insured shipping. Today’s special: 5% extra off on all prepaid orders!'
    },
    {
      label: '🚚 Delivery Timeline',
      title: 'Express Shipping & Delivery',
      category: 'DELIVERY',
      shortcut: '/delivery',
      content: 'Standard delivery takes 3-5 business days via Blue Dart Express insured courier. You will receive an SMS and WhatsApp tracking notification the moment your parcel is dispatched!'
    },
    {
      label: '💳 Instant UPI Link',
      title: 'Instant UPI & Card Checkout',
      category: 'PAYMENT',
      shortcut: '/pay',
      content: 'You can complete your 100% secure payment via UPI (GPay/PhonePe/Paytm), Cards, or NetBanking: https://renic.store/pay. Please share a screenshot once payment is complete!'
    },
    {
      label: '📍 Store Visit',
      title: 'Showroom Location & Timings',
      category: 'INQUIRY',
      shortcut: '/store',
      content: 'Visit our flagship jewelry showroom Monday to Sunday, 10:30 AM - 8:30 PM. Address: Renic Flagship Store, High Street. We would be delighted to host you!'
    },
    {
      label: '👋 Welcome Greeting',
      title: 'Warm Welcome & Store Intro',
      category: 'GREETING',
      shortcut: '/hi',
      content: 'Namaste! Welcome to Renic Tech. We are thrilled to assist you with our handcrafted gold and diamond collections. How may we assist your jewelry search today?'
    }
  ];

  useEffect(() => {
    fetchQuickReplies();
  }, [categoryFilter]);

  const fetchQuickReplies = async () => {
    try {
      setLoading(true);
      const params = categoryFilter ? { category: categoryFilter } : {};
      const response = await apiClient.get('/quick-replies', { params });
      setQuickReplies(response.data || []);
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
        platforms: reply.platforms || ['WHATSAPP', 'INSTAGRAM']
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        category: 'GREETING',
        shortcut: '',
        platforms: ['WHATSAPP', 'INSTAGRAM']
      });
    }
    setOpenDialog(true);
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      category: preset.category,
      shortcut: preset.shortcut,
      content: preset.content
    }));
    setSnackbar({ open: true, message: `Loaded "${preset.label}" snippet!`, severity: 'success' });
  };

  const handleInsertToken = (token) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content} ${token}` : token
    }));
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
      if (editingId === deleteId) {
        setOpenDialog(false);
        setEditingId(null);
      }
      setDeleteId(null);
      fetchQuickReplies();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete quick reply', severity: 'error' });
      console.error('Failed to delete quick reply:', error);
    }
  };

  const handleCopyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setSnackbar({ open: true, message: 'Copied reply snippet to clipboard!', severity: 'success' });
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || { label: category, color: '#64748b' };
  };

  const totalCount = quickReplies.length;
  const shortcutsCount = quickReplies.filter(r => r.shortcut && r.shortcut.trim()).length;
  const totalUsage = quickReplies.reduce((acc, r) => acc + (r.usageCount || 0), 0);
  const categoriesInUse = new Set(quickReplies.map(r => r.category)).size;

  const filteredReplies = quickReplies.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchContent = (r.content || '').toLowerCase().includes(q);
      const matchShortcut = (r.shortcut || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchShortcut) return false;
    }
    return true;
  });

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      {/* SLEEK COMPACT HEADER BAR */}
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
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(132, 204, 22, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4d7c0f'
            }}
          >
            <FlashOnIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                Quick Replies
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
                label={`Total: ${totalCount}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
              />
              <Chip
                label={`Shortcuts: ${shortcutsCount}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}
              />
              <Chip
                label={`Categories: ${categoriesInUse}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(147, 51, 234, 0.12)', color: '#7e22ce' }}
              />
              <Chip
                label={`Uses: ${totalUsage.toLocaleString()}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}
              />
            </Stack>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => handleOpenDialog()}
          size="small"
          sx={{
            backgroundColor: '#84cc16',
            color: '#0f172a',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '0.825rem',
            borderRadius: '8px',
            px: 2,
            height: '34px',
            boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
            '&:hover': { backgroundColor: '#65a30d', color: '#ffffff' }
          }}
        >
          New Quick Reply
        </Button>
      </Card>

      {/* FILTER TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={openDialog ? 12 : 6}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by title, shortcut (e.g. /price), or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={openDialog ? 6 : 4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Filter by Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories ({quickReplies.length})</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={openDialog ? 6 : 2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Showing {filteredReplies.length} of {quickReplies.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* TWO-COLUMN MID-SPLIT LAYOUT CONTAINER */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: QUICK REPLIES LIST / TABLE */}
        <Box
          sx={{
            width: openDialog ? (isMaximized ? '0%' : { xs: '100%', lg: '44%', xl: '42%' }) : '100%',
            display: openDialog && isMaximized ? 'none' : 'block',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#84cc16' }} />
            </Box>
          ) : filteredReplies.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: '#ffffff' }}>
              <AutoAwesomeIcon sx={{ fontSize: 60, color: '#84cc16', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a' }}>
                No quick replies found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3, maxWidth: 450, mx: 'auto' }}>
                Create your first quick reply macro to speed up conversations and instantly answer customer FAQs.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: '#84cc16',
                  color: '#0f172a',
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: '8px',
                  px: 3,
                  '&:hover': { backgroundColor: '#65a30d' }
                }}
              >
                Create Quick Reply
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#0f172a' }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>TITLE &amp; SHORTCUT</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>CATEGORY</TableCell>
                    {!openDialog && <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>CONTENT PREVIEW</TableCell>}
                    {!openDialog && <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>USAGE</TableCell>}
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReplies.map((reply, idx) => {
                    const catInfo = getCategoryInfo(reply.category);
                    const isSelected = openDialog && editingId === reply._id;
                    return (
                      <TableRow
                        key={reply._id}
                        hover
                        onClick={() => handleOpenDialog(reply)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(132, 204, 22, 0.12)' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                          borderLeft: isSelected ? '4px solid #84cc16' : 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                            {reply.title}
                          </Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center" mt={0.5}>
                            {reply.shortcut && (
                              <Chip
                                label={reply.shortcut}
                                size="small"
                                sx={{
                                  bgcolor: '#0f172a',
                                  color: '#84cc16',
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  fontSize: '0.68rem',
                                  height: 18
                                }}
                              />
                            )}
                            {(reply.platforms || ['WHATSAPP']).map((plat) => (
                              <Chip
                                key={plat}
                                label={plat}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  bgcolor: plat === 'WHATSAPP' ? '#f0fdf4' : '#faf5ff',
                                  color: plat === 'WHATSAPP' ? '#16a34a' : '#9333ea',
                                  border: `1px solid ${plat === 'WHATSAPP' ? '#bbf7d0' : '#e9d5ff'}`
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            label={catInfo.label}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                              backgroundColor: `${catInfo.color}15`,
                              color: catInfo.color,
                              border: `1px solid ${catInfo.color}35`
                            }}
                          />
                        </TableCell>
                        {!openDialog && (
                          <TableCell sx={{ maxWidth: 320, py: 1.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.825rem'
                              }}
                            >
                              {reply.content}
                            </Typography>
                          </TableCell>
                        )}
                        {!openDialog && (
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={`${reply.usageCount || 0} hits`}
                              size="small"
                              sx={{
                                height: 20,
                                bgcolor: '#f1f5f9',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontSize: '0.7rem'
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ py: 1.5 }} onClick={e => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Copy to clipboard">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyToClipboard(reply.content)}
                                sx={{ color: '#16a34a', bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' }, p: 0.6 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(reply)}
                                sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, p: 0.6 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => confirmDeleteReply(reply._id)}
                                sx={{ color: '#ef4444', bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' }, p: 0.6 }}
                              >
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

        {/* RIGHT COLUMN: QUICK REPLY SAP DM OBJECT PAGE & LIVE SIMULATOR */}
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
            {/* Header Bar */}
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
                gap: 1.5
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
                  <FlashOnIcon />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                      {editingId ? (formData.title || 'Edit Quick Reply') : 'Create Quick Reply'}
                    </Typography>
                    {formData.shortcut && (
                      <Chip
                        label={formData.shortcut}
                        size="small"
                        sx={{ bgcolor: 'rgba(132, 204, 22, 0.2)', color: '#84cc16', fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Slash command macro for instant chat responses
                  </Typography>
                </Box>
              </Box>

              {/* Header Action Buttons */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={isMaximized ? "Restore split layout" : "Maximize view"}>
                  <IconButton
                    size="small"
                    onClick={() => setIsMaximized(!isMaximized)}
                    sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  >
                    {isMaximized ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveReply}
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
                  {editingId ? 'Update' : 'Save'}
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

            {/* Scrollable Form Body */}
            <Box sx={{ p: 2.5, flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <Stack spacing={2.5}>
                {/* 1-Click Seller Presets */}
                {!editingId && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      ⚡ 1-Click E-Commerce Presets:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {sellerPresets.map((preset, i) => (
                        <Chip
                          key={i}
                          label={preset.label}
                          onClick={() => handleApplyPreset(preset)}
                          clickable
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            bgcolor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            '&:hover': { bgcolor: '#84cc16', color: '#0f172a', borderColor: '#84cc16' }
                          }}
                        />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {/* Form Controls & WhatsApp Simulator Grid */}
                <Grid container spacing={2.5}>
                  {/* Form Inputs */}
                  <Grid item xs={12} md={7}>
                    <Stack spacing={2}>
                      <TextField
                        label="Reply Title *"
                        fullWidth
                        size="small"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Shipping & Delivery Timelines"
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
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
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Shortcut Trigger"
                            fullWidth
                            size="small"
                            value={formData.shortcut}
                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                            placeholder="e.g., /delivery"
                            helperText="Type this slash command to auto-expand"
                          />
                        </Grid>
                      </Grid>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5 }}>
                          Platforms:
                        </Typography>
                        <FormGroup row>
                          {['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'].map((platform) => (
                            <FormControlLabel
                              key={platform}
                              control={
                                <Checkbox
                                  size="small"
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
                                  sx={{ '&.Mui-checked': { color: '#84cc16' } }}
                                />
                              }
                              label={<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{platform.charAt(0) + platform.slice(1).toLowerCase()}</Typography>}
                            />
                          ))}
                        </FormGroup>
                      </Box>

                      {/* Variable tokens */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5 }}>
                          Insert Variable Token:
                        </Typography>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                          {['{{customer_name}}', '{{order_id}}', '{{product_name}}', '{{tracking_link}}'].map((tok) => (
                            <Chip
                              key={tok}
                              label={tok}
                              size="small"
                              onClick={() => handleInsertToken(tok)}
                              clickable
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                bgcolor: '#f1f5f9',
                                border: '1px solid #cbd5e1'
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      <TextField
                        label="Message Content *"
                        fullWidth
                        multiline
                        rows={4}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Enter the full response message..."
                      />
                    </Stack>
                  </Grid>

                  {/* Live WhatsApp Bubble Simulator */}
                  <Grid item xs={12} md={5}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        bgcolor: '#f8fafc',
                        position: 'sticky',
                        top: 10
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.825rem' }}>
                          📱 Live WhatsApp Simulator
                        </Typography>
                        <Chip
                          label="SIMULATOR"
                          size="small"
                          sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.625rem', height: 18 }}
                        />
                      </Box>

                      {/* WhatsApp Phone Mock */}
                      <Box
                        sx={{
                          borderRadius: '14px',
                          border: '2px solid #1e293b',
                          overflow: 'hidden',
                          bgcolor: '#efeae2',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                        }}
                      >
                        {/* WhatsApp Top Bar */}
                        <Box sx={{ bgcolor: '#075e54', p: 1, display: 'flex', alignItems: 'center', gap: 1, color: '#ffffff' }}>
                          <Avatar sx={{ width: 26, height: 26, bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.7rem' }}>
                            R
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.2 }}>
                              RENIC TECH Support
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.58rem' }}>
                              {formData.shortcut ? `Trigger: ${formData.shortcut}` : 'Instant macro reply'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Chat Area */}
                        <Box sx={{ p: 1.5, minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <Box sx={{ alignSelf: 'flex-end', maxWidth: '92%' }}>
                            <Box sx={{ bgcolor: '#d9fdd3', p: 1.25, borderRadius: '8px 8px 0px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                              <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                {formData.content || 'Type message content to see live WhatsApp preview here...'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#667781', fontSize: '0.58rem' }}>
                                  10:45 AM
                                </Typography>
                                <span style={{ color: '#53bdeb', fontSize: '0.7rem', lineHeight: 1 }}>✓✓</span>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {/* Test Copy Button */}
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<ContentCopyIcon fontSize="inherit" />}
                        onClick={() => handleCopyToClipboard(formData.content)}
                        disabled={!formData.content}
                        sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', bgcolor: '#ffffff', border: '1px solid #cbd5e1' }}
                      >
                        Copy Preview Text
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
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
                {editingId ? `Category: ${formData.category || 'GENERAL'}` : 'New Quick Reply Preset'}
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
                  onClick={handleSaveReply}
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
                  {submitting ? 'Saving...' : editingId ? 'Update Quick Reply' : 'Save & Publish'}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          ⚠️ Delete Quick Reply?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete this quick reply snippet? Agents will no longer be able to expand it using shortcuts.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteReply}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
          >
            Delete Reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
