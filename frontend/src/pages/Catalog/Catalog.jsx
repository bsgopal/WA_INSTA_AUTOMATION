import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Tooltip, CircularProgress, InputAdornment, CardHeader, Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Storefront as StoreIcon,
  AutoAwesome as SparklesIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendIcon,
  Save as SaveIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';
import { API_ORIGIN } from '../../api/base';
import CustomSnackbar from '../../components/Snackbar';

// Categories options matching backend
const CATEGORIES = [
  { value: 'ALL', label: '✨ All Collections' },
  { value: 'RINGS', label: '💍 Rings' },
  { value: 'NECKLACES', label: '📿 Necklaces' },
  { value: 'BANGLES', label: '⭕ Bangles' },
  { value: 'EARRINGS', label: '💎 Earrings' },
  { value: 'CUSTOM', label: '🎨 Custom' },
  { value: 'OTHER', label: '📦 Other' }
];

// Helper to format currency in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Component to render product image with an elegant, premium fallback if it doesn't load
function ProductImage({ src, name, category, height = 200 }) {
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
          gap: 1,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid rgba(255,215,0,0.15)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none'
          }
        }}
      >
        {getCategoryIcon()}
        <Typography variant="caption" sx={{ letterSpacing: '2px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', mt: 0.5, fontSize: '0.7rem' }}>
          {category}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: height, overflow: 'hidden', position: 'relative' }}>
      <img
        src={fullUrl}
        alt={name}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.5s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
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
  
  // Dialog controls
  const [openDialog, setOpenDialog] = useState(false);
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

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchCatalog();
    }
  };

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

  const handleOpenDialog = (item = null) => {
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
    setOpenDialog(true);
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
      setOpenDialog(false);
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
      fetchCatalog();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete catalog item', severity: 'error' });
      console.error('Delete catalog item error:', error);
    }
  };

  const getCategoryCount = (cat) => {
    return items.filter(item => item.category === cat).length;
  };

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
            <StoreIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                Product Catalog & Collections
              </Typography>
              <Chip
                label="Digital Showcase"
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
                label={`Total: ${totalItems}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
              />
              <Chip
                label={`Rings & Necklaces: ${getCategoryCount('RINGS') + getCategoryCount('NECKLACES')}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}
              />
              <Chip
                label={`Bangles & Earrings: ${getCategoryCount('BANGLES') + getCategoryCount('EARRINGS')}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}
              />
              <Chip
                label={`Custom: ${getCategoryCount('CUSTOM') + getCategoryCount('OTHER')}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(233, 30, 99, 0.12)', color: '#be185d' }}
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
          Add Product
        </Button>
      </Card>

      {/* FILTER AND SEARCH BAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <TextField
          size="small"
          placeholder="Search items by name, description or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyPress}
          sx={{ flexGrow: 1, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          onClick={fetchCatalog}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            borderColor: '#0f172a',
            color: '#0f172a',
            borderRadius: '8px',
            '&:hover': { bgcolor: '#0f172a', color: '#ffffff' }
          }}
        >
          Search
        </Button>
        <Box sx={{ borderLeft: '1px solid #e2e8f0', height: 32, mx: 1, display: { xs: 'none', sm: 'block' } }} />
        
        {/* Category Horizontal Filter Chips */}
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5, maxWidth: '100%' }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              onClick={() => setSelectedCategory(cat.value)}
              sx={{
                fontWeight: selectedCategory === cat.value ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                bgcolor: selectedCategory === cat.value ? '#0f172a' : '#f1f5f9',
                color: selectedCategory === cat.value ? '#84cc16' : '#475569',
                border: `1px solid ${selectedCategory === cat.value ? '#0f172a' : '#cbd5e1'}`,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: selectedCategory === cat.value ? '#0f172a' : '#e2e8f0'
                }
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
          <CircularProgress size={50} sx={{ color: '#84cc16' }} />
          <Typography variant="body2" color="text.secondary">Fetching collections...</Typography>
        </Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '16px', bgcolor: '#ffffff' }}>
          <StoreIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a' }}>
            No jewelry products found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3} sx={{ maxWidth: 450, mx: 'auto' }}>
            Try clearing your search query, choosing another collection tab, or click below to add a new product to your showcase.
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
            Add New Product
          </Button>
        </Paper>
      ) : (
        /* PRODUCT GRID */
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                    borderColor: '#84cc16',
                    '& .card-actions-hover': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                {/* Product Image */}
                <ProductImage
                  src={item.imageUrl}
                  name={item.name}
                  category={item.category}
                />

                <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                      label={CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <VerifiedIcon sx={{ fontSize: 13 }} /> BIS 916
                    </Typography>
                  </Stack>

                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      color: '#0f172a',
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      mb: 1
                    }}
                  >
                    {item.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontSize: '0.8rem',
                      lineHeight: 1.5,
                      mb: 2,
                      flexGrow: 1
                    }}
                  >
                    {item.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      PRICE
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {formatINR(item.price)}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Floating Edit/Delete Action Overlay */}
                <Box
                  className="card-actions-hover"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    opacity: 0,
                    transform: 'translateY(-5px)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '8px',
                    p: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <Tooltip title="Edit Product">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: '#0f172a', '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton size="small" onClick={() => confirmDeleteItem(item._id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ELEVATED 2-COLUMN CREATE & EDIT DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
        {/* Obsidian Slate Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#0f172a',
            color: '#ffffff',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#84cc16',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SparklesIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {editingId ? 'Edit Product Item' : 'Add New Product'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Jewelry catalog item with AI search matching
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveItem}
              sx={{
                backgroundColor: '#84cc16',
                color: '#0f172a',
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: '8px',
                px: 2.5,
                '&:hover': { backgroundColor: '#65a30d' }
              }}
            >
              {editingId ? 'Update Product' : 'Save Product'}
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {/* 1-Click Product Presets */}
          {!editingId && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                ⚡ Quick Sample Presets (Click to Auto-fill):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {productPresets.map((preset, i) => (
                  <Chip
                    key={i}
                    label={preset.label}
                    onClick={() => handleApplyPreset(preset)}
                    clickable
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      '&:hover': { bgcolor: '#84cc16', color: '#0f172a', borderColor: '#84cc16' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Left Column: Form Controls */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Stack spacing={2}>
                  <TextField
                    label="Product Name *"
                    fullWidth
                    size="small"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Royal Kundan Bangle"
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
                          {CATEGORIES.filter(c => c.value !== 'ALL').map((cat) => (
                            <MenuItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Price (INR ₹) *"
                        type="number"
                        fullWidth
                        size="small"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g. 75000"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Detailed Description *"
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a detailed description of the jewelry item, certifying purity (BIS Hallmark 916), metal weight, design origin, and lifetime warranty details."
                  />

                  <TextField
                    label="Keywords (Comma separated)"
                    fullWidth
                    size="small"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="e.g. gold, ring, bridal, kundan, royal"
                    helperText="Keywords used by AI to find and recommend this product"
                  />

                  <TextField
                    label="Image URL Path (Optional)"
                    fullWidth
                    size="small"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="e.g. /uploads/catalog/gold_diamond_ring.jpg"
                    helperText="Leave empty to use automatic premium category fallback gradient"
                  />
                </Stack>
              </Paper>
            </Grid>

            {/* Right Column: Live WhatsApp Catalog Card Simulation */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  position: 'sticky',
                  top: 20
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    📱 WhatsApp Card Preview
                  </Typography>
                  <Chip
                    label="CUSTOMER VIEW"
                    size="small"
                    sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.65rem' }}
                  />
                </Box>

                {/* Simulated WhatsApp Product Card */}
                <Box
                  sx={{
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                  }}
                >
                  <ProductImage
                    src={formData.imageUrl}
                    name={formData.name || 'Product Image'}
                    category={formData.category}
                    height={160}
                  />

                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip
                        label={formData.category}
                        size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f1f5f9', color: '#0f172a' }}
                      />
                      <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <VerifiedIcon sx={{ fontSize: 12 }} /> BIS 916
                      </Typography>
                    </Stack>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                      {formData.name || 'Sample Product Name'}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, maxHeight: 40, overflow: 'hidden' }}>
                      {formData.description || 'Description will appear here as formatted in the product sheet...'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                        PRICE:
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                        ₹{formData.price ? Number(formData.price).toLocaleString('en-IN') : '0'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Simulated Action Button in WhatsApp */}
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      sx={{
                        bgcolor: '#25D366',
                        color: '#ffffff',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        '&:hover': { bgcolor: '#128C7E' }
                      }}
                    >
                      💬 Inquire on WhatsApp
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          ⚠️ Delete Catalog Item?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete this jewelry item from the catalog? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteItem}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
          >
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}
