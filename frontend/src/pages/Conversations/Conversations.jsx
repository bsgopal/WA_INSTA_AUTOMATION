import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, TextField, InputAdornment, Button,
  Chip, IconButton, Avatar, Stack, Badge, Divider, List,
  ListItemAvatar, ListItemText, ListItemButton, Select, MenuItem,
  FormControl, InputLabel, Tooltip, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import CameraIcon from '@mui/icons-material/Camera';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import ForumIcon from '@mui/icons-material/Forum';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StarIcon from '@mui/icons-material/Star';
import ChatIcon from '@mui/icons-material/Chat';
import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';

export default function Conversations() {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);

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
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    pending: 0,
    whatsapp: 0,
    instagram: 0
  });

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [statusFilter, platformFilter, searchTerm]);

  // Polling for real-time inbox updates
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const params = {
          page: 1,
          limit: 100,
          ...(statusFilter && { status: statusFilter }),
          ...(platformFilter && { platform: platformFilter }),
          ...(searchTerm && { search: searchTerm })
        };

        // Fetch conversations silently
        const convRes = await apiClient.get('/conversations', { params });
        if (!active) return;
        
        let list = convRes.data.conversations || [];
        
        // Find if the currently selected conversation is in the fetched list
        // and update selectedConversation with fresh backend state
        if (selectedConversation) {
          const freshSelected = list.find(c => c._id === selectedConversation._id);
          if (freshSelected) {
            setSelectedConversation(freshSelected);
          }
        }

        if (selectedConversation && selectedConversation.isTemporary) {
          if (!list.some(c => c._id === selectedConversation._id)) {
            list = [selectedConversation, ...list];
          }
        }
        setConversations(list);

        // Fetch stats silently
        const statsRes = await apiClient.get('/conversations/stats/overview');
        if (!active) return;
        setStats(statsRes.data);

        // If a conversation is selected (and not temp), fetch its messages silently
        if (selectedConversation && !selectedConversation.isTemporary) {
          const msgRes = await apiClient.get(`/conversations/${selectedConversation._id}`);
          if (!active) return;
          
          if (selectedConversation._id === msgRes.data.conversation._id) {
            setMessages(msgRes.data.messages || []);
          }
        }
      } catch (err) {
        console.error('Silent polling refresh error:', err);
      }
    };

    const interval = setInterval(poll, 4000); // Poll every 4 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedConversation, statusFilter, platformFilter, searchTerm]);

  const [fetchingTempCustomer, setFetchingTempCustomer] = useState(false);

  useEffect(() => {
    const checkStateCustomer = async () => {
      if (location.state && location.state.customerId && !loading && !fetchingTempCustomer) {
        const match = conversations.find(
          c => c.customerId?._id === location.state.customerId || c._id === location.state.customerId
        );
        if (match) {
          handleSelectConversation(match);
        } else {
          try {
            setFetchingTempCustomer(true);
            const res = await apiClient.get(`/customers/${location.state.customerId}`);
            const tempConv = {
              _id: `temp_${res.data._id}`,
              customerId: res.data,
              primaryPlatform: 'WHATSAPP',
              status: 'ACTIVE',
              messageCount: 0,
              lastMessage: null,
              isTemporary: true
            };
            setConversations(prev => {
              if (prev.some(c => c._id === tempConv._id)) return prev;
              return [tempConv, ...prev];
            });
            setSelectedConversation(tempConv);
            setMessages([]);
          } catch (err) {
            console.error('Failed to load temporary customer chat:', err);
          } finally {
            setFetchingTempCustomer(false);
          }
        }
      }
    };
    checkStateCustomer();
  }, [location.state, conversations, loading, fetchingTempCustomer]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100, // Load more in inbox for smooth scroll
        ...(statusFilter && { status: statusFilter }),
        ...(platformFilter && { platform: platformFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await apiClient.get('/conversations', { params });
      let list = response.data.conversations || [];
      if (selectedConversation && selectedConversation.isTemporary) {
        if (!list.some(c => c._id === selectedConversation._id)) {
          list = [selectedConversation, ...list];
        }
      }
      setConversations(list);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch conversations', severity: 'error' });
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/conversations/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      setMessagesLoading(true);
      setSelectedConversation(conversation);
      if (conversation.isTemporary) {
        setMessages([]);
      } else {
        const response = await apiClient.get(`/conversations/${conversation._id}`);
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load conversation thread', severity: 'error' });
      console.error('Failed to load conversation:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      if (selectedConversation.isTemporary) {
        const response = await apiClient.post('/ai-chat/send-message', {
          customerId: selectedConversation.customerId._id,
          message: newMessage
        });

        setNewMessage('');
        const newConvId = response.data.conversationId;
        await fetchConversations();

        if (newConvId) {
          try {
            setMessagesLoading(true);
            const convRes = await apiClient.get(`/conversations/${newConvId}`);
            setSelectedConversation(convRes.data.conversation);
            setMessages(convRes.data.messages || []);
          } catch (loadErr) {
            console.error('Failed to load new conversation details:', loadErr);
          } finally {
            setMessagesLoading(false);
          }
        }
      } else {
        const response = await apiClient.post(`/conversations/${selectedConversation._id}/messages`, {
          content: newMessage,
          platform: selectedConversation.primaryPlatform,
          sender: 'TEAM',
          messageType: 'TEXT'
        });

        // Optimistically append message
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        
        // Update last message in local conversation state list
        setConversations(prev => prev.map(c => {
          if (c._id === selectedConversation._id) {
            return {
              ...c,
              lastMessage: {
                content: newMessage,
                sender: 'TEAM',
                timestamp: new Date(),
                platform: selectedConversation.primaryPlatform
              }
            };
          }
          return c;
        }));
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to send message';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedConversation) return;
    try {
      await apiClient.put(`/conversations/${selectedConversation._id}/status`, {
        status: newStatus
      });
      setSnackbar({ open: true, message: `Status marked as ${newStatus}`, severity: 'success' });
      
      setSelectedConversation(prev => ({ ...prev, status: newStatus }));
      fetchConversations();
      fetchStats();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
      console.error('Failed to update status:', error);
    }
  };

  const handleToggleAutoReply = async (enabled) => {
    if (!selectedConversation) return;
    try {
      await apiClient.put(`/conversations/${selectedConversation._id}/auto-reply`, {
        autoReplyEnabled: enabled
      });
      
      setSelectedConversation(prev => ({ ...prev, autoReplyEnabled: enabled }));
      
      setConversations(prev => prev.map(c => {
        if (c._id === selectedConversation._id) {
          return { ...c, autoReplyEnabled: enabled };
        }
        return c;
      }));

      setSnackbar({
        open: true,
        message: enabled ? 'AI Autopilot enabled' : 'AI Autopilot paused',
        severity: enabled ? 'success' : 'warning'
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to toggle AI Autopilot', severity: 'error' });
      console.error('Failed to toggle AI Autopilot:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: '#2196f3',
      RESOLVED: '#4caf50',
      PENDING: '#ff9800',
      WAITING_FOR_CUSTOMER: '#ffb74d',
      WAITING_FOR_TEAM: '#f44336'
    };
    return colors[status] || '#9e9e9e';
  };

  const getSegmentColor = (segment) => {
    const colors = {
      VIP: { bg: '#ffebee', text: '#d32f2f', border: '#ffcdd2' },
      LOYAL: { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
      REGULAR: { bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' },
      NEW: { bg: '#e0f7fa', text: '#00838f', border: '#b2ebf2' },
      AT_RISK: { bg: '#fff3e0', text: '#ef6c00', border: '#ffe0b2' }
    };
    return colors[segment] || { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    // Else show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', mt: -2, width: '100%' }}>
      {/* Sleek KPI Summary Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #e8eef7',
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ForumIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
            Unified Conversations
          </Typography>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: '#1976d2' },
            { label: 'Active', value: stats.active, color: '#2196f3' },
            { label: 'Pending', value: stats.pending, color: '#ff9800' },
            { label: 'Resolved', value: stats.resolved, color: '#4caf50' },
            { label: 'WhatsApp', value: stats.whatsapp, color: '#25D366' },
            { label: 'Instagram', value: stats.instagram, color: '#E1306C' }
          ].map((item, idx) => (
            <Box key={idx} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                {item.label}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: item.color }}>
                {item.value || 0}
              </Typography>
            </Box>
          ))}
        </Stack>

        <IconButton size="small" onClick={() => { fetchConversations(); fetchStats(); }} title="Refresh Inbox">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Flex container taking full remaining height */}
      <Box sx={{ display: 'flex', gap: 2.5, flexGrow: 1, height: 'calc(100% - 60px)', minHeight: 0, width: '100%' }}>
        {/* Left Side: Conversations List */}
        <Box sx={{ width: { xs: '100%', md: '340px' }, minWidth: { md: '340px' }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              border: '1px solid #e8eef7',
              overflow: 'hidden',
              background: '#ffffff'
            }}
          >
            {/* Search and Filters Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e8eef7', bgcolor: '#fcfdfe' }}>
              <TextField
                placeholder="Search by name or content..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, bgcolor: '#ffffff' }
                  }
                }}
              />
              <Stack direction="row" spacing={1.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="WAITING_FOR_CUSTOMER">Waiting (Cust)</MenuItem>
                    <MenuItem value="WAITING_FOR_TEAM">Waiting (Team)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={platformFilter}
                    label="Platform"
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                    <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Scrollable Conversation List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <CircularProgress size={30} />
                </Box>
              ) : conversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                  <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    No conversations match filters.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {conversations.map((conv) => {
                    const isSelected = selectedConversation?._id === conv._id;
                    const cust = conv.customerId;
                    const isWA = conv.primaryPlatform === 'WHATSAPP';
                    const brandColor = isWA ? '#25D366' : '#E1306C';
                    const rfm = getSegmentColor(cust?.rfmSegment);

                    return (
                      <ListItemButton
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv)}
                        sx={{
                          borderRadius: 2.5,
                          mb: 1,
                          p: 1.5,
                          transition: 'all 0.2s',
                          border: isSelected ? '1px solid #bbdefb' : '1px solid transparent',
                          bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                          '&:hover': {
                            bgcolor: isSelected ? '#e3f2fd' : '#f5f8fc'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  bgcolor: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                              >
                                {isWA ? (
                                  <PhoneIcon sx={{ fontSize: 10, color: brandColor }} />
                                ) : (
                                  <CameraIcon sx={{ fontSize: 10, color: brandColor }} />
                                )}
                              </Box>
                            }
                          >
                            <Avatar sx={{ bgcolor: isWA ? '#e8f5e9' : '#fce4ec', color: brandColor, fontWeight: 700 }}>
                              {getAvatarInitial(cust)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0, ml: 1.5 }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {getDisplayName(cust)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                              {formatTime(conv.lastMessage?.timestamp)}
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ display: 'block', maxWidth: '200px' }}
                            >
                              {conv.lastMessage?.content || 'No messages yet'}
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              <Chip
                                label={conv.status}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  backgroundColor: conv.status === 'ACTIVE' ? 'success.50' : 'grey.100',
                                  color: conv.status === 'ACTIVE' ? 'success.main' : 'text.secondary',
                                  border: 'none'
                                }}
                              />
                              {conv.leadScore !== undefined && (
                                <Chip
                                  label={`Score: ${conv.leadScore}/10`}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: conv.leadScore >= 6.5 ? 'secondary.50' : 'grey.100',
                                    color: conv.leadScore >= 6.5 ? 'secondary.main' : 'text.secondary',
                                    border: 'none'
                                  }}
                                />
                              )}
                              {rfm && (
                                <Chip
                                  label={rfm.label}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: rfm.bg,
                                    color: rfm.text,
                                    border: `1px solid ${rfm.border}`
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Side: Chat Window (Stretches to fill all remaining width) */}
        <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedConversation ? (
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: '1px solid #e8eef7',
                overflow: 'hidden',
                background: '#ffffff'
              }}
            >
              {/* Chat Window Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e8eef7', bgcolor: '#fcfdfe' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: selectedConversation.primaryPlatform === 'WHATSAPP' ? '#25D366' : '#E1306C', color: '#ffffff', fontWeight: 700 }}>
                      {getAvatarInitial(selectedConversation.customerId)}
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                          {getDisplayName(selectedConversation.customerId)}
                        </Typography>
                        {selectedConversation.customerId?.rfmSegment && (
                          <Chip
                            label={selectedConversation.customerId.rfmSegment}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              ...getSegmentColor(selectedConversation.customerId.rfmSegment)
                            }}
                          />
                        )}
                        {selectedConversation.customerId?.totalSpent > 0 && (
                          <Chip
                            label={`Spent: ₹${selectedConversation.customerId.totalSpent.toLocaleString()}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 500 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {selectedConversation.customerId?.phone} | Channel: {selectedConversation.primaryPlatform}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
                    {/* AI Autopilot Switch */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedConversation.autoReplyEnabled !== false}
                          onChange={(e) => handleToggleAutoReply(e.target.checked)}
                          color="secondary"
                          size="small"
                        />
                      }
                      label={
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <SmartToyIcon
                            sx={{
                              fontSize: 16,
                              color: selectedConversation.autoReplyEnabled !== false ? 'secondary.main' : 'text.disabled'
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            Autopilot
                          </Typography>
                        </Stack>
                      }
                      sx={{ mr: 0.5 }}
                    />

                    <FormControl size="small" sx={{ width: 130 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={selectedConversation.status}
                        label="Status"
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        sx={{ borderRadius: 2, height: 32, fontSize: '0.8rem' }}
                      >
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="RESOLVED">Resolved</MenuItem>
                        <MenuItem value="WAITING_FOR_CUSTOMER">Waiting (Cust)</MenuItem>
                        <MenuItem value="WAITING_FOR_TEAM">Waiting (Team)</MenuItem>
                      </Select>
                    </FormControl>

                    <Tooltip title="Actions">
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>

              {/* Chat Message Stream */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#fafbfd' }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={35} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
                    <ForumIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      No messages in this chat. Type below to send a message.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    {messages.map((msg, idx) => {
                      const isOutbound = msg.sender?.type === 'TEAM' || msg.sender?.type === 'SYSTEM' || msg.isAutoResponse;
                      const isAI = msg.sender?.type === 'SYSTEM' || msg.isAutoResponse;

                      return (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            justifyContent: isOutbound ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOutbound ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.8,
                                borderRadius: isOutbound ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: isOutbound
                                  ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                                  : '#ffffff',
                                color: isOutbound ? '#ffffff' : 'text.primary',
                                border: isOutbound ? 'none' : '1px solid #e8eef7',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {msg.content}
                              </Typography>
                            </Paper>
                            
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5, px: 0.5 }}>
                              {isAI && (
                                <Chip
                                  label="AI"
                                  size="small"
                                  icon={<SmartToyIcon style={{ fontSize: 10, color: '#673ab7' }} />}
                                  sx={{
                                    height: 14,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: '#ede7f6',
                                    color: '#673ab7',
                                    border: '1px solid #d1c4e9',
                                    '& .MuiChip-icon': { ml: 0.5 }
                                  }}
                                />
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {formatTime(msg.createdAt)}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Stack>
                )}
              </Box>

              {/* Chat Input Footer */}
              <Divider />
              <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a response to this customer..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: '#fafafa'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    sx={{
                      borderRadius: 3,
                      height: 48,
                      minWidth: 48,
                      p: 0,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                      bgcolor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 20 }} />}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 3,
                border: '1px solid #e8eef7',
                bgcolor: '#ffffff',
                p: 4,
                textAlign: 'center'
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  mb: 2,
                  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.08)'
                }}
              >
                <ForumIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Unified Inbox Sandbox
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '360px', mb: 3 }}>
                Select a conversation from the sidebar list to view real-time chat history, customer details, and reply to messages.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Snackbar alerts */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
