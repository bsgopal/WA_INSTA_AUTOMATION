import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, TextField, Button, Switch,
  FormControlLabel, Divider, Stack, Card, CardContent, Alert,
  Tabs, Tab, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, MenuItem, FormControl, InputLabel, Select,
  Avatar, Badge, CircularProgress, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ChatIcon from '@mui/icons-material/Chat';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloudIcon from '@mui/icons-material/Cloud';
import KeyIcon from '@mui/icons-material/Key';
import ForwardIcon from '@mui/icons-material/Forward';

import apiClient from '../../api/client';
import { API_ORIGIN } from '../../api/base';
import CustomSnackbar from '../../components/Snackbar';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            pt: 3,
            width: '100%',
            '@keyframes tabFadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(6px)'
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            animation: 'tabFadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);

  // Tab 1: Integrations State (Local Storage)
  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem('renic_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          twilioSid: parsed.twilioSid || '',
          twilioToken: parsed.twilioToken || '',
          instagramToken: parsed.instagramToken || '',
          geminiKey: parsed.geminiKey || '',
          useAnthropic: parsed.useAnthropic !== undefined ? parsed.useAnthropic : false,
          anthropicApiKey: parsed.anthropicApiKey || '',
          anthropicModel: parsed.anthropicModel || 'claude-3-haiku-20240307',
          geminiModel: parsed.geminiModel || 'gemini-1.5-flash',
          emailNotifications: parsed.emailNotifications !== undefined ? parsed.emailNotifications : true,
          smsNotifications: parsed.smsNotifications !== undefined ? parsed.smsNotifications : false,
          campaignAlerts: parsed.campaignAlerts !== undefined ? parsed.campaignAlerts : true,
          defaultLanguage: parsed.defaultLanguage || 'en',
          timezone: parsed.timezone || 'Asia/Kolkata',
          autoReply: parsed.autoReply !== undefined ? parsed.autoReply : true,
        };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      twilioSid: '',
      twilioToken: '',
      instagramToken: '',
      geminiKey: '',
      useAnthropic: false,
      anthropicApiKey: '',
      anthropicModel: 'claude-3-haiku-20240307',
      geminiModel: 'gemini-1.5-flash',
      emailNotifications: true,
      smsNotifications: false,
      campaignAlerts: true,
      defaultLanguage: 'en',
      timezone: 'Asia/Kolkata',
      autoReply: true,
    };
  });

  // Tab 2: Knowledge Base State (MongoDB / ShopConfig)
  const [shopConfig, setShopConfig] = useState({
    shopName: 'Renic Jewellers',
    websiteUrl: 'https://kanalli.in/',
    address: '123 Gold Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017',
    operatingHours: '10:00 AM - 8:30 PM (Monday to Saturday)',
    contactPhone: '+91 9345578103',
    returnPolicy: '7-day replacement guarantee on manufacturing defects. 100% buyback guarantee at current gold rates.',
    aiCustomInstructions: 'Always sound extremely polite, warm, and helpful. Invite customers to consult on gold customization options.',
    faqs: []
  });

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  // Tab 3: Catalog State
  const [catalogItems, setCatalogItems] = useState([]);
  const [newCatalog, setNewCatalog] = useState({
    name: '',
    category: 'Rings',
    price: '',
    description: '',
    keywords: '',
    imageFile: null,
    imagePreview: ''
  });
  const fileInputRef = useRef(null);

  // Tab 4: Sandbox Chat State
  const [sandboxMessages, setSandboxMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! Welcome to Renic Jewellers. May I know your name, please?',
      timestamp: new Date()
    }
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxName, setSandboxName] = useState('Customer');
  const [sandboxSending, setSandboxSending] = useState(false);
  const chatEndRef = useRef(null);

  // WhatsApp Session Management State
  const [whatsappStatus, setWhatsappStatus] = useState({
    success: true,
    status: 'STOPPED',
    authenticated: false,
    phoneNumber: null
  });
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [whatsappQr, setWhatsappQr] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState('');
  const [restartingSession, setRestartingSession] = useState(false);
  const qrRetryTimer = useRef(null);
  const whatsappQrRef = useRef('');

  // Instagram Session Management State
  const [instagramStatus, setInstagramStatus] = useState({
    success: false,
    profile: null,
    error: null
  });
  const [loadingInstagram, setLoadingInstagram] = useState(false);

  // Meta API Configuration State
  const [metaConfig, setMetaConfig] = useState({
    metaApiEnabled: false,
    metaAppId: '',
    metaAppSecret: '',
    metaPhoneNumberId: '',
    metaAccessToken: '',
    metaWebhookVerifyToken: '',
    metaBusinessAccountId: '',
    metaForwardReplies: false,
    metaHandoffMessage: 'Hi {name}! You replied to our promotional number. Our support team will now continue this chat with you on this number. How can we help you?',
    metaAutoReplyMessage: 'Hi {name}, how can I help you?'
  });
  const [metaTesting, setMetaTesting] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState(null);
  
  // System Status State
  const [systemStatus, setSystemStatus] = useState({
    ngrok: { running: false, url: null },
    waha: { running: false }
  });

  const fetchSystemStatus = async () => {
    try {
      const response = await apiClient.get('/shop-config/system-status');
      if (response.data.success) {
        setSystemStatus(response.data.status);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const fetchMetaConfig = async () => {
    try {
      const response = await apiClient.get('/shop-config/meta-config');
      if (response.data.success) {
        setMetaConfig(response.data.metaConfig);
      }
    } catch (error) {
      console.error('Failed to load Meta config:', error);
    }
  };

  const handleMetaConfigChange = (field, value) => {
    setMetaConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMetaConfig = async () => {
    try {
      setSavingConfig(true);
      const response = await apiClient.post('/shop-config/meta-config', metaConfig);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Meta API configuration saved successfully!', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to save Meta config:', error);
      setSnackbar({ open: true, message: 'Failed to save Meta API configuration.', severity: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestMetaConnection = async () => {
    try {
      setMetaTesting(true);
      setMetaTestResult(null);
      const response = await apiClient.post('/shop-config/meta-test');
      if (response.data.success) {
        setMetaTestResult({ success: true, message: 'Meta API connection successful!' });
        setSnackbar({ open: true, message: 'Meta API connection successful!', severity: 'success' });
      } else {
        setMetaTestResult({ success: false, message: response.data.error || 'Connection failed' });
        setSnackbar({ open: true, message: response.data.error || 'Connection failed', severity: 'error' });
      }
    } catch (error) {
      console.error('Meta API test error:', error);
      setMetaTestResult({ success: false, message: 'Failed to test Meta API connection' });
      setSnackbar({ open: true, message: 'Failed to test Meta API connection.', severity: 'error' });
    } finally {
      setMetaTesting(false);
    }
  };

  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchKnowledgeDocs = async () => {
    try {
      setLoadingDocs(true);
      const response = await apiClient.get('/knowledge-documents');
      setKnowledgeDocs(response.data || []);
    } catch (error) {
      console.error('Failed to load knowledge documents:', error);
      setSnackbar({ open: true, message: 'Could not load knowledge documents.', severity: 'error' });
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDoc = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File is too large. Maximum size is 5MB.', severity: 'warning' });
      return;
    }
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'pdf', 'csv'].includes(fileExt)) {
      setSnackbar({ open: true, message: 'Unsupported file type. Please upload .txt, .pdf, or .csv.', severity: 'warning' });
      return;
    }
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/knowledge-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKnowledgeDocs(prev => [response.data, ...prev]);
      setSnackbar({ open: true, message: `${file.name} uploaded and ingested successfully!`, severity: 'success' });
    } catch (error) {
      console.error('Failed to upload document:', error);
      const errorMsg = error.response?.data?.error || 'Failed to upload document.';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await apiClient.delete(`/knowledge-documents/${docId}`);
      setKnowledgeDocs(prev => prev.filter(d => d._id !== docId));
      setSnackbar({ open: true, message: 'Knowledge document deleted successfully.', severity: 'success' });
    } catch (error) {
      console.error('Failed to delete document:', error);
      setSnackbar({ open: true, message: 'Failed to delete knowledge document.', severity: 'error' });
    }
  };

  const fetchWhatsappQr = async () => {
    try {
      setLoadingQr(true);
      setQrError('');
      const response = await apiClient.get('/ai-chat/whatsapp/qr');
      if (response.data.success && response.data.qrCode) {
        whatsappQrRef.current = response.data.qrCode;
        setWhatsappQr(response.data.qrCode);
      } else if (response.data.status === 'STARTING' || response.data.status === 'STOPPING') {
        setQrError(response.data.error || 'WhatsApp session is starting up, please wait a few seconds...');
        if (qrRetryTimer.current) clearTimeout(qrRetryTimer.current);
        qrRetryTimer.current = setTimeout(() => {
          if (!whatsappStatus.authenticated) fetchWhatsappQr();
        }, response.data.retryAfter || 8000);
      } else {
        setQrError(response.data.error || 'Failed to load QR code.');
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp QR:', error);
      setQrError('Failed to reach the WhatsApp service. Make sure the Docker (WAHA) container is running.');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleRestartSession = async () => {
    try {
      setRestartingSession(true);
      const response = await apiClient.post('/ai-chat/whatsapp/session/restart');
      if (response.data.success) {
        setSnackbar({ open: true, message: 'WhatsApp session restarted. Fetching fresh QR code...', severity: 'info' });
        whatsappQrRef.current = '';
        setWhatsappQr('');
        setQrError('');
        setTimeout(async () => {
          await fetchWhatsappStatus();
          fetchWhatsappQr();
        }, 6000);
      } else {
        setSnackbar({ open: true, message: response.data.error || 'Failed to restart WhatsApp session.', severity: 'error' });
      }
    } catch (error) {
      console.error('Failed to restart WhatsApp session:', error);
      setSnackbar({ open: true, message: 'Failed to restart WhatsApp session.', severity: 'error' });
    } finally {
      setRestartingSession(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const response = await apiClient.get('/ai-chat/whatsapp/waha-status');
      setWhatsappStatus(response.data);
      if (response.data.success && !response.data.authenticated) {
        // Only fetch a fresh QR if we don't already have one displayed.
        // WAHA regenerates the QR on every /auth/qr call, so re-fetching while
        // polling would invalidate the code the user is trying to scan.
        if (!whatsappQrRef.current) {
          fetchWhatsappQr();
        }
      } else if (response.data.success && response.data.authenticated) {
        whatsappQrRef.current = '';
        setWhatsappQr('');
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    }
  };

  const fetchInstagramStatus = async () => {
    try {
      setLoadingInstagram(true);
      const response = await apiClient.get('/ai-chat/instagram/status');
      setInstagramStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch Instagram status:', error);
      setInstagramStatus({ success: false, error: 'Failed to fetch status' });
    } finally {
      setLoadingInstagram(false);
    }
  };

  const handleWhatsappLogout = async () => {
    try {
      setLoadingWhatsapp(true);
      await apiClient.post('/ai-chat/whatsapp/logout');
      setSnackbar({ open: true, message: 'Logged out from WhatsApp successfully.', severity: 'info' });
      fetchWhatsappStatus();
    } catch (error) {
      console.error('Failed to logout WhatsApp:', error);
      setSnackbar({ open: true, message: 'Failed to disconnect WhatsApp session.', severity: 'error' });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  // WhatsApp Pairing Code Flow State
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [showPairingForm, setShowPairingForm] = useState(false);

  const handleRequestPairingCode = async () => {
    if (!pairingPhone.trim()) {
      setSnackbar({ open: true, message: 'Please enter a valid phone number.', severity: 'warning' });
      return;
    }
    try {
      setRequestingCode(true);
      setPairingCode('');
      const response = await apiClient.post('/ai-chat/whatsapp/request-code', {
        phoneNumber: pairingPhone
      });
      if (response.data.success && response.data.code) {
        setPairingCode(response.data.code);
        setSnackbar({ open: true, message: 'Pairing code generated successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.data.error || 'Failed to request pairing code', severity: 'error' });
      }
    } catch (error) {
      console.error('Failed to request pairing code:', error);
      setSnackbar({ open: true, message: 'Failed to generate pairing code. Make sure WAHA container is running.', severity: 'error' });
    } finally {
      setRequestingCode(false);
    }
  };

  // Load backend data
  useEffect(() => {
    fetchShopConfig();
    fetchCatalog();
    fetchWhatsappStatus();
    fetchInstagramStatus();
    fetchKnowledgeDocs();
    fetchMetaConfig();
    fetchSystemStatus();
    // Poll WhatsApp status every 12 seconds
    const interval = setInterval(fetchWhatsappStatus, 12000);
    // Poll System status every 30 seconds
    const sysInterval = setInterval(fetchSystemStatus, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(sysInterval);
    };
  }, []);

  // Fetch QR Code automatically when switching to the WhatsApp tab
  useEffect(() => {
    if (activeTab === 2 && !whatsappStatus.authenticated) {
      fetchWhatsappQr();
    }
  }, [activeTab, whatsappStatus.authenticated]);

  // Scroll chat sandbox
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sandboxMessages]);

  const fetchShopConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await apiClient.get('/ai-chat/shop-config');
      if (response.data.success && response.data.config) {
        setShopConfig(response.data.config);
        const config = response.data.config || {};
        setIntegrations(prev => ({
          ...prev,
          geminiKey: config.geminiApiKey ?? prev.geminiKey,
          useAnthropic: config.useAnthropic ?? prev.useAnthropic,
          anthropicApiKey: config.anthropicApiKey ?? prev.anthropicApiKey,
          anthropicModel: config.anthropicModel ?? prev.anthropicModel,
          geminiModel: config.geminiModel ?? prev.geminiModel
        }));
      }
    } catch (error) {
      console.error('Failed to load shop config:', error);
      setSnackbar({ open: true, message: 'Could not load knowledge base settings.', severity: 'error' });
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const response = await apiClient.get('/ai-chat/catalog');
      if (response.data.success) {
        setCatalogItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load catalog items:', error);
      setSnackbar({ open: true, message: 'Could not load catalog database.', severity: 'error' });
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Save integrations to localStorage
  const handleSaveIntegrations = async () => {
    localStorage.setItem('renic_settings', JSON.stringify(integrations));
    try {
      setSavingConfig(true);
      const response = await apiClient.put('/ai-chat/shop-config', {
        geminiApiKey: integrations.geminiKey,
        useAnthropic: integrations.useAnthropic,
        anthropicApiKey: integrations.anthropicApiKey,
        anthropicModel: integrations.anthropicModel,
        geminiModel: integrations.geminiModel
      });
      if (response.data.success) {
        setShopConfig(response.data.config);
        setSnackbar({ open: true, message: 'Integration settings saved and synced to database!', severity: 'success' });
      }
    } catch (err) {
      console.error('Failed to sync settings to database:', err);
      setSnackbar({ open: true, message: 'Settings saved locally, but database sync failed.', severity: 'warning' });
    } finally {
      setSavingConfig(false);
    }
  };

  // Save shop config to MongoDB
  const handleSaveShopConfig = async (updatedConfig = shopConfig) => {
    try {
      setSavingConfig(true);
      const response = await apiClient.put('/ai-chat/shop-config', updatedConfig);
      if (response.data.success) {
        setShopConfig(response.data.config);
        setSnackbar({ open: true, message: 'Knowledge base updated successfully!', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setSnackbar({ open: true, message: 'Failed to update knowledge base.', severity: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  // Manage FAQs
  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      setSnackbar({ open: true, message: 'Please provide both a question and answer.', severity: 'warning' });
      return;
    }
    const updatedFaqs = [...shopConfig.faqs, { ...newFaq }];
    const updatedConfig = { ...shopConfig, faqs: updatedFaqs };
    setShopConfig(updatedConfig);
    handleSaveShopConfig(updatedConfig);
    setNewFaq({ question: '', answer: '' });
  };

  const handleDeleteFaq = (index) => {
    const updatedFaqs = shopConfig.faqs.filter((_, i) => i !== index);
    const updatedConfig = { ...shopConfig, faqs: updatedFaqs };
    setShopConfig(updatedConfig);
    handleSaveShopConfig(updatedConfig);
  };

  // Handle integration changes
  const handleIntegrationChange = (field, value) => {
    setIntegrations(prev => ({ ...prev, [field]: value }));
  };

  // Handle shopConfig changes
  const handleConfigChange = (field, value) => {
    setShopConfig(prev => ({ ...prev, [field]: value }));
  };

  // Handle Catalog Form file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCatalog(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Add Catalog Item
  const handleAddCatalogItem = async (e) => {
    e.preventDefault();
    if (!newCatalog.name.trim() || !newCatalog.price || !newCatalog.imageFile) {
      setSnackbar({ open: true, message: 'Name, price, and product image are required.', severity: 'warning' });
      return;
    }

    try {
      setSavingCatalog(true);
      const formData = new FormData();
      formData.append('name', newCatalog.name);
      formData.append('category', newCatalog.category);
      formData.append('price', newCatalog.price);
      formData.append('description', newCatalog.description);
      formData.append('keywords', newCatalog.keywords);
      formData.append('image', newCatalog.imageFile);

      const response = await apiClient.post('/ai-chat/catalog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setCatalogItems(prev => [response.data.item, ...prev]);
        setNewCatalog({
          name: '',
          category: 'Rings',
          price: '',
          description: '',
          keywords: '',
          imageFile: null,
          imagePreview: ''
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSnackbar({ open: true, message: 'Product added to jewelry catalog!', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to create catalog item:', error);
      setSnackbar({ open: true, message: 'Failed to upload catalog item.', severity: 'error' });
    } finally {
      setSavingCatalog(false);
    }
  };

  // Delete Catalog Item
  const handleDeleteCatalog = async (id) => {
    try {
      const response = await apiClient.delete(`/ai-chat/catalog/${id}`);
      if (response.data.success) {
        setCatalogItems(prev => prev.filter(item => item._id !== id));
        setSnackbar({ open: true, message: 'Product removed from catalog.', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to delete catalog item:', error);
      setSnackbar({ open: true, message: 'Failed to delete catalog item.', severity: 'error' });
    }
  };

  // Send message in sandbox
  const handleSendSandbox = async (presetInput = null) => {
    const payload = typeof presetInput === 'object' && presetInput !== null
      ? presetInput
      : { text: presetInput || sandboxInput };
    const textToSend = (payload.text || '').trim();
    if (!textToSend) return;

    // Add user message
    const userMsg = {
      sender: 'customer',
      text: textToSend,
      timestamp: new Date()
    };
    setSandboxMessages(prev => [...prev, userMsg]);
    if (!presetInput) setSandboxInput('');

    try {
      setSandboxSending(true);
      const response = await apiClient.post('/ai-chat/test-ai-response', {
        message: textToSend,
        widgetData: payload.widgetData || null
      });
      if (response.data.success) {
        const aiMsg = {
          sender: 'ai',
          text: response.data.aiResponse,
          timestamp: new Date(),
          mediaUrl: response.data.mediaUrl,
          buttons: response.data.buttons || [],
          list: response.data.list || null,
          isCatalogPrompt: response.data.isCatalogPrompt,
          catalogMatches: response.data.catalogMatches || [],
          nameUpdated: response.data.nameUpdated,
          newName: response.data.newName
        };
        setSandboxMessages(prev => [...prev, aiMsg]);
        if (response.data.nameUpdated && response.data.newName) {
          setSandboxName(response.data.newName);
        }
      }
    } catch (error) {
      console.error('Sandbox error:', error);
      setSandboxMessages(prev => [...prev, {
        sender: 'ai',
        text: '⚠️ error calling AI service. Check your API key and retry limit.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setSandboxSending(false);
    }
  };

  // Format response for WhatsApp bold style (*word* -> bold)
  const formatAIResponse = (text) => {
    if (!text) return '';
    return text.split(/\*([^*]+)\*/g).map((part, index) => {
      return index % 2 === 1 ? <strong key={index} style={{ fontWeight: 700 }}>{part}</strong> : part;
    });
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ORIGIN}${url}`;
  };

  const formatActionTypeLabel = (actionType, fallback = 'Quick Reply') => {
    const normalized = String(actionType || '').trim();
    if (!normalized) return fallback;
    return normalized.replace(/_/g, ' ');
  };

  const renderSandboxInteractive = (msg) => {
    const buttons = Array.isArray(msg.buttons) ? msg.buttons : [];
    const list = msg.list || null;

    if (buttons.length === 0 && !list) return null;

    return (
      <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {buttons.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {buttons.map((btn, idx) => (
              <Button
                key={idx}
                size="small"
                variant="outlined"
                onClick={() => {
                  const actionValue = btn.value || btn.actionValue || btn.label;
                  const actionType = String(btn.actionType || btn.type || 'QUICK_REPLY').toUpperCase();
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
                  handleSendSandbox({
                    text: btn.label,
                    value: actionValue,
                        widgetData: {
                          interactiveReply: {
                            id: actionValue,
                            actionValue,
                            actionType,
                            triggerText: btn.label,
                            text: btn.label
                          }
                        }
                      });
                }}
                sx={{ textTransform: 'none', borderRadius: 4, bgcolor: '#ffffff', py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
              >
                {btn.label}
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>
                  {formatActionTypeLabel(btn.actionType || btn.type, 'Quick Reply')}
                </Typography>
              </Button>
            ))}
          </Box>
        )}

        {list && (
          <Box sx={{ border: '1px solid #e8eef7', borderRadius: 3, bgcolor: '#ffffff', p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {list.title || 'Options'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {list.buttonText || 'Select'}
            </Typography>
            <Stack spacing={1}>
              {(list.sections || []).map((section, sectionIdx) => (
                <Box key={sectionIdx}>
                  {section.title && (
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                      {section.title}
                    </Typography>
                  )}
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {(section.rows || []).map((row, rowIdx) => (
                      <Button
                        key={rowIdx}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const actionValue = row.actionValue || row.id || row.title;
                          const actionType = String(row.actionType || 'CUSTOM').toUpperCase();
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
                          handleSendSandbox({
                            text: row.title,
                            value: actionValue,
                            widgetData: {
                              interactiveReply: {
                                id: row.rowId || row.id || row.title,
                                actionValue,
                                actionType,
                                triggerText: row.title,
                                text: row.title
                              }
                            }
                          });
                        }}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 3, bgcolor: '#ffffff', py: 0.7, px: 1.2, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'text.primary' }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.title}
                          </Typography>
                          <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 700 }}>
                            {formatActionTypeLabel(row.actionType, 'Custom')}
                          </Typography>
                          {row.description && (
                            <Typography variant="caption" color="text.secondary">
                              {row.description}
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Top Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0.8, 
          bgcolor: '#f1f5f9', 
          borderRadius: '14px', 
          border: '1px solid #e2e8f0' 
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTab-root': {
              minHeight: 44,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              borderRadius: '10px',
              color: '#64748b',
              transition: 'all 0.2s ease',
              gap: 1.2,
              '&.Mui-selected': {
                color: '#2563eb',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.03)'
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: 'rgba(255,255,255,0.4)',
                color: '#334155'
              }
            }
          }}
        >
          <Tab icon={<StorefrontIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Store Details" />
          <Tab icon={<SmartToyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="AI & Policies" />
          <Tab icon={<ChatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="WhatsApp Login" />
          <Tab icon={<CloudIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Meta API Config" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {loadingConfig ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          {/* Tab 1: Store Details */}
          {activeTab === 0 && (
            <Grid container spacing={3.5} sx={{
              '@keyframes tabFadeIn': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              },
              animation: 'tabFadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
            }}>

              {/* Shop Details Configuration */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    bgcolor: '#ffffff',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StorefrontIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          Store Information
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Core store details referenced by the AI to answer business and location inquiries
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={2.5}>
                      <TextField
                        label="Store Name"
                        fullWidth
                        value={shopConfig.shopName}
                        onChange={(e) => handleConfigChange('shopName', e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                      <TextField
                        label="Store Address"
                        fullWidth
                        multiline
                        rows={2}
                        value={shopConfig.address}
                        onChange={(e) => handleConfigChange('address', e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                      <TextField
                        label="Jewelry Website URL (One URL)"
                        fullWidth
                        value={shopConfig.websiteUrl || ''}
                        placeholder="e.g. https://kanalli.in/"
                        onChange={(e) => handleConfigChange('websiteUrl', e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                      <TextField
                        label="Catalog Cover Image URL (One URL Image)"
                        fullWidth
                        value={shopConfig.catalogImageUrl || ''}
                        placeholder="e.g. https://kanalli.in/wp-content/uploads/...logo.png"
                        onChange={(e) => handleConfigChange('catalogImageUrl', e.target.value)}
                        helperText="Used to scrape logo/banner dynamically if left blank."
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />

                      <Grid container spacing={2.5}>
                        <Grid item xs={6}>
                          <TextField
                            label="Contact Phone"
                            fullWidth
                            value={shopConfig.contactPhone}
                            onChange={(e) => handleConfigChange('contactPhone', e.target.value)}
                            InputProps={{ sx: { borderRadius: '12px' } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Operating Hours"
                            fullWidth
                            value={shopConfig.operatingHours}
                            onChange={(e) => handleConfigChange('operatingHours', e.target.value)}
                            InputProps={{ sx: { borderRadius: '12px' } }}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Save Button for Store & Rates */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSaveShopConfig()}
                    disabled={savingConfig}
                    sx={{ 
                      borderRadius: '12px', 
                      fontWeight: 700, 
                      px: 4, 
                      py: 1.5, 
                      textTransform: 'none',
                      bgcolor: '#2563EB',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                      '&:hover': {
                        bgcolor: '#1d4ed8',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)'
                      }
                    }}
                  >
                    {savingConfig ? 'Saving Store Settings...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: AI & Policies */}
          {activeTab === 1 && (
            <Grid container spacing={3.5} sx={{
              '@keyframes tabFadeIn': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              },
              animation: 'tabFadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
            }}>
              {/* Policies & Instructions */}
              <Grid item xs={12}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    bgcolor: '#ffffff'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SmartToyIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          Policies & Custom AI Behavior
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Define purchase rules, return policies, and prompt behavior instructions for your AI agent
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={3}>
                      <TextField
                        label="Return & Buyback Policy"
                        fullWidth
                        multiline
                        rows={3}
                        value={shopConfig.returnPolicy}
                        onChange={(e) => handleConfigChange('returnPolicy', e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                      <TextField
                        label="Custom AI Behavior Instructions"
                        fullWidth
                        multiline
                        rows={4}
                        value={shopConfig.aiCustomInstructions}
                        onChange={(e) => handleConfigChange('aiCustomInstructions', e.target.value)}
                        placeholder="e.g. Always offer custom metal/carat configurations. Address customers with respect. Suggest visiting the website for checkout."
                        InputProps={{ sx: { borderRadius: '12px' } }}
                        helperText="Provide specific guidelines on tone, language preference, and catalog presentation."
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* FAQ Management */}
              <Grid item xs={12}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    bgcolor: '#ffffff',
                    mt: 1
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InfoIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          Frequently Asked Questions (FAQs)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Teach the AI specific answers to typical user inquiries (returns, delivery times, pricing, etc.)
                        </Typography>
                      </Box>
                    </Stack>

                    {/* FAQ List */}
                    <Box sx={{ mb: 4 }}>
                      {(!shopConfig.faqs || shopConfig.faqs.length === 0) ? (
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: '12px', borderStyle: 'dashed', bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <Typography variant="body2" color="text.secondary">
                            No FAQs added yet. Use the fields below to add your first FAQ item.
                          </Typography>
                        </Paper>
                      ) : (
                        <Stack spacing={2}>
                          {shopConfig.faqs.map((faq, index) => (
                            <Paper 
                              key={index} 
                              variant="outlined" 
                              sx={{ 
                                p: 2.5, 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                position: 'relative',
                                '&:hover': { bgcolor: '#f8fafc' }
                              }}
                            >
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteFaq(index)}
                                sx={{ position: 'absolute', top: 12, right: 12, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', pr: 4 }}>
                                Q: {faq.question}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, pr: 4 }}>
                                A: {faq.answer}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Add New FAQ Form */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#334155' }}>
                      Add a New FAQ Item
                    </Typography>
                    <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="Question"
                          fullWidth
                          value={newFaq.question}
                          onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                          placeholder="e.g. Do you ship internationally?"
                          InputProps={{ sx: { borderRadius: '12px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="Answer"
                          fullWidth
                          multiline
                          maxRows={3}
                          value={newFaq.answer}
                          onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                          placeholder="e.g. Yes, we ship worldwide. Shipping rates vary by country."
                          InputProps={{ sx: { borderRadius: '12px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={handleAddFaq}
                          sx={{ 
                            borderRadius: '12px', 
                            py: 1.8, 
                            fontWeight: 700,
                            textTransform: 'none',
                            borderWidth: 1.5,
                            '&:hover': { borderWidth: 1.5 }
                          }}
                        >
                          Add Item
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Save Button for AI & Policies */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSaveShopConfig()}
                    disabled={savingConfig}
                    sx={{ 
                      borderRadius: '12px', 
                      fontWeight: 700, 
                      px: 4, 
                      py: 1.5, 
                      textTransform: 'none',
                      bgcolor: '#2563EB',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                      '&:hover': {
                        bgcolor: '#1d4ed8',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)'
                      }
                    }}
                  >
                    {savingConfig ? 'Saving AI Settings...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 3: WhatsApp Login & Status */}
          {activeTab === 2 && (
            <Box sx={{
              '@keyframes tabFadeIn': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              },
              animation: 'tabFadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
              display: 'flex',
              flexDirection: 'column',
              gap: 3.5
            }}>
              {/* Header Status Card */}
              <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: whatsappStatus.authenticated ? '#A7F3D0' : '#FDE68A', overflow: 'hidden' }}>
                <Box sx={{
                  p: 4,
                  background: whatsappStatus.authenticated 
                    ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)' 
                    : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: whatsappStatus.authenticated ? '#065F46' : '#92400E', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: whatsappStatus.authenticated ? '#10B981' : '#F59E0B',
                        boxShadow: whatsappStatus.authenticated ? '0 0 12px #10B981' : '0 0 12px #F59E0B',
                        animation: 'pulse 2s infinite'
                      }} />
                      {whatsappStatus.authenticated ? 'WhatsApp Active & Connected' : 'WhatsApp Connection Required'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: whatsappStatus.authenticated ? '#047857' : '#B45309', fontWeight: 500 }}>
                      {whatsappStatus.authenticated 
                        ? `Your WhatsApp service is fully authorized and running under session ID: default`
                        : 'Connect your WhatsApp business/personal number to enable automated campaign broadcasting and AI chat responses.'}
                    </Typography>
                  </Box>

                  {whatsappStatus.authenticated && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleWhatsappLogout}
                      sx={{ 
                        borderRadius: '10px', 
                        fontWeight: 700, 
                        borderColor: '#FCA5A5', 
                        color: '#DC2626', 
                        bgcolor: '#FFFFFF',
                        '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' },
                        textTransform: 'none',
                        px: 3
                      }}
                    >
                      Disconnect Account
                    </Button>
                  )}
                </Box>
              </Card>

              {/* Main Panel Content */}
              {whatsappStatus.authenticated ? (
                /* Connected State View */
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    py: 6,
                    bgcolor: '#ffffff'
                  }}
                >
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: '#E8F5E9', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mb: 3,
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.1)'
                  }}>
                    <SmartToyIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                  </Box>
                  
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1F2937' }}>
                    Connected to {(() => {
                      if (!whatsappStatus.phoneNumber) return 'WhatsApp';
                      if (whatsappStatus.channel === 'meta_api') return whatsappStatus.phoneNumber;
                      const clean = whatsappStatus.phoneNumber.replace('@c.us', '').replace('@s.whatsapp.net', '');
                      return clean.startsWith('+') ? clean : '+' + clean;
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mb: 4, lineHeight: 1.6 }}>
                    {whatsappStatus.channel === 'meta_api'
                      ? 'The Meta WhatsApp Cloud API is successfully configured. Automated campaigns, broadcasts, and AI responses will deploy automatically.'
                      : 'The AI Auto-Responder engine is successfully listening to incoming messages. Any campaigns or auto-replies configured in the platform will deploy automatically.'}
                  </Typography>

                  <Grid container spacing={3} sx={{ maxWidth: 800, mx: 'auto' }}>
                    <Grid item xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', textAlign: 'left', bgcolor: '#F8FAFC', borderColor: '#e2e8f0', height: '100%' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>PROVIDER MODE</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#334155' }}>
                          {whatsappStatus.channel === 'meta_api' ? 'Meta Cloud API' : 'Docker WAHA (QR Mode)'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', textAlign: 'left', bgcolor: '#F8FAFC', borderColor: '#e2e8f0', height: '100%' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ENDPOINT HOST</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#334155', wordBreak: 'break-all' }}>
                          {whatsappStatus.channel === 'meta_api' ? 'graph.facebook.com' : 'localhost:3000'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', textAlign: 'left', bgcolor: systemStatus.ngrok.running ? '#ECFDF5' : '#FEF2F2', borderColor: systemStatus.ngrok.running ? '#A7F3D0' : '#FECACA', height: '100%' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                          PUBLIC TUNNEL (NGROK)
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: systemStatus.ngrok.running ? '#10B981' : '#EF4444' }} />
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: systemStatus.ngrok.running ? '#065F46' : '#991B1B', wordBreak: 'break-all' }}>
                          {systemStatus.ngrok.running ? systemStatus.ngrok.url : 'Not Running'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Card>
              ) : (
                /* Pairing Options (Disconnected State) */
                <Grid container spacing={4}>
                  {/* Option 1: QR Code Card */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Box sx={{ 
                          width: 56, 
                          height: 56, 
                          borderRadius: '12px', 
                          bgcolor: '#EFF6FF', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          mb: 2.5
                        }}>
                          <SmartToyIcon sx={{ fontSize: 28, color: '#2563EB' }} />
                        </Box>
                        
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1F2937' }}>
                          Option 1: Scan QR Code
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mb: 4, lineHeight: 1.5 }}>
                          Open WhatsApp on your mobile phone &rarr; Settings &rarr; Linked Devices &rarr; Link a Device, then scan the QR code below.
                        </Typography>

                        <Box sx={{ 
                          width: 240, 
                          height: 240, 
                          borderRadius: '16px', 
                          border: '1px solid #E5E7EB',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          p: 2,
                          mb: 3
                        }}>
                          {loadingQr ? (
                            <CircularProgress size={36} />
                          ) : whatsappQr ? (
                            <img src={whatsappQr} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : qrError ? (
                            <Typography variant="caption" color="text.secondary" px={3} sx={{ textAlign: 'center' }}>
                              {qrError}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary" px={3}>
                              Press refresh to load the QR code.
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1.5}>
                          <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchWhatsappQr}
                            disabled={loadingQr}
                            sx={{ 
                              borderRadius: '10px', 
                              fontWeight: 700,
                              textTransform: 'none',
                              px: 3,
                              borderColor: '#D1D5DB',
                              color: '#4B5563',
                              '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' }
                            }}
                          >
                            Refresh QR Code
                          </Button>
                          {!whatsappStatus.authenticated && (
                            <Button
                              variant="contained"
                              startIcon={<RefreshIcon />}
                              onClick={handleRestartSession}
                              disabled={restartingSession}
                              sx={{ 
                                borderRadius: '10px', 
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 3,
                                bgcolor: '#D97706',
                                '&:hover': { bgcolor: '#B45309' }
                              }}
                            >
                              {restartingSession ? 'Restarting...' : 'Restart Session'}
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Option 2: Pairing Code Card */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Box sx={{ 
                          width: 56, 
                          height: 56, 
                          borderRadius: '12px', 
                          bgcolor: '#F0FDF4', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          mb: 2.5
                        }}>
                          <SendIcon sx={{ fontSize: 24, color: '#16A34A', transform: 'rotate(-45deg)', mt: -0.5 }} />
                        </Box>
                        
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1F2937' }}>
                          Option 2: Use 8-Character Code
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mb: 4, lineHeight: 1.5 }}>
                          Enter your phone number (including country code, e.g. 919876543210) to receive an 8-character code to pair instantly.
                        </Typography>

                        <Stack spacing={2} sx={{ width: '100%', maxWidth: 300, mb: 3 }}>
                          <TextField
                            label="WhatsApp Phone Number"
                            placeholder="e.g. 919345578103"
                            value={pairingPhone}
                            onChange={(e) => setPairingPhone(e.target.value)}
                            fullWidth
                            InputProps={{
                              sx: { borderRadius: '12px' }
                            }}
                          />
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleRequestPairingCode}
                            disabled={requestingCode}
                            disableElevation
                            sx={{ 
                              borderRadius: '12px', 
                              fontWeight: 700,
                              py: 1.5,
                              textTransform: 'none',
                              bgcolor: '#2563EB',
                              '&:hover': { bgcolor: '#1d4ed8' }
                            }}
                          >
                            {requestingCode ? 'Requesting Code...' : 'Get Pairing Code'}
                          </Button>
                        </Stack>

                        {pairingCode && (
                          <Paper elevation={0} sx={{ 
                            bgcolor: '#EFF6FF', 
                            p: 3, 
                            borderRadius: '16px', 
                            border: '1px solid #BFDBFE', 
                            width: '100%', 
                            maxWidth: 300,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)'
                          }}>
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                              Enter Code on Phone
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 850, color: '#1E40AF', letterSpacing: 4 }}>
                              {pairingCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, lineHeight: 1.4 }}>
                              Tap "Link with Phone Number" on your WhatsApp mobile application to link.
                            </Typography>
                          </Paper>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Tab 4: Meta API Configuration */}
      {activeTab === 3 && (
        <Box sx={{
          '@keyframes tabFadeIn': {
            from: { opacity: 0, transform: 'translateY(6px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          },
          animation: 'tabFadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5
        }}>
          {/* Meta API Status Card */}
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: metaConfig.metaApiEnabled ? '#A7F3D0' : '#FDE68A', overflow: 'hidden' }}>
            <Box sx={{
              p: 4,
              background: metaConfig.metaApiEnabled
                ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)'
                : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2
            }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: metaConfig.metaApiEnabled ? '#065F46' : '#92400E', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: metaConfig.metaApiEnabled ? '#10B981' : '#F59E0B',
                    boxShadow: metaConfig.metaApiEnabled ? '0 0 12px #10B981' : '0 0 12px #F59E0B',
                    animation: 'pulse 2s infinite'
                  }} />
                  {metaConfig.metaApiEnabled ? 'Meta API Connected' : 'Meta API Not Configured'}
                </Typography>
                <Typography variant="body2" sx={{ color: metaConfig.metaApiEnabled ? '#047857' : '#B45309', fontWeight: 500 }}>
                  {metaConfig.metaApiEnabled
                    ? 'Bulk messages will be sent via Meta WhatsApp Cloud API. Docker/WAHA fallback is disabled.'
                    : 'Configure your Meta API credentials to send bulk messages via WhatsApp Cloud API. If not configured, the system will fall back to Docker/WAHA.'}
                </Typography>
              </Box>

              {metaConfig.metaApiEnabled && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setMetaConfig(prev => ({ ...prev, metaApiEnabled: false }));
                    handleSaveMetaConfig();
                  }}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    borderColor: '#FCA5A5',
                    color: '#DC2626',
                    bgcolor: '#FFFFFF',
                    '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' },
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Disable Meta API
                </Button>
              )}
            </Box>
          </Card>

          {/* Lead Handoff / Forwarding Card */}
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ForwardIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Lead Handoff — Forward Replies to WhatsApp
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When a customer replies to your Meta campaign number, a handoff message is sent to them from your QR-logged WhatsApp so your staff can continue the chat there
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!metaConfig.metaForwardReplies}
                      onChange={(e) => handleMetaConfigChange('metaForwardReplies', e.target.checked)}
                      color="success"
                      disabled={!metaConfig.metaApiEnabled}
                    />
                  }
                  label="Forward customer replies to my WhatsApp (connected in the WhatsApp Login tab)"
                />

                <TextField
                  label="Handoff Message"
                  fullWidth
                  multiline
                  minRows={2}
                  value={metaConfig.metaHandoffMessage}
                  onChange={(e) => handleMetaConfigChange('metaHandoffMessage', e.target.value)}
                  disabled={!metaConfig.metaApiEnabled || !metaConfig.metaForwardReplies}
                  helperText="Use {name} for the customer name. Sent from Meta when first message is received."
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />

                <TextField
                  label="Auto-Reply Message"
                  fullWidth
                  multiline
                  minRows={2}
                  value={metaConfig.metaAutoReplyMessage || ''}
                  onChange={(e) => handleMetaConfigChange('metaAutoReplyMessage', e.target.value)}
                  disabled={!metaConfig.metaApiEnabled || !metaConfig.metaForwardReplies}
                  helperText="Use {name} for the customer name. Sent from your logged-in WhatsApp (WAHA) as the first reply."
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />

                <Alert
                  severity={whatsappStatus.authenticated ? 'success' : 'warning'}
                  icon={<ForwardIcon fontSize="inherit" />}
                  sx={{ borderRadius: '12px' }}
                >
                  {whatsappStatus.authenticated
                    ? 'WhatsApp Login (QR session) is connected — handoff messages will be sent from your QR-scanned number.'
                    : 'WhatsApp Login (QR session) is not connected yet. Go to the "WhatsApp Login" tab and scan the QR code or use a pairing code first.'}
                </Alert>
              </Stack>
            </CardContent>
          </Card>

          {/* Meta API Configuration Form */}
          <Grid container spacing={3.5}>
            {/* Basic Credentials */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: '#ffffff', height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloudIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Basic Credentials
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enter your Meta App credentials and WhatsApp Business Account details
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={2.5}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={metaConfig.metaApiEnabled}
                          onChange={(e) => handleMetaConfigChange('metaApiEnabled', e.target.checked)}
                          color="success"
                        />
                      }
                      label="Enable Meta API for bulk messaging"
                    />

                    <TextField
                      label="Meta App ID"
                      fullWidth
                      value={metaConfig.metaAppId}
                      onChange={(e) => handleMetaConfigChange('metaAppId', e.target.value)}
                      placeholder="e.g. 123456789012345"
                      disabled={!metaConfig.metaApiEnabled}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Meta App Secret"
                      fullWidth
                      type="password"
                      value={metaConfig.metaAppSecret}
                      onChange={(e) => handleMetaConfigChange('metaAppSecret', e.target.value)}
                      placeholder="Enter your Meta App Secret"
                      disabled={!metaConfig.metaApiEnabled}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Phone Number ID"
                      fullWidth
                      value={metaConfig.metaPhoneNumberId}
                      onChange={(e) => handleMetaConfigChange('metaPhoneNumberId', e.target.value)}
                      placeholder="e.g. 123456789012345"
                      disabled={!metaConfig.metaApiEnabled}
                      helperText="The WhatsApp Business phone number ID from Meta Developer Portal"
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Business Account ID"
                      fullWidth
                      value={metaConfig.metaBusinessAccountId}
                      onChange={(e) => handleMetaConfigChange('metaBusinessAccountId', e.target.value)}
                      placeholder="e.g. 123456789012345"
                      disabled={!metaConfig.metaApiEnabled}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Access Token & Security */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: '#ffffff', height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <KeyIcon sx={{ color: '#0369A1', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Access Token & Security
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Configure the access token and webhook verification token
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={2.5}>
                    <TextField
                      label="Meta Access Token"
                      fullWidth
                      type="password"
                      value={metaConfig.metaAccessToken}
                      onChange={(e) => handleMetaConfigChange('metaAccessToken', e.target.value)}
                      placeholder="Enter your Meta permanent access token"
                      disabled={!metaConfig.metaApiEnabled}
                      helperText="Use a permanent system user access token from Meta Business Manager"
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Webhook Verify Token"
                      fullWidth
                      value={metaConfig.metaWebhookVerifyToken}
                      onChange={(e) => handleMetaConfigChange('metaWebhookVerifyToken', e.target.value)}
                      placeholder="e.g. renic_meta_verify_token_2026"
                      disabled={!metaConfig.metaApiEnabled}
                      helperText="A secret token for webhook verification"
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Stack>

                  <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveMetaConfig}
                      disabled={savingConfig || !metaConfig.metaApiEnabled}
                      sx={{ 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        textTransform: 'none',
                        px: 3.5,
                        py: 1.2,
                        bgcolor: '#2563EB',
                        '&:hover': { bgcolor: '#1d4ed8' }
                      }}
                    >
                      {savingConfig ? 'Saving...' : 'Save Meta Config'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudIcon />}
                      onClick={handleTestMetaConnection}
                      disabled={metaTesting || !metaConfig.metaApiEnabled}
                      sx={{ 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        textTransform: 'none',
                        px: 3.5,
                        py: 1.2,
                        borderWidth: 1.5,
                        '&:hover': { borderWidth: 1.5 }
                      }}
                    >
                      {metaTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </Box>

                  {metaTestResult && (
                    <Alert
                      severity={metaTestResult.success ? 'success' : 'error'}
                      sx={{ mt: 3, borderRadius: '12px' }}
                    >
                      {metaTestResult.message}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
