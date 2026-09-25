import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, Avatar, CircularProgress, Grid,
  FormControl, InputLabel, Select, Alert, Checkbox, Pagination, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import UploadIcon from '@mui/icons-material/Upload';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';
import { useBackgroundMessaging } from '../../context/BackgroundMessagingContext';

export default function Customers() {
  const navigate = useNavigate();
  const { startBackgroundJob, showTopToast } = useBackgroundMessaging();
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
  const [hasMore, setHasMore] = useState(true);
  const gridRef = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState('');

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
    setSelectedCustomerIds([]);
    setSelectAllAcrossPages(false);
  };

  const handleSegmentChange = (event) => {
    setSelectedSegment(event.target.value);
    setPage(1);
    setSelectedCustomerIds([]);
    setSelectAllAcrossPages(false);
  };
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    language: 'en',
    rfmSegment: 'NEW'
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Bulk message states
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
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

  const selectedCount = selectAllAcrossPages ? stats.total : selectedCustomerIds.length;

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(selectedSegment && { segment: selectedSegment })
      };

      const response = await apiClient.get('/customers', { params });
      const list = response.data.customers;
      setCustomers(list);
      setTotalPages(response.data.pagination.pages);
      setHasMore(page < response.data.pagination.pages);

      if (page === 1) {
        const statsResponse = await apiClient.get('/customers/analytics/segments');
        const total = statsResponse.data.reduce((sum, seg) => sum + seg.count, 0);
        const vip = statsResponse.data.find(s => s._id === 'VIP')?.count || 0;
        const loyal = statsResponse.data.find(s => s._id === 'LOYAL')?.count || 0;
        const newCustomers = statsResponse.data.find(s => s._id === 'NEW')?.count || 0;

        setStats({ total, vip, loyal, new: newCustomers });
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    fetchCustomers();
    fetchTemplates();
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
    if (page === 1) {
      setSelectedCustomerIds([]);
      setSelectAllAcrossPages(false);
    }
  }, [page, debouncedSearchTerm, selectedSegment]);


  const handleOpenAddDialog = () => {
    setEditingId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      language: 'en',
      rfmSegment: 'NEW'
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
      language: customer.language || 'en',
      rfmSegment: customer.rfmSegment || 'NEW'
    });
    setOpenDialog(true);
  };

  const handleBulkUpdateStatus = async (status) => {
    setStatusMenuAnchor(null);
    try {
      const response = await apiClient.post('/customers/bulk-update-status', {
        customerIds: selectAllAcrossPages ? [] : selectedCustomerIds,
        rfmSegment: status,
        updateAll: selectAllAcrossPages
      });
      setSnackbar({
        open: true,
        message: response.data.message || `Customers status updated to ${status}!`,
        severity: 'success'
      });
      setSelectedCustomerIds([]);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to bulk update customer status:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update customer status.',
        severity: 'error'
      });
    }
  };

  const handleSaveCustomer = async () => {
    const rawPhone = (formData.phone || '').trim();
    const rawWhatsapp = (formData.whatsappNumber || '').trim();
    const effectivePhone = rawPhone || rawWhatsapp;
    const effectiveWhatsapp = rawWhatsapp || rawPhone;

    if (!formData.firstName?.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter customer First Name',
        severity: 'warning'
      });
      return;
    }

    if (!effectivePhone) {
      setSnackbar({
        open: true,
        message: 'Please enter a Phone Number or WhatsApp Number',
        severity: 'warning'
      });
      return;
    }

    const payload = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: (formData.lastName || '').trim(),
      email: (formData.email || '').trim() || undefined,
      phone: effectivePhone,
      whatsappNumber: effectiveWhatsapp,
      language: formData.language || 'en'
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await apiClient.put(`/customers/${editingId}`, payload);
        setSnackbar({
          open: true,
          message: 'Customer updated successfully!',
          severity: 'success'
        });
      } else {
        await apiClient.post('/customers', payload);
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
          language: 'en',
          rfmSegment: 'NEW'
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

  const handleBulkDeleteCustomers = async () => {
    try {
      const response = await apiClient.post('/customers/bulk-delete', {
        customerIds: selectAllAcrossPages ? [] : selectedCustomerIds,
        deleteAll: selectAllAcrossPages
      });
      setSnackbar({
        open: true,
        message: response.data.message || 'Selected customers deleted successfully!',
        severity: 'success'
      });
      setBulkDeleteConfirmOpen(false);
      setSelectedCustomerIds([]);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to bulk delete customers:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete selected customers. Please try again.',
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

    const count = selectAllAcrossPages ? (totalCustomersCount || customers.length) : selectedCustomerIds.length;
    const targetCustomerIds = selectAllAcrossPages ? [] : [...selectedCustomerIds];
    const sendAll = selectAllAcrossPages;

    setOpenBulkDialog(false);
    setSelectedCustomerIds([]);

    startBackgroundJob({
      title: `Bulk Message (${template.name})`,
      total: count || 1,
      taskFn: async (updateProgress) => {
        updateProgress(0, 0, `Broadcasting "${template.name}" to ${count} recipient(s)...`);
        const res = await apiClient.post('/messages/bulk-send', {
          customerIds: targetCustomerIds,
          sendToAll: sendAll,
          content: template.content,
          channel: bulkChannel
        });

        const successCount = res.data?.successCount ?? count;
        const failCount = res.data?.failCount ?? 0;
        updateProgress(successCount, failCount, `Finished: ${successCount} sent, ${failCount} failed`);

        return {
          sentCount: successCount,
          failCount: failCount,
          data: res.data
        };
      },
      onComplete: (res) => {
        fetchCustomers();
      }
    });
  };

  const toggleSelectAllCustomers = () => {
    if (selectAllAcrossPages || selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
      setSelectAllAcrossPages(false);
    } else {
      setSelectedCustomerIds(customers.map(c => c._id));
      setSelectAllAcrossPages(false);
    }
  };

  const toggleSelectCustomer = (customerId) => {
    if (selectAllAcrossPages) {
      setSelectAllAcrossPages(false);
      setSelectedCustomerIds(customers.filter(c => c._id !== customerId).map(c => c._id));
      return;
    }

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
      setImportErrors([]);
      const data = new FormData();
      data.append('file', csvFile);

      const response = await apiClient.post('/customers/import/csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.errors > 0) {
        setImportErrors(response.data.errorDetails);
        setSnackbar({
          open: true,
          message: `Import finished with some errors. ${response.data.imported} imported, ${response.data.skipped} skipped, ${response.data.errors} failed validation.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Import complete: ${response.data.imported} imported, ${response.data.skipped} skipped.`,
          severity: 'success'
        });
        setImportDialogOpen(false);
        setCsvFile(null);
        setImportErrors([]);
      }
      fetchCustomers();
    } catch (error) {
      console.error('Failed to import file:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to import file.',
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

  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      {/* SAP dialog-style header: title + search + actions */}
      <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ mr: 'auto', display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
            Customer Master
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {stats.total.toLocaleString()} records
            {selectedCustomerIds.length > 0 && ` · ${selectAllAcrossPages ? 'all' : selectedCustomerIds.length} selected`}
          </Typography>
        </Box>
        <TextField
          placeholder="Search customers..."
          size="small"
          value={searchTerm}
          onChange={handleSearchTermChange}
          sx={{ width: 240, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              )
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={selectedSegment}
            onChange={handleSegmentChange}
            displayEmpty
            sx={{ fontSize: '0.8125rem' }}
          >
            <MenuItem value="">All Segments</MenuItem>
            <MenuItem value="VIP">VIP</MenuItem>
            <MenuItem value="LOYAL">Loyal</MenuItem>
            <MenuItem value="REGULAR">Regular</MenuItem>
            <MenuItem value="NEW">New</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          size="small"
          onClick={() => {
            setImportDialogOpen(true);
            setImportErrors([]);
            setCsvFile(null);
          }}
          sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', whiteSpace: 'nowrap', height: '32px', borderRadius: '6px' }}
        >
          Import Excel/CSV
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={handleOpenAddDialog}
          disableElevation
          sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', whiteSpace: 'nowrap', height: '32px', borderRadius: '6px' }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Compact status strip - always visible, no page scroll */}
      <Box sx={{ px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
        {[
          { label: 'Total Customers', value: stats.total, color: 'primary.main', icon: <PeopleIcon /> },
          { label: 'VIP', value: stats.vip, color: 'error.main', icon: <StarIcon /> },
          { label: 'Loyal', value: stats.loyal, color: 'success.main', icon: <TrendingUpIcon /> },
          { label: 'New', value: stats.new, color: 'info.main', icon: <AddIcon /> }
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, color: item.color }}>
                {item.value.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Loading progress strip (SAP-style status line while data loads) */}
      {loading && (
        <Box sx={{ height: 3, bgcolor: 'divider' }}>
          <Box sx={{ height: '100%', width: '25%', bgcolor: 'primary.main', animation: 'sapLoad 1s linear infinite', '@keyframes sapLoad': { from: { marginLeft: '-25%' }, to: { marginLeft: '100%' } } }} />
        </Box>
      )}

      {/* Data grid - fills the rest of the screen, scrolls internally like an SAP ALV */}
      <TableContainer ref={gridRef} component={Paper} elevation={0} sx={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: 0, bgcolor: 'background.paper' }}>
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', minWidth: 920 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 44, bgcolor: '#f8fafc', borderColor: 'divider' }}>
                <Checkbox
                  size="small"
                  indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < customers.length && !selectAllAcrossPages}
                  checked={selectAllAcrossPages || (customers.length > 0 && selectedCustomerIds.length === customers.length)}
                  onChange={toggleSelectAllCustomers}
                />
              </TableCell>
              <TableCell sx={{ width: '28%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Customer</TableCell>
              <TableCell sx={{ width: '18%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Contact</TableCell>
              <TableCell sx={{ width: '10%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Status</TableCell>
              <TableCell align="right" sx={{ width: '12%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Total Spent</TableCell>
              <TableCell align="right" sx={{ width: '8%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Purchases</TableCell>
              <TableCell sx={{ width: '8%', py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Language</TableCell>
              <TableCell align="center" sx={{ width: 120, py: 1, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderColor: 'divider' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No customers found. Add your first customer to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id} hover selected={selectAllAcrossPages || selectedCustomerIds.includes(customer._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectAllAcrossPages || selectedCustomerIds.includes(customer._id)}
                      onChange={() => toggleSelectCustomer(customer._id)}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.8125rem' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                        {getAvatarInitial(customer)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
                          {getDisplayName(customer)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {customer.email || 'No email'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{customer.phone}</Typography>
                    {customer.whatsappNumber && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        WA: {customer.whatsappNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={customer.rfmSegment}
                      size="small"
                      color={getSegmentColor(customer.rfmSegment)}
                      sx={{ fontSize: '0.75rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    ₹{customer.totalSpent?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1, fontSize: '0.8125rem' }}>
                    {customer.totalPurchases || 0}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip label={customer.language.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 20 }} />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
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

      {/* SAP-style footer bar: selection actions + paging */}
      <Box sx={{ px: 2.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0, overflowX: 'auto' }}>
          {selectedCustomerIds.length > 0 ? (
            <>
              <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {selectAllAcrossPages ? `All ${stats.total} customers selected` : `${selectedCount} selected`}
              </Typography>
              <Button
                size="small"
                color="success"
                startIcon={<MessageIcon />}
                onClick={() => {
                  setSelectedTemplateId('');
                  setBulkChannel('whatsapp');
                  setOpenBulkDialog(true);
                }}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Bulk Message
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteConfirmOpen(true)}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Delete
              </Button>
              <Button
                size="small"
                color="warning"
                startIcon={<EditIcon />}
                onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Status
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSelectedCustomerIds([]);
                  setSelectAllAcrossPages(false);
                }}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.secondary' }}
              >
                Cancel
              </Button>
              {!selectAllAcrossPages && selectedCustomerIds.length === customers.length && stats.total > customers.length && (
                <Button
                  size="small"
                  onClick={() => setSelectAllAcrossPages(true)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  Select all {stats.total} customers
                </Button>
              )}
              {selectAllAcrossPages && (
                <Button
                  size="small"
                  onClick={() => setSelectAllAcrossPages(false)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  Clear selection (page only)
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
              Showing {stats.total > 0 ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, stats.total)} of {stats.total.toLocaleString()} records
            </Typography>
          )}
        </Box>
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleBulkUpdateStatus('NEW')}>New</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('VIP')}>VIP</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('LOYAL')}>Loyal</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('REGULAR')}>Regular</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('AT_RISK')}>At Risk</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('INACTIVE')}>Inactive</MenuItem>
          <MenuItem onClick={() => handleBulkUpdateStatus('LOST')}>Lost</MenuItem>
        </Menu>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          size="small"
          sx={{ '& .MuiPaginationItem-root': { fontSize: '0.75rem' } }}
        />
      </Box>

      {/* Add / Edit Customer Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
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
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#84cc16',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '1rem'
              }}
            >
              {formData.firstName ? formData.firstName.slice(0, 1).toUpperCase() : 'C'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {editingId ? 'Edit Customer Details' : 'Add New Customer'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Customer profile, contact details & loyalty tier
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, minWidth: 'auto', p: 0.5, '&:hover': { color: '#ffffff' } }}
          >
            ✕
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Stack spacing={2.5} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name *"
                  fullWidth
                  size="small"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Priya"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="priya@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={formData.language}
                    label="Language"
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <MenuItem value="en">🇬🇧 English</MenuItem>
                    <MenuItem value="hi">🇮🇳 हिंदी (Hindi)</MenuItem>
                    <MenuItem value="ta">🇮🇳 தமிழ் (Tamil)</MenuItem>
                    <MenuItem value="te">🇮🇳 తెలుగు (Telugu)</MenuItem>
                    <MenuItem value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</MenuItem>
                    <MenuItem value="ml">🇮🇳 മലയാളം (Malayalam)</MenuItem>
                    <MenuItem value="mr">🇮🇳 मराठी (Marathi)</MenuItem>
                    <MenuItem value="gu">🇮🇳 ગુજરાતી (Gujarati)</MenuItem>
                    <MenuItem value="bn">🇮🇳 বাংলা (Bengali)</MenuItem>
                    <MenuItem value="pa">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</MenuItem>
                    <MenuItem value="or">🇮🇳 ଓଡ଼ିଆ (Odia)</MenuItem>
                    <MenuItem value="as">🇮🇳 অসমীয়া (Assamese)</MenuItem>
                    <MenuItem value="ur">🇮🇳 اردو (Urdu)</MenuItem>
                    <MenuItem value="sa">🇮🇳 संस्कृतम् (Sanskrit)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Phone Number *"
              fullWidth
              size="small"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="9876543210"
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
            />

            <Box>
              <TextField
                label="WhatsApp Number"
                fullWidth
                size="small"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="9876543210"
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />
              {formData.phone && formData.phone !== formData.whatsappNumber && (
                <Button
                  size="small"
                  onClick={() => setFormData({ ...formData, whatsappNumber: formData.phone })}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', mt: 0.5, p: 0 }}
                >
                  ⚡ Same as Phone Number
                </Button>
              )}
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>Customer Loyalty Tier (RFM)</InputLabel>
              <Select
                value={formData.rfmSegment}
                label="Customer Loyalty Tier (RFM)"
                onChange={(e) => setFormData({ ...formData, rfmSegment: e.target.value })}
              >
                <MenuItem value="NEW">🌟 New Shopper</MenuItem>
                <MenuItem value="VIP">👑 VIP Customer</MenuItem>
                <MenuItem value="LOYAL">💎 Loyal Buyer</MenuItem>
                <MenuItem value="REGULAR">🛍️ Regular</MenuItem>
                <MenuItem value="AT_RISK">⚠️ At Risk</MenuItem>
                <MenuItem value="INACTIVE">💤 Inactive</MenuItem>
                <MenuItem value="LOST">❌ Lost</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            disableElevation
            onClick={handleSaveCustomer}
            disabled={submitting}
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
            {submitting ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel/CSV Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          📊 Import Customers from Excel / CSV
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Bulk import customer contacts and mobile numbers into your store audience.
              <br />
              • Required columns: <b>Customer Name</b> and <b>Mobile Number</b> (10 digits).
              <br />
              • Optional columns: <i>Email</i>, <i>Address</i>, <i>Instagram Handle</i>, <i>Language</i>.
            </Typography>
            <Box
              sx={{
                border: '2px dashed #cbd5e1',
                p: 3.5,
                textAlign: 'center',
                borderRadius: '12px',
                bgcolor: '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#84cc16', bgcolor: 'rgba(132,204,22,0.03)' }
              }}
            >
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                id="excel-file-input"
                style={{ display: 'none' }}
                onChange={(e) => {
                  setCsvFile(e.target.files[0]);
                  setImportErrors([]);
                }}
              />
              <label htmlFor="excel-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  sx={{
                    borderColor: '#0f172a',
                    color: '#0f172a',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px',
                    mb: 1
                  }}
                >
                  Choose Excel / CSV File
                </Button>
              </label>
              {csvFile ? (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: '#16a34a' }}>
                  ✓ Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                  Supports .xlsx, .xls, and .csv formats
                </Typography>
              )}
            </Box>

            {importErrors.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', maxHeight: 150, overflowY: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b91c1c', mb: 0.5 }}>
                  Validation Errors ({importErrors.length}):
                </Typography>
                {importErrors.map((err, i) => (
                  <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#b91c1c', marginBottom: '4px' }}>
                    • {err}
                  </div>
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setImportDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={!csvFile || importing}
            onClick={handleImportCSV}
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
            {importing ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          ⚠️ Delete Customer Profile?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete this customer? This will remove their profile and all associated chat logs. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCustomer}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
          >
            Delete Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Customer Confirmation Dialog */}
      <Dialog
        open={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          ⚠️ Delete {selectedCount} Selected Customers?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete all <strong>{selectedCount}</strong> selected customer profiles? This action will permanently remove their chat history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDeleteCustomers}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
          >
            Delete {selectedCount} Customers
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Message Send Dialog */}
      <Dialog 
        open={openBulkDialog} 
        onClose={() => !bulkSending && setOpenBulkDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
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
              <MessageIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                Send Bulk Template Message
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Broadcast to {selectedCount} selected recipients
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Minimize to background">
              <IconButton
                size="small"
                onClick={() => {
                  setOpenBulkDialog(false);
                  showTopToast({
                    title: '🗕 Minimized Composer',
                    message: 'Bulk message composer minimized. You can restore it anytime.',
                    severity: 'info',
                    duration: 3500
                  });
                }}
                sx={{
                  color: '#94a3b8',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)' }
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => setOpenBulkDialog(false)}
              sx={{
                color: '#94a3b8',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.15)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Stack spacing={2.5} mt={1}>
            <Alert
              severity="info"
              sx={{
                borderRadius: '10px',
                bgcolor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                '& .MuiAlert-icon': { color: '#2563eb' }
              }}
            >
              Broadcasting message to <strong>{selectedCount}</strong> targeted customer(s).
            </Alert>

            <FormControl fullWidth size="small">
              <InputLabel>Select Template</InputLabel>
              <Select
                value={selectedTemplateId}
                label="Select Template"
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
              <InputLabel>Delivery Channel</InputLabel>
              <Select
                value={bulkChannel}
                label="Delivery Channel"
                onChange={(e) => setBulkChannel(e.target.value)}
                disabled={bulkSending}
              >
                <MenuItem value="whatsapp">WhatsApp Official API</MenuItem>
                <MenuItem value="instagram">Instagram Direct</MenuItem>
              </Select>
            </FormControl>

            {selectedTemplateId && (
              <Box sx={{ 
                p: 2, 
                bgcolor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px' 
              }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                  Live Content Preview:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#0f172a', fontSize: '0.85rem' }}>
                  {templates.find(t => t._id === selectedTemplateId)?.content || ''}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenBulkDialog(false)} disabled={bulkSending} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            disableElevation
            disabled={bulkSending || !selectedTemplateId}
            onClick={handleBulkSend}
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
            {bulkSending ? 'Sending...' : 'Send Broadcast'}
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
