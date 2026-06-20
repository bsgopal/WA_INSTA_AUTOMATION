import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BrushIcon from '@mui/icons-material/Brush';
import InfoIcon from '@mui/icons-material/Info';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import AIProviderStatus from '../../components/AIProviderStatus';

// Helper to resolve backend media URLs
const backendUrl = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

// Parser to turn raw message content or widget metadata into structured cards
const parseMessageCard = (messageOrContent, isOutbound, isAI) => {
  const content = typeof messageOrContent === 'string' ? messageOrContent : (messageOrContent?.content || '');
  const widgetData = typeof messageOrContent === 'object'
    ? (messageOrContent?.widgetData || messageOrContent?.variables?.widgetData || messageOrContent?.variables?.interactive || null)
    : null;

  const widgetButtons = Array.isArray(widgetData?.buttons) ? widgetData.buttons : [];
  const widgetList = widgetData?.list || null;

  if (widgetButtons.length > 0 || widgetList) {
    return {
      type: 'widget',
      title: widgetList?.title || (widgetButtons.length > 0 ? 'âš¡ Interactive Reply' : 'ðŸ“‹ Interactive Reply'),
      headerBg: isOutbound
        ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
        : 'linear-gradient(135deg, #78909c 0%, #546e7a 100%)',
      icon: isOutbound ? 'ai' : 'customer',
      body: content,
      buttons: widgetButtons.map(btn => ({
        text: btn.label || btn.text || btn.value || btn.actionValue || '',
        value: btn.value || btn.actionValue || btn.label || btn.text || '',
        actionType: btn.actionType || btn.type || 'QUICK_REPLY',
        triggerText: btn.triggerText || btn.label || btn.text || btn.value || btn.actionValue || ''
      })),
      list: widgetList
    };
  }

  if (!content) return null;
  const lines = content.split('\n');
  
  // 1. Check for product catalog listings
  const productBlocks = [];
  let currentProduct = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const nameMatch = trimmed.match(/^\*?(\d+)\.\s*(.+?)\*?$/) || trimmed.match(/^\*?(\d+)\.\s*(.+?)\*?\s*$/);
    if (nameMatch) {
      if (currentProduct) productBlocks.push(currentProduct);
      currentProduct = {
        index: nameMatch[1],
        name: nameMatch[2].replace(/\*/g, '').trim(),
        price: 'Contact for price',
        imageUrl: '',
        productUrl: ''
      };
      continue;
    }
    
    if (currentProduct) {
      if (trimmed.toLowerCase().includes('price:') || trimmed.toLowerCase().includes('ðŸ’° à¤•à¥€à¤®à¤¤:') || trimmed.toLowerCase().includes('ðŸ’° à®µà®¿à®²à¯ˆ:')) {
        currentProduct.price = trimmed.replace(/^(?:price|ðŸ’° à¤•à¥€à¤®à¤¤|ðŸ’° à®µà®¿à®²à¯ˆ|Price)\s*[:ï¼š]\s*/i, '').replace(/\*/g, '').trim();
      } else if (trimmed.toLowerCase().includes('image:') || trimmed.toLowerCase().includes('img:')) {
        currentProduct.imageUrl = trimmed.replace(/^(?:image|img)\s*[:ï¼š]\s*/i, '').trim();
      } else if (trimmed.toLowerCase().includes('view / buy:') || trimmed.toLowerCase().includes('view details:') || trimmed.toLowerCase().includes('ðŸ”— à¤µà¤¿à¤µà¤°à¤£ à¤¦à¥‡à¤–à¥‡à¤‚:') || trimmed.toLowerCase().includes('ðŸ”— à®µà®¿à®µà®°à®®à¯ à®ªà®¾à®°à¯à®•à¯à®•:')) {
        currentProduct.productUrl = trimmed.replace(/^(?:view \/ buy|view details|ðŸ”— à¤µà¤¿à¤µà¤°à¤£ à¤¦à¥‡à¤–à¥‡à¤‚|ðŸ”— à®µà®¿à®µà®°à®®à¯ à®ªà®¾à®°à¯à®•à¯à®•|Link)\s*[:ï¼š]\s*/i, '').trim();
      }
    }
  }
  if (currentProduct) productBlocks.push(currentProduct);

  if (productBlocks.length > 0 && productBlocks.every(p => p.name)) {
    let headerText = '';
    let footerText = '';
    let readingHeader = true;
    for (const line of lines) {
      const trimmed = line.trim();
      const isProductLine = trimmed.match(/^\*?\d+\./) || 
                            trimmed.toLowerCase().includes('price:') || 
                            trimmed.toLowerCase().includes('ðŸ’°') ||
                            trimmed.toLowerCase().includes('image:') || 
                            trimmed.toLowerCase().includes('link:') ||
                            trimmed.toLowerCase().includes('view / buy:') ||
                            trimmed.toLowerCase().includes('view details:') ||
                            trimmed.toLowerCase().includes('ðŸ”—');
      if (isProductLine) {
        readingHeader = false;
        continue;
      }
      if (readingHeader) {
        headerText += line + '\n';
      } else {
        if (!trimmed.toLowerCase().includes('reply') && !trimmed.toLowerCase().includes('choose this')) {
          footerText += line + '\n';
        }
      }
    }
    return {
      type: 'catalog',
      header: headerText.trim(),
      products: productBlocks,
      footer: footerText.trim()
    };
  }

  // 2. Otherwise, check for normal card formatting (Metadata grids and Buttons)
  const buttons = [];
  const bodyLines = [];
  const standaloneButtons = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const optionMatch = trimmed.match(/^\s*\*?([1-9])\*?\.\s*(.+)$/);
    const btnMatch = trimmed.match(/^\[(.+?)\]$/) || trimmed.match(/^\[Button:\s*(.+?)\]$/);
    
    if (optionMatch) {
      const id = optionMatch[1];
      const text = optionMatch[2].replace(/\*/g, '').replace(/\[.+?\]/g, '').trim();
      buttons.push({ id, text });
    } else if (btnMatch) {
      standaloneButtons.push({ id: btnMatch[1], text: btnMatch[1] });
    } else {
      bodyLines.push(line);
    }
  }

  const finalButtons = [...buttons, ...standaloneButtons];
  const bodyText = bodyLines.join('\n').trim();

  // Determine card category/style based on keywords
  let title = 'ðŸ“‹ Store Update';
  let headerBg = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)';
  let icon = 'info';

  if (!isOutbound) {
    title = 'ðŸ‘¤ Customer Inquiry';
    headerBg = 'linear-gradient(135deg, #78909c 0%, #546e7a 100%)';
    icon = 'customer';
  } else {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('rate') || lowerContent.includes('price') || lowerContent.includes('gold') || lowerContent.includes('silver') || lowerContent.includes('platinum')) {
      title = 'ðŸ’Ž Today\'s Live Metal Rates';
      headerBg = 'linear-gradient(135deg, #fbc02d 0%, #f57f17 100%)';
      icon = 'gold';
    } else if (lowerContent.includes('delivery') || lowerContent.includes('shipping') || lowerContent.includes('track') || lowerContent.includes('pickup') || lowerContent.includes('refund')) {
      title = lowerContent.includes('refund') ? 'ðŸ’° Refund Status' : 'ðŸšš Shipment Tracking';
      headerBg = 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)';
      icon = 'delivery';
    } else if (lowerContent.includes('custom') || lowerContent.includes('design') || lowerContent.includes('make') || lowerContent.includes('bespoke')) {
      title = 'ðŸŽ¨ Custom Jewelry Design';
      headerBg = 'linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%)';
      icon = 'custom';
    } else if (lowerContent.includes('complaint') || lowerContent.includes('sorry') || lowerContent.includes('apologize') || lowerContent.includes('issue')) {
      title = 'âš ï¸ Support Assistance';
      headerBg = 'linear-gradient(135deg, #e53935 0%, #c62828 100%)';
      icon = 'complaint';
    } else if (lowerContent.includes('welcome') || lowerContent.includes('namaste') || lowerContent.includes('hello')) {
      title = 'âœ¨ Greeting & Introduction';
      headerBg = 'linear-gradient(135deg, #00acc1 0%, #00838f 100%)';
      icon = 'welcome';
    } else if (isAI) {
      title = 'ðŸ¤– Assistant Smart Response';
      headerBg = 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)';
      icon = 'ai';
    }
  }

  return {
    type: 'ticket',
    title,
    headerBg,
    icon,
    body: bodyText,
    buttons: finalButtons
  };
};

const formatActionTypeLabel = (actionType, fallback = 'Quick Reply') => {
  const normalized = String(actionType || '').trim();
  if (!normalized) return fallback;
  return normalized.replace(/_/g, ' ');
};

const formatMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
};

const formatListBubbleText = (card) => {
  if (!card?.list?.sections?.length) return '';

  const lines = [];
  const title = String(card.list.title || '').trim();
  const buttonText = String(card.list.buttonText || '').trim();

  if (title) lines.push(title);
  if (buttonText) lines.push(buttonText);

  card.list.sections.forEach((section) => {
    const sectionTitle = String(section?.title || '').trim();
    if (sectionTitle) lines.push(sectionTitle);

    (section?.rows || []).forEach((row) => {
      const rowTitle = String(row?.title || '').trim();
      const rowDescription = String(row?.description || '').trim();
      if (!rowTitle) return;
      lines.push(rowDescription ? `${rowTitle} - ${rowDescription}` : rowTitle);
    });
  });

  return lines.join('\n');
};

const renderCardIcon = (iconName) => {
  switch (iconName) {
    case 'gold':
      return <StarIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'delivery':
      return <LocalShippingIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'custom':
      return <BrushIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'complaint':
      return <SupportAgentIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'welcome':
      return <InfoIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'customer':
      return <AccountCircleIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    case 'ai':
      return <SmartToyIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
    default:
      return <InfoIcon sx={{ fontSize: 16, color: '#ffffff' }} />;
  }
};

export default function Conversations() {
  const location = useLocation();
  const navigate = useNavigate();
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
      
      let updatedStatus = selectedConversation.status;
      if (enabled && selectedConversation.status === 'WAITING_FOR_TEAM') {
        updatedStatus = 'ACTIVE';
        await apiClient.put(`/conversations/${selectedConversation._id}/status`, {
          status: 'ACTIVE'
        });
      }
      
      setSelectedConversation(prev => ({ 
        ...prev, 
        autoReplyEnabled: enabled,
        status: updatedStatus
      }));
      
      setConversations(prev => prev.map(c => {
        if (c._id === selectedConversation._id) {
          return { 
            ...c, 
            autoReplyEnabled: enabled,
            status: updatedStatus
          };
        }
        return c;
      }));

      // Refresh list & stats
      fetchConversations();
      fetchStats();

      setSnackbar({
        open: true,
        message: enabled ? 'AI Autopilot enabled & status marked as Active' : 'AI Autopilot paused',
        severity: enabled ? 'success' : 'warning'
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to toggle AI Autopilot', severity: 'error' });
      console.error('Failed to toggle AI Autopilot:', error);
    }
  };

  const handleActionClick = async (actionOrPayload) => {
    if (!selectedConversation || sending) return;

    const actionPayload = typeof actionOrPayload === 'object' && actionOrPayload !== null
      ? actionOrPayload
      : { text: actionOrPayload, value: actionOrPayload };
    const actionText = actionPayload.text || actionPayload.value || '';
    const actionType = String(actionPayload.actionType || actionPayload.widgetData?.interactiveReply?.actionType || '').toUpperCase();
    const actionValue = actionPayload.value || actionPayload.actionValue || actionText;
    const actionTriggerText = actionPayload.triggerText || actionPayload.text || actionValue;

    if (actionType === 'URL' && actionValue) {
      window.open(actionValue, '_blank', 'noopener,noreferrer');
      return;
    }

    if (actionType === 'CATALOG') {
      if (actionValue && /^https?:\/\//i.test(actionValue)) {
        window.open(actionValue, '_blank', 'noopener,noreferrer');
      } else {
        navigate('/catalog');
      }
      return;
    }
    
    try {
      setSending(true);
      
      // Post customer message (simulating the client's click)
      const response = await apiClient.post(`/conversations/${selectedConversation._id}/messages`, {
        content: actionText,
        platform: selectedConversation.primaryPlatform,
        sender: 'CUSTOMER',
        messageType: 'TEXT',
        widgetData: actionPayload.widgetData || {
          interactiveReply: {
            id: actionPayload.id || actionValue,
            text: actionPayload.text || actionValue,
            actionValue,
            actionType: actionType || 'CUSTOM',
            triggerText: actionTriggerText
          }
        }
      });

      // Optimistically append the CUSTOMER message to chat list
      setMessages(prev => [...prev, response.data]);
      
      // Update last message in sidebar list
      setConversations(prev => prev.map(c => {
        if (c._id === selectedConversation._id) {
          return {
            ...c,
            lastMessage: {
              content: actionText,
              sender: 'CUSTOMER',
              timestamp: new Date(),
              platform: selectedConversation.primaryPlatform
            }
          };
        }
        return c;
      }));

      // Scroll to bottom immediately
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Failed to post simulated customer action:', error);
      setSnackbar({ open: true, message: 'Failed to send action', severity: 'error' });
    } finally {
      setSending(false);
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
                              {conv.status === 'WAITING_FOR_TEAM' ? (
                                <Chip
                                  label="Escalated"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: '#ffebee',
                                    color: '#d32f2f',
                                    border: '1px solid #ffcdd2',
                                    animation: 'pulseRed 2s infinite',
                                    '@keyframes pulseRed': {
                                      '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                                      '70%': { boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)' },
                                      '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' }
                                    }
                                  }}
                                />
                              ) : (
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
                              )}
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
                            label={`Spent: â‚¹${selectedConversation.customerId.totalSpent.toLocaleString()}`}
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

              {/* Warning Banner if Autopilot is paused/escalated */}
              {(selectedConversation.autoReplyEnabled === false || selectedConversation.status === 'WAITING_FOR_TEAM') && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    px: 3,
                    bgcolor: '#fff9c4',
                    borderBottom: '1px solid #fff59d',
                    borderRadius: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <ReportProblemIcon sx={{ color: '#f57f17' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57f17', fontSize: '0.82rem' }}>
                      AI Autopilot Paused â€” This conversation is escalated for admin takeover.
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    onClick={() => handleToggleAutoReply(true)}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: '#f57f17',
                      px: 2,
                      py: 0.5,
                      '&:hover': { bgcolor: '#e65100' }
                    }}
                  >
                    Resume Autopilot
                  </Button>
                </Paper>
              )}

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
                      const card = parseMessageCard(msg, isOutbound, isAI);

                      return (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            justifyContent: isOutbound ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOutbound ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            {card && card.type === 'widget' && card.list?.sections?.length ? (
                              <Paper
                                elevation={0}
                                sx={{
                                  alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                                  bgcolor: '#ffffff',
                                  color: '#111827',
                                  borderRadius: '18px 18px 6px 18px',
                                  border: '1px solid #e6e0d8',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                  width: '100%',
                                  minWidth: { xs: '260px', sm: '320px' },
                                  maxWidth: '420px',
                                  p: 1.8
                                }}
                              >
                                {card.list.title && (
                                  <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.4, mb: 0.9, fontSize: '0.95rem' }}>
                                    {card.list.title}
                                  </Typography>
                                )}
                                <Stack spacing={0.8}>
                                  {card.list.sections.map((section, sectionIdx) => (
                                    <Box key={sectionIdx}>
                                      {section.title && (
                                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.28, mb: 0.45, fontSize: '0.88rem' }}>
                                          {section.title}
                                        </Typography>
                                      )}
                                      <Stack spacing={0.25}>
                                        {(section.rows || []).map((row, rowIdx) => (
                                          <Box
                                            key={rowIdx}
                                            onClick={() => handleActionClick({
                                              text: row.title,
                                              value: row.actionValue || row.id || row.title,
                                              actionType: row.actionType || 'CUSTOM',
                                              triggerText: row.title,
                                              widgetData: {
                                                interactiveReply: {
                                                  id: row.id || row.title,
                                                  actionValue: row.actionValue || row.id || row.title,
                                                  actionType: row.actionType || 'CUSTOM',
                                                  triggerText: row.title,
                                                  text: row.title
                                                }
                                              }
                                            })}
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'flex-start',
                                              gap: 0.8,
                                              cursor: 'pointer',
                                              px: 0.5,
                                              py: 0.35,
                                              borderRadius: 1.5,
                                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' }
                                            }}
                                          >
                                            <Typography variant="body2" sx={{ lineHeight: 1.35, fontSize: '0.9rem' }}>
                                              • <strong>{row.title}</strong>{row.description ? ` - ${row.description}` : ''}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>
                                  ))}
                                </Stack>
                              </Paper>
                            ) : card && card.type === 'widget' ? (
                              <Paper
                                elevation={0}
                                sx={{
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  border: '1px solid #e8eef7',
                                  boxShadow: '0 3px 10px rgba(0,0,0,0.02)',
                                  bgcolor: '#ffffff',
                                  width: '100%',
                                  minWidth: { xs: '260px', sm: '380px' },
                                  maxWidth: '480px'
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 1.2,
                                    px: 2,
                                    background: card.headerBg,
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.2
                                  }}
                                >
                                  {renderCardIcon(card.icon)}
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', flexGrow: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {card.title}
                                  </Typography>
                                </Box>

                                <Box sx={{ p: 2, px: 2.2 }}>
                                  {card.body && (
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, mb: 1.5 }}>
                                      {card.body}
                                    </Typography>
                                  )}

                                  {card.buttons.length > 0 && (
                                    <>
                                      <Divider sx={{ my: 1.5, borderColor: '#e8eef7' }} />
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {card.buttons.map((btn, bIdx) => (
                                          <Button
                                            key={bIdx}
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleActionClick({
                                              text: btn.text,
                                              value: btn.value || btn.text,
                                              actionType: btn.actionType || 'QUICK_REPLY',
                                              triggerText: btn.triggerText || btn.text,
                                              widgetData: {
                                                interactiveReply: {
                                                  id: btn.value || btn.text,
                                                  actionValue: btn.value || btn.text,
                                                  actionType: btn.type || 'QUICK_REPLY',
                                                  triggerText: btn.triggerText || btn.text,
                                                  text: btn.text
                                                }
                                              }
                                            })}
                                            sx={{
                                              borderRadius: 4,
                                              textTransform: 'none',
                                              fontSize: '0.72rem',
                                              fontWeight: 700,
                                              color: 'primary.main',
                                              borderColor: '#bbdefb',
                                              bgcolor: 'rgba(25, 118, 210, 0.01)',
                                              py: 0.3,
                                              px: 1.5,
                                              '&:hover': {
                                                bgcolor: 'rgba(25, 118, 210, 0.06)',
                                                borderColor: 'primary.main'
                                              }
                                            }}
                                          >
                                            {btn.text}
                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>
                                              {formatActionTypeLabel(btn.actionType, 'Quick Reply')}
                                            </Typography>
                                          </Button>
                                        ))}
                                      </Box>
                                    </>
                                  )}
                                </Box>
                              </Paper>
                            ) : card && card.type === 'catalog' ? (
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  borderRadius: 4,
                                  border: '1px solid #e8eef7',
                                  bgcolor: '#ffffff',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                  width: '100%',
                                  maxWidth: '650px'
                                }}
                              >
                                {card.header && (
                                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontWeight: 500 }}>
                                    {card.header}
                                  </Typography>
                                )}
                                
                                <Grid container spacing={2} sx={{ mb: 1.5 }}>
                                  {card.products.map((product, pIdx) => {
                                    const resolvedImg = product.imageUrl 
                                      ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${backendUrl}${product.imageUrl}`)
                                      : 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format';
                                    return (
                                      <Grid item xs={12} sm={6} md={4} key={pIdx}>
                                        <Paper
                                          elevation={0}
                                          sx={{
                                            p: 1.2,
                                            borderRadius: 3,
                                            border: '1px solid #e8eef7',
                                            bgcolor: '#fcfdfe',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                              transform: 'translateY(-3px)',
                                              boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
                                              borderColor: 'primary.light'
                                            }
                                          }}
                                        >
                                          <Box>
                                            <Box
                                              component="img"
                                              src={resolvedImg}
                                              alt={product.name}
                                              sx={{
                                                width: '100%',
                                                height: 100,
                                                objectFit: 'cover',
                                                borderRadius: 2.5,
                                                mb: 1
                                              }}
                                            />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: '0.8rem', lineHeight: 1.3 }}>
                                              {product.name}
                                            </Typography>
                                            <Chip
                                              label={product.price}
                                              size="small"
                                              sx={{
                                                bgcolor: 'primary.50',
                                                color: 'primary.main',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                mb: 1.5
                                              }}
                                            />
                                          </Box>
                                          <Stack spacing={0.8}>
                                            {product.productUrl && (
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                href={product.productUrl}
                                                target="_blank"
                                                sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: 2, height: 26 }}
                                              >
                                                View details
                                              </Button>
                                            )}
                                            <Button
                                              variant="contained"
                                              size="small"
                                              onClick={() => handleActionClick(`I would like to order: ${product.name}`)}
                                              sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: 2, height: 26, boxShadow: 'none' }}
                                            >
                                              Select Design
                                            </Button>
                                          </Stack>
                                        </Paper>
                                      </Grid>
                                    );
                                  })}
                                </Grid>

                                {card.footer && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.8rem' }}>
                                    {card.footer}
                                  </Typography>
                                )}
                              </Paper>
                            ) : card ? (
                              <Paper
                                elevation={0}
                                sx={{
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  border: '1px solid #e8eef7',
                                  boxShadow: '0 3px 10px rgba(0,0,0,0.02)',
                                  bgcolor: '#ffffff',
                                  width: '100%',
                                  minWidth: { xs: '260px', sm: '380px' },
                                  maxWidth: '480px'
                                }}
                              >
                                {/* Ticket Header */}
                                <Box
                                  sx={{
                                    p: 1.2,
                                    px: 2,
                                    background: card.headerBg,
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.2
                                  }}
                                >
                                  {renderCardIcon(card.icon)}
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', flexGrow: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {card.title}
                                  </Typography>
                                </Box>
                                
                                {/* Ticket Body */}
                                <Box sx={{ p: 2, px: 2.2 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'text.primary',
                                      lineHeight: 1.5,
                                      fontSize: '0.85rem',
                                      whiteSpace: 'pre-wrap',
                                      '& strong': {
                                        color: isOutbound ? 'primary.dark' : 'inherit',
                                        fontWeight: 700
                                      }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(card.body) }}
                                  />
                                  
                                  {/* Action Buttons */}
                                  {card.buttons.length > 0 && (
                                    <>
                                      <Divider sx={{ my: 1.5, borderColor: '#e8eef7' }} />
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {card.buttons.map((btn, bIdx) => (
                                          <Button
                                            key={bIdx}
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleActionClick({
                                              text: btn.text,
                                              value: btn.value || btn.text,
                                              widgetData: {
                                                interactiveReply: {
                                                  id: btn.value || btn.text,
                                                  text: btn.text
                                                }
                                              }
                                            })}
                                            sx={{
                                              borderRadius: 4,
                                              textTransform: 'none',
                                              fontSize: '0.72rem',
                                              fontWeight: 700,
                                              color: 'primary.main',
                                              borderColor: '#bbdefb',
                                              bgcolor: 'rgba(25, 118, 210, 0.01)',
                                              py: 0.3,
                                              px: 1.5,
                                              '&:hover': {
                                                bgcolor: 'rgba(25, 118, 210, 0.06)',
                                                borderColor: 'primary.main'
                                              }
                                            }}
                                          >
                                            {btn.text}
                                          </Button>
                                        ))}
                                      </Box>
                                    </>
                                  )}
                                </Box>
                              </Paper>
                            ) : (
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
                            )}
                            
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
                <AIProviderStatus compact sx={{ mb: 1.5 }} />
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





