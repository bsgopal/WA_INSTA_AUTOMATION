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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import AIProviderStatus from '../../components/AIProviderStatus';
import { API_ORIGIN } from '../../api/base';

// Helper to resolve backend media URLs
const backendUrl = API_ORIGIN;

// Parser to turn raw message content or widget metadata into structured cards (only for real interactive widgets/catalogs)
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
      title: widgetList?.title || (widgetButtons.length > 0 ? '⚡ Interactive Options' : '📋 Quick Menu'),
      headerBg: isOutbound
        ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
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
      if (trimmed.toLowerCase().includes('price:') || trimmed.toLowerCase().includes('💰 कीमत:') || trimmed.toLowerCase().includes('💰 விலை:')) {
        currentProduct.price = trimmed.replace(/^(?:price|💰 कीमत|💰 விலை|Price)\s*[:：]\s*/i, '').replace(/\*/g, '').trim();
      } else if (trimmed.toLowerCase().includes('image:') || trimmed.toLowerCase().includes('img:')) {
        currentProduct.imageUrl = trimmed.replace(/^(?:image|img)\s*[:：]\s*/i, '').trim();
      } else if (trimmed.toLowerCase().includes('view / buy:') || trimmed.toLowerCase().includes('view details:') || trimmed.toLowerCase().includes('🔗 विवरण देखें:') || trimmed.toLowerCase().includes('🔗 விவரம் பார்க்க:')) {
        currentProduct.productUrl = trimmed.replace(/^(?:view \/ buy|view details|🔗 विवरण देखें|🔗 விவரம் பார்க்க|Link)\s*[:：]\s*/i, '').trim();
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
                            trimmed.toLowerCase().includes('💰') ||
                            trimmed.toLowerCase().includes('image:') || 
                            trimmed.toLowerCase().includes('link:') ||
                            trimmed.toLowerCase().includes('view / buy:') ||
                            trimmed.toLowerCase().includes('view details:') ||
                            trimmed.toLowerCase().includes('🔗');
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

  // 2. Check for explicit standalone action buttons [Button text]
  const standaloneButtons = [];
  for (const line of lines) {
    const btnMatch = line.trim().match(/^\[(?:Button:\s*)?(.+?)\]$/);
    if (btnMatch) {
      standaloneButtons.push({ text: btnMatch[1], value: btnMatch[1] });
    }
  }

  if (standaloneButtons.length > 0) {
    const cleanBody = lines.filter(l => !l.trim().match(/^\[(?:Button:\s*)?(.+?)\]$/)).join('\n').trim();
    return {
      type: 'widget',
      title: '⚡ Quick Actions',
      headerBg: isOutbound
        ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      icon: isOutbound ? 'ai' : 'customer',
      body: cleanBody,
      buttons: standaloneButtons
    };
  }

  // Normal text messages render as clean WhatsApp chat bubbles (return null)
  return null;
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

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const str = String(phone).trim();
    if (str.includes('@lid')) return '';
    let cleaned = str.replace(/@c\.us|@s\.whatsapp\.net/g, '').replace(/\D/g, '');
    if (!cleaned || (cleaned.length > 13 && !cleaned.startsWith('91'))) return '';
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return '+' + cleaned;
  };

  const getDisplayName = (cust, conv) => {
    if (!cust) return conv?.title || 'Unknown Customer';
    const firstName = (cust.firstName || '').trim();
    const lastName = (cust.lastName || '').trim();
    const phone = (cust.phone || '').trim();
    const pushName = (cust.customFields?.displayName || cust.customFields?.pushName || '').trim();
    
    const isPlaceholder = !firstName || 
                          firstName.toLowerCase().startsWith('customer') || 
                          firstName.includes('@lid') || 
                          lastName.includes('@lid') ||
                          firstName.includes('@c.us') ||
                          firstName.startsWith('+') ||
                          firstName === phone;
                          
    if (!isPlaceholder && (firstName || lastName)) {
      return `${firstName} ${lastName}`.trim();
    }

    if (pushName && !pushName.includes('@lid') && !pushName.startsWith('+')) {
      return pushName;
    }

    const formattedPhone = formatPhoneDisplay(phone);
    if (formattedPhone) {
      return formattedPhone;
    }

    if (pushName) {
      return pushName;
    }

    if (conv?.title && !conv.title.includes('@lid') && !conv.title.includes('Chat with Customer') && !conv.title.startsWith('Chat with +')) {
      return conv.title.replace(/^Chat with\s+/i, '');
    }

    return 'WhatsApp Customer';
  };

  const getAvatarInitial = (cust, conv) => {
    const name = getDisplayName(cust, conv);
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
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    pending: 0,
    whatsapp: 0,
    instagram: 0
  });
  const [smartReplies, setSmartReplies] = useState([]);
  const [smartRepliesLoading, setSmartRepliesLoading] = useState(false);

  const fetchSmartReplies = async (customText = null) => {
    const targetText = customText || [...messages].reverse().find(m => m.sender?.type === 'CUSTOMER')?.content;
    if (!targetText || !targetText.trim()) {
      setSnackbar({ open: true, message: 'No customer message found to generate suggestions for.', severity: 'info' });
      return;
    }
    try {
      setSmartRepliesLoading(true);
      const res = await apiClient.post('/ai/smart-replies', {
        messageText: targetText,
        customerContext: {
          segment: selectedConversation?.customerId?.rfmSegment || 'REGULAR',
          customerName: getDisplayName(selectedConversation?.customerId, selectedConversation)
        }
      });
      if (Array.isArray(res.data?.replies) && res.data.replies.length > 0) {
        setSmartReplies(res.data.replies);
      } else {
        setSmartReplies([
          { type: 'professional', text: 'Thank you for reaching out. How can I assist you with your order?' },
          { type: 'friendly', text: 'Hi! Glad to connect with you. What details do you need?' },
          { type: 'brief', text: 'Hello! Checking this right away for you.' }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch smart replies:', err);
      setSmartReplies([
        { type: 'professional', text: 'Thank you for contacting us. How can we assist you today?' },
        { type: 'friendly', text: 'Hi there! We are happy to help you with that.' },
        { type: 'brief', text: 'Sure! Let me check that for you right now.' }
      ]);
    } finally {
      setSmartRepliesLoading(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const response = await apiClient.get('/ai-chat/whatsapp/status');
      setWhatsappStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    }
  };

  useEffect(() => {
    fetchWhatsappStatus();
  }, []);

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
      const requestBody = {
        content: newMessage,
        sender: 'TEAM',
        messageType: 'TEXT'
      };

      if (!selectedConversation.isTemporary) {
        requestBody.platform = selectedConversation.primaryPlatform || selectedConversation.platform;
      }

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
        const response = await apiClient.post(`/conversations/${selectedConversation._id}/messages`, requestBody);

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
                platform: requestBody.platform || selectedConversation.primaryPlatform
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 85px)', mt: 0, width: '100%' }}>
      {/* Sleek Space-Saving Header Ribbon */}
      <Box
        sx={{
          px: 2,
          py: 1,
          mb: 1.5,
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ForumIcon sx={{ color: '#84cc16', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.2 }}>
              Conversations
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>
              Live customer messaging & omnichannel chat
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: '#0f172a', bg: '#f1f5f9' },
            { label: 'Active', value: stats.active, color: '#0369a1', bg: '#e0f2fe' },
            { label: 'Pending', value: stats.pending, color: '#c2410c', bg: '#ffedd5' },
            { label: 'Resolved', value: stats.resolved, color: '#15803d', bg: '#dcfce7' },
            { label: 'WhatsApp', value: stats.whatsapp, color: '#16a34a', bg: '#ecfdf5' }
          ].map((item, idx) => (
            <Chip
              key={idx}
              label={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>{item.label}:</span>
                  <strong style={{ color: item.color, fontWeight: 800 }}>{item.value || 0}</strong>
                </Box>
              }
              size="small"
              sx={{
                bgcolor: item.bg,
                border: '1px solid rgba(0,0,0,0.06)',
                height: 24,
                fontSize: '0.72rem'
              }}
            />
          ))}

          <Tooltip title="Refresh Conversations">
            <IconButton size="small" onClick={() => { fetchConversations(); fetchStats(); }} sx={{ ml: 0.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <RefreshIcon sx={{ fontSize: 16, color: '#475569' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Conversation & Chat Split View taking 100% remaining height */}
      <Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, minHeight: 0, width: '100%' }}>
        {/* Left Side: Conversations List */}
        <Box sx={{ width: { xs: '100%', md: '350px' }, minWidth: { md: '350px' }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            {/* Search and Filters Header */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <TextField
                placeholder="Search by customer name or number..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={whatsappStatus?.authenticated ? 'WhatsApp Live & Connected' : 'WhatsApp Disconnected'}>
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: whatsappStatus?.authenticated ? '#16a34a' : '#dc2626',
                            boxShadow: whatsappStatus?.authenticated ? '0 0 6px #16a34a' : 'none'
                          }} />
                        </Tooltip>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.82rem', height: 36 }
                  }
                }}
              />
              <Stack direction="row" spacing={1}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={statusFilter}
                    displayEmpty
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: '8px', height: 32, fontSize: '0.78rem', bgcolor: '#f8fafc' }}
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
                  <Select
                    value={platformFilter}
                    displayEmpty
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    sx={{ borderRadius: '8px', height: 32, fontSize: '0.78rem', bgcolor: '#f8fafc' }}
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                    <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Scrollable Conversation List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <CircularProgress size={26} sx={{ color: '#0f172a' }} />
                </Box>
              ) : conversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                  <ChatIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                    No conversations match filters.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {conversations.map((conv) => {
                    const isSelected = selectedConversation?._id === conv._id;
                    const cust = conv.customerId;
                    const isWA = conv.primaryPlatform === 'WHATSAPP';
                    const brandColor = isWA ? '#16a34a' : '#E1306C';
                    const rfm = getSegmentColor(cust?.rfmSegment);

                    return (
                      <ListItemButton
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv)}
                        sx={{
                          borderRadius: 0,
                          borderBottom: '1px solid #f1f5f9',
                          p: 1.25,
                          px: 1.5,
                          transition: 'all 0.15s ease',
                          bgcolor: isSelected ? '#f1f5f9' : '#ffffff',
                          borderLeft: isSelected ? '3px solid #0f172a' : '3px solid transparent',
                          '&:hover': {
                            bgcolor: isSelected ? '#f1f5f9' : '#f8fafc'
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <Box
                                sx={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  bgcolor: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}
                              >
                                {isWA ? (
                                  <PhoneIcon sx={{ fontSize: 9, color: brandColor }} />
                                ) : (
                                  <CameraIcon sx={{ fontSize: 9, color: brandColor }} />
                                )}
                              </Box>
                            }
                          >
                            <Avatar sx={{
                              bgcolor: isWA ? '#ecfdf5' : '#fce4ec',
                              color: brandColor,
                              fontWeight: 800,
                              width: 36,
                              height: 36,
                              fontSize: '0.85rem'
                            }}>
                              {getAvatarInitial(cust, conv)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0, ml: 1 }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '0.84rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 160
                            }}>
                              {getDisplayName(cust, conv)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                              {formatTime(conv.lastMessage?.timestamp)}
                            </Typography>
                          </Stack>

                          <Typography
                            variant="caption"
                            sx={{
                              color: '#64748b',
                              fontSize: '0.74rem',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mt: 0.2
                            }}
                          >
                            {conv.lastMessage?.content || 'No messages yet'}
                          </Typography>

                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, alignItems: 'center' }}>
                            {conv.status === 'WAITING_FOR_TEAM' ? (
                              <Chip
                                label="Escalated"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca'
                                }}
                              />
                            ) : (
                              <Chip
                                label={conv.status || 'ACTIVE'}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  backgroundColor: conv.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                                  color: conv.status === 'ACTIVE' ? '#15803d' : '#64748b',
                                  border: '1px solid rgba(0,0,0,0.06)'
                                }}
                              />
                            )}
                            {rfm && (
                              <Chip
                                label={rfm.label}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  bgcolor: rfm.bg,
                                  color: rfm.text,
                                  border: `1px solid ${rfm.border}`
                                }}
                              />
                            )}
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

        {/* Right Side: Chat Window */}
        <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedConversation ? (
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                background: '#f0f2f5',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Sleek WhatsApp Header (52px) */}
              <Box sx={{
                p: 1.2, px: 2,
                borderBottom: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{
                    bgcolor: selectedConversation.primaryPlatform === 'WHATSAPP' ? '#16a34a' : '#E1306C',
                    color: '#ffffff',
                    fontWeight: 800,
                    width: 38,
                    height: 38,
                    fontSize: '0.9rem'
                  }}>
                    {getAvatarInitial(selectedConversation.customerId, selectedConversation)}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                        {getDisplayName(selectedConversation.customerId, selectedConversation)}
                      </Typography>
                      {selectedConversation.customerId?.rfmSegment && (
                        <Chip
                          label={selectedConversation.customerId.rfmSegment}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            ...getSegmentColor(selectedConversation.customerId.rfmSegment)
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                      {formatPhoneDisplay(selectedConversation.customerId?.phone)
                        ? `${formatPhoneDisplay(selectedConversation.customerId?.phone)} · `
                        : ''}WhatsApp Chat
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  {/* AI Autopilot Switch */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedConversation.autoReplyEnabled !== false}
                        onChange={(e) => handleToggleAutoReply(e.target.checked)}
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.4} alignItems="center">
                        <SmartToyIcon sx={{ fontSize: 14, color: selectedConversation.autoReplyEnabled !== false ? '#16a34a' : '#94a3b8' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#334155' }}>
                          Autopilot
                        </Typography>
                      </Stack>
                    }
                    sx={{ mr: 0 }}
                  />

                  <FormControl size="small" sx={{ width: 125 }}>
                    <Select
                      value={selectedConversation.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      sx={{ borderRadius: '8px', height: 30, fontSize: '0.76rem', bgcolor: '#f8fafc' }}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="WAITING_FOR_CUSTOMER">Waiting (Cust)</MenuItem>
                      <MenuItem value="WAITING_FOR_TEAM">Waiting (Team)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              {/* Compact Escalation Notice Banner */}
              {(selectedConversation.autoReplyEnabled === false || selectedConversation.status === 'WAITING_FOR_TEAM') && (
                <Box
                  sx={{
                    px: 2,
                    py: 0.75,
                    bgcolor: '#fffbeb',
                    borderBottom: '1px solid #fef3c7',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                    flexShrink: 0
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReportProblemIcon sx={{ color: '#d97706', fontSize: 16 }} />
                    <Typography sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.76rem' }}>
                      AI Autopilot Paused — escalated for admin takeover.
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleToggleAutoReply(true)}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      textTransform: 'none',
                      bgcolor: '#d97706',
                      height: 24,
                      px: 1.5,
                      '&:hover': { bgcolor: '#b45309' }
                    }}
                  >
                    Resume Autopilot
                  </Button>
                </Box>
              )}

              {/* Chat Message Stream */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f0f2f5' }}>
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
                                  p: 1.5,
                                  px: 2,
                                  borderRadius: isOutbound ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  background: isOutbound ? '#dcf8c6' : '#ffffff',
                                  color: '#0f172a',
                                  border: isOutbound ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                  maxWidth: '100%'
                                }}
                              >
                                {(msg.media?.url || msg.mediaUrl) && (
                                  <Box
                                    component="img"
                                    src={(msg.media?.url || msg.mediaUrl).startsWith('http') ? (msg.media?.url || msg.mediaUrl) : `${backendUrl}${msg.media?.url || msg.mediaUrl}`}
                                    alt="Media"
                                    sx={{
                                      maxWidth: '100%',
                                      maxHeight: 280,
                                      borderRadius: 2,
                                      mb: msg.content ? 1 : 0,
                                      display: 'block'
                                    }}
                                  />
                                )}
                                {msg.content && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: 1.5,
                                      fontSize: '0.92rem',
                                      color: isOutbound ? '#0f172a' : '#1e293b',
                                      wordBreak: 'break-word'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                                  />
                                )}
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
              <Divider sx={{ borderColor: '#e0e0e0' }} />
              <Box sx={{ p: 2, bgcolor: '#f0f2f5' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
                  <AIProviderStatus compact />
                  <Button
                    size="small"
                    startIcon={smartRepliesLoading ? <CircularProgress size={14} sx={{ color: '#0f172a' }} /> : <AutoAwesomeIcon sx={{ fontSize: 16, color: '#84cc16' }} />}
                    onClick={() => fetchSmartReplies()}
                    disabled={smartRepliesLoading}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 28,
                      borderRadius: '14px',
                      color: '#0f172a',
                      bgcolor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      '&:hover': { bgcolor: '#f8fafc', borderColor: '#84cc16' }
                    }}
                  >
                    AI Suggestions
                  </Button>
                </Stack>

                {/* AI Smart Suggested Replies Bar */}
                {smartReplies.length > 0 && (
                  <Box sx={{ mb: 1.5, p: 1, bgcolor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>
                        💡 Click an AI suggestion to insert:
                      </Typography>
                      <Chip
                        label="Dismiss"
                        size="small"
                        onClick={() => setSmartReplies([])}
                        sx={{ height: 18, fontSize: '0.62rem', cursor: 'pointer', bgcolor: '#f1f5f9' }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.25 }}>
                      {smartReplies.map((rep, idx) => (
                        <Chip
                          key={idx}
                          label={`${rep.type === 'professional' ? '💼 Professional' : rep.type === 'friendly' ? '😊 Friendly' : '⚡ Quick'}: ${rep.text}`}
                          onClick={() => setNewMessage(rep.text)}
                          clickable
                          size="small"
                          sx={{
                            maxWidth: 360,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: rep.type === 'professional' ? 'rgba(37,99,235,0.08)' : rep.type === 'friendly' ? 'rgba(132,204,22,0.12)' : 'rgba(245,158,11,0.1)',
                            color: rep.type === 'professional' ? '#1d4ed8' : rep.type === 'friendly' ? '#4d7c0f' : '#b45309',
                            border: '1px solid',
                            borderColor: rep.type === 'professional' ? 'rgba(37,99,235,0.2)' : rep.type === 'friendly' ? 'rgba(132,204,22,0.3)' : 'rgba(245,158,11,0.25)'
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
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
                        borderRadius: '24px',
                        bgcolor: '#ffffff',
                        border: 'none',
                        px: 2,
                        py: 1,
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    sx={{
                      borderRadius: '50%',
                      height: 44,
                      width: 44,
                      minWidth: 44,
                      p: 0,
                      boxShadow: 'none',
                      bgcolor: '#008069',
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: '#006653'
                      }
                    }}
                  >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
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





