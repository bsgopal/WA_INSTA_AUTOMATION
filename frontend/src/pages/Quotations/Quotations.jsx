import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, TextField,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Stack,
  Grid, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, Divider, Alert, Pagination, ToggleButtonGroup,
  ToggleButton, Tabs, Tab
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DrawIcon from '@mui/icons-material/Draw';
import ArticleIcon from '@mui/icons-material/Article';
import PaletteIcon from '@mui/icons-material/Palette';

import CustomSnackbar from '../../components/Snackbar';
import SplitDivider from '../../components/SplitDivider';
import CopyButton from '../../components/CopyButton';
import QuotationDocument from '../../components/Quotations/QuotationDocument';
import apiClient from '../../api/client';

const STATUS_COLORS = {
  DRAFT: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  SENT: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  ACCEPTED: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  REJECTED: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  EXPIRED: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  CONVERTED_TO_INVOICE: { bg: '#FAF5FF', color: '#7C3AED', border: '#E9D5FF' }
};

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValue: 0,
    acceptedCount: 0,
    acceptedValue: 0,
    sentCount: 0,
    draftCount: 0
  });

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followupOnly, setFollowupOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Split Panel / Master-Detail layout state
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [splitPercent, setSplitPercent] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPercent >= 20 && newPercent <= 80) {
        setSplitPercent(newPercent);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);
  const [rightViewMode, setRightViewMode] = useState('PREVIEW'); // 'PREVIEW' | 'EDIT'
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Available DB Customers list for dropdown
  const [dbCustomers, setDbCustomers] = useState([]);
  const [shopConfig, setShopConfig] = useState(null);

  // Form State
  const [customerMode, setCustomerMode] = useState('NEW'); // 'NEW' | 'EXISTING'
  const [formData, setFormData] = useState({
    title: 'Custom Software Development',
    subtitle: 'A tailored solution to streamline your operations and support your business growth.',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'DRAFT',
    isExistingCustomer: false,
    customerId: '',
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    items: [
      { sNo: 1, item: 'Requirements Analysis & Planning', description: '', quantity: 1, unitPrice: 15000, amount: 15000 },
      { sNo: 2, item: 'Custom Software Development', description: '', quantity: 1, unitPrice: 85000, amount: 85000 },
      { sNo: 3, item: 'Testing & Quality Assurance', description: '', quantity: 1, unitPrice: 10000, amount: 10000 },
      { sNo: 4, item: 'Deployment & Training', description: '', quantity: 1, unitPrice: 10000, amount: 10000 },
      { sNo: 5, item: '1 Year Support & Maintenance', description: '', quantity: 1, unitPrice: 15000, amount: 15000 }
    ],
    currencySymbol: '₹',
    subtotal: 135000,
    taxPercent: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 135000,
    terms: [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ],
    signatoryName: 'Renic Team',
    signatoryTitle: 'Authorized Signature',
    signatoryCompany: 'RENIC TECHNOLOGY',
    themeColor: '#C20E2C',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // SAP DM Sticky Anchor Navigation State
  const [activeTabSection, setActiveTabSection] = useState(0);
  const detailScrollRef = useRef(null);
  const [newTermText, setNewTermText] = useState('');

  // WhatsApp Dispatch modal
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [customWaMessage, setCustomWaMessage] = useState('');
  const [sendingWa, setSendingWa] = useState(false);

  // Convert to Invoice confirmation
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const printComponentRef = useRef(null);

  // Smooth scroll to anchor section inside right object panel
  const handleScrollToSection = (index, sectionId) => {
    setActiveTabSection(index);
    const element = document.getElementById(sectionId);
    if (element && detailScrollRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto detect active section while scrolling right panel
  const handlePanelScroll = () => {
    if (!detailScrollRef.current) return;
    const sections = [
      'sec-customer',
      'sec-validity',
      'sec-items',
      'sec-terms',
      'sec-signatory',
      'sec-notes'
    ];
    const scrollPos = detailScrollRef.current.scrollTop + 100;
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (el && el.offsetTop <= scrollPos) {
        setActiveTabSection(i);
        break;
      }
    }
  };

  // Manage Proposal Terms
  const handleAddProposalTerm = () => {
    if (!newTermText.trim()) return;
    const current = Array.isArray(formData.terms) ? formData.terms : [];
    setFormData(prev => ({
      ...prev,
      terms: [...current, newTermText.trim()]
    }));
    setNewTermText('');
  };

  const handleRemoveProposalTerm = (index) => {
    const current = Array.isArray(formData.terms) ? formData.terms : [];
    setFormData(prev => ({
      ...prev,
      terms: current.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProposalTerm = (index, val) => {
    const current = Array.isArray(formData.terms) ? [...formData.terms] : [];
    current[index] = val;
    setFormData(prev => ({ ...prev, terms: current }));
  };

  // Fetch shop config and customer list on mount
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [configRes, custRes] = await Promise.all([
          apiClient.get('/shop-config'),
          apiClient.get('/customers?limit=200')
        ]);
        if (configRes.data) {
          setShopConfig(configRes.data);
        }
        if (custRes.data?.customers) {
          setDbCustomers(custRes.data.customers);
        }
      } catch (err) {
        console.warn('Init data load notice:', err.message);
      }
    };
    loadInitData();
  }, []);

  // Fetch Quotations list
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        followupPending: followupOnly ? 'true' : undefined
      };
      const res = await apiClient.get('/quotations', { params });
      if (res.data?.success) {
        setQuotations(res.data.quotations || []);
        setTotalPages(res.data.pagination?.pages || 1);
        if (res.data.stats) setStats(res.data.stats);

        // Update selected quotation if in view
        if (selectedQuotation) {
          const fresh = (res.data.quotations || []).find(q => q._id === selectedQuotation._id);
          if (fresh) setSelectedQuotation(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, startDate, endDate, followupOnly, selectedQuotation]);

  useEffect(() => {
    fetchQuotations();
  }, [page, statusFilter, startDate, endDate, followupOnly]);

  // Recalculate Totals
  const recalculateTotals = (items, taxPct = formData.taxPercent, discount = formData.discountAmount) => {
    const sub = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const tax = (sub * (Number(taxPct) || 0)) / 100;
    const tot = Math.max(0, sub + tax - (Number(discount) || 0));
    return { subtotal: sub, taxAmount: tax, totalAmount: tot };
  };

  // Row selection
  const handleSelectQuotation = (quotation) => {
    setSelectedQuotation(quotation);
    setIsCreateMode(false);
    setRightViewMode('PREVIEW');
  };

  // Open Create Mode
  const handleOpenCreate = () => {
    const cfg = shopConfig || {};
    const defaultTerms = cfg.defaultQuotationTerms || [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ];

    setSelectedQuotation(null);
    setIsCreateMode(true);
    setRightViewMode('EDIT');
    setCustomerMode('NEW');

    const initItems = [
      { sNo: 1, item: 'Requirements Analysis & Planning', description: '', quantity: 1, unitPrice: 15000, amount: 15000 },
      { sNo: 2, item: 'Custom Software Development', description: '', quantity: 1, unitPrice: 85000, amount: 85000 },
      { sNo: 3, item: 'Testing & Quality Assurance', description: '', quantity: 1, unitPrice: 10000, amount: 10000 },
      { sNo: 4, item: 'Deployment & Training', description: '', quantity: 1, unitPrice: 10000, amount: 10000 },
      { sNo: 5, item: '1 Year Support & Maintenance', description: '', quantity: 1, unitPrice: 15000, amount: 15000 }
    ];
    const { subtotal, taxAmount, totalAmount } = recalculateTotals(initItems, 0, 0);

    setFormData({
      title: 'Custom Software Development',
      subtitle: 'A tailored solution to streamline your operations and support your business growth.',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'DRAFT',
      isExistingCustomer: false,
      customerId: '',
      customerName: 'ABC Enterprises',
      contactPerson: '',
      phone: '',
      email: '',
      address: '123, Main Road, Gobichettipalayam, Erode – 638452, Tamil Nadu, India',
      gstin: '',
      items: initItems,
      currencySymbol: cfg.currencySymbol || '₹',
      subtotal,
      taxPercent: 0,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      terms: defaultTerms,
      signatoryName: cfg.signatoryName || 'Renic Team',
      signatoryTitle: cfg.signatoryTitle || 'Authorized Signature',
      signatoryCompany: cfg.companyName || 'RENIC TECHNOLOGY',
      themeColor: cfg.themeColor || '#84CC16',
      notes: ''
    });
  };

  // Open Edit Mode
  const handleOpenEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setIsCreateMode(false);
    setRightViewMode('EDIT');
    setCustomerMode(quotation.isExistingCustomer ? 'EXISTING' : 'NEW');

    setFormData({
      title: quotation.title || '',
      subtitle: quotation.subtitle || '',
      date: quotation.date ? new Date(quotation.date).toISOString().split('T')[0] : '',
      validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
      status: quotation.status || 'DRAFT',
      isExistingCustomer: quotation.isExistingCustomer || false,
      customerId: quotation.customerId?._id || quotation.customerId || '',
      customerName: quotation.customerName || '',
      contactPerson: quotation.contactPerson || '',
      phone: quotation.phone || '',
      email: quotation.email || '',
      address: quotation.address || '',
      gstin: quotation.gstin || '',
      items: quotation.items || [],
      currencySymbol: quotation.currencySymbol || '₹',
      subtotal: quotation.subtotal || 0,
      taxPercent: quotation.taxPercent || 0,
      taxAmount: quotation.taxAmount || 0,
      discountAmount: quotation.discountAmount || 0,
      totalAmount: quotation.totalAmount || 0,
      terms: quotation.terms || [],
      signatoryName: quotation.signatoryName || 'Renic Team',
      signatoryTitle: quotation.signatoryTitle || 'Authorized Signature',
      signatoryCompany: quotation.signatoryCompany || 'RENIC TECHNOLOGY',
      themeColor: quotation.themeColor || '#84CC16',
      notes: quotation.notes || ''
    });
  };

  // Handle Existing Customer selection in Form
  const handleSelectDbCustomer = (custId) => {
    const cust = dbCustomers.find(c => c._id === custId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        isExistingCustomer: true,
        customerId: cust._id,
        customerName: `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || cust.phone,
        phone: cust.phone || cust.whatsappNumber || '',
        email: cust.email || '',
        address: cust.location?.address ? `${cust.location.address}, ${cust.location.city || ''} ${cust.location.state || ''}`.trim() : prev.address
      }));
    }
  };

  // Item Table Handlers
  const handleItemChange = (idx, field, val) => {
    const updated = [...formData.items];
    updated[idx] = { ...updated[idx], [field]: val };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[idx].quantity) || 1;
      const u = Number(updated[idx].unitPrice) || 0;
      updated[idx].amount = q * u;
    }

    const { subtotal, taxAmount, totalAmount } = recalculateTotals(updated);
    setFormData(prev => ({
      ...prev,
      items: updated,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  const handleAddItem = () => {
    const updated = [
      ...formData.items,
      { sNo: formData.items.length + 1, item: 'New Service / Deliverable', description: '', quantity: 1, unitPrice: 5000, amount: 5000 }
    ];
    const { subtotal, taxAmount, totalAmount } = recalculateTotals(updated);
    setFormData(prev => ({
      ...prev,
      items: updated,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  const handleRemoveItem = (idx) => {
    const updated = formData.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sNo: i + 1 }));
    const { subtotal, taxAmount, totalAmount } = recalculateTotals(updated);
    setFormData(prev => ({
      ...prev,
      items: updated,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  // Save Quotation
  const handleSaveQuotation = async () => {
    if (!formData.customerName?.trim() || !formData.phone?.trim()) {
      setSnackbar({ open: true, message: 'Please enter Customer Name and Phone Number', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        isExistingCustomer: customerMode === 'EXISTING'
      };

      if (selectedQuotation?._id && !isCreateMode) {
        const res = await apiClient.put(`/quotations/${selectedQuotation._id}`, payload);
        setSnackbar({ open: true, message: 'Quotation updated successfully!', severity: 'success' });
        setSelectedQuotation(res.data.quotation);
      } else {
        const res = await apiClient.post('/quotations', payload);
        setSnackbar({ open: true, message: 'Quotation created successfully!', severity: 'success' });
        setSelectedQuotation(res.data.quotation);
        setIsCreateMode(false);
      }
      setRightViewMode('PREVIEW');
      fetchQuotations();
    } catch (err) {
      console.error('Save Quotation Error:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save quotation', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Convert to Invoice
  const handleConvertToInvoice = async () => {
    if (!selectedQuotation) return;
    setConverting(true);
    try {
      const res = await apiClient.post(`/quotations/${selectedQuotation._id}/convert-to-invoice`);
      if (res.data?.success) {
        setSnackbar({
          open: true,
          message: `🎉 Success! Converted to Tax Invoice (${res.data.invoice?.invoiceNumber}). Customer auto-enrolled into CRM!`,
          severity: 'success'
        });
        setConvertDialogOpen(false);
        fetchQuotations();
        setSelectedQuotation(res.data.quotation);
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to convert quotation', severity: 'error' });
    } finally {
      setConverting(false);
    }
  };

  // Send WhatsApp Proposal
  const handleSendWhatsApp = async () => {
    if (!selectedQuotation) return;
    setSendingWa(true);
    try {
      const res = await apiClient.post(`/quotations/${selectedQuotation._id}/send-whatsapp`, {
        customMessage: customWaMessage || undefined
      });
      if (res.data?.success) {
        setSnackbar({ open: true, message: 'Quotation proposal dispatched on WhatsApp!', severity: 'success' });
        setWhatsappDialogOpen(false);
        fetchQuotations();
        setSelectedQuotation(res.data.quotation);
      }
    } catch (err) {
      console.error('WhatsApp send error:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to send quotation on WhatsApp', severity: 'error' });
    } finally {
      setSendingWa(false);
    }
  };

  // Print / PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // Delete Quotation
  const handleDeleteQuotation = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/quotations/${deleteId}`);
      setSnackbar({ open: true, message: 'Quotation deleted successfully', severity: 'success' });
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      if (selectedQuotation?._id === deleteId) {
        setSelectedQuotation(null);
        setIsCreateMode(false);
      }
      fetchQuotations();
    } catch (err) {
      console.error('Delete error:', err);
      setSnackbar({ open: true, message: 'Failed to delete quotation', severity: 'error' });
    }
  };

  const isDetailOpen = Boolean(selectedQuotation || isCreateMode);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
      
      {/* ========================================================
          1. TOP HEADER & METRICS BAR
          ======================================================== */}
      <Box sx={{ px: 2.5, py: 1.2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, zIndex: 10 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#84CC16', fontSize: '1.2rem' }}>
            📄
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem', lineHeight: 1.2 }}>
              Quotations & Invoicing Hub
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              {stats.totalCount} proposals · ₹{stats.totalValue.toLocaleString('en-IN')} total pipeline value
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Search proposal, client, phone..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchQuotations();
            }}
            sx={{ width: { xs: 180, sm: 240 }, '& .MuiInputBase-root': { fontSize: '0.82rem', height: 34, bgcolor: '#F8FAFC' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: '#64748B' }} />
                  </InputAdornment>
                )
              }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              displayEmpty
              sx={{ fontSize: '0.82rem', height: 34, bgcolor: '#F8FAFC' }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="SENT">Sent</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CONVERTED_TO_INVOICE">Converted to Bill</MenuItem>
            </Select>
          </FormControl>

          {/* Follow-up Pending Filter Toggle */}
          <Tooltip title="Show quotations pending follow-up (Sent > 3 days ago or expiring soon)">
            <Button
              variant={followupOnly ? 'contained' : 'outlined'}
              size="small"
              startIcon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
              onClick={() => {
                setFollowupOnly(!followupOnly);
                setPage(1);
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '7px',
                bgcolor: followupOnly ? '#D97706' : 'transparent',
                color: followupOnly ? '#FFF' : '#B45309',
                borderColor: '#FDE68A',
                '&:hover': { bgcolor: followupOnly ? '#B45309' : '#FFFBEB' }
              }}
            >
              Follow-up Alert
            </Button>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            size="small"
            onClick={handleOpenCreate}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              height: 34,
              borderRadius: '7px',
              bgcolor: '#84CC16',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(132,204,22,0.25)',
              '&:hover': { bgcolor: '#65A30D' }
            }}
          >
            Create Quotation
          </Button>
        </Stack>
      </Box>

      {/* KPI Stats Strip */}
      <Box sx={{ px: 2.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 3, borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflowX: 'auto' }}>
        {[
          { label: 'Total Proposals', value: stats.totalCount, color: '#2563EB', icon: <ReceiptIcon sx={{ fontSize: 17 }} /> },
          { label: 'Accepted Value', value: `₹${stats.acceptedValue.toLocaleString('en-IN')}`, color: '#16A34A', icon: <CheckCircleIcon sx={{ fontSize: 17 }} /> },
          { label: 'Sent / In Review', value: stats.sentCount, color: '#0284C7', icon: <SendIcon sx={{ fontSize: 17 }} /> },
          { label: 'Draft Proposals', value: stats.draftCount, color: '#64748B', icon: <EditIcon sx={{ fontSize: 17 }} /> }
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'max-content' }}>
            <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 700, fontSize: '0.66rem', lineHeight: 1, textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2, color: item.color }}>
                {item.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Loading Bar */}
      {loading && (
        <Box sx={{ height: 3, bgcolor: '#E2E8F0', overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: '30%', bgcolor: '#84CC16', animation: 'barLoad 1s linear infinite', '@keyframes barLoad': { from: { marginLeft: '-30%' }, to: { marginLeft: '100%' } } }} />
        </Box>
      )}

      {/* ========================================================
          2. TWO-SPLIT MASTER-DETAIL BODY
          ======================================================== */}
      <Box ref={containerRef} sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        
        {/* ----------------------------------------------------
            LEFT / MASTER COLUMN: Quotations List
            ---------------------------------------------------- */}
        <Box
          sx={{
            display: isPanelMaximized ? 'none' : 'flex',
            flexDirection: 'column',
            width: isDetailOpen ? (isPanelMaximized ? '0%' : `${splitPercent}%`) : '100%', flexShrink: 0,
            height: '100%',
            borderRight: isDetailOpen ? '1px solid #E2E8F0' : 'none',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: isDetailOpen ? '42%' : '25%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC' }}>
                    Quotation & Client
                  </TableCell>
                  <TableCell sx={{ width: isDetailOpen ? '32%' : '22%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC' }}>
                    Date & Validity
                  </TableCell>
                  <TableCell align="right" sx={{ width: isDetailOpen ? '26%' : '18%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC' }}>
                    Amount (INR)
                  </TableCell>
                  {!isDetailOpen && (
                    <>
                      <TableCell sx={{ width: '15%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC' }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ width: '20%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC' }}>
                        Actions
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isDetailOpen ? 3 : 5} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No quotations found. Click <strong>Create Quotation</strong> to draft your first proposal.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quo) => {
                    const isRowSelected = selectedQuotation?._id === quo._id;
                    const st = STATUS_COLORS[quo.status] || STATUS_COLORS.DRAFT;
                    const daysToExpiry = Math.ceil((new Date(quo.validUntil) - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                      <TableRow
                        key={quo._id}
                        hover
                        onClick={() => handleSelectQuotation(quo)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isRowSelected ? 'rgba(132,204,22,0.12) !important' : 'inherit',
                          borderLeft: isRowSelected ? '4px solid #84CC16' : '4px solid transparent',
                          '&:hover': { bgcolor: isRowSelected ? 'rgba(132,204,22,0.18) !important' : '#F8FAFC' }
                        }}
                      >
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0F172A', fontSize: '0.82rem' }}>
                            {quo.quotationNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, display: 'block' }}>
                            {quo.customerName}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center" mt={0.3}>
                            <Chip
                              label={quo.isExistingCustomer ? 'CRM Client' : 'New Lead'}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                bgcolor: quo.isExistingCustomer ? '#F0FDF4' : '#FFFBEB',
                                color: quo.isExistingCustomer ? '#16A34A' : '#D97706',
                                border: `1px solid ${quo.isExistingCustomer ? '#BBF7D0' : '#FDE68A'}`
                              }}
                            />
                            {isDetailOpen && (
                              <Chip
                                label={quo.status}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ py: 1.2 }}>
                          <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.74rem' }}>
                            Date: {new Date(quo.date).toLocaleDateString('en-GB')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: daysToExpiry < 3 ? '#DC2626' : '#64748B', fontWeight: daysToExpiry < 3 ? 700 : 500, fontSize: '0.72rem' }}>
                            {daysToExpiry > 0 ? `Valid till: ${new Date(quo.validUntil).toLocaleDateString('en-GB')}` : 'Expired'}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.2 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0F172A', fontSize: '0.85rem' }}>
                            ₹{(quo.totalAmount || 0).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>

                        {!isDetailOpen && (
                          <>
                            <TableCell sx={{ py: 1.2 }}>
                              <Chip
                                label={quo.status}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  bgcolor: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`
                                }}
                              />
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.2 }} onClick={(e) => e.stopPropagation()}>
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="Send on WhatsApp">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedQuotation(quo);
                                      setWhatsappDialogOpen(true);
                                    }}
                                  >
                                    <WhatsAppIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Convert to Tax Invoice / Bill">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setSelectedQuotation(quo);
                                      setConvertDialogOpen(true);
                                    }}
                                  >
                                    <ReceiptIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(quo)}
                                  >
                                    <EditIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setDeleteId(quo._id);
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Master Pagination */}
          <Box sx={{ px: 2, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Page {page} of {totalPages} ({stats.totalCount} proposals)
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, val) => setPage(val)}
              size="small"
              shape="rounded"
              sx={{ '& .MuiPaginationItem-root': { fontSize: '0.75rem', minWidth: 26, height: 26 } }}
            />
          </Box>
        </Box>

        {isDetailOpen && !isPanelMaximized && (
          <SplitDivider isDragging={isDragging} onMouseDown={() => setIsDragging(true)} />
        )}

        {/* ----------------------------------------------------
            RIGHT / DETAIL COLUMN: Visual Preview & Editor
            ---------------------------------------------------- */}
        {isDetailOpen && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: isPanelMaximized ? '100%' : `${100 - splitPercent}%`,
              flexShrink: 0,
              flex: isPanelMaximized ? 1 : 'none',
              height: '100%',
              bgcolor: '#FFFFFF',
              overflow: 'hidden',
              boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
              zIndex: 5
            }}
          >
            {/* Action Header Bar */}
            <Box
              sx={{
                px: 2.5,
                py: 1,
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderBottom: '1px solid #1E293B'
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem', lineHeight: 1.1 }}>
                    {isCreateMode ? 'Draft New Quotation Proposal' : selectedQuotation?.quotationNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {isCreateMode ? 'Fill proposal details & customer info' : `${selectedQuotation?.customerName} (${selectedQuotation?.phone})`}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                {/* View / Edit Mode Switcher */}
                {!isCreateMode && (
                  <ToggleButtonGroup
                    size="small"
                    value={rightViewMode}
                    exclusive
                    onChange={(e, val) => val && setRightViewMode(val)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '6px', height: 28 }}
                  >
                    <ToggleButton value="PREVIEW" sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, px: 1, '&.Mui-selected': { bgcolor: '#84CC16', color: '#FFF' } }}>
                      Visual Document
                    </ToggleButton>
                    <ToggleButton value="EDIT" sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, px: 1, '&.Mui-selected': { bgcolor: '#84CC16', color: '#FFF' } }}>
                      Edit Proposal
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}

                {/* Primary Actions */}
                {rightViewMode === 'PREVIEW' && selectedQuotation && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setWhatsappDialogOpen(true)}
                      sx={{ bgcolor: '#16A34A', color: '#FFF', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5, '&:hover': { bgcolor: '#15803D' } }}
                    >
                      Send WhatsApp
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReceiptIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setConvertDialogOpen(true)}
                      disabled={selectedQuotation.status === 'CONVERTED_TO_INVOICE'}
                      sx={{ bgcolor: '#0284C7', color: '#FFF', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5 }}
                    >
                      {selectedQuotation.status === 'CONVERTED_TO_INVOICE' ? 'Converted to Bill' : 'Convert to Invoice'}
                    </Button>

                    <Tooltip title="Print or Save PDF">
                      <IconButton size="small" onClick={handlePrint} sx={{ color: '#E2E8F0', bgcolor: 'rgba(255,255,255,0.08)' }}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {rightViewMode === 'EDIT' && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (isCreateMode) {
                          setSelectedQuotation(null);
                          setIsCreateMode(false);
                        } else {
                          setRightViewMode('PREVIEW');
                        }
                      }}
                      sx={{ borderColor: '#475569', color: '#E2E8F0', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 14 }} />}
                      disabled={saving}
                      onClick={handleSaveQuotation}
                      sx={{ bgcolor: '#84CC16', color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', px: 2, '&:hover': { bgcolor: '#65A30D' } }}
                    >
                      {saving ? 'Saving...' : 'Save Quotation'}
                    </Button>
                  </>
                )}

                <Divider orientation="vertical" flexItem sx={{ bgcolor: '#334155', my: 0.5 }} />

                {/* Back Button */}
                <Button
                  startIcon={<ArrowBackIcon fontSize="small" />}
                  onClick={() => { setSelectedQuotation(null); setIsCreateMode(false); }}
                  variant="outlined"
                  size="small"
                  sx={{
                    color: '#F8FAFC',
                    borderColor: '#475569',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    '&:hover': { borderColor: '#84CC16', bgcolor: '#1E293B' },
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5
                  }}
                >
                  Back
                </Button>

                {/* Maximize */}
                <Tooltip title={isPanelMaximized ? 'Restore Split View' : 'Maximize Fullscreen'}>
                  <IconButton size="small" onClick={() => setIsPanelMaximized(!isPanelMaximized)} sx={{ color: '#94A3B8' }}>
                    {isPanelMaximized ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Close */}
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => { setSelectedQuotation(null); setIsCreateMode(false); }} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* SAP DM STICKY ANCHOR HEADER TABS (SINGLE PAGE SCROLL) */}
            {rightViewMode === 'EDIT' && (
              <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF', px: 2, flexShrink: 0 }}>
                <Tabs
                  value={activeTabSection}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 38,
                    '& .MuiTab-root': {
                      minHeight: 38,
                      py: 0.5,
                      px: 1.8,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#64748B',
                      '&.Mui-selected': { color: '#84CC16' }
                    },
                    '& .MuiTabs-indicator': { bgcolor: '#84CC16', height: 3 }
                  }}
                >
                  <Tab label="1. Customer / Target" onClick={() => handleScrollToSection(0, 'sec-customer')} />
                  <Tab label="2. Proposal & Validity" onClick={() => handleScrollToSection(1, 'sec-validity')} />
                  <Tab label="3. Line Items & Pricing" onClick={() => handleScrollToSection(2, 'sec-items')} />
                  <Tab label="4. Terms & Conditions" onClick={() => handleScrollToSection(3, 'sec-terms')} />
                  <Tab label="5. Signatory & Theme" onClick={() => handleScrollToSection(4, 'sec-signatory')} />
                  <Tab label="6. Notes & Metadata" onClick={() => handleScrollToSection(5, 'sec-notes')} />
                </Tabs>
              </Box>
            )}

            {/* Content Body - Single Scrollable Object Page Container */}
            <Box
              ref={detailScrollRef}
              onScroll={handlePanelScroll}
              sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3, bgcolor: '#F8FAFC' }}
            >
              
              {/* MODE 1: VISUAL DOCUMENT PREVIEW */}
              {rightViewMode === 'PREVIEW' && selectedQuotation && (
                <Box>
                  <QuotationDocument ref={printComponentRef} quotation={selectedQuotation} isPreview={true} />
                </Box>
              )}

              {/* MODE 2: FORM EDITOR */}
              {rightViewMode === 'EDIT' && (
                <Stack spacing={3}>
                  
                  {/* 1. Customer Selection Cohort */}
                  <Paper id="sec-customer" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 1. Customer / Target Audience
                      </Typography>

                      <ToggleButtonGroup
                        size="small"
                        value={customerMode}
                        exclusive
                        onChange={(e, val) => {
                          if (val) {
                            setCustomerMode(val);
                            setFormData(prev => ({ ...prev, isExistingCustomer: val === 'EXISTING' }));
                          }
                        }}
                        sx={{ height: 28 }}
                      >
                        <ToggleButton value="NEW" sx={{ fontSize: '0.72rem', fontWeight: 700, px: 1.5 }}>
                          ✨ New Prospective Client
                        </ToggleButton>
                        <ToggleButton value="EXISTING" sx={{ fontSize: '0.72rem', fontWeight: 700, px: 1.5 }}>
                          👥 Select from CRM
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {customerMode === 'EXISTING' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Existing Customer</InputLabel>
                            <Select
                              value={formData.customerId || ''}
                              label="Select Existing Customer"
                              onChange={(e) => handleSelectDbCustomer(e.target.value)}
                            >
                              {dbCustomers.map((c) => (
                                <MenuItem key={c._id} value={c._id}>
                                  {c.firstName} {c.lastName} ({c.phone}) - {c.rfmSegment || 'Customer'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Customer / Company Name" fullWidth size="small" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Phone Number" fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Billing Address" fullWidth size="small" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Company / Client Name *" fullWidth size="small" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="e.g. ABC Enterprises" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Contact Person" fullWidth size="small" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="e.g. Rajesh Kumar" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Phone / WhatsApp Number *" fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Email Address" fullWidth size="small" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contact@abcenterprises.com" />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Full Address *" fullWidth size="small" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123, Main Road, Erode - 638452, Tamil Nadu, India" />
                        </Grid>
                      </Grid>
                    )}
                  </Paper>

                  {/* 2. Proposal Title & Dates */}
                  <Paper id="sec-validity" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <EventIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 2. Proposal Title & Validity
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Proposal Title *" fullWidth size="small" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Proposal Subtitle" fullWidth size="small" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Quotation Date" type="date" fullWidth size="small" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Valid Till Date" type="date" fullWidth size="small" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 3. Itemized Table Editor */}
                  <Paper id="sec-items" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListAltIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 3. Project / Service Line Items
                      </Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem} sx={{ textTransform: 'none', fontWeight: 700, color: '#84CC16' }}>
                        + Add Line Item
                      </Button>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell sx={{ width: 50, fontWeight: 700 }}>S.No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Service / Item Name</TableCell>
                          <TableCell sx={{ width: 90, fontWeight: 700 }}>Qty</TableCell>
                          <TableCell sx={{ width: 140, fontWeight: 700 }}>Unit Price (₹)</TableCell>
                          <TableCell sx={{ width: 140, fontWeight: 700 }} align="right">Amount (₹)</TableCell>
                          <TableCell sx={{ width: 50 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((it, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={it.item}
                                onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={it.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                ₹{(it.amount || 0).toLocaleString('en-IN')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)} disabled={formData.items.length <= 1}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Totals Summary */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF5F6', borderRadius: '8px', border: '1px solid #FFE4E6' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            Subtotal: ₹{formData.subtotal.toLocaleString('en-IN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#84CC16' }}>
                            Grand Total: ₹{formData.totalAmount.toLocaleString('en-IN')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>

                  {/* 4. Terms & Conditions */}
                  <Paper id="sec-terms" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <DrawIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 4. Terms & Conditions
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {(formData.terms || []).map((term, tIdx) => (
                        <Box key={tIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', minWidth: 20 }}>
                            {tIdx + 1}.
                          </Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={term}
                            onChange={(e) => handleUpdateProposalTerm(tIdx, e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '8px', fontSize: '0.85rem' } } }}
                          />
                          <IconButton size="small" color="error" onClick={() => handleRemoveProposalTerm(tIdx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Add proposal term (e.g. 1 year free support and maintenance)"
                        value={newTermText}
                        onChange={(e) => setNewTermText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProposalTerm(); } }}
                        slotProps={{ input: { sx: { borderRadius: '8px', fontSize: '0.85rem' } } }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddProposalTerm}
                        sx={{ textTransform: 'none', borderRadius: '8px', minWidth: 90 }}
                      >
                        Add Term
                      </Button>
                    </Box>
                  </Paper>

                  {/* 5. Signatory & Theme */}
                  <Paper id="sec-signatory" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PaletteIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 5. Signatory & Visual Theme
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Signatory Name"
                          fullWidth
                          size="small"
                          value={formData.signatoryName || ''}
                          onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Signatory Title"
                          fullWidth
                          size="small"
                          value={formData.signatoryTitle || ''}
                          onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Signatory Company"
                          fullWidth
                          size="small"
                          value={formData.signatoryCompany || ''}
                          onChange={(e) => setFormData({ ...formData, signatoryCompany: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Proposal Accent Theme Color"
                          fullWidth
                          size="small"
                          value={formData.themeColor || '#C20E2C'}
                          onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: formData.themeColor || '#C20E2C', mr: 1, border: '1px solid #ccc' }} />
                              )
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 6. Internal Notes & Metadata */}
                  <Paper id="sec-notes" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ArticleIcon sx={{ color: '#84CC16', fontSize: 18 }} /> 6. Internal Reference Notes
                    </Typography>

                    <TextField
                      label="Internal Staff Notes (Not visible on customer PDF)"
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any internal deal discussions, client expectations, or custom agreements..."
                    />
                  </Paper>

                </Stack>
              )}
            </Box>

            {/* Sticky Action Footer for Right Column */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                zIndex: 10
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                {isCreateMode
                  ? 'Draft Proposal'
                  : `Grand Total: ₹${Number(selectedQuotation?.grandTotal || calculateTotals().grandTotal || 0).toLocaleString('en-IN')}`}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCloseDetail}
                  sx={{ borderColor: '#CBD5E1', color: '#475569', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Cancel / Close
                </Button>
                {isCreateMode || rightViewMode === 'EDIT' ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 15 }} />}
                    disabled={submitting}
                    onClick={handleSaveQuotation}
                    sx={{ bgcolor: '#84CC16', color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', px: 2.5, '&:hover': { bgcolor: '#9E0A22' } }}
                  >
                    {submitting ? 'Saving...' : isCreateMode ? 'Create Quotation' : 'Save Quotation'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setWhatsappDialogOpen(true)}
                    sx={{ bgcolor: '#16A34A', color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', px: 2.5, '&:hover': { bgcolor: '#15803D' } }}
                  >
                    Send via WhatsApp
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* ========================================================
          3. MODALS & CONFIRMATIONS
          ======================================================== */}

      {/* WhatsApp Send Dialog */}
      <Dialog open={whatsappDialogOpen} onClose={() => setWhatsappDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon sx={{ color: '#16A34A' }} /> Dispatch Proposal on WhatsApp
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Send this professional quotation summary directly to <strong>{selectedQuotation?.customerName}</strong> ({selectedQuotation?.phone}).
          </Typography>
          <TextField
            label="Custom Message (Leave blank for professional default)"
            multiline
            rows={4}
            fullWidth
            size="small"
            value={customWaMessage}
            onChange={(e) => setCustomWaMessage(e.target.value)}
            placeholder="Hi, please find attached the quotation proposal..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setWhatsappDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={sendingWa}
            onClick={handleSendWhatsApp}
            startIcon={sendingWa ? <CircularProgress size={14} color="inherit" /> : <WhatsAppIcon />}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            {sendingWa ? 'Sending...' : 'Dispatch on WhatsApp'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>Convert to Official Tax Invoice?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will mark quotation <strong>{selectedQuotation?.quotationNumber}</strong> as Accepted, generate an official Tax Invoice, and automatically enroll the client into your CRM database with complete purchase history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={converting}
            onClick={handleConvertToInvoice}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            {converting ? 'Converting...' : 'Confirm & Generate Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Quotation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this quotation? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteQuotation} sx={{ fontWeight: 800 }}>
            Delete
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
