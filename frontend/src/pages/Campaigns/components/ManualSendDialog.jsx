import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Checkbox,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import apiClient from '../../../api/client';

/**
 * ManualSendDialog Component
 * Premium Google/Microsoft-style dialog to execute bulk manual sends to targeted customers.
 */
const ManualSendDialog = React.memo(({
  open = false,
  campaign,
  onClose = () => {},
  onSuccess = () => {}
}) => {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Sending states
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Fetch customers matching criteria
  const fetchCustomers = useCallback(async (searchQuery = search, segmentQuery = segment) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100
      };
      if (segmentQuery) params.segment = segmentQuery;
      if (searchQuery) params.search = searchQuery;
      
      const res = await apiClient.get('/customers', { params });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers for manual send:', err);
    } finally {
      setLoading(false);
    }
  }, [search, segment]);

  // Load customers when dialog opens
  useEffect(() => {
    if (open && campaign) {
      setSearch('');
      setSegment(campaign.targetAudience?.segments?.[0] || '');
      const preSelectedIds = campaign.targetAudience?.customFilter?.targetedCustomerIds || [];
      setSelectedIds(preSelectedIds);
      setSelectAllFiltered(false);
      setSendResult(null);
      setSending(false);
      fetchCustomers('', campaign.targetAudience?.segments?.[0] || '');
    }
  }, [open, campaign, fetchCustomers]);

  if (!campaign) return null;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchClick = () => {
    fetchCustomers(search, segment);
  };

  const handleSegmentChange = (e) => {
    const nextSegment = e.target.value;
    setSegment(nextSegment);
    setSelectedIds([]);
    fetchCustomers(search, nextSegment);
  };

  const handleCheckboxToggle = (customerId) => {
    if (selectAllFiltered) return;
    if (selectedIds.includes(customerId)) {
      setSelectedIds(selectedIds.filter(id => id !== customerId));
    } else {
      setSelectedIds([...selectedIds, customerId]);
    }
  };

  const handleSelectAllToggle = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSend = async () => {
    if (!selectAllFiltered && selectedIds.length === 0) return;
    
    try {
      setSending(true);
      setSendResult(null);
      
      const response = await apiClient.post(`/campaigns/${campaign._id}/manual-send`, {
        customerIds: selectAllFiltered ? [] : selectedIds,
        sendToAll: selectAllFiltered,
        segmentFilter: segment || null,
        searchTerm: search || null
      });

      setSendResult({
        success: true,
        message: response.data?.message || 'Manual send executed successfully',
        successCount: response.data?.successCount || 0,
        failCount: response.data?.failCount || 0
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to execute bulk send:', error);
      setSendResult({
        success: false,
        message: error.response?.data?.error || 'Failed to complete manual send request.'
      });
    } finally {
      setSending(false);
    }
  };

  const selectedCount = selectAllFiltered ? 'All Filtered' : selectedIds.length;

  return (
    <Dialog
      open={open}
      onClose={sending ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2.5,
        borderBottom: '1px solid #E5E7EB',
        bgcolor: '#F9FAFB'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" /> Bulk Campaign Sender
        </Typography>
        {!sending && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {sendResult ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            {sendResult.success ? (
              <Box>
                <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1F2937' }}>
                  Bulk Sending Completed!
                </Typography>
                <Typography variant="body2" sx={{ color: '#4B5563', mb: 3 }}>
                  {sendResult.message}
                </Typography>
                <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 2 }}>
                  <Paper sx={{ p: 2, px: 4, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#047857' }}>
                      {sendResult.successCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Sent Successfully</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, px: 4, bgcolor: '#FEF2F2', border: '1px solid #FEE2E2', textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#B91C1C' }}>
                      {sendResult.failCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600 }}>Failed</Typography>
                  </Paper>
                </Stack>
              </Box>
            ) : (
              <Box>
                <WarningIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1F2937' }}>
                  Execution Failed
                </Typography>
                <Typography variant="body2" sx={{ color: '#EF4444', mb: 3 }}>
                  {sendResult.message}
                </Typography>
              </Box>
            )}
          </Box>
        ) : sending ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Sending Messages...
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
              Please wait while we queue and send campaign messages to selected customers.
            </Typography>
            <LinearProgress sx={{ width: '80%', mx: 'auto', borderRadius: '4px', height: '6px' }} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {/* Campaign info alert */}
            {campaign.messageContent && (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #BFDBFE', bgcolor: '#EFF6FF' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', display: 'block', mb: 0.5 }}>
                  CAMPAIGN MESSAGE PREVIEW
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E3A8A', whiteSpace: 'pre-wrap' }}>
                  {campaign.messageContent}
                </Typography>
              </Alert>
            )}

            {/* Filter controls */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Search Customers"
                size="small"
                fullWidth
                value={search}
                onChange={handleSearchChange}
                placeholder="Name or phone number..."
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={handleSearchClick}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>RFM Segment</InputLabel>
                <Select
                  value={segment}
                  label="RFM Segment"
                  onChange={handleSegmentChange}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="LOYAL">Loyal</MenuItem>
                  <MenuItem value="NEW">New Customers</MenuItem>
                  <MenuItem value="AT_RISK">At Risk</MenuItem>
                  <MenuItem value="LOST">Lost Customers</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Select options */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" component="span" sx={{ color: '#4B5563', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                Recipients selected: <Chip label={selectedCount} color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Typography>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Checkbox
                  checked={selectAllFiltered}
                  onChange={(e) => {
                    setSelectAllFiltered(e.target.checked);
                    if (e.target.checked) setSelectedIds([]);
                  }}
                  size="small"
                />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  Send to all filtered customers
                </Typography>
              </Stack>
            </Stack>

            {/* Customer table */}
            {loading ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280, borderRadius: '8px' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: '#F9FAFB' }}>
                        <Checkbox
                          disabled={selectAllFiltered}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < customers.length}
                          checked={customers.length > 0 && selectedIds.length === customers.length}
                          onChange={handleSelectAllToggle}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600 }}>Phone / Destination</TableCell>
                      <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600 }}>RFM Segment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="textSecondary">
                            No customers match the current filter
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((c) => (
                        <TableRow
                          key={c._id}
                          hover
                          selected={selectedIds.includes(c._id)}
                          onClick={() => handleCheckboxToggle(c._id)}
                          sx={{ cursor: selectAllFiltered ? 'default' : 'pointer' }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              disabled={selectAllFiltered}
                              checked={selectedIds.includes(c._id)}
                              onChange={() => handleCheckboxToggle(c._id)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 550 }}>
                            {c.firstName} {c.lastName || ''}
                          </TableCell>
                          <TableCell sx={{ color: '#4B5563' }}>
                            {c.whatsappNumber || c.phone || '-'}
                          </TableCell>
                          <TableCell>
                            {c.rfmSegment ? (
                              <Chip
                                label={c.rfmSegment}
                                size="small"
                                sx={{
                                  fontSize: '10px',
                                  height: '20px',
                                  bgcolor: c.rfmSegment === 'VIP' ? '#FEF3C7' : '#F3F4F6',
                                  color: c.rfmSegment === 'VIP' ? '#D97706' : '#374151',
                                  fontWeight: 700
                                }}
                              />
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 2.5,
        borderTop: '1px solid #E5E7EB',
        bgcolor: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {sendResult ? (
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: 600, ml: 'auto', px: 3 }}
          >
            Close
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={sending}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#4B5563', borderColor: '#D1D5DB' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || (!selectAllFiltered && selectedIds.length === 0)}
              startIcon={<SendIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                borderRadius: '8px',
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              {sending ? 'Sending...' : 'Send Bulk Message'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
});

ManualSendDialog.displayName = 'ManualSendDialog';

export default ManualSendDialog;
