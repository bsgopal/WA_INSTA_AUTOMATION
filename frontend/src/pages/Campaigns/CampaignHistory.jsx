import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Stack,
  CircularProgress,
  Tooltip,
  Divider,
  Tabs,
  Tab
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReplayIcon from '@mui/icons-material/Replay';
import apiClient from '../../api/client';

const STATUS_COLORS = {
  COMPLETED: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  RUNNING: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  DRAFT: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  FAILED: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  SCHEDULED: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' }
};

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Campaign for Recipient Detail Panel (Two-Column Master-Detail Layout)
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [recipientLogLoading, setRecipientLogLoading] = useState(false);
  const [recipientLogData, setRecipientLogData] = useState(null);
  const [recipientTab, setRecipientTab] = useState('all'); // 'all' | 'sent' | 'failed'
  const [recipientSearch, setRecipientSearch] = useState('');
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
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Fetch all campaigns
  const fetchCampaignHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/campaigns?limit=100');
      const list = res.data?.campaigns || res.data || [];
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to fetch campaign history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignHistory();
  }, [fetchCampaignHistory]);

  // Load recipient log into right side column
  const loadRecipientLog = async (campaign) => {
    setSelectedCampaign(campaign);
    setRecipientTab('all');
    setRecipientSearch('');
    setRecipientLogLoading(true);
    setRecipientLogData(null);

    try {
      const res = await apiClient.get(`/campaigns/${campaign._id}/recipients`);
      setRecipientLogData(res.data);
    } catch (err) {
      console.error('Failed to fetch recipient log:', err);
      // Fallback
      setRecipientLogData({
        campaign,
        sentList: [],
        notSentList: [],
        totalCount: campaign.totalTargets || 0,
        sentCount: campaign.totalSent || 0,
        notSentCount: campaign.totalFailed || 0
      });
    } finally {
      setRecipientLogLoading(false);
    }
  };

  const handleCloseRecipientLog = () => {
    setSelectedCampaign(null);
    setRecipientLogData(null);
  };

  // Export Recipients to CSV
  const handleExportCSV = (type = 'all') => {
    if (!recipientLogData) return;

    let rows = [];
    if (type === 'sent') rows = recipientLogData.sentList || [];
    else if (type === 'failed') rows = recipientLogData.notSentList || [];
    else rows = [...(recipientLogData.sentList || []), ...(recipientLogData.notSentList || [])];

    const headers = ['Customer Name', 'Phone Number', 'Status', 'Sent At', 'Failure Reason', 'Message Content'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${(r.customerName || 'Unknown').replace(/"/g, '""')}"`,
        `"${(r.phone || r.phoneNumber || '').replace(/"/g, '""')}"`,
        `"${r.status || 'SENT'}"`,
        `"${r.sentAt ? new Date(r.sentAt).toLocaleString() : ''}"`,
        `"${(r.error || r.failureReason || '').replace(/"/g, '""')}"`,
        `"${(r.content || recipientLogData.campaign?.content || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-recipients-${selectedCampaign?.name || 'log'}-${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesStatus = statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.topic || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, searchQuery]);

  // Filtered Recipients for Right Side List
  const filteredRecipients = useMemo(() => {
    if (!recipientLogData) return [];
    let list = [];
    if (recipientTab === 'sent') {
      list = recipientLogData.sentList || [];
    } else if (recipientTab === 'failed') {
      list = recipientLogData.notSentList || [];
    } else {
      list = [...(recipientLogData.sentList || []), ...(recipientLogData.notSentList || [])];
    }

    const q = recipientSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(r =>
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.phone || r.phoneNumber || '').includes(q) ||
      (r.error || r.failureReason || '').toLowerCase().includes(q)
    );
  }, [recipientLogData, recipientTab, recipientSearch]);

  const totalAudience = campaigns.reduce((acc, c) => acc + (c.totalTargets || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.totalSent || 0), 0);
  const successRate = totalAudience > 0 ? ((totalDelivered / totalAudience) * 100).toFixed(1) : 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden', bgcolor: '#f8fafc', p: { xs: 1, sm: 2 } }}>
      
      {/* ── TOP HEADER / TOOLBAR ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', flexShrink: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <div>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex' }}>
                <CampaignIcon sx={{ fontSize: 22 }} />
              </Box>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '1.15rem' }}>
                  Campaign History &amp; Dispatch Logs
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {campaigns.length} Broadcasts · Total Audience: <b style={{ color: '#0f172a' }}>{totalAudience}</b> · Delivered: <b style={{ color: '#059669' }}>{totalDelivered}</b> · Success Rate: <b style={{ color: '#0284c7' }}>{successRate}%</b>
                </Typography>
              </div>
            </Stack>
          </div>

          <Stack direction="row" alignItems="center" spacing={1} overflow="auto">
            <TextField
              size="small"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.8 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />

            <Stack direction="row" spacing={0.5} sx={{ bgcolor: '#f1f5f9', p: 0.5, borderRadius: '8px' }}>
              {['ALL', 'COMPLETED', 'RUNNING', 'DRAFT', 'FAILED'].map((st) => {
                const active = statusFilter === st;
                return (
                  <Button
                    key={st}
                    size="small"
                    onClick={() => setStatusFilter(st)}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      py: 0.3,
                      px: 1,
                      minWidth: 'auto',
                      borderRadius: '6px',
                      bgcolor: active ? '#ffffff' : 'transparent',
                      color: active ? '#0f172a' : '#64748b',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': { bgcolor: active ? '#ffffff' : '#e2e8f0' }
                    }}
                  >
                    {st}
                  </Button>
                );
              })}
            </Stack>

            <Tooltip title="Refresh Logs">
              <IconButton size="small" onClick={fetchCampaignHistory} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <RefreshIcon fontSize="small" className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* ── TWO-COLUMN MID-SPLIT LAYOUT CONTAINER ── */}
      <Box ref={containerRef} sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 0, overflow: 'hidden' }}>
        
        {/* ── LEFT COLUMN: CAMPAIGNS LIST TABLE ── */}
        <Paper
          elevation={0}
          sx={{
            width: selectedCampaign ? (isPanelMaximized ? '0%' : `${splitPercent}%`) : '100%',
            display: selectedCampaign && isPanelMaximized ? 'none' : 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
          }}
        >
          {/* Subheader */}
          <Box sx={{ px: 2, py: 1.2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Broadcast Fleet ({filteredCampaigns.length})
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Click row to inspect recipients
            </Typography>
          </Box>

          {/* List Table */}
          <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Campaign / Topic</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Targets</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Sent</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1, display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} sx={{ color: '#0284c7', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>Loading campaigns...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>No campaigns found</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Try adjusting your filters or search query.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((c) => {
                    const isSelected = selectedCampaign?._id === c._id;
                    const st = (c.status || 'DRAFT').toUpperCase();
                    const stStyle = STATUS_COLORS[st] || STATUS_COLORS.DRAFT;
                    const senderMode = (c.senderMode || 'META').toUpperCase();

                    return (
                      <TableRow
                        key={c._id}
                        hover
                        onClick={() => loadRecipientLog(c)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'rgba(241, 245, 249, 0.6)' }
                        }}
                      >
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.2 }}>
                            {c.name}
                          </Typography>
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.3 }}>
                            {c.topic && (
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                                Topic: {c.topic}
                              </Typography>
                            )}
                            <Chip
                              label={senderMode === 'DOCKER' ? '🐳 WAHA' : '⚡ Meta API'}
                              size="small"
                              sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700, bgcolor: senderMode === 'DOCKER' ? '#f0fdf4' : '#eff6ff', color: senderMode === 'DOCKER' ? '#166534' : '#1e40af' }}
                            />
                          </Stack>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 1.2, fontWeight: 700, color: '#334155', fontSize: '0.8rem' }}>
                          {c.totalTargets || 0}
                        </TableCell>

                        <TableCell align="center" sx={{ py: 1.2, fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>
                          {c.totalSent || 0}
                        </TableCell>

                        <TableCell sx={{ py: 1.2 }}>
                          <Chip
                            label={st}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              bgcolor: stStyle.bg,
                              color: stStyle.color,
                              border: `1px solid ${stStyle.border}`
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1.2, display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                            {c.sentAt || c.createdAt ? new Date(c.sentAt || c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                            {c.sentAt || c.createdAt ? new Date(c.sentAt || c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Draggable Divider */}
        {selectedCampaign && !isPanelMaximized && (
          <Box
            onMouseDown={() => setIsDragging(true)}
            sx={{
              width: 8,
              bgcolor: isDragging ? '#0284c7' : 'transparent',
              cursor: 'col-resize',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 20,
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: '#0284c7' }
            }}
            title="Drag to resize columns"
          >
            <Box sx={{ width: 2, height: 32, bgcolor: '#cbd5e1', borderRadius: 1 }} />
          </Box>
        )}

        {/* ── RIGHT COLUMN: RECIPIENTS DETAIL STUDIO ── */}
        {selectedCampaign && (
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              width: isPanelMaximized ? '100%' : `${100 - splitPercent}%`,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              overflow: 'hidden'
            }}
          >
            {/* 1. Header Bar */}
            <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <div>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                      {selectedCampaign.name}
                    </Typography>
                    <Chip
                      label={(selectedCampaign.status || 'DRAFT').toUpperCase()}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        bgcolor: STATUS_COLORS[(selectedCampaign.status || 'DRAFT').toUpperCase()]?.bg || '#f1f5f9',
                        color: STATUS_COLORS[(selectedCampaign.status || 'DRAFT').toUpperCase()]?.color || '#475569'
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                    Dispatched: <b style={{ color: '#0f172a' }}>{selectedCampaign.sentAt ? new Date(selectedCampaign.sentAt).toLocaleString() : 'Pending'}</b> · Engine: <b style={{ color: '#0f172a' }}>{selectedCampaign.senderMode === 'DOCKER' ? 'WAHA Docker' : 'Meta Cloud API'}</b>
                  </Typography>
                </div>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={isPanelMaximized ? "Restore Split View" : "Maximize"}>
                    <IconButton size="small" onClick={() => setIsPanelMaximized(!isPanelMaximized)} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      {isPanelMaximized ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close Detail View">
                    <IconButton size="small" onClick={handleCloseRecipientLog} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', '&:hover': { color: '#0f172a' } }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* Stats Counters */}
              <Stack direction="row" spacing={2} sx={{ mt: 1.5, p: 1.2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Total Targets</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {recipientLogData ? recipientLogData.totalCount : (selectedCampaign.totalTargets ?? 0)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Delivered</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                    {recipientLogData ? recipientLogData.sentCount : (selectedCampaign.totalSent ?? 0)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Failed / Undelivered</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                    {recipientLogData ? recipientLogData.notSentCount : (selectedCampaign.totalFailed ?? 0)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* 2. Sub-Toolbar: Tabs, Recipient Search, Export */}
            <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={recipientTab}
                onChange={(_, v) => setRecipientTab(v)}
                sx={{
                  minHeight: 32,
                  '& .MuiTab-root': {
                    minHeight: 32,
                    py: 0,
                    px: 1.5,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab value="all" label={`All Recipients (${recipientLogData ? recipientLogData.totalCount : (selectedCampaign.totalTargets ?? 0)})`} />
                <Tab value="sent" label={`Delivered (${recipientLogData ? recipientLogData.sentCount : (selectedCampaign.totalSent ?? 0)})`} />
                <Tab value="failed" label={`Failed (${recipientLogData ? recipientLogData.notSentCount : (selectedCampaign.totalFailed ?? 0)})`} />
              </Tabs>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Filter customer / phone..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  sx={{ width: 180, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 15 }} />
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
                  onClick={() => handleExportCSV(recipientTab)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    bgcolor: 'rgba(2, 132, 199, 0.08)',
                    borderRadius: '8px',
                    textTransform: 'none',
                    py: 0.5,
                    px: 1,
                    '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.15)' }
                  }}
                >
                  Export CSV
                </Button>
              </Stack>
            </Box>

            {/* 3. Recipient Customer List Table */}
            <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Customer Recipient</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Phone Number</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Delivery Status</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1, display: { xs: 'none', md: 'table-cell' } }}>Dispatched At</TableCell>
                    <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#475569', fontSize: '0.75rem', py: 1 }}>Direct Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipientLogLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={24} sx={{ color: '#0284c7', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>Loading recipient logs...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>No recipients matching filter</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Try searching by name or phone number.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipients.map((r, idx) => {
                      const statusUpper = String(r.status || 'SENT').toUpperCase();
                      // QUEUED = accepted by WhatsApp and dispatched, awaiting a
                      // delivery receipt. It is not a failure, so it must render
                      // as sent rather than falling through to the red error badge.
                      const isSent = ['SENT', 'DELIVERED', 'READ', 'QUEUED'].includes(statusUpper);
                      const isDraft = ['DRAFT', 'PENDING', 'SCHEDULED'].includes(statusUpper);
                      const displayPhone = r.phone || r.phoneNumber || '—';
                      const rawPhone = (displayPhone || '').replace(/[^0-9]/g, '');

                      let badgeBg = isSent ? '#ecfdf5' : isDraft ? '#f1f5f9' : '#fef2f2';
                      let badgeColor = isSent ? '#059669' : isDraft ? '#475569' : '#dc2626';
                      let badgeBorder = isSent ? '#a7f3d0' : isDraft ? '#cbd5e1' : '#fecaca';

                      return (
                        <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                              {r.customerName || 'Customer'}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1, fontFamily: 'monospace', fontWeight: 600, color: '#334155', fontSize: '0.75rem' }}>
                            {displayPhone}
                          </TableCell>

                          <TableCell sx={{ py: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                              <Chip
                                label={statusUpper}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: badgeBg,
                                  color: badgeColor,
                                  border: `1px solid ${badgeBorder}`
                                }}
                              />
                              {!isSent && !isDraft && (r.error || r.failureReason) && (
                                <Tooltip title={r.error || r.failureReason}>
                                  <Typography variant="caption" sx={{ color: '#dc2626', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '0.7rem' }}>
                                    {r.error || r.failureReason}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ py: 1, display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                              {r.sentAt ? new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" sx={{ py: 1 }}>
                            {rawPhone && rawPhone.length >= 7 ? (
                              <Tooltip title="Open WhatsApp Chat">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={`https://wa.me/${rawPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{
                                    color: '#059669',
                                    bgcolor: '#ecfdf5',
                                    borderRadius: '8px',
                                    p: 0.6,
                                    '&:hover': { bgcolor: '#d1fae5' }
                                  }}
                                >
                                  <WhatsAppIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Sticky Recipient Studio Footer */}
            <Box
              sx={{
                px: 2.5,
                py: 1.2,
                bgcolor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                zIndex: 10
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Showing <b>{filteredRecipients.length}</b> recipients · Delivered: <b style={{ color: '#059669' }}>{recipientLogData ? recipientLogData.sentCount : (selectedCampaign.totalSent ?? 0)}</b> · Failed: <b style={{ color: '#dc2626' }}>{recipientLogData ? recipientLogData.notSentCount : (selectedCampaign.totalFailed ?? 0)}</b>
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
                  onClick={() => handleExportCSV(recipientTab)}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    bgcolor: 'rgba(2, 132, 199, 0.08)',
                    borderRadius: '8px',
                    textTransform: 'none',
                    py: 0.5,
                    px: 1.5,
                    '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.15)' }
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCloseRecipientLog}
                  sx={{ borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  Close
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
