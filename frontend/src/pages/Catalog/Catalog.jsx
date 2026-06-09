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
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';
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
function ProductImage({ src, name, category }) {
  const [error, setError] = useState(false);

  // SVG representation for jewelry categories
  const getCategoryIcon = () => {
    switch (category) {
      case 'RINGS':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#FFD700' }}>
            <circle cx="12" cy="14" r="6" />
            <path d="M12 2l3 3-3 3-3-3z" strokeLinejoin="round" />
          </svg>
        );
      case 'NECKLACES':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#FFD700' }}>
            <path d="M6 3c0 8 3 13 6 13s6-5 6-13" />
            <path d="M12 16v4M10 20h4" />
            <circle cx="12" cy="3" r="1" fill="currentColor" />
            <circle cx="6" cy="3" r="1" fill="currentColor" />
            <circle cx="18" cy="3" r="1" fill="currentColor" />
          </svg>
        );
      case 'BANGLES':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#FFD700' }}>
            <ellipse cx="12" cy="12" rx="9" ry="5" />
            <ellipse cx="12" cy="12" rx="6" ry="3.3" />
          </svg>
        );
      case 'EARRINGS':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#FFD700' }}>
            <path d="M8 5c0 3-1 6-1 9 0 2.5 2 4.5 5 4.5s5-2 5-4.5c0-3-1-6-1-9M12 3v2" />
            <circle cx="12" cy="18.5" r="1.5" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#FFD700' }}>
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

  // Resolve full backend URL if relative path
  const fullUrl = src && src.startsWith('/') ? `http://localhost:5000${src}` : src;

  if (error || !src) {
    return (
      <Box
        sx={{
          height: 200,
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
        <Typography variant="caption" sx={{ letterSpacing: '2px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', mt: 1 }}>
          {category}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 200, overflow: 'hidden', position: 'relative' }}>
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

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  // Handle Search Input Change with simple debouncer or trigger on enter/click
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchCatalog();
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 120, // Fetch all seeded items
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

  // Stats calculation
  const getCategoryCount = (cat) => {
    return items.filter(item => item.category === cat).length;
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      
      {/* Header section with Premium Gold/Metal accents */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StoreIcon sx={{ color: 'primary.main', fontSize: 36 }} />
            Jewelry Catalog
            <Chip 
              icon={<SparklesIcon sx={{ fontSize: '14px !important', color: '#B8860B !important' }} />}
              label="Premium Collections" 
              size="small" 
              sx={{ backgroundColor: 'rgba(218,165,32,0.12)', border: '1px solid rgba(218,165,32,0.3)', color: '#B8860B', fontWeight: 600 }}
            />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your exclusive collection of rings, necklaces, bangles, and earrings synced with the conversational AI.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disableElevation
          sx={{
            px: 3,
            py: 1.2,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px 0 rgba(170,124,17,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #e5c158 0%, #c59b27 100%)',
              boxShadow: '0 6px 20px 0 rgba(170,124,17,0.5)',
            }
          }}
        >
          Add Product
        </Button>
      </Box>

      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px' }}>
            <Avatar sx={{ bgcolor: 'rgba(218,165,32,0.1)', color: '#d4af37', width: 48, height: 48 }}>
              <InventoryIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Total Products</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalItems}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px' }}>
            <Avatar sx={{ bgcolor: 'rgba(30,144,255,0.1)', color: 'dodgerblue', width: 48, height: 48 }}>
              <CategoryIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Rings & Necklaces</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {getCategoryCount('RINGS') + getCategoryCount('NECKLACES')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px' }}>
            <Avatar sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', width: 48, height: 48 }}>
              <TrendIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Bangles & Earrings</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {getCategoryCount('BANGLES') + getCategoryCount('EARRINGS')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px' }}>
            <Avatar sx={{ bgcolor: 'rgba(233,30,99,0.1)', color: '#e91e63', width: 48, height: 48 }}>
              <SparklesIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Bespoke / Custom</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {getCategoryCount('CUSTOM') + getCategoryCount('OTHER')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and search bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px' }}>
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
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          onClick={fetchCatalog}
          sx={{ textTransform: 'none', px: 3, border: '1px solid rgba(0,0,0,0.15)', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}
        >
          Search
        </Button>
        <Box sx={{ borderLeft: '1px solid rgba(0,0,0,0.1)', height: 32, mx: 1, display: { xs: 'none', sm: 'block' } }} />
        
        {/* Category Horizontal Filter Chips */}
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5, maxWidth: '100%' }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              onClick={() => setSelectedCategory(cat.value)}
              variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
              color={selectedCategory === cat.value ? 'primary' : 'default'}
              sx={{
                fontWeight: selectedCategory === cat.value ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: selectedCategory === cat.value ? 'primary.main' : 'rgba(0,0,0,0.04)'
                }
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
          <CircularProgress size={50} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">Fetching collections...</Typography>
        </Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed rgba(0,0,0,0.15)', borderRadius: '12px' }}>
          <StoreIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No products found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
            There are no products matching your search or category filters. Try adding a new item or clearing your filter.
          </Typography>
          <Button variant="outlined" onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }} sx={{ textTransform: 'none' }}>
            Clear Filters
          </Button>
        </Paper>
      ) : (
        /* Grid of Product Cards */
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                    borderColor: 'rgba(212,175,55,0.4)',
                    '& .card-actions-hover': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                {/* Product Image Fallback component */}
                <ProductImage src={item.imageUrl} name={item.name} category={item.category} />

                {/* Card Info */}
                <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        fontSize: '10px',
                        fontWeight: 700,
                        height: 20,
                        backgroundColor: 
                          item.category === 'RINGS' ? 'rgba(156,39,176,0.08)' :
                          item.category === 'NECKLACES' ? 'rgba(33,150,243,0.08)' :
                          item.category === 'BANGLES' ? 'rgba(76,175,80,0.08)' :
                          item.category === 'EARRINGS' ? 'rgba(233,30,99,0.08)' : 'rgba(0,0,0,0.05)',
                        color: 
                          item.category === 'RINGS' ? '#9c27b0' :
                          item.category === 'NECKLACES' ? '#2196f3' :
                          item.category === 'BANGLES' ? '#4caf50' :
                          item.category === 'EARRINGS' ? '#e91e63' : '#666',
                        border: '1px solid currentColor'
                      }}
                    />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.1rem' }}
                    >
                      {formatINR(item.price)}
                    </Typography>
                  </Box>

                  <Typography 
                    variant="subtitle2" 
                    sx={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, mt: 0.5, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
                  >
                    {item.name}
                  </Typography>

                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: 1.4, flexGrow: 1 }}
                  >
                    {item.description}
                  </Typography>

                  {item.keywords && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.keywords.split(',').slice(0, 3).map((kw, idx) => (
                        <Chip
                          key={idx}
                          label={kw.trim()}
                          size="small"
                          sx={{ fontSize: '9px', height: 16, backgroundColor: 'rgba(0,0,0,0.03)', color: 'text.secondary' }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                {/* Hover Actions Bar */}
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
                    gap: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    p: 0.5,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  <Tooltip title="Edit Product">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: 'info.main', '&:hover': { bgcolor: 'rgba(2,136,209,0.08)' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton size="small" onClick={() => confirmDeleteItem(item._id)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CREATE & EDIT DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingId ? '✍️ Edit Catalog Item' : '✨ Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Product Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Royal Kundan Bangle"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
                  label="Price (INR ₹)"
                  required
                  type="number"
                  fullWidth
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
              label="Description"
              required
              multiline
              rows={4}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a stunning and detailed description of the jewelry item, certifying purity (e.g. BIS Hallmark 916), metal weight, design origin, and lifetime warranty details."
            />

            <TextField
              label="Keywords (Comma separated)"
              fullWidth
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="e.g. gold, ring, bridal, kundan, royal"
              helperText="Keywords are used by the AI to match items during conversation"
            />

            <TextField
              label="Image URL Path"
              fullWidth
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="e.g. /uploads/catalog/gold_diamond_ring.jpg"
              helperText="Optional. Leave blank to automatically use standard premium fallback"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained"
            disableElevation
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #e5c158 0%, #c59b27 100%)',
              }
            }}
          >
            Save Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>⚠️ Delete Catalog Item?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this jewelry item from the catalog? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained" disableElevation sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
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
