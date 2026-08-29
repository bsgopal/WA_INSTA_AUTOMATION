import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
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
  Avatar,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import apiClient from '../../../api/client';

/**
 * ManualSendDialog Component
 * Premium dialog to execute bulk manual sends to targeted customers.
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
  const [dialogLayout, setDialogLayout] = useState({
    x: 40,
    y: 40,
    isMaximized: false
  });
  const dragRef = React.useRef({ dragging: false, startX: 0, startY: 0, originX: 40, originY: 40 });
  const segmentRef = React.useRef('');
  const searchDebounceRef = React.useRef(null);

  // Fetch customers matching criteria
  const fetchCustomers = useCallback(async (searchQuery, segmentQuery) => {
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
  }, []);

  // Load customers when dialog opens
  useEffect(() => {
    if (open && campaign) {
      const initSegment = campaign.targetAudience?.segments?.[0] || '';
      setSearch('');
      setSegment(initSegment);
      segmentRef.current = initSegment;
      const preSelectedIds = campaign.targetAudience?.customFilter?.targetedCustomerIds || [];
      setSelectedIds(preSelectedIds);
      setSelectAllFiltered(false);
      setSendResult(null);
      setSending(false);
      fetchCustomers('', initSegment);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign]);

  // Live search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchCustomers(value, segmentRef.current);
    }, 350);
  };

  const handleDialogMouseDown = (e) => {
    if (e.button !== 0 || dialogLayout.isMaximized) return;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: dialogLayout.x,
      originY: dialogLayout.y
    };
  };

  const handleDialogMouseMove = React.useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const nextX = dragRef.current.originX + (e.clientX - dragRef.current.startX);
    const nextY = dragRef.current.originY + (e.clientY - dragRef.current.startY);
    setDialogLayout((prev) => ({
      ...prev,
      x: Math.max(8, Math.min(window.innerWidth - 320, nextX)),
      y: Math.max(8, Math.min(window.innerHeight - 120, nextY))
    }));
  }, []);

  const handleDialogMouseUp = React.useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  React.useEffect(() => {
    if (!open) return;
    window.addEventListener('mousemove', handleDialogMouseMove);
    window.addEventListener('mouseup', handleDialogMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleDialogMouseMove);
      window.removeEventListener('mouseup', handleDialogMouseUp);
    };
  }, [open, handleDialogMouseMove, handleDialogMouseUp]);

  React.useEffect(() => {
    return () => clearTimeout(searchDebounceRef.current);
  }, []);

  const handleToggleMaximize = () => {
    setDialogLayout((prev) => ({
      ...prev,
      isMaximized: !prev.isMaximized
    }));
  };

  if (!campaign) return null;

  const handleSegmentChange = (e) => {
    const nextSegment = e.target.value;
    setSegment(nextSegment);
    segmentRef.current = nextSegment;
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
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: dialogLayout.isMaximized ? '96vw' : 'min(1180px, 96vw)',
          height: 'calc(100vh - 72px)',
          minHeight: 560,
          position: 'fixed',
          left: dialogLayout.isMaximized ? '50%' : dialogLayout.x,
          top: dialogLayout.isMaximized ? '50%' : dialogLayout.y,
          transform: dialogLayout.isMaximized ? 'translate(-50%, -50%)' : 'none',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 28px 64px -16px rgba(15, 23, 42, 0.35)'
        }
      }}
    >
      {/* ===== Slim header ===== */}
      <Box sx={{
        background: '#3b5bdb',
        px: 3,
        py: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        cursor: dialogLayout.isMaximized ? 'default' : 'grab',
        userSelect: 'none'
      }} onMouseDown={handleDialogMouseDown}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              bgcolor: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
              flexShrink: 0
            }}
          >
            <SendIcon sx={{ color: '#ffffff', fontSize: 17 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2 }}>
              Bulk Campaign Sender
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.7rem' }}>
              Send {campaign.name || 'campaign'} to selected customers
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={handleToggleMaximize}
            sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
          >
            <FullscreenRoundedIcon fontSize="small" />
          </IconButton>
          {!sending && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <DialogContent sx={{ p: 2, pt: 1.5, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {sendResult ? (
          /* ===== Result view ===== */
          <Box sx={{ py: 3, textAlign: 'center' }}>
            {sendResult.success ? (
              <Box>
                <Box sx={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  bgcolor: '#ecfdf5',
                  border: '2px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5
                }}>
                  <CheckCircleIcon sx={{ fontSize: 44, color: '#10b981' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>
                  Bulk Sending Completed!
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                  {sendResult.message}
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 1 }}>
                  <Paper sx={{
                    p: 2.5,
                    minWidth: 130,
                    bgcolor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '14px'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#047857' }}>
                      {sendResult.successCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>
                      Sent Successfully
                    </Typography>
                  </Paper>
                  <Paper sx={{
                    p: 2.5,
                    minWidth: 130,
                    bgcolor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '14px'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                      {sendResult.failCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>
                      Failed
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            ) : (
              <Box>
                <Box sx={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  bgcolor: '#fef2f2',
                  border: '2px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5
                }}>
                  <WarningAmberIcon sx={{ fontSize: 44, color: '#ef4444' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
                  Execution Failed
                </Typography>
                <Typography variant="body2" sx={{ color: '#dc2626', mb: 3, px: 4 }}>
                  {sendResult.message}
                </Typography>
              </Box>
            )}
          </Box>
        ) : sending ? (
          /* ===== Sending progress view ===== */
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={56} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>
              Sending Messages...
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Please wait while we queue and send campaign messages to selected customers.
            </Typography>
            <LinearProgress sx={{ width: '70%', mx: 'auto', borderRadius: '4px', height: '8px' }} />
          </Box>
        ) : (
          /* ===== Selection view ===== */
          <Stack spacing={1.5} sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Filter controls */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
              <TextField
                label="Search Customers"
                size="small"
                fullWidth
                value={search}
                onChange={handleSearchChange}
                placeholder="Type name or phone number... live search"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    bgcolor: '#ffffff',
                    height: '40px'
                  }
                }}
              />

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 210 } }}>
                <InputLabel>Customer Status</InputLabel>
                <Select
                  value={segment}
                  label="Customer Status"
                  onChange={handleSegmentChange}
                  MenuProps={{ disablePortal: true }}
                  sx={{ borderRadius: '6px', bgcolor: '#ffffff', height: '40px' }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="LOYAL">Loyal</MenuItem>
                  <MenuItem value="REGULAR">Regular</MenuItem>
                  <MenuItem value="AT_RISK">At Risk</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="LOST">Lost</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Selection summary */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  Recipients selected:
                </Typography>
                <Chip label={selectedCount} color="primary" size="small" sx={{ fontWeight: 800, height: 22 }} />
              </Box>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Checkbox
                  checked={selectAllFiltered}
                  onChange={(e) => {
                    setSelectAllFiltered(e.target.checked);
                    if (e.target.checked) setSelectedIds([]);
                  }}
                  size="small"
                  sx={{ color: '#6366f1' }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  Send to all filtered customers
                </Typography>
              </Stack>
            </Stack>

            {/* Customer table - fills remaining height */}
            {loading ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  minHeight: 200,
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  '&::-webkit-scrollbar': { width: 8 },
                  '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 }
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc' }}>
                        <Checkbox
                          disabled={selectAllFiltered}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < customers.length}
                          checked={customers.length > 0 && selectedIds.length === customers.length}
                          onChange={handleSelectAllToggle}
                          size="small"
                          sx={{ color: '#6366f1' }}
                        />
                      </TableCell>
                      <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Phone / Destination</TableCell>
                      <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>RFM Segment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <PersonAddIcon sx={{ color: '#cbd5e1', fontSize: 36 }} />
                            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                              No customers match the current filter
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((c) => (
                        <TableRow
                          key={c._id}
                          hover
                          selected={selectedIds.includes(c._id)}
                          onClick={() => handleCheckboxToggle(c._id)}
                          sx={{
                            cursor: selectAllFiltered ? 'default' : 'pointer',
                            '&.Mui-selected': { bgcolor: '#eef2ff' },
                            '&.Mui-selected:hover': { bgcolor: '#e0e7ff' }
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              disabled={selectAllFiltered}
                              checked={selectedIds.includes(c._id)}
                              onChange={() => handleCheckboxToggle(c._id)}
                              size="small"
                              sx={{ color: '#6366f1' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar
                                sx={{
                                  width: 30,
                                  height: 30,
                                  bgcolor: 'rgba(99,102,241,0.12)',
                                  color: '#4338ca',
                                  fontSize: '13px',
                                  fontWeight: 700
                                }}
                              >
                                {(c.firstName || '?').charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 650, color: '#1e293b' }}>
                                {c.firstName} {c.lastName || ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <PhoneIcon sx={{ color: '#94a3b8', fontSize: 14 }} />
                              <Typography variant="body2" sx={{ color: '#475569' }}>
                                {c.whatsappNumber || c.phone || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {c.rfmSegment ? (
                              <Chip
                                label={c.rfmSegment}
                                size="small"
                                sx={{
                                  fontSize: '10px',
                                  height: '20px',
                                  bgcolor: c.rfmSegment === 'VIP' ? '#fef3c7' : '#f1f5f9',
                                  color: c.rfmSegment === 'VIP' ? '#b45309' : '#475569',
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
        pt: 2,
        borderTop: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {sendResult ? (
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: 700, ml: 'auto', px: 4, borderRadius: '10px' }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={sending}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1', borderRadius: '10px', px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || (!selectAllFiltered && selectedIds.length === 0)}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                px: 4,
                height: '42px',
                borderRadius: '10px',
                bgcolor: '#6366f1',
                boxShadow: '0 8px 18px -6px rgba(99,102,241,0.5)',
                '&:hover': { bgcolor: '#4f46e5' },
                '&:disabled': { bgcolor: '#c7d2fe', color: '#ffffff' }
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