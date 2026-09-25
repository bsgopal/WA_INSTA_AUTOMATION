import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import apiClient from '../../../api/client';
import { useBackgroundMessaging } from '../../../context/BackgroundMessagingContext';

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
  const { startBackgroundJob, showTopToast, addNotification } = useBackgroundMessaging();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sending states
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [resendingAll, setResendingAll] = useState(false);
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

    const targetCount = selectAllFiltered ? (customers.length || 1) : selectedIds.length;
    const campaignTitle = campaign?.name ? `Campaign: ${campaign.name}` : 'Broadcast Message';

    try {
      setSending(true);
      setSendResult(null);

      // Launch background tracking job
      const result = await startBackgroundJob({
        title: campaignTitle,
        total: targetCount,
        taskFn: async (updateProgress) => {
          updateProgress(0, 0, `Broadcasting campaign to ${targetCount} recipients...`);
          const response = await apiClient.post(`/campaigns/${campaign._id}/manual-send`, {
            customerIds: selectAllFiltered ? [] : selectedIds,
            sendToAll: selectAllFiltered,
            segmentFilter: segment || null,
            searchTerm: search || null
          });

          const resData = response.data || {};
          const successCount = resData.successCount || 0;
          const failCount = resData.failCount || 0;
          updateProgress(successCount, failCount, `Sent ${successCount}, Failed ${failCount}`);

          return {
            sentCount: successCount,
            failCount: failCount,
            data: resData
          };
        }
      });

      const resData = result?.data || {};
      setSendResult({
        success: resData.successCount > 0,
        message: resData.message || 'Manual send executed successfully',
        successCount: resData.successCount || 0,
        failCount: resData.failCount || 0,
        totalCount: resData.totalCount || (resData.successCount + resData.failCount),
        recipients: resData.recipients || []
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to execute bulk send:', error);
      setSendResult({
        success: false,
        message: error.response?.data?.error || 'Failed to complete manual send request.',
        successCount: 0,
        failCount: selectedIds.length,
        totalCount: selectedIds.length,
        recipients: []
      });
    } finally {
      setSending(false);
    }
  };

  const handleResendSingle = async (recipient) => {
    if (!recipient?.customerId) return;
    try {
      setResendingId(recipient.customerId);
      const res = await apiClient.post(`/campaigns/${campaign._id}/manual-send`, {
        customerIds: [recipient.customerId],
        sendToAll: false
      });

      const updatedRecipient = res.data?.recipients?.[0];
      if (updatedRecipient) {
        setSendResult(prev => {
          if (!prev) return prev;
          const newRecipients = prev.recipients.map(r => 
            (r.customerId === recipient.customerId ? updatedRecipient : r)
          );
          const newSuccess = newRecipients.filter(r => r.status === 'SENT').length;
          const newFail = newRecipients.filter(r => r.status === 'FAILED').length;
          return {
            ...prev,
            successCount: newSuccess,
            failCount: newFail,
            recipients: newRecipients
          };
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Single resend error:', err);
    } finally {
      setResendingId(null);
    }
  };

  const handleResendAllFailed = async () => {
    if (!sendResult?.recipients?.length) return;
    const failedList = sendResult.recipients.filter(r => r.status === 'FAILED' && r.customerId);
    if (!failedList.length) return;

    try {
      setResendingAll(true);
      const failedIds = failedList.map(r => r.customerId);
      const res = await apiClient.post(`/campaigns/${campaign._id}/manual-send`, {
        customerIds: failedIds,
        sendToAll: false
      });

      const updatedMap = new Map((res.data?.recipients || []).map(r => [r.customerId, r]));
      setSendResult(prev => {
        if (!prev) return prev;
        const newRecipients = prev.recipients.map(r => updatedMap.get(r.customerId) || r);
        const newSuccess = newRecipients.filter(r => r.status === 'SENT').length;
        const newFail = newRecipients.filter(r => r.status === 'FAILED').length;
        return {
          ...prev,
          success: newSuccess > 0,
          successCount: newSuccess,
          failCount: newFail,
          recipients: newRecipients
        };
      });
      onSuccess();
    } catch (err) {
      console.error('Resend all failed error:', err);
    } finally {
      setResendingAll(false);
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
          width: dialogLayout.isMaximized ? '98.5vw' : 'min(1240px, 95vw)',
          height: dialogLayout.isMaximized ? '97vh' : 'calc(100vh - 60px)',
          maxWidth: '99vw',
          maxHeight: '98vh',
          minHeight: 560,
          margin: 'auto',
          borderRadius: dialogLayout.isMaximized ? '10px' : '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px -12px rgba(15, 23, 42, 0.55), 0 0 0 1px rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.18)',
          bgcolor: '#0f172a',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* ===== Premium Dark Gradient Header ===== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3b5bdb 100%)',
          px: 3,
          py: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
          userSelect: 'none',
          borderBottom: '1px solid rgba(165,180,252,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative glow */}
        <Box sx={{
          position: 'absolute', top: -30, right: 80, width: 160, height: 160,
          borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.25)', filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, zIndex: 1 }}>
          {/* Campaign icon box */}
          <Box sx={{
            width: 44, height: 44, borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
            border: '1px solid rgba(165,180,252,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}>
            <SendIcon sx={{ color: '#c7d2fe', fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
                Bulk Campaign Sender
              </Typography>
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  height: 18, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
                  bgcolor: 'rgba(16,185,129,0.25)', color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.4)', px: 0.3
                }}
              />
            </Box>
            <Typography sx={{
              color: 'rgba(165,180,252,0.9)', fontWeight: 500, fontSize: '0.75rem', mt: 0.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500
            }}>
              📣 {campaign?.name || 'Campaign'} · {campaign?.template?.name ? `Template: ${campaign.template.name}` : 'Broadcast to selected contacts'}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ zIndex: 1, flexShrink: 0 }}>
          <Tooltip title="Minimize to background">
            <IconButton
              size="small"
              onClick={() => {
                onClose();
                showTopToast({
                  title: '🗕 Minimized to Background',
                  message: sending ? 'Broadcast is continuing in the background.' : 'Campaign sender dialog minimized.',
                  severity: 'info',
                  duration: 3500
                });
              }}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff' },
                borderRadius: '8px'
              }}
            >
              <RemoveIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={dialogLayout.isMaximized ? "Restore size" : "Maximize"}>
            <IconButton size="small" onClick={handleToggleMaximize} sx={{
              color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff' }, borderRadius: '8px'
            }}>
              {dialogLayout.isMaximized ? (
                <FullscreenExitRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <FullscreenRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
          {!sending && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} sx={{
                color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }, borderRadius: '8px'
              }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: '#f8fafc' }}>
        {sendResult ? (
          /* ===== Comprehensive Results & Recipient Delivery Breakdown View ===== */
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
            {/* Top Summary Banner */}
            <Box sx={{
              p: 2.5, px: 3,
              bgcolor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  bgcolor: sendResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${sendResult.success ? '#a7f3d0' : '#fecaca'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {sendResult.success ? (
                    <CheckCircleIcon sx={{ fontSize: 26, color: '#059669' }} />
                  ) : (
                    <WarningAmberIcon sx={{ fontSize: 26, color: '#dc2626' }} />
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {sendResult.success ? 'Campaign Dispatched Successfully 🎉' : 'Campaign Dispatch Notice'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2 }}>
                    {sendResult.message}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Paper elevation={0} sx={{
                  px: 2, py: 1, borderRadius: '10px',
                  bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>TOTAL</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {sendResult.totalCount || ((sendResult.successCount || 0) + (sendResult.failCount || 0))}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{
                  px: 2, py: 1, borderRadius: '10px',
                  bgcolor: '#ecfdf5', border: '1px solid #a7f3d0',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857' }}>SENT</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>
                    {sendResult.successCount || 0}
                  </Typography>
                </Paper>

                {sendResult.failCount > 0 && (
                  <Paper elevation={0} sx={{
                    px: 2, py: 1, borderRadius: '10px',
                    bgcolor: '#fef2f2', border: '1px solid #fecaca',
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#b91c1c' }}>FAILED</Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#b91c1c', lineHeight: 1 }}>
                      {sendResult.failCount}
                    </Typography>
                  </Paper>
                )}

                {sendResult.failCount > 0 && (
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    disabled={resendingAll}
                    onClick={handleResendAllFailed}
                    startIcon={resendingAll ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      height: 38, px: 2, borderRadius: '8px',
                      textTransform: 'none', fontWeight: 800, fontSize: '0.8rem',
                      bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }
                    }}
                  >
                    {resendingAll ? 'Retrying...' : `Resend Failed (${sendResult.failCount})`}
                  </Button>
                )}
              </Stack>
            </Box>

            {/* Recipient Status Table */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0, bgcolor: '#ffffff' }}>
              <TableContainer sx={{ maxHeight: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', color: '#64748b', fontWeight: 800, fontSize: '0.74rem', borderBottom: '1px solid #e2e8f0', py: 1.25 } }}>
                      <TableCell>RECIPIENT / CONTACT</TableCell>
                      <TableCell>PHONE NUMBER</TableCell>
                      <TableCell>STATUS</TableCell>
                      <TableCell>DETAILS / ERROR</TableCell>
                      <TableCell align="right">ACTION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(sendResult.recipients || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            Dispatch recorded. {sendResult.successCount} sent, {sendResult.failCount} failed.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sendResult.recipients.map((rec, rIdx) => {
                        const isSent = rec.status === 'SENT' || rec.status === 'DELIVERED';
                        const isRetrying = resendingId === rec.customerId;

                        return (
                          <TableRow key={rec.customerId || rIdx} hover sx={{
                            bgcolor: isSent ? '#ffffff' : 'rgba(254, 242, 242, 0.4)',
                            '&:hover': { bgcolor: isSent ? '#f8fafc' : 'rgba(254, 242, 242, 0.7)' }
                          }}>
                            <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Avatar sx={{
                                  width: 32, height: 32,
                                  bgcolor: isSent ? '#ecfdf5' : '#fee2e2',
                                  color: isSent ? '#059669' : '#dc2626',
                                  fontSize: '12px', fontWeight: 800,
                                  border: `1px solid ${isSent ? '#a7f3d0' : '#fca5a5'}`
                                }}>
                                  {(rec.customerName || '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>
                                  {rec.customerName || 'Customer'}
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                                {rec.phoneNumber || '—'}
                              </Typography>
                            </TableCell>

                            <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                              <Chip
                                label={isSent ? 'Delivered' : 'Failed'}
                                size="small"
                                icon={isSent ? <CheckCircleIcon sx={{ fontSize: '13px !important' }} /> : <WarningAmberIcon sx={{ fontSize: '13px !important' }} />}
                                sx={{
                                  height: 22, fontSize: '0.7rem', fontWeight: 800,
                                  bgcolor: isSent ? '#ecfdf5' : '#fef2f2',
                                  color: isSent ? '#059669' : '#dc2626',
                                  border: `1px solid ${isSent ? '#a7f3d0' : '#fecaca'}`
                                }}
                              />
                            </TableCell>

                            <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                              <Typography sx={{ fontSize: '0.75rem', color: isSent ? '#059669' : '#dc2626', fontWeight: 500 }}>
                                {isSent ? 'Dispatched via WhatsApp' : (rec.error || 'Failed to dispatch message')}
                              </Typography>
                            </TableCell>

                            <TableCell align="right" sx={{ py: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isRetrying || resendingAll}
                                onClick={() => handleResendSingle(rec)}
                                startIcon={isRetrying ? <CircularProgress size={12} color="inherit" /> : <SendIcon sx={{ fontSize: 13 }} />}
                                sx={{
                                  height: 28, px: 1.5, borderRadius: '6px',
                                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                                  borderColor: isSent ? '#cbd5e1' : '#fca5a5',
                                  color: isSent ? '#475569' : '#dc2626',
                                  '&:hover': {
                                    borderColor: isSent ? '#94a3b8' : '#dc2626',
                                    bgcolor: isSent ? '#f1f5f9' : '#fef2f2'
                                  }
                                }}
                              >
                                {isRetrying ? 'Sending...' : 'Resend'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        ) : sending ? (
          /* ===== Sending progress view ===== */
          <Box sx={{ py: 10, textAlign: 'center', px: 3, bgcolor: '#f8fafc' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress size={72} thickness={3} sx={{ color: '#6366f1' }} />
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <SendIcon sx={{ color: '#6366f1', fontSize: 28 }} />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>
              Dispatching Messages...
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, maxWidth: 380, mx: 'auto' }}>
              Queuing and sending campaign messages. Please wait — do not close this window.
            </Typography>
            <LinearProgress sx={{
              width: '60%', mx: 'auto', borderRadius: '6px', height: '10px',
              bgcolor: '#e0e7ff',
              '& .MuiLinearProgress-bar': { bgcolor: '#6366f1', borderRadius: '6px' }
            }} />
          </Box>
        ) : (
          /* ===== Selection view ===== */
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>

            {/* ── Filter & Controls Bar ── */}
            <Box sx={{
              px: 2.5, py: 2,
              bgcolor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <TextField
                size="small"
                placeholder="Search by name or phone..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                }}
                sx={{
                  flex: 1, minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', bgcolor: '#f8fafc', height: 40,
                    '&:hover fieldset': { borderColor: '#a5b4fc' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                  }
                }}
              />

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={segment}
                  onChange={handleSegmentChange}
                  displayEmpty
                  MenuProps={{ disablePortal: true }}
                  sx={{
                    borderRadius: '10px', bgcolor: '#f8fafc', height: 40,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                  }}
                  renderValue={(val) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                      <Typography sx={{ fontSize: '0.82rem', color: val ? '#0f172a' : '#94a3b8', fontWeight: 600 }}>
                        {val || 'All Segments'}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  <MenuItem value="NEW">🆕 New</MenuItem>
                  <MenuItem value="VIP">⭐ VIP</MenuItem>
                  <MenuItem value="LOYAL">💎 Loyal</MenuItem>
                  <MenuItem value="REGULAR">👤 Regular</MenuItem>
                  <MenuItem value="AT_RISK">⚠️ At Risk</MenuItem>
                  <MenuItem value="INACTIVE">😴 Inactive</MenuItem>
                  <MenuItem value="LOST">❌ Lost</MenuItem>
                </Select>
              </FormControl>

              {/* Send to all toggle */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.75, borderRadius: '10px',
                bgcolor: selectAllFiltered ? 'rgba(99,102,241,0.08)' : '#f8fafc',
                border: `1px solid ${selectAllFiltered ? 'rgba(99,102,241,0.3)' : '#e2e8f0'}`,
                cursor: 'pointer', transition: 'all 0.18s ease'
              }} onClick={() => {
                setSelectAllFiltered(!selectAllFiltered);
                if (!selectAllFiltered) setSelectedIds([]);
              }}>
                <Checkbox
                  checked={selectAllFiltered}
                  size="small"
                  sx={{ p: 0, color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
                />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectAllFiltered ? '#4338ca' : '#475569', userSelect: 'none' }}>
                  Select All Filtered
                </Typography>
              </Box>
            </Box>

            {/* ── Stats bar ── */}
            <Box sx={{
              px: 2.5, py: 1,
              bgcolor: '#fafafa',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                    {customers.length} contacts loaded
                  </Typography>
                </Box>
                {selectedIds.length > 0 && (
                  <Chip
                    label={`${selectedIds.length} selected`}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.72rem', fontWeight: 800,
                      bgcolor: 'rgba(99,102,241,0.1)', color: '#4338ca',
                      border: '1px solid rgba(99,102,241,0.25)'
                    }}
                  />
                )}
                {selectAllFiltered && (
                  <Chip
                    label="Sending to ALL filtered"
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.72rem', fontWeight: 800,
                      bgcolor: 'rgba(16,185,129,0.1)', color: '#065f46',
                      border: '1px solid rgba(16,185,129,0.3)'
                    }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                Recipients: <strong style={{ color: '#6366f1' }}>{selectedCount}</strong>
              </Typography>
            </Box>

            {/* ── Customer Table ── */}
            {loading ? (
              <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, bgcolor: '#f8fafc' }}>
                <CircularProgress size={36} sx={{ color: '#6366f1' }} />
                <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Loading contacts...</Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  bgcolor: '#ffffff',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { background: '#c7d2fe', borderRadius: 4 },
                  '&::-webkit-scrollbar-track': { background: '#f8fafc' }
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{
                        bgcolor: '#0f172a', borderBottom: '2px solid rgba(99,102,241,0.3)',
                        py: 1.25
                      }}>
                        <Checkbox
                          disabled={selectAllFiltered}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < customers.length}
                          checked={customers.length > 0 && selectedIds.length === customers.length}
                          onChange={handleSelectAllToggle}
                          size="small"
                          sx={{ color: 'rgba(165,180,252,0.6)', '&.Mui-checked': { color: '#818cf8' }, '&.MuiCheckbox-indeterminate': { color: '#818cf8' } }}
                        />
                      </TableCell>
                      {['Contact', 'WhatsApp / Phone', 'Segment', 'Status'].map((h) => (
                        <TableCell key={h} sx={{
                          bgcolor: '#0f172a',
                          color: '#94a3b8',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          borderBottom: '2px solid rgba(99,102,241,0.3)',
                          py: 1.25
                        }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0, border: 'none' }}>
                          <Box sx={{
                            py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            bgcolor: '#fafafa'
                          }}>
                            <Box sx={{
                              width: 72, height: 72, borderRadius: '50%',
                              bgcolor: '#f1f5f9', border: '2px dashed #cbd5e1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <PersonAddIcon sx={{ color: '#94a3b8', fontSize: 32 }} />
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                                No contacts found
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Try adjusting your search or segment filter
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((c, idx) => {
                        const isSelected = selectedIds.includes(c._id);
                        const segColors = {
                          VIP: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
                          LOYAL: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
                          NEW: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
                          REGULAR: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                          AT_RISK: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
                          INACTIVE: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
                          LOST: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
                        };
                        const seg = segColors[c.rfmSegment] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                        return (
                          <TableRow
                            key={c._id}
                            hover
                            selected={isSelected}
                            onClick={() => handleCheckboxToggle(c._id)}
                            sx={{
                              cursor: selectAllFiltered ? 'default' : 'pointer',
                              bgcolor: isSelected ? 'rgba(99,102,241,0.04)' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                              '&:hover': { bgcolor: 'rgba(99,102,241,0.06) !important' },
                              '&.Mui-selected': { bgcolor: 'rgba(99,102,241,0.06) !important' },
                              transition: 'background-color 0.12s ease',
                              borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent'
                            }}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <Checkbox
                                disabled={selectAllFiltered}
                                checked={isSelected}
                                onChange={() => handleCheckboxToggle(c._id)}
                                size="small"
                                sx={{ color: '#c7d2fe', '&.Mui-checked': { color: '#6366f1' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Avatar sx={{
                                  width: 34, height: 34,
                                  background: isSelected
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                  color: isSelected ? '#ffffff' : '#4338ca',
                                  fontSize: '13px', fontWeight: 800,
                                  boxShadow: isSelected ? '0 4px 10px rgba(99,102,241,0.35)' : 'none',
                                  transition: 'all 0.18s'
                                }}>
                                  {(c.firstName || '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.83rem', color: '#1e293b', lineHeight: 1.2 }}>
                                    {c.firstName} {c.lastName || ''}
                                  </Typography>
                                  {c.email && (
                                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.2 }}>
                                      {c.email}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{
                                  width: 24, height: 24, borderRadius: '6px',
                                  bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <PhoneIcon sx={{ color: '#16a34a', fontSize: 13 }} />
                                </Box>
                                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                                  {c.whatsappNumber || c.phone || '—'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1 }}>
                              {c.rfmSegment ? (
                                <Chip
                                  label={c.rfmSegment}
                                  size="small"
                                  sx={{
                                    height: 22, fontSize: '0.7rem', fontWeight: 800,
                                    bgcolor: seg.bg, color: seg.color,
                                    border: `1px solid ${seg.border}`,
                                    letterSpacing: '0.03em'
                                  }}
                                />
                              ) : (
                                <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1 }}>
                              <Chip
                                label={c.status || 'Active'}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.68rem', fontWeight: 700,
                                  bgcolor: c.status === 'BLOCKED' ? '#fef2f2' : '#f0fdf4',
                                  color: c.status === 'BLOCKED' ? '#b91c1c' : '#15803d',
                                  border: `1px solid ${c.status === 'BLOCKED' ? '#fecaca' : '#bbf7d0'}`
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ===== Footer ===== */}
      <Box sx={{
        px: 2.5, py: 1.75,
        borderTop: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        gap: 2
      }}>
        {sendResult ? (
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              ml: 'auto', px: 5, height: 42, borderRadius: '10px',
              fontWeight: 800, textTransform: 'none', fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 20px -6px rgba(99,102,241,0.5)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
            }}
          >
            Done ✓
          </Button>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={sending}
                sx={{
                  px: 3, height: 40, borderRadius: '10px', fontWeight: 700,
                  textTransform: 'none', color: '#64748b', borderColor: '#e2e8f0',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                }}
              >
                Cancel
              </Button>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {selectAllFiltered
                  ? `Will send to all ${customers.length} visible contacts`
                  : selectedIds.length === 0
                  ? 'Select recipients above to send'
                  : `${selectedIds.length} recipient${selectedIds.length > 1 ? 's' : ''} selected`}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || (!selectAllFiltered && selectedIds.length === 0)}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{
                px: 4, height: 44, borderRadius: '10px',
                fontWeight: 800, textTransform: 'none', fontSize: '0.9rem',
                background: (!selectAllFiltered && selectedIds.length === 0)
                  ? undefined
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: (!selectAllFiltered && selectedIds.length === 0)
                  ? 'none'
                  : '0 8px 20px -6px rgba(99,102,241,0.5)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                },
                '&:disabled': { bgcolor: '#e0e7ff', color: '#a5b4fc' }
              }}
            >
              {sending ? 'Sending...' : 'Send Bulk Message'}
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  );
});

ManualSendDialog.displayName = 'ManualSendDialog';

export default ManualSendDialog;
