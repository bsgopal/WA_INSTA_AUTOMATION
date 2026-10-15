import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, Avatar, CircularProgress, Grid,
  FormControl, InputLabel, Select, Alert, Checkbox, Pagination, Tooltip,
  Divider, Tabs, Tab, Card, CardContent, Switch, FormControlLabel
} from '@mui/material';

// Icons
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
import SaveIcon from '@mui/icons-material/Save';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NoteIcon from '@mui/icons-material/Note';
import PersonIcon from '@mui/icons-material/Person';
import DiamondIcon from '@mui/icons-material/Diamond';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import * as XLSX from 'xlsx';

import CustomSnackbar from '../../components/Snackbar';
import CopyButton, { copyToClipboard } from '../../components/CopyButton';
import apiClient from '../../api/client';
import { useBackgroundMessaging } from '../../context/BackgroundMessagingContext';

const SEGMENT_COLORS = {
  VIP: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  LOYAL: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  REGULAR: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  NEW: { bg: '#FAF5FF', color: '#7C3AED', border: '#E9D5FF' },
  AT_RISK: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  INACTIVE: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  LOST: { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' }
};

const LOYALTY_TIER_COLORS = {
  BRONZE: { bg: '#FEF3C7', color: '#92400E' },
  SILVER: { bg: '#F1F5F9', color: '#475569' },
  GOLD: { bg: '#FEF08A', color: '#854D0E' },
  DIAMOND: { bg: '#E0F2FE', color: '#0369A1' }
};

export default function Customers() {
  const navigate = useNavigate();
  const { startBackgroundJob, showTopToast } = useBackgroundMessaging();
  
  // Master data states
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSegment, setSelectedSegment] = useState('');
  const gridRef = useRef(null);

  // Split Panel / Master-Detail layout states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState(0);

  // Form State for Create & Edit
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    instagramHandle: '',
    language: 'en',
    rfmSegment: 'NEW',
    loyaltyTier: 'BRONZE',
    loyaltyPoints: 0,
    totalSpent: 0,
    region: 'North',
    location: {
      address: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'India'
    },
    notes: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Bulk operations
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [bulkChannel, setBulkChannel] = useState('whatsapp');
  const [bulkSending, setBulkSending] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);

  // Deletion modals
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Import CSV / Excel Modal
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dbPhoneSet, setDbPhoneSet] = useState(new Set());

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    loyal: 0,
    new: 0
  });

  const selectedCount = selectAllAcrossPages ? stats.total : selectedCustomerIds.length;

  // Scroll Container Ref for Right Detail Panel
  const detailScrollRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
      const list = response.data.customers || [];
      setCustomers(list);
      setTotalPages(response.data.pagination?.pages || 1);

      if (page === 1) {
        const statsResponse = await apiClient.get('/customers/analytics/segments');
        const total = statsResponse.data.reduce((sum, seg) => sum + seg.count, 0);
        const vip = statsResponse.data.find(s => s._id === 'VIP')?.count || 0;
        const loyal = statsResponse.data.find(s => s._id === 'LOYAL')?.count || 0;
        const newCustomers = statsResponse.data.find(s => s._id === 'NEW')?.count || 0;

        setStats({ total, vip, loyal, new: newCustomers });
      }

      // If selected customer is still in view, refresh it
      if (selectedCustomer) {
        const fresh = list.find(c => c._id === selectedCustomer._id);
        if (fresh) setSelectedCustomer(fresh);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Handle selecting a row to open detail view
  const handleSelectCustomerRow = (customer) => {
    setSelectedCustomer(customer);
    setIsCreateMode(false);
    setIsEditMode(false);
    setActiveTabSection(0);
    // Populate form data for immediate editing capability
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsappNumber: customer.whatsappNumber || customer.phone || '',
      instagramHandle: customer.instagramHandle || '',
      language: customer.language || 'en',
      rfmSegment: customer.rfmSegment || 'NEW',
      loyaltyTier: customer.loyaltyTier || 'BRONZE',
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalSpent: customer.totalSpent || 0,
      region: customer.region || 'North',
      location: {
        address: customer.location?.address || '',
        city: customer.location?.city || '',
        state: customer.location?.state || '',
        zipcode: customer.location?.zipcode || '',
        country: customer.location?.country || 'India'
      },
      notes: customer.notes || '',
      tags: customer.tags || []
    });
  };

  // Open create panel in right column
  const handleOpenCreatePanel = () => {
    setSelectedCustomer(null);
    setIsCreateMode(true);
    setIsEditMode(true);
    setActiveTabSection(0);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      instagramHandle: '',
      language: 'en',
      rfmSegment: 'NEW',
      loyaltyTier: 'BRONZE',
      loyaltyPoints: 0,
      totalSpent: 0,
      region: 'North',
      location: {
        address: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'India'
      },
      notes: '',
      tags: []
    });
  };

  const handleCloseDetailPanel = () => {
    setSelectedCustomer(null);
    setIsCreateMode(false);
    setIsEditMode(false);
    setIsPanelMaximized(false);
  };

  // Smooth scroll to anchor section in right panel
  const handleScrollToSection = (index, sectionId) => {
    setActiveTabSection(index);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle section scroll detection inside right panel
  const handlePanelScroll = () => {
    if (!detailScrollRef.current) return;
    const sections = [
      'sec-general',
      'sec-contact',
      'sec-rfm',
      'sec-location',
      'sec-purchases',
      'sec-tags'
    ];
    const scrollPos = detailScrollRef.current.scrollTop + 120;
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (el && el.offsetTop <= scrollPos) {
        setActiveTabSection(i);
        break;
      }
    }
  };

  // Add / Remove Tags
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async () => {
    const rawPhone = (formData.phone || '').trim();
    const rawWhatsapp = (formData.whatsappNumber || '').trim();
    const effectivePhone = rawPhone || rawWhatsapp;
    const effectiveWhatsapp = rawWhatsapp || rawPhone;

    if (!formData.firstName?.trim()) {
      setSnackbar({ open: true, message: 'Please enter customer First Name', severity: 'warning' });
      return;
    }

    if (!effectivePhone) {
      setSnackbar({ open: true, message: 'Please enter a Phone Number or WhatsApp Number', severity: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        phone: effectivePhone,
        whatsappNumber: effectiveWhatsapp
      };

      if (selectedCustomer?._id && !isCreateMode) {
        const res = await apiClient.put(`/customers/${selectedCustomer._id}`, payload);
        setSnackbar({ open: true, message: 'Customer updated successfully!', severity: 'success' });
        setSelectedCustomer(res.data);
        setIsEditMode(false);
      } else {
        const res = await apiClient.post('/customers', payload);
        setSnackbar({ open: true, message: 'Customer created successfully!', severity: 'success' });
        setSelectedCustomer(res.data);
        setIsCreateMode(false);
        setIsEditMode(false);
      }
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save customer profile',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id) => {
    try {
      await apiClient.delete(`/customers/${id}`);
      setSnackbar({ open: true, message: 'Customer deleted successfully!', severity: 'success' });
      if (selectedCustomer?._id === id) {
        handleCloseDetailPanel();
      }
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setSnackbar({ open: true, message: 'Failed to delete customer', severity: 'error' });
    }
  };

  // Bulk Send
  const handleBulkSend = async () => {
    if (!selectedTemplateId || !bulkChannel) {
      setSnackbar({ open: true, message: 'Please select a template and channel', severity: 'warning' });
      return;
    }

    const template = templates.find(t => t._id === selectedTemplateId);
    if (!template) return;

    const count = selectAllAcrossPages ? stats.total : selectedCustomerIds.length;
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

        return { sentCount: successCount, failCount: failCount, data: res.data };
      },
      onComplete: () => {
        fetchCustomers();
      }
    });
  };

  // Bulk Status Update
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
        message: response.data.message || `Customer statuses updated to ${status}!`,
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

  // Bulk Delete
  const handleBulkDelete = async () => {
    try {
      await apiClient.post('/customers/bulk-delete', {
        customerIds: selectAllAcrossPages ? [] : selectedCustomerIds,
        deleteAll: selectAllAcrossPages
      });
      setSnackbar({ open: true, message: 'Selected customers deleted successfully!', severity: 'success' });
      setBulkDeleteConfirmOpen(false);
      setSelectedCustomerIds([]);
      if (selectedCustomer && selectedCustomerIds.includes(selectedCustomer._id)) {
        handleCloseDetailPanel();
      }
      fetchCustomers();
    } catch (error) {
      console.error('Failed to bulk delete customers:', error);
      setSnackbar({ open: true, message: 'Failed to delete selected customers', severity: 'error' });
    }
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      { 'Customer Name': 'John Doe', 'Mobile Number': '9876543210', 'Email': 'john@example.com', 'Address': '123 Main St, Chennai', 'Segment': 'VIP', 'Language': 'en' },
      { 'Customer Name': 'Ravi Kumar', 'Mobile Number': '9123456789', 'Email': 'ravi@example.com', 'Address': '45 Park Ave, Coimbatore', 'Segment': 'REGULAR', 'Language': 'ta' },
      { 'Customer Name': 'Priya Sharma', 'Mobile Number': '9988776655', 'Email': 'priya@example.com', 'Address': '78 High Rd, Erode', 'Segment': 'LOYAL', 'Language': 'en' }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'renic_customer_import_template.xlsx');
  };

  // Recalculate row statuses based on duplicates and phone validity
  const recalculateRows = (rows, existingPhones) => {
    const seenInFile = new Map();
    return rows.map((r, idx) => {
      const digits = (r.phone || '').replace(/\D/g, '');
      const cleanPhone = digits.length >= 10 ? digits.slice(-10) : digits;

      let status = 'valid';
      let statusMsg = 'Ready to import';

      if (!cleanPhone || cleanPhone.length !== 10) {
        status = 'invalid';
        statusMsg = `Invalid phone (${cleanPhone.length} digits, must be 10)`;
      } else if (seenInFile.has(cleanPhone)) {
        status = 'duplicate_file';
        statusMsg = `Duplicate in this file (same as row ${seenInFile.get(cleanPhone) + 1})`;
      } else if (existingPhones.has(cleanPhone)) {
        status = 'duplicate_db';
        statusMsg = 'Already exists in customer database';
      } else {
        seenInFile.set(cleanPhone, idx);
      }

      return {
        ...r,
        phone: cleanPhone,
        status,
        statusMsg
      };
    });
  };

  // Handle file selection and live preview parsing
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setPreviewLoading(true);
    setImportErrors([]);

    try {
      // 1. Fetch all existing customer phone numbers to check DB duplicates
      const existingRes = await apiClient.get('/customers?limit=5000');
      const existingList = existingRes.data?.customers || [];
      const existingPhones = new Set(existingList.map(c => (c.phone || '').replace(/\D/g, '').slice(-10)));
      setDbPhoneSet(existingPhones);

      // 2. Parse file buffer with XLSX
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      if (rawData.length === 0) {
        setSnackbar({ open: true, message: 'The uploaded file contains no data rows.', severity: 'warning' });
        setParsedRows([]);
        return;
      }

      // 3. Map into clean editable rows
      const initialRows = rawData.map((r, idx) => {
        const keys = Object.keys(r);
        const nameKey = keys.find(k => /name|customer/i.test(k)) || keys[0];
        const phoneKey = keys.find(k => /phone|mobile|contact|number|whatsapp/i.test(k)) || keys[1];
        const emailKey = keys.find(k => /email/i.test(k)) || '';
        const addressKey = keys.find(k => /address|location|city/i.test(k)) || '';
        const segmentKey = keys.find(k => /segment|tier|type|status/i.test(k)) || '';

        const name = String(r[nameKey] || '').trim();
        const rawPhone = String(r[phoneKey] || '').trim();
        const email = String(r[emailKey] || '').trim();
        const address = String(r[addressKey] || '').trim();
        const segment = String(r[segmentKey] || 'NEW').trim().toUpperCase();

        return {
          id: idx,
          name: name || `Customer`,
          phone: rawPhone,
          email,
          address,
          segment: ['VIP', 'LOYAL', 'REGULAR', 'AT_RISK', 'INACTIVE', 'NEW'].includes(segment) ? segment : 'NEW'
        };
      });

      const validated = recalculateRows(initialRows, existingPhones);
      setParsedRows(validated);
    } catch (err) {
      console.error('File parsing error:', err);
      setSnackbar({ open: true, message: 'Failed to parse file. Please upload a valid CSV or XLSX file.', severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpdateParsedRow = (idx, field, value) => {
    const updated = parsedRows.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    const revalidated = recalculateRows(updated, dbPhoneSet);
    setParsedRows(revalidated);
  };

  const handleRemoveParsedRow = (idx) => {
    const updated = parsedRows.filter((_, i) => i !== idx);
    const revalidated = recalculateRows(updated, dbPhoneSet);
    setParsedRows(revalidated);
  };

  // Submit valid records from the preview list
  const handleImportCSV = async () => {
    const validRows = parsedRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      setSnackbar({ open: true, message: 'No valid customer rows to import. Please fix invalid/duplicate rows.', severity: 'warning' });
      return;
    }

    try {
      setImporting(true);
      setImportErrors([]);

      // Create a clean Excel file from valid records
      const exportData = validRows.map(r => ({
        'Customer Name': r.name,
        'Mobile Number': r.phone,
        'Email': r.email,
        'Address': r.address,
        'Segment': r.segment
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const cleanFile = new File([blob], 'clean_customers.xlsx', { type: blob.type });

      const data = new FormData();
      data.append('file', cleanFile);

      const response = await apiClient.post('/customers/import/csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.errors > 0 && (!response.data.imported || response.data.imported === 0)) {
        setImportErrors(response.data.errorDetails || []);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || `Successfully imported ${response.data.imported || validRows.length} customers!`,
          severity: 'success'
        });
        setImportDialogOpen(false);
        setCsvFile(null);
        setParsedRows([]);
        fetchCustomers();
      }
    } catch (error) {
      console.error('Import Error:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to import customers', severity: 'error' });
    } finally {
      setImporting(false);
    }
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

  const isDetailOpen = Boolean(selectedCustomer || isCreateMode);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
      
      {/* ========================================================
          TOP HEADER BAR & KPI STRIP
          ======================================================== */}
      <Box sx={{ px: 2.5, py: 1.2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1.2rem' }}>
            👥
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem', lineHeight: 1.2 }}>
              Customer Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              {stats.total.toLocaleString()} total customer profiles · SAP DM Object Page layout
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Search name, phone, email..."
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
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
              value={selectedSegment}
              onChange={(e) => {
                setSelectedSegment(e.target.value);
                setPage(1);
              }}
              displayEmpty
              sx={{ fontSize: '0.82rem', height: 34, bgcolor: '#F8FAFC' }}
            >
              <MenuItem value="">All Segments</MenuItem>
              <MenuItem value="VIP">⭐ VIP</MenuItem>
              <MenuItem value="LOYAL">💎 Loyal</MenuItem>
              <MenuItem value="REGULAR">Regular</MenuItem>
              <MenuItem value="NEW">✨ New</MenuItem>
              <MenuItem value="AT_RISK">⚠️ At Risk</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
            size="small"
            onClick={() => {
              setImportDialogOpen(true);
              setImportErrors([]);
              setCsvFile(null);
            }}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', height: 34, borderRadius: '7px', borderColor: '#CBD5E1', color: '#334155' }}
          >
            Import CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            size="small"
            onClick={handleOpenCreatePanel}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              height: 34,
              borderRadius: '7px',
              bgcolor: '#16A34A',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(22,163,74,0.2)',
              '&:hover': { bgcolor: '#15803D' }
            }}
          >
            Add Customer
          </Button>
        </Stack>
      </Box>

      {/* KPI Status Strip */}
      <Box sx={{ px: 2.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 3, borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflowX: 'auto' }}>
        {[
          { label: 'Total Records', value: stats.total, color: '#2563EB', icon: <PeopleIcon sx={{ fontSize: 17 }} /> },
          { label: 'VIP Customers', value: stats.vip, color: '#DC2626', icon: <StarIcon sx={{ fontSize: 17 }} /> },
          { label: 'Loyal Clients', value: stats.loyal, color: '#16A34A', icon: <TrendingUpIcon sx={{ fontSize: 17 }} /> },
          { label: 'New Cohort', value: stats.new, color: '#7C3AED', icon: <AddIcon sx={{ fontSize: 17 }} /> }
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'max-content' }}>
            <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 700, fontSize: '0.66rem', lineHeight: 1, textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2, color: item.color }}>
                {item.value.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Loading Progress Bar */}
      {loading && (
        <Box sx={{ height: 3, bgcolor: '#E2E8F0', overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: '30%', bgcolor: '#16A34A', animation: 'sapBar 1s linear infinite', '@keyframes sapBar': { from: { marginLeft: '-30%' }, to: { marginLeft: '100%' } } }} />
        </Box>
      )}

      {/* ========================================================
          TWO-SPLIT / MID-COLUMN MASTER-DETAIL MAIN BODY
          ======================================================== */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        
        {/* ----------------------------------------------------
            LEFT / MASTER COLUMN: Table of Customers
            ---------------------------------------------------- */}
        <Box
          sx={{
            display: isPanelMaximized ? 'none' : 'flex',
            flexDirection: 'column',
            width: isDetailOpen ? { xs: '100%', md: '42%', lg: '38%' } : '100%',
            height: '100%',
            borderRight: isDetailOpen ? '1px solid #E2E8F0' : 'none',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <TableContainer ref={gridRef} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 42, bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    <Checkbox
                      size="small"
                      indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < customers.length && !selectAllAcrossPages}
                      checked={selectAllAcrossPages || (customers.length > 0 && selectedCustomerIds.length === customers.length)}
                      onChange={toggleSelectAllCustomers}
                    />
                  </TableCell>
                  <TableCell sx={{ width: isDetailOpen ? '45%' : '26%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ width: isDetailOpen ? '35%' : '20%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    Contact & Phone
                  </TableCell>
                  {!isDetailOpen && (
                    <>
                      <TableCell sx={{ width: '12%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        Segment
                      </TableCell>
                      <TableCell align="right" sx={{ width: '12%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        Total Spent
                      </TableCell>
                      <TableCell align="right" sx={{ width: '10%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        Purchases
                      </TableCell>
                      <TableCell sx={{ width: '8%', py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        Lang
                      </TableCell>
                    </>
                  )}
                  <TableCell align="center" sx={{ width: isDetailOpen ? 60 : 100, py: 1, fontWeight: 700, fontSize: '0.78rem', color: '#475569', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isDetailOpen ? 4 : 7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No customers found. Click <strong>Add Customer</strong> to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((cust) => {
                    const isRowSelected = selectedCustomer?._id === cust._id;
                    const isChecked = selectAllAcrossPages || selectedCustomerIds.includes(cust._id);
                    const segStyle = SEGMENT_COLORS[cust.rfmSegment] || SEGMENT_COLORS.NEW;

                    return (
                      <TableRow
                        key={cust._id}
                        hover
                        onClick={() => handleSelectCustomerRow(cust)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isRowSelected ? '#F0FDF4 !important' : isChecked ? '#F8FAFC' : 'inherit',
                          borderLeft: isRowSelected ? '4px solid #16A34A' : '4px solid transparent',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: isRowSelected ? '#DCFCE7 !important' : '#F1F5F9' }
                        }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={isChecked}
                            onChange={() => toggleSelectCustomer(cust._id)}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                bgcolor: isRowSelected ? '#16A34A' : '#0284C7',
                                color: '#FFFFFF'
                              }}
                            >
                              {getAvatarInitial(cust)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getDisplayName(cust)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cust.email || 'No email registered'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                              {cust.phone}
                            </Typography>
                            <CopyButton
                              text={cust.phone}
                              tooltip="Copy Phone Number"
                              size="small"
                              onCopied={() => setSnackbar({ open: true, message: `Copied ${cust.phone} to clipboard!`, severity: 'success' })}
                            />
                          </Stack>
                          {isDetailOpen && (
                            <Chip
                              label={cust.rfmSegment || 'NEW'}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: segStyle.bg,
                                color: segStyle.color,
                                border: `1px solid ${segStyle.border}`,
                                mt: 0.3
                              }}
                            />
                          )}
                        </TableCell>

                        {!isDetailOpen && (
                          <>
                            <TableCell sx={{ py: 1 }}>
                              <Chip
                                label={cust.rfmSegment || 'NEW'}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  bgcolor: segStyle.bg,
                                  color: segStyle.color,
                                  border: `1px solid ${segStyle.border}`
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ py: 1, fontWeight: 700, fontSize: '0.8rem', color: '#0F172A' }}>
                              ₹{(cust.totalSpent || 0).toLocaleString()}
                            </TableCell>

                            <TableCell align="right" sx={{ py: 1, fontSize: '0.8rem', color: '#475569' }}>
                              {cust.totalPurchases || 0}
                            </TableCell>

                            <TableCell sx={{ py: 1 }}>
                              <Chip
                                label={(cust.language || 'en').toUpperCase()}
                                size="small"
                                variant="outlined"
                                sx={{ height: 19, fontSize: '0.65rem', fontWeight: 700, borderColor: '#CBD5E1' }}
                              />
                            </TableCell>
                          </>
                        )}

                        <TableCell align="center" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.3} justifyContent="center">
                            <Tooltip title="Chat on WhatsApp">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => navigate('/conversations', { state: { customerId: cust._id } })}
                              >
                                <MessageIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            {!isDetailOpen && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeleteId(cust._id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Master Table Pagination Footer */}
          <Box sx={{ px: 2, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexShrink: 0 }}>
            {selectedCustomerIds.length > 0 ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {selectAllAcrossPages ? `All ${stats.total} selected` : `${selectedCount} selected`}
                </Typography>
                <Button
                  size="small"
                  color="success"
                  startIcon={<MessageIcon sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    setSelectedTemplateId('');
                    setBulkChannel('whatsapp');
                    setOpenBulkDialog(true);
                  }}
                  sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, py: 0.2 }}
                >
                  Broadcast
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, py: 0.2 }}
                >
                  Delete
                </Button>
                <Button
                  size="small"
                  color="warning"
                  onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
                  sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, py: 0.2 }}
                >
                  Status
                </Button>
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Page {page} of {totalPages} ({stats.total} records)
              </Typography>
            )}

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

        {/* ----------------------------------------------------
            RIGHT / DETAIL COLUMN: SAP DM OBJECT PAGE
            ---------------------------------------------------- */}
        {isDetailOpen && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              height: '100%',
              bgcolor: '#FFFFFF',
              overflow: 'hidden',
              boxShadow: '-4px 0 16px rgba(0,0,0,0.04)',
              zIndex: 5
            }}
          >
            {/* SAP DM Top Navigation / Action Bar */}
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
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#16A34A',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}
                >
                  {isCreateMode ? '+' : getAvatarInitial(selectedCustomer)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem', lineHeight: 1.1 }}>
                    {isCreateMode ? 'Create New Customer' : getDisplayName(selectedCustomer)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {isCreateMode ? 'Fill in profile fields & WhatsApp preferences' : `Customer ID: ${selectedCustomer?._id || 'N/A'}`}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                {/* Mode Actions */}
                {!isEditMode && !isCreateMode ? (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<MessageIcon sx={{ fontSize: 14 }} />}
                      onClick={() => navigate('/conversations', { state: { customerId: selectedCustomer?._id } })}
                      sx={{ bgcolor: '#0284C7', color: '#FFF', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5 }}
                    >
                      Chat
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setIsEditMode(true)}
                      sx={{ borderColor: '#475569', color: '#E2E8F0', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5, '&:hover': { borderColor: '#94A3B8' } }}
                    >
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (isCreateMode) {
                          handleCloseDetailPanel();
                        } else {
                          setIsEditMode(false);
                        }
                      }}
                      sx={{ borderColor: '#475569', color: '#E2E8F0', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 14 }} />}
                      disabled={submitting}
                      onClick={handleSaveCustomer}
                      sx={{ bgcolor: '#16A34A', color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', px: 2, '&:hover': { bgcolor: '#15803D' } }}
                    >
                      {submitting ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </>
                )}

                <Divider orientation="vertical" flexItem sx={{ bgcolor: '#334155', my: 0.5 }} />

                {/* Maximize / Restore */}
                <Tooltip title={isPanelMaximized ? 'Restore Side-by-Side View' : 'Maximize Full Screen'}>
                  <IconButton
                    size="small"
                    onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                    sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}
                  >
                    {isPanelMaximized ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Close Panel */}
                <Tooltip title="Close Panel">
                  <IconButton
                    size="small"
                    onClick={handleCloseDetailPanel}
                    sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Quick URL & Phone Copy Hub Banner */}
            {!isCreateMode && selectedCustomer && (
              <Box sx={{ px: 2.5, py: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  {/* Copy Phone */}
                  <CopyButton
                    variant="chip"
                    text={selectedCustomer.phone}
                    label={`Phone: ${selectedCustomer.phone}`}
                    onCopied={() => setSnackbar({ open: true, message: 'Phone number copied to clipboard!', severity: 'success' })}
                  />

                  {/* Copy Direct WhatsApp Link */}
                  <CopyButton
                    variant="chip"
                    text={`https://wa.me/${(selectedCustomer.whatsappNumber || selectedCustomer.phone || '').replace(/\D/g, '')}`}
                    label="WA Direct URL"
                    tooltip="Copy WhatsApp Direct Chat Link"
                    onCopied={() => setSnackbar({ open: true, message: 'WhatsApp Direct Chat Link copied!', severity: 'success' })}
                  />

                  {/* Copy Customer ID */}
                  <CopyButton
                    variant="chip"
                    text={selectedCustomer._id}
                    label={`ID: ${selectedCustomer._id.slice(-6)}`}
                    tooltip="Copy Customer ID"
                    onCopied={() => setSnackbar({ open: true, message: 'Customer ID copied!', severity: 'success' })}
                  />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`Segment: ${selectedCustomer.rfmSegment || 'NEW'}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      bgcolor: SEGMENT_COLORS[selectedCustomer.rfmSegment]?.bg || '#F1F5F9',
                      color: SEGMENT_COLORS[selectedCustomer.rfmSegment]?.color || '#475569',
                      border: `1px solid ${SEGMENT_COLORS[selectedCustomer.rfmSegment]?.border || '#E2E8F0'}`
                    }}
                  />
                  <Chip
                    label={`Tier: ${selectedCustomer.loyaltyTier || 'BRONZE'}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      bgcolor: LOYALTY_TIER_COLORS[selectedCustomer.loyaltyTier]?.bg || '#F1F5F9',
                      color: LOYALTY_TIER_COLORS[selectedCustomer.loyaltyTier]?.color || '#475569'
                    }}
                  />
                </Stack>
              </Box>
            )}

            {/* ========================================================
                SAP DM STICKY ANCHOR HEADER TABS (SINGLE PAGE SCROLL)
                ======================================================== */}
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
                    '&.Mui-selected': { color: '#16A34A' }
                  },
                  '& .MuiTabs-indicator': { bgcolor: '#16A34A', height: 3 }
                }}
              >
                <Tab label="1. General Info" onClick={() => handleScrollToSection(0, 'sec-general')} />
                <Tab label="2. Contact & Channels" onClick={() => handleScrollToSection(1, 'sec-contact')} />
                <Tab label="3. RFM & Loyalty" onClick={() => handleScrollToSection(2, 'sec-rfm')} />
                <Tab label="4. Location" onClick={() => handleScrollToSection(3, 'sec-location')} />
                <Tab label="5. Purchases & Metrics" onClick={() => handleScrollToSection(4, 'sec-purchases')} />
                <Tab label="6. Tags & Notes" onClick={() => handleScrollToSection(5, 'sec-tags')} />
              </Tabs>
            </Box>

            {/* ========================================================
                SINGLE SCROLLABLE OBJECT CONTENT CONTAINER
                ======================================================== */}
            <Box
              ref={detailScrollRef}
              onScroll={handlePanelScroll}
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                p: 3,
                bgcolor: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {/* ----------------------------------------------------
                  SECTION 1: GENERAL INFORMATION
                  ---------------------------------------------------- */}
              <Paper id="sec-general" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon sx={{ color: '#16A34A', fontSize: 20 }} /> 1. General Profile Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name *"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
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
                      disabled={!isEditMode}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Sharma"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Preferred Language</InputLabel>
                      <Select
                        disabled={!isEditMode}
                        value={formData.language}
                        label="Preferred Language"
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

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Created Timestamp"
                      fullWidth
                      size="small"
                      disabled
                      value={selectedCustomer?.createdAt ? new Date(selectedCustomer.createdAt).toLocaleString() : 'Pending Creation'}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* ----------------------------------------------------
                  SECTION 2: CONTACT & WHATSAPP CHANNELS
                  ---------------------------------------------------- */}
              <Paper id="sec-contact" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 20 }} /> 2. Contact Details & Channels
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number *"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                      slotProps={{
                        input: {
                          endAdornment: formData.phone && (
                            <InputAdornment position="end">
                              <CopyButton
                                text={formData.phone}
                                tooltip="Copy Phone"
                                onCopied={() => setSnackbar({ open: true, message: 'Phone copied!', severity: 'success' })}
                              />
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="WhatsApp Number"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="9876543210"
                      slotProps={{
                        input: {
                          endAdornment: formData.phone && formData.phone !== formData.whatsappNumber && isEditMode && (
                            <InputAdornment position="end">
                              <Button
                                size="small"
                                onClick={() => setFormData({ ...formData, whatsappNumber: formData.phone })}
                                sx={{ textTransform: 'none', fontSize: '0.7rem', p: 0 }}
                              >
                                Same as Phone
                              </Button>
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      fullWidth
                      size="small"
                      type="email"
                      disabled={!isEditMode}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="customer@example.com"
                      slotProps={{
                        input: {
                          endAdornment: formData.email && (
                            <InputAdornment position="end">
                              <CopyButton
                                text={formData.email}
                                tooltip="Copy Email"
                                onCopied={() => setSnackbar({ open: true, message: 'Email copied!', severity: 'success' })}
                              />
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Instagram Handle"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.instagramHandle}
                      onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                      placeholder="@username"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* ----------------------------------------------------
                  SECTION 3: RFM SCORING & LOYALTY TIER
                  ---------------------------------------------------- */}
              <Paper id="sec-rfm" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StarIcon sx={{ color: '#D97706', fontSize: 20 }} /> 3. RFM Scoring & Loyalty Status
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>RFM Segment</InputLabel>
                      <Select
                        disabled={!isEditMode}
                        value={formData.rfmSegment}
                        label="RFM Segment"
                        onChange={(e) => setFormData({ ...formData, rfmSegment: e.target.value })}
                      >
                        <MenuItem value="VIP">⭐ VIP Client</MenuItem>
                        <MenuItem value="LOYAL">💎 Loyal Repeat Customer</MenuItem>
                        <MenuItem value="REGULAR">Regular Active Buyer</MenuItem>
                        <MenuItem value="NEW">✨ New First-Time Lead</MenuItem>
                        <MenuItem value="AT_RISK">⚠️ At Risk (Inactive)</MenuItem>
                        <MenuItem value="INACTIVE">💤 Dormant / Inactive</MenuItem>
                        <MenuItem value="LOST">❌ Lost Customer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Loyalty Tier</InputLabel>
                      <Select
                        disabled={!isEditMode}
                        value={formData.loyaltyTier}
                        label="Loyalty Tier"
                        onChange={(e) => setFormData({ ...formData, loyaltyTier: e.target.value })}
                      >
                        <MenuItem value="BRONZE">🥉 Bronze Tier</MenuItem>
                        <MenuItem value="SILVER">🥈 Silver Tier</MenuItem>
                        <MenuItem value="GOLD">🥇 Gold Tier</MenuItem>
                        <MenuItem value="DIAMOND">💎 Diamond VIP Tier</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Loyalty Points Earned"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={!isEditMode}
                      value={formData.loyaltyPoints}
                      onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number(e.target.value) })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Lifetime Total Spent (₹)"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={!isEditMode}
                      value={formData.totalSpent}
                      onChange={(e) => setFormData({ ...formData, totalSpent: Number(e.target.value) })}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* ----------------------------------------------------
                  SECTION 4: LOCATION & DEMOGRAPHICS
                  ---------------------------------------------------- */}
              <Paper id="sec-location" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOnIcon sx={{ color: '#2563EB', fontSize: 20 }} /> 4. Location & Address
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Street Address"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.location?.address || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                      placeholder="e.g. 124 Diamond Plaza, M.G. Road"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.location?.city || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                      placeholder="e.g. Mumbai"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="State / Province"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.location?.state || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                      placeholder="e.g. Maharashtra"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Pincode / Zipcode"
                      fullWidth
                      size="small"
                      disabled={!isEditMode}
                      value={formData.location?.zipcode || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, zipcode: e.target.value } })}
                      placeholder="400001"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Geographic Region</InputLabel>
                      <Select
                        disabled={!isEditMode}
                        value={formData.region || 'North'}
                        label="Geographic Region"
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      >
                        <MenuItem value="North">North India</MenuItem>
                        <MenuItem value="South">South India</MenuItem>
                        <MenuItem value="East">East India</MenuItem>
                        <MenuItem value="West">West India</MenuItem>
                        <MenuItem value="Northeast">Northeast India</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              {/* ----------------------------------------------------
                  SECTION 5: PURCHASES & ENGAGEMENT METRICS
                  ---------------------------------------------------- */}
              <Paper id="sec-purchases" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShoppingBagIcon sx={{ color: '#059669', fontSize: 20 }} /> 5. Purchases & Interaction Analytics
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>TOTAL ORDERS</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                        {selectedCustomer?.totalPurchases || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>MESSAGES SENT</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284C7', mt: 0.5 }}>
                        {selectedCustomer?.messagesSentCount || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>MESSAGES READ</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
                        {selectedCustomer?.messagesReadCount || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>AVG ORDER VALUE</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
                        ₹{(selectedCustomer?.averageOrderValue || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* ----------------------------------------------------
                  SECTION 6: TAGS & INTERNAL NOTES
                  ---------------------------------------------------- */}
              <Paper id="sec-tags" elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalOfferIcon sx={{ color: '#7C3AED', fontSize: 20 }} /> 6. Tags & CRM Notes
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                    Customer Segment Tags:
                  </Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    {(formData.tags || []).map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        size="small"
                        onDelete={isEditMode ? () => handleRemoveTag(t) : undefined}
                        sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 700 }}
                      />
                    ))}
                    {(formData.tags || []).length === 0 && (
                      <Typography variant="caption" color="text.secondary">No custom tags added.</Typography>
                    )}
                  </Stack>

                  {isEditMode && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        placeholder="Add new tag (e.g. Bridal, Wholesale)..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        sx={{ width: 280 }}
                      />
                      <Button size="small" variant="outlined" onClick={handleAddTag} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        + Add Tag
                      </Button>
                    </Stack>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                    Internal CRM Notes &amp; Follow-up Remarks:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    disabled={!isEditMode}
                    placeholder="Enter customer preferences, wedding dates, jewelry preferences, follow-up instructions..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Box>
              </Paper>
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
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                {isCreateMode
                  ? 'Draft Customer Profile'
                  : selectedCustomer?.updatedAt
                    ? `Last updated: ${new Date(selectedCustomer.updatedAt).toLocaleDateString()}`
                    : 'Customer Record Loaded'}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (isCreateMode) {
                      handleCloseDetailPanel();
                    } else if (isEditMode) {
                      setIsEditMode(false);
                    } else {
                      handleCloseDetailPanel();
                    }
                  }}
                  sx={{ borderColor: '#CBD5E1', color: '#475569', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {isEditMode || isCreateMode ? 'Cancel' : 'Close'}
                </Button>
                {isEditMode || isCreateMode ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 15 }} />}
                    disabled={submitting}
                    onClick={handleSaveCustomer}
                    sx={{ bgcolor: '#16A34A', color: '#FFF', textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', px: 2.5, '&:hover': { bgcolor: '#15803D' } }}
                  >
                    {submitting ? 'Saving...' : 'Save Customer'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setIsEditMode(true)}
                    sx={{ bgcolor: '#0284C7', color: '#FFF', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, '&:hover': { bgcolor: '#0369A1' } }}
                  >
                    Edit Customer
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* ========================================================
          MODALS & DIALOGS
          ======================================================== */}

      {/* Bulk Message Dialog */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0F172A', color: '#FFFFFF', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageIcon sx={{ color: '#FFFFFF', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                Broadcast Template Message
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Sending to {selectedCount} targeted recipient(s)
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setOpenBulkDialog(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          <Stack spacing={2.5} mt={1}>
            <Alert severity="info" sx={{ borderRadius: '8px' }}>
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
              <Box sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>
                  LIVE TEMPLATE PREVIEW:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#0F172A', fontSize: '0.85rem' }}>
                  {templates.find(t => t._id === selectedTemplateId)?.content || ''}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setOpenBulkDialog(false)} disabled={bulkSending} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={bulkSending || !selectedTemplateId}
            onClick={handleBulkSend}
            sx={{ bgcolor: '#16A34A', color: '#FFFFFF', textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#15803D' } }}
          >
            {bulkSending ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV / Excel Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0F172A', color: '#FFFFFF', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UploadIcon sx={{ color: '#84cc16' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
              Import Customers from Excel / CSV
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSampleTemplate}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '8px',
                '&:hover': { borderColor: '#84cc16', color: '#84cc16', bgcolor: 'rgba(132,204,22,0.1)' }
              }}
            >
              Download Template (.xlsx)
            </Button>
            <IconButton size="small" onClick={() => setImportDialogOpen(false)} sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          <Stack spacing={2.5}>
            {/* File Upload Box */}
            <Box
              sx={{
                p: parsedRows.length > 0 ? 1.5 : 3,
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                textAlign: 'center',
                bgcolor: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#84cc16', bgcolor: '#F0FDF4' }
              }}
            >
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                id="csv-file-input"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <UploadIcon sx={{ fontSize: parsedRows.length > 0 ? 24 : 36, color: '#16A34A', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {csvFile ? `Selected: ${csvFile.name}` : 'Click to select CSV or Excel (.xlsx) file'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {parsedRows.length > 0 ? 'Click to choose a different file' : 'Columns: Customer Name, Mobile Number, Email, Address, Segment'}
                </Typography>
              </label>
            </Box>

            {/* Loading Indicator */}
            {previewLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#16A34A' }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  Analyzing records and checking for duplicates...
                </Typography>
              </Box>
            )}

            {/* Duplicate & Validation Summary Banner */}
            {parsedRows.length > 0 && !previewLoading && (() => {
              const validCount = parsedRows.filter(r => r.status === 'valid').length;
              const fileDupCount = parsedRows.filter(r => r.status === 'duplicate_file').length;
              const dbDupCount = parsedRows.filter(r => r.status === 'duplicate_db').length;
              const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;
              const totalDuplicates = fileDupCount + dbDupCount;

              return (
                <Stack spacing={2}>
                  {/* Status Metric Pills */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    <Chip
                      label={`Total Rows: ${parsedRows.length}`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#E2E8F0', color: '#334155' }}
                    />
                    <Chip
                      label={`✓ Valid: ${validCount}`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
                    />
                    {fileDupCount > 0 && (
                      <Chip
                        label={`⚠️ Duplicates in File: ${fileDupCount}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}
                      />
                    )}
                    {dbDupCount > 0 && (
                      <Chip
                        label={`⚠️ Already in Database: ${dbDupCount}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: '#FFEDD5', color: '#C2410C', border: '1px solid #FDBA74' }}
                      />
                    )}
                    {invalidCount > 0 && (
                      <Chip
                        label={`❌ Invalid Phone: ${invalidCount}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}
                      />
                    )}
                  </Box>

                  {/* Warning Alert Banner for Duplicates */}
                  {totalDuplicates > 0 && (
                    <Alert
                      severity="warning"
                      icon={<WarningAmberIcon />}
                      sx={{ borderRadius: '10px', fontSize: '0.8rem', py: 0.5 }}
                    >
                      <strong>{totalDuplicates} duplicate customer phone numbers detected.</strong> Duplicate rows will be skipped during import. You can edit the phone numbers in the table below to correct them.
                    </Alert>
                  )}

                  {/* Interactive Inline Correction Table */}
                  <Paper variant="outlined" sx={{ borderRadius: '10px', maxHeight: 320, overflow: 'auto', border: '1px solid #CBD5E1' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', width: 40 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', minWidth: 140 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', minWidth: 160 }}>Customer Name</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', minWidth: 150 }}>Mobile Number (10 Digits)</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', minWidth: 160 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', width: 100 }}>Segment</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9', width: 50, textAlign: 'center' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parsedRows.map((row, idx) => {
                          const isDup = row.status === 'duplicate_file' || row.status === 'duplicate_db';
                          const isInvalid = row.status === 'invalid';

                          return (
                            <TableRow
                              key={idx}
                              sx={{
                                bgcolor: isInvalid ? '#FEF2F2' : (isDup ? '#FFFBEB' : '#FFFFFF'),
                                '&:hover': { bgcolor: isInvalid ? '#FEE2E2' : (isDup ? '#FEF3C7' : '#F8FAFC') }
                              }}
                            >
                              <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                              <TableCell>
                                <Chip
                                  label={row.statusMsg}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    height: 22,
                                    bgcolor: row.status === 'valid' ? '#DCFCE7' : (isInvalid ? '#FEE2E2' : '#FEF3C7'),
                                    color: row.status === 'valid' ? '#166534' : (isInvalid ? '#991B1B' : '#92400E')
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.name}
                                  onChange={(e) => handleUpdateParsedRow(idx, 'name', e.target.value)}
                                  slotProps={{ input: { sx: { fontSize: '0.8rem', py: 0.2, bgcolor: '#FFFFFF', borderRadius: '6px' } } }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.phone}
                                  onChange={(e) => handleUpdateParsedRow(idx, 'phone', e.target.value)}
                                  error={isInvalid || isDup}
                                  placeholder="10 digit number"
                                  slotProps={{ input: { sx: { fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, py: 0.2, bgcolor: '#FFFFFF', borderRadius: '6px' } } }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.email}
                                  onChange={(e) => handleUpdateParsedRow(idx, 'email', e.target.value)}
                                  slotProps={{ input: { sx: { fontSize: '0.8rem', py: 0.2, bgcolor: '#FFFFFF', borderRadius: '6px' } } }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.segment}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    bgcolor: SEGMENT_COLORS[row.segment]?.bg || '#F1F5F9',
                                    color: SEGMENT_COLORS[row.segment]?.color || '#475569'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <IconButton size="small" color="error" onClick={() => handleRemoveParsedRow(idx)} title="Remove row">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Paper>
                </Stack>
              );
            })()}

            {importErrors.length > 0 && (
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                <Typography variant="caption" fontWeight={700}>Import encountered errors:</Typography>
                {importErrors.slice(0, 5).map((err, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: 'block' }}>• {err}</Typography>
                ))}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Box>
            {parsedRows.length > 0 && (
              <Button
                onClick={() => { setCsvFile(null); setParsedRows([]); }}
                disabled={importing}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#DC2626' }}
              >
                Clear File
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button onClick={() => setImportDialogOpen(false)} disabled={importing} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={importing || parsedRows.filter(r => r.status === 'valid').length === 0}
              onClick={handleImportCSV}
              sx={{ bgcolor: '#16A34A', color: '#FFFFFF', textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#15803D' } }}
            >
              {importing
                ? 'Importing Customers...'
                : `Import ${parsedRows.filter(r => r.status === 'valid').length} Valid Customer(s)`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>Delete Customer Profile?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this customer? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteId && handleDeleteCustomer(deleteId)} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>Bulk Delete Customers?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selectedCount}</strong> selected customer(s)?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Delete Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Menu */}
      <Menu anchorEl={statusMenuAnchor} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}>
        <MenuItem onClick={() => handleBulkUpdateStatus('VIP')}>⭐ Mark as VIP</MenuItem>
        <MenuItem onClick={() => handleBulkUpdateStatus('LOYAL')}>💎 Mark as Loyal</MenuItem>
        <MenuItem onClick={() => handleBulkUpdateStatus('REGULAR')}>Mark as Regular</MenuItem>
        <MenuItem onClick={() => handleBulkUpdateStatus('AT_RISK')}>⚠️ Mark as At Risk</MenuItem>
        <MenuItem onClick={() => handleBulkUpdateStatus('INACTIVE')}>Mark as Inactive</MenuItem>
      </Menu>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
