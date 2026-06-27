import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Stack, Card, CardContent, Avatar, Pagination,
  FormControl, InputLabel, Select, Alert, Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import UploadIcon from '@mui/icons-material/Upload';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  const getDisplayName = (cust) => {
    if (!cust) return 'Unknown Customer';
    const firstName = (cust.firstName || '').trim();
    const lastName = (cust.lastName || '').trim();
    const phone = (cust.phone || '').trim();
    
    const isPlaceholder = firstName.toLowerCase().startsWith('customer') || 
                          firstName.includes('@lid') || 
                          lastName.includes('@lid') ||
                          firstName.startsWith('+') ||
                          firstName === phone;
                          
    if (!isPlaceholder && (firstName || lastName)) {
      return `${firstName} ${lastName}`.trim();
    }
    
    let cleaned = phone.replace(/@c\.us|@lid/g, '').replace(/\D/g, '');
    if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    return phone || 'Unknown Customer';
  };

  const getAvatarInitial = (cust) => {
    const name = getDisplayName(cust);
    if (name.startsWith('+')) {
      return name.replace('+', '').slice(0, 1);
    }
    return name.slice(0, 1).toUpperCase();
  };
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    language: 'en'
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Bulk message states
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [bulkChannel, setBulkChannel] = useState('whatsapp');
  const [bulkSending, setBulkSending] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    loyal: 0,
    new: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchTemplates();
  }, [page, searchTerm, selectedSegment]);

  const fetchTemplates = async () => {
    try {
      const res = await apiClient.get('/templates?limit=1000');
      setTemplates(res.data?.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSegment && { segment: selectedSegment })
      };

      const response = await apiClient.get('/customers', { params });
      setCustomers(response.data.customers);
      setTotalPages(response.data.pagination.pages);

      // Fetch stats
      const statsResponse = await apiClient.get('/customers/analytics/segments');
      const total = statsResponse.data.reduce((sum, seg) => sum + seg.count, 0);
      const vip = statsResponse.data.find(s => s._id === 'VIP')?.count || 0;
      const loyal = statsResponse.data.find(s => s._id === 'LOYAL')?.count || 0;
      const newCustomers = statsResponse.data.find(s => s._id === 'NEW')?.count || 0;

      setStats({ total, vip, loyal, new: newCustomers });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      language: 'en'
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (customer) => {
    setEditingId(customer._id);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone,
      whatsappNumber: customer.whatsappNumber || '',
      language: customer.language
    });
    setOpenDialog(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
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
        await apiClient.put(`/customers/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Customer updated successfully!',
          severity: 'success'
        });
      } else {
        await apiClient.post('/customers', formData);
        setSnackbar({
          open: true,
          message: 'Customer added successfully!',
          severity: 'success'
        });
      }
      setTimeout(() => {
        setOpenDialog(false);
        setEditingId(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          whatsappNumber: '',
          language: 'en'
        });
        fetchCustomers();
      }, 1500);
    } catch (error) {
      console.error('Failed to save customer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save customer. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteCustomer = (customerId) => {
    setDeleteId(customerId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCustomer = async () => {
    try {
      await apiClient.delete(`/customers/${deleteId}`);
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully!',
        severity: 'success'
      });
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete customer. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleBulkSend = async () => {
    if (!selectedTemplateId || !bulkChannel) {
      setSnackbar({ open: true, message: 'Please select a template and a channel', severity: 'warning' });
      return;
    }

    const template = templates.find(t => t._id === selectedTemplateId);
    if (!template) return;

    try {
      setBulkSending(true);
      const res = await apiClient.post('/messages/bulk-send', {
        customerIds: selectedCustomerIds,
        content: template.content,
        channel: bulkChannel
      });

      if (res.data?.success) {
        setSnackbar({
          open: true,
          message: `Bulk message job completed successfully! Sent: ${res.data.successCount}, Failed: ${res.data.failCount}`,
          severity: 'success'
        });
        setOpenBulkDialog(false);
        setSelectedCustomerIds([]);
      }
    } catch (err) {
      console.error('Bulk sending failed:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Bulk sending failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setBulkSending(false);
    }
  };

  const toggleSelectAllCustomers = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map(c => c._id));
    }
  };

  const toggleSelectCustomer = (customerId) => {
    if (selectedCustomerIds.includes(customerId)) {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
    } else {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      setSnackbar({ open: true, message: 'Please select a file to import', severity: 'warning' });
      return;
    }

    try {
      setImporting(true);
      const data = new FormData();
      data.append('file', csvFile);

      const response = await apiClient.post('/customers/import/csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSnackbar({
        open: true,
        message: `Import complete: ${response.data.imported} imported, ${response.data.skipped} skipped.`,
        severity: 'success'
      });
      setImportDialogOpen(false);
      setCsvFile(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to import CSV:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to import CSV.',
        severity: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  const getSegmentColor = (segment) => {
    const colors = {
      VIP: 'error',
      LOYAL: 'success',
      REGULAR: 'primary',
      AT_RISK: 'warning',
      INACTIVE: 'default',
      LOST: 'default',
      NEW: 'info'
    };
    return colors[segment] || 'default';
  };

  const getLoyaltyIcon = (tier) => {
    const icons = {
      DIAMOND: '💎',
      GOLD: '🥇',
      SILVER: '🥈',
      BRONZE: '🥉'
    };
    return icons[tier] || '⭐';
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your customer database and segments
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {selectedCustomerIds.length > 0 && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<MessageIcon />}
                onClick={() => {
                  setSelectedTemplateId('');
                  setBulkChannel('whatsapp');
                  setOpenBulkDialog(true);
                }}
                disableElevation
                sx={{ fontWeight: 600 }}
              >
                Bulk Message ({selectedCustomerIds.length})
              </Button>
              <Button
                variant="text"
                onClick={() => setSelectedCustomerIds([])}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Deselect All
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            disableElevation
          >
            Add Customer
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Customers
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: '50%' }}>
                  <PeopleIcon color="primary" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    VIP Customers
                  </Typography>
                  <Typography variant="h4" color="error.main">{stats.vip}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'error.50', p: 1.5, borderRadius: '50%' }}>
                  <StarIcon color="error" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Loyal Customers
                  </Typography>
                  <Typography variant="h4" color="success.main">{stats.loyal}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'success.50', p: 1.5, borderRadius: '50%' }}>
                  <TrendingUpIcon color="success" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    New Customers
                  </Typography>
                  <Typography variant="h4" color="info.main">{stats.new}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'info.50', p: 1.5, borderRadius: '50%' }}>
                  <AddIcon color="info" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search customers..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
          >
            Filter
          </Button>
        </Stack>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => { setSelectedSegment(''); setFilterAnchor(null); }}>
          All Segments
        </MenuItem>
        <MenuItem onClick={() => { setSelectedSegment('VIP'); setFilterAnchor(null); }}>
          VIP
        </MenuItem>
        <MenuItem onClick={() => { setSelectedSegment('LOYAL'); setFilterAnchor(null); }}>
          Loyal
        </MenuItem>
        <MenuItem onClick={() => { setSelectedSegment('REGULAR'); setFilterAnchor(null); }}>
          Regular
        </MenuItem>
        <MenuItem onClick={() => { setSelectedSegment('NEW'); setFilterAnchor(null); }}>
          New
        </MenuItem>
      </Menu>

      {/* Customers Table */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < customers.length}
                  checked={customers.length > 0 && selectedCustomerIds.length === customers.length}
                  onChange={toggleSelectAllCustomers}
                />
              </TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Loyalty</TableCell>
              <TableCell align="right">Total Spent</TableCell>
              <TableCell align="right">Purchases</TableCell>
              <TableCell>Language</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No customers found. Add your first customer to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id} hover selected={selectedCustomerIds.includes(customer._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCustomerIds.includes(customer._id)}
                      onChange={() => toggleSelectCustomer(customer._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getAvatarInitial(customer)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {getDisplayName(customer)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.email || 'No email'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{customer.phone}</Typography>
                    {customer.whatsappNumber && (
                      <Typography variant="caption" color="text.secondary">
                        WA: {customer.whatsappNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.rfmSegment}
                      size="small"
                      color={getSegmentColor(customer.rfmSegment)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">
                        {getLoyaltyIcon(customer.loyaltyTier)}
                      </Typography>
                      <Typography variant="caption">
                        {customer.loyaltyTier}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    ₹{customer.totalSpent?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell align="right">
                    {customer.totalPurchases || 0}
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.language.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate('/conversations', { state: { customerId: customer._id } })}
                        title="Chat with Customer"
                      >
                        <MessageIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenEditDialog(customer)}
                        title="Edit Customer"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => confirmDeleteCustomer(customer._id)}
                        title="Delete Customer"
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

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Add / Edit Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {editingId ? 'Edit Customer Details' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="First Name *"
              fullWidth
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
            />
            <TextField
              label="Last Name *"
              fullWidth
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
            <TextField
              label="Phone Number *"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
            />
            <TextField
              label="WhatsApp Number"
              fullWidth
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="+91 9876543210"
            />
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={formData.language}
                label="Language"
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
                <MenuItem value="ta">Tamil</MenuItem>
                <MenuItem value="te">Telugu</MenuItem>
                <MenuItem value="mr">Marathi</MenuItem>
                <MenuItem value="gu">Gujarati</MenuItem>
                <MenuItem value="kn">Kannada</MenuItem>
                <MenuItem value="ml">Malayalam</MenuItem>
                <MenuItem value="pa">Punjabi</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={handleSaveCustomer}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Import Customers from CSV</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV file to import customers. The CSV must contain at least a <b>phone</b>, <b>firstName</b>, and <b>lastName</b> columns. Other optional columns: <i>email</i>, <i>whatsappNumber</i>, <i>language</i>.
            </Typography>
            <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fafafa' }}>
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                style={{ display: 'none' }}
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
              <label htmlFor="csv-file-input">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />} sx={{ mb: 1 }}>
                  Choose CSV File
                </Button>
              </label>
              {csvFile && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 500 }}>
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            disabled={!csvFile || importing}
            onClick={handleImportCSV}
          >
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this customer? This action will remove the customer profile and their conversation logs.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disableElevation onClick={handleDeleteCustomer}>
            Delete Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Message Send Dialog */}
      <Dialog 
        open={openBulkDialog} 
        onClose={() => !bulkSending && setOpenBulkDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>💬 Send Bulk Template Message</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              You are sending a bulk message to <strong>{selectedCustomerIds.length}</strong> selected customer(s).
            </Alert>

            <FormControl fullWidth size="small">
              <InputLabel>Select Message Template</InputLabel>
              <Select
                value={selectedTemplateId}
                label="Select Message Template"
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={bulkSending}
              >
                {templates.map((tpl) => (
                  <MenuItem key={tpl._id} value={tpl._id}>
                    {tpl.name} ({tpl.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Channel</InputLabel>
              <Select
                value={bulkChannel}
                label="Channel"
                onChange={(e) => setBulkChannel(e.target.value)}
                disabled={bulkSending}
              >
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>

            {selectedTemplateId && (
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: 2 
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                  TEMPLATE CONTENT PREVIEW:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                  {templates.find(t => t._id === selectedTemplateId)?.content || ''}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenBulkDialog(false)} disabled={bulkSending} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            disableElevation
            disabled={bulkSending || !selectedTemplateId}
            onClick={handleBulkSend}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 5, px: 3 }}
          >
            {bulkSending ? 'Sending...' : 'Send Messages'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
