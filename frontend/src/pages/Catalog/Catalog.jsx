import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Tooltip, CircularProgress, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, ToggleButtonGroup,
  ToggleButton, Divider, Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Storefront as StoreIcon,
  AutoAwesome as SparklesIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendIcon,
  Save as SaveIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ShoppingBag as ProductIcon,
  AttachMoney as MoneyIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Tag as TagIcon,
  GridView as GridViewIcon,
  TableRows as TableRowsIcon,
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import apiClient from '../../api/client';
import { API_ORIGIN } from '../../api/base';
import CustomSnackbar from '../../components/Snackbar';
import SplitDivider from '../../components/SplitDivider';

// Categories options matching backend
const CATEGORIES = [
  { value: 'ALL', label: '✨ All Collections', color: '#64748b' },
  { value: 'RINGS', label: '💍 Rings', color: '#f59e0b' },
  { value: 'NECKLACES', label: '📿 Necklaces', color: '#8b5cf6' },
  { value: 'BANGLES', label: '⭕ Bangles', color: '#ec4899' },
  { value: 'EARRINGS', label: '💎 Earrings', color: '#06b6d4' },
  { value: 'CUSTOM', label: '🎨 Custom', color: '#10b981' },
  { value: 'OTHER', label: '📦 Other', color: '#6b7280' }
];

// Helper to format currency in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
};

// Component to render product image with an elegant fallback if it doesn't load
function ProductImage({ src, name, category, height = 180 }) {
  const [error, setError] = useState(false);

  const getCategoryIcon = () => {
    switch (category) {
      case 'RINGS':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#FFD700' }}>
            <circle cx="12" cy="14" r="6" />
            <path d="M12 2l3 3-3 3-3-3z" strokeLinejoin="round" />
          </svg>
        );
      case 'NECKLACES':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#FFD700' }}>
            <path d="M6 3c0 8 3 13 6 13s6-5 6-13" />
            <path d="M12 16v4M10 20h4" />
            <circle cx="12" cy="3" r="1" fill="currentColor" />
            <circle cx="6" cy="3" r="1" fill="currentColor" />
            <circle cx="18" cy="3" r="1" fill="currentColor" />
          </svg>
        );
      case 'BANGLES':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#FFD700' }}>
            <ellipse cx="12" cy="12" rx="9" ry="5" />
            <ellipse cx="12" cy="12" rx="6" ry="3.3" />
          </svg>
        );
      case 'EARRINGS':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#FFD700' }}>
            <path d="M8 5c0 3-1 6-1 9 0 2.5 2 4.5 5 4.5s5-2 5-4.5c0-3-1-6-1-9M12 3v2" />
            <circle cx="12" cy="18.5" r="1.5" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#FFD700' }}>
            <path d="M12 3v18M3 12h18" />
            <path d="M12 3l9 9-9 9-9-9z" />
          </svg>
        );
    }
  };

  const getGradient = () => {
    switch (category) {
      case 'RINGS':
        return 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)';
      case 'NECKLACES':
        return 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
      case 'BANGLES':
        return 'linear-gradient(135deg, #141e30 0%, #243b55 100%)';
      case 'EARRINGS':
        return 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)';
      default:
        return 'linear-gradient(135deg, #16222f 0%, #363795 100%)';
    }
  };

  const fullUrl = src && src.startsWith('/') ? `${API_ORIGIN}${src}` : src;

  if (error || !src) {
    return (
      <Box
        sx={{
          height: height,
          background: getGradient(),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid rgba(255,215,0,0.15)',
        }}
      >
        {getCategoryIcon()}
        <Typography variant="caption" sx={{ letterSpacing: '1.5px', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', mt: 0.5, fontSize: '0.65rem' }}>
          {category}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: height, overflow: 'hidden', position: 'relative', bgcolor: '#f8fafc' }}>
      <img
        src={fullUrl}
        alt={name}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.4s ease'
        }}
      />
    </Box>
  );
}

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'TABLE'
  
  // Two-column panel controls
  const [openEditor, setOpenEditor] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [splitPercent, setSplitPercent] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const [activeSection, setActiveSection] = useState('sec-presets');
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Form parameters
  const [formData, setFormData] = useState({
    name: '',
    category: 'RINGS',
    price: '',
    description: '',
    keywords: '',
    imageUrl: ''
  });

  // 1-Click Product Presets
  const productPresets = [
    {
      label: '💍 Solitaire Ring',
      name: 'Princess Cut Solitaire Diamond Ring',
      category: 'RINGS',
      price: '85000',
      description: 'Certified 1.02 Carat VVS1 Clarity Natural Diamond set in 18K Hallmarked Yellow Gold. Hand-finished prong setting with lifetime buyback guarantee.',
      keywords: 'diamond, solitaire, ring, engagement, 18k gold, certified',
      imageUrl: ''
    },
    {
      label: '📿 Kundan Choker',
      name: 'Royal Heritage Kundan Choker Set',
      category: 'NECKLACES',
      price: '145000',
      description: 'Traditional Rajasthani Kundan bridal choker crafted in pure 22K Hallmarked Gold. Embellished with uncut Polki stones, natural pearls, and matching jhumkas.',
      keywords: 'kundan, choker, bridal, necklace, 22k gold, polki, royal',
      imageUrl: ''
    },
    {
      label: '⭕ Bridal Bangles',
      name: 'Traditional Filigree Kada Bangles (Pair)',
      category: 'BANGLES',
      price: '98000',
      description: 'Pair of handcrafted 22K BIS Hallmarked solid gold Kada bangles featuring intricate antique filigree and ruby floral motifs.',
      keywords: 'bangles, kada, bridal, gold, 22k, filigree, wedding',
      imageUrl: ''
    },
    {
      label: '💎 Emerald Drops',
      name: 'Colombian Emerald & Diamond Chandbali Earrings',
      category: 'EARRINGS',
      price: '62000',
      description: 'Stunning teardrop Colombian green emeralds accented by round brilliant cut diamonds in 18K Rose Gold for evening celebrations.',
      keywords: 'earrings, emerald, diamond, chandbali, rose gold, 18k',
      imageUrl: ''
    }
  ];

  // Dragging handler for SplitDivider
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newPercent = Math.min(Math.max((offsetX / rect.width) * 100, 25), 75);
      setSplitPercent(newPercent);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 120,
        category: selectedCategory === 'ALL' ? '' : selectedCategory
      };
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      const response = await apiClient.get('/catalog', { params });
      setItems(response.data.items || []);
      setTotalItems(response.data.pagination?.total || response.data.items?.length || 0);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch catalog items', severity: 'error' });
      console.error('Fetch catalog error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        description: item.description,
        keywords: item.keywords || '',
        imageUrl: item.imageUrl || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: 'RINGS',
        price: '',
        description: '',
        keywords: '',
        imageUrl: ''
      });
    }
    setOpenEditor(true);
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      name: preset.name,
      category: preset.category,
      price: preset.price,
      description: preset.description,
      keywords: preset.keywords,
      imageUrl: preset.imageUrl
    });
    setSnackbar({ open: true, message: `Loaded "${preset.label}" sample!`, severity: 'success' });
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim() || !formData.price || !formData.description.trim()) {
      setSnackbar({ open: true, message: 'Name, price and description are required', severity: 'warning' });
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setSnackbar({ open: true, message: 'Price must be a valid positive number', severity: 'warning' });
      return;
    }

    try {
      const payload = {
        ...formData,
        price: priceNum
      };

      if (editingId) {
        await apiClient.put(`/catalog/${editingId}`, payload);
        setSnackbar({ open: true, message: 'Catalog item updated successfully!', severity: 'success' });
      } else {
        await apiClient.post('/catalog', payload);
        setSnackbar({ open: true, message: 'Catalog item created successfully!', severity: 'success' });
      }
      setOpenEditor(false);
      fetchCatalog();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to save catalog item', 
        severity: 'error' 
      });
      console.error('Save catalog item error:', error);
    }
  };

  const confirmDeleteItem = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      await apiClient.delete(`/catalog/${deleteId}`);
      setSnackbar({ open: true, message: 'Catalog item deleted successfully!', severity: 'success' });
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      if (editingId === deleteId) {
        setOpenEditor(false);
      }
      fetchCatalog();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete catalog item', severity: 'error' });
      console.error('Delete catalog item error:', error);
    }
  };

  const scrollToAnchor = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box ref={containerRef} sx={{ display: 'flex', height: '100%', maxHeight: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* ── LEFT COLUMN: MASTER CATALOG BROWSER ── */}
      <Box
        sx={{
          width: openEditor ? (isMaximized ? '0%' : `${splitPercent}%`) : '100%',
          display: openEditor && isMaximized ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          flexShrink: 0,
          transition: isDragging ? 'none' : 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          pr: openEditor ? 0.5 : 0
        }}
      >
        {/* Pinned Top Bar / Stats & Search */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, flexShrink: 0, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}
              >
                <StoreIcon />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.2 }}>
                    Jewelry &amp; Product Catalog
                  </Typography>
                  <Chip
                    label={`${totalItems} Products`}
                    size="small"
                    sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  AI-indexed inventory &amp; WhatsApp product showcase catalog
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                sx={{ height: 32, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <ToggleButton value="GRID" title="Grid view">
                  <GridViewIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="TABLE" title="Table view">
                  <TableRowsIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>

              {!openEditor && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenEditor()}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 1.5,
                    px: 2,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                  }}
                >
                  Add New Product
                </Button>
              )}
            </Box>
          </Box>

          {/* Search bar & Category filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search jewelry by title, metal, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: '#f8fafc',
                    borderRadius: 1.5,
                    height: 36,
                    fontSize: '0.825rem',
                    '& fieldset': { borderColor: '#e2e8f0' }
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={fetchCatalog}
                sx={{ minWidth: 40, height: 36, borderColor: '#cbd5e1', color: '#475569', borderRadius: 1.5 }}
              >
                <RefreshIcon fontSize="small" />
              </Button>
            </Box>

            {/* Category Filter Chips */}
            <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { height: 4 } }}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    onClick={() => setSelectedCategory(cat.value)}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.725rem',
                      height: 26,
                      borderRadius: 1.5,
                      bgcolor: isSelected ? '#0f172a' : '#f1f5f9',
                      color: isSelected ? '#fbbf24' : '#475569',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid transparent',
                      '&:hover': { bgcolor: isSelected ? '#0f172a' : '#e2e8f0' }
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Scrollable Center Body */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
              <CircularProgress size={36} sx={{ color: '#f59e0b' }} />
            </Box>
          ) : items.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                border: '2px dashed #cbd5e1',
                borderRadius: 3,
                bgcolor: '#ffffff',
                mt: 2
              }}
            >
              <StoreIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                No Products Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2, maxWidth: 360, mx: 'auto' }}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'No products match your current search and filter criteria.'
                  : 'Get started by creating your first jewelry or showcase item for WhatsApp & Instagram catalog.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenEditor()}
                sx={{
                  bgcolor: '#84cc16',
                  color: '#0f172a',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                Add First Product
              </Button>
            </Paper>
          ) : viewMode === 'GRID' ? (
            <Grid container spacing={2}>
              {items.map((item) => {
                const isSelected = openEditor && editingId === item._id;
                return (
                  <Grid item xs={12} sm={openEditor ? 12 : 6} md={openEditor ? 6 : 4} lg={openEditor ? 6 : 3} key={item._id}>
                    <Card
                      elevation={0}
                      onClick={() => handleOpenEditor(item)}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2.5,
                        border: isSelected ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                        bgcolor: isSelected ? '#fffbeb' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px -4px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <ProductImage
                        src={item.imageUrl}
                        name={item.name}
                        category={item.category}
                        height={160}
                      />
                      <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3, flex: 1 }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              bgcolor: '#f1f5f9',
                              color: '#475569'
                            }}
                          />
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1.5,
                            fontSize: '0.725rem',
                            minHeight: 32
                          }}
                        >
                          {item.description}
                        </Typography>

                        <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', fontWeight: 700 }}>
                              PRICE
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                              {formatINR(item.price)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Edit Product">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditor(item)}
                                sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#fde68a' }, p: 0.6 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => confirmDeleteItem(item._id)}
                                sx={{ color: '#ef4444', bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' }, p: 0.6 }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#0f172a' }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}>PRODUCT</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}>CATEGORY</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}>PRICE</TableCell>
                    {!openEditor && <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}>KEYWORDS</TableCell>}
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => {
                    const isSelected = openEditor && editingId === item._id;
                    return (
                      <TableRow
                        key={item._id}
                        hover
                        onClick={() => handleOpenEditor(item)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected ? '#fffbeb' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                          borderLeft: isSelected ? '4px solid #f59e0b' : 'none'
                        }}
                      >
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }}>
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.2, fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                          {formatINR(item.price)}
                        </TableCell>
                        {!openEditor && (
                          <TableCell sx={{ py: 1.2, maxWidth: 200 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.keywords || '—'}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ py: 1.2 }} onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditor(item)}
                                sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, p: 0.6 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => confirmDeleteItem(item._id)}
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
      </Box>

      {/* ── DRAGGABLE DIVIDER ── */}
      {openEditor && !isMaximized && (
        <SplitDivider isDragging={isDragging} onMouseDown={() => setIsDragging(true)} />
      )}

      {/* ── RIGHT COLUMN: PRODUCT STUDIO (OBJECT PAGE) ── */}
      {openEditor && (
        <Box
          sx={{
            width: isMaximized ? '100%' : `${100 - splitPercent}%`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            bgcolor: '#ffffff',
            flexShrink: 0,
            borderLeft: isMaximized ? 'none' : '1px solid #e2e8f0',
            transition: isDragging ? 'none' : 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* 1. Pinned Header Bar */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#0f172a',
              color: '#ffffff',
              borderBottom: '2px solid #84cc16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: '#84cc16',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                <ProductIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }} noWrap>
                    {editingId ? 'Edit Product Item' : 'New Product Showcase'}
                  </Typography>
                  <Chip
                    label="PRODUCT STUDIO"
                    size="small"
                    sx={{ height: 18, fontSize: '0.625rem', fontWeight: 800, bgcolor: '#84cc16', color: '#0f172a' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }} noWrap>
                  {formData.name || 'Configure catalog product specs & AI keywords'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Button
                startIcon={<ArrowBackIcon fontSize="small" />}
                onClick={() => setOpenEditor(false)}
                size="small"
                variant="outlined"
                sx={{
                  color: '#ffffff',
                  borderColor: '#475569',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { borderColor: '#84cc16', bgcolor: '#1e293b' },
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  mr: 1
                }}
              >
                Back
              </Button>
              <Tooltip title={isMaximized ? "Restore view" : "Maximize"}>
                <IconButton
                  size="small"
                  onClick={() => setIsMaximized(!isMaximized)}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', bgcolor: '#1e293b' } }}
                >
                  {isMaximized ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setOpenEditor(false)}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', bgcolor: '#1e293b' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* 2. Anchor Fast Navigation Strip */}
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              flexShrink: 0,
              '::-webkit-scrollbar': { height: 3 }
            }}
          >
            {[
              { id: 'sec-presets', label: '⚡ 1-Click Presets' },
              { id: 'sec-details', label: '🏷️ Basic Info' },
              { id: 'sec-pricing', label: '💰 Pricing & Specs' },
              { id: 'sec-media', label: '🖼️ Media & Image' },
              { id: 'sec-preview', label: '📱 WhatsApp Preview' }
            ].map((tab) => (
              <Chip
                key={tab.id}
                label={tab.label}
                onClick={() => scrollToAnchor(tab.id)}
                size="small"
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.725rem',
                  height: 24,
                  bgcolor: activeSection === tab.id ? '#0f172a' : '#ffffff',
                  color: activeSection === tab.id ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1'
                }}
              />
            ))}
          </Box>

          {/* 3. Scrollable Center Form Body */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 2, sm: 2.5 }, bgcolor: '#f8fafc' }}>
            <Stack spacing={2.5}>
              
              {/* SECTION: 1-Click Presets */}
              <Paper id="sec-presets" elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SparklesIcon sx={{ fontSize: 18, color: '#f59e0b' }} /> 1-Click Sample Jewelry Presets
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                    AUTO-FILL FORM
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {productPresets.map((preset, i) => (
                    <Button
                      key={i}
                      variant="outlined"
                      size="small"
                      onClick={() => handleApplyPreset(preset)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderColor: '#e2e8f0',
                        color: '#0f172a',
                        bgcolor: '#f8fafc',
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: '#fef3c7', borderColor: '#fde68a' }
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </Box>
              </Paper>

              {/* SECTION: Basic Information */}
              <Paper id="sec-details" elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TagIcon sx={{ fontSize: 18, color: '#3b82f6' }} /> Basic Product Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Product Name / Title *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Princess Cut Solitaire Diamond Ring"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category *</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category *"
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                          <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="Detailed Product Description *"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Include materials, gold purity, carat weight, certifications..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="AI & Keyword Tags (Comma Separated)"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="e.g. diamond, engagement, solitaire, 18k gold, bridal"
                      helperText="Helps auto-responder and AI bots match customer inquiries to this product"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* SECTION: Pricing & Specifications */}
              <Paper id="sec-pricing" elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon sx={{ fontSize: 18, color: '#16a34a' }} /> Pricing &amp; Commercials
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Price in INR (₹) *"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.2, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                        FORMATTED PRICE DISPLAY
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#15803d' }}>
                        {formatINR(parseFloat(formData.price) || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* SECTION: Media & Image */}
              <Paper id="sec-media" elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ fontSize: 18, color: '#8b5cf6' }} /> Product Media &amp; Image URL
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Direct Image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/images/gold-ring.jpg"
                  helperText="Provide a high-resolution photo URL or leave empty to use category illustration"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ width: '100%', maxWidth: 260, mx: 'auto', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                  <ProductImage
                    src={formData.imageUrl}
                    name={formData.name || 'Sample Product'}
                    category={formData.category}
                    height={150}
                  />
                  <Box sx={{ p: 1, textAlign: 'center', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Live Image Preview
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* SECTION: WhatsApp Customer Live Preview */}
              <Paper id="sec-preview" elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WhatsAppIcon sx={{ fontSize: 18, color: '#22c55e' }} /> WhatsApp Interactive Card Preview
                </Typography>

                <Box
                  sx={{
                    maxWidth: 320,
                    mx: 'auto',
                    bgcolor: '#efeae2',
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid #d1d7db',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#ffffff' }}>
                    <ProductImage
                      src={formData.imageUrl}
                      name={formData.name || 'Jewelry Product'}
                      category={formData.category}
                      height={140}
                    />
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#111b21', mb: 0.5 }}>
                        {formData.name || 'Exquisite 22K Gold Item'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#667781', display: 'block', mb: 1, fontSize: '0.7rem' }}>
                        {formData.description || 'Certified handcrafted hallmark jewelry.'}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#00a884', mb: 1.5 }}>
                        {formatINR(parseFloat(formData.price) || 0)}
                      </Typography>

                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: '#00a884',
                          color: '#ffffff',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontSize: '0.75rem',
                          '&:hover': { bgcolor: '#008069' }
                        }}
                      >
                        Inquire on WhatsApp
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Paper>

            </Stack>
          </Box>

          {/* 4. Pinned Sticky Action Footer */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              flexShrink: 0
            }}
          >
            {editingId ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => confirmDeleteItem(editingId)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
              >
                Delete
              </Button>
            ) : (
              <Box />
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setOpenEditor(false)}
                sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#475569', borderRadius: 1.5 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveItem}
                sx={{
                  bgcolor: '#84cc16',
                  color: '#0f172a',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 2.5,
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                {editingId ? 'Update Product' : 'Save Product'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this product from the catalog? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteItem} variant="contained" color="error" sx={{ fontWeight: 800, borderRadius: 1.5 }}>
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notification */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}
