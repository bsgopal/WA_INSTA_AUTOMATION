import { useState, useEffect, useRef } from 'react';
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
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import apiClient from '../../api/client';
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
        <Box sx={{ pt: 3, width: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Settings() {
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
    goldRate22K: 7200,
    goldRate24K: 7850,
    silverRate: 95,
    platinumRate: 3200,
    customStartPrice: 8500,
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

  // Instagram Session Management State
  const [instagramStatus, setInstagramStatus] = useState({
    success: false,
    profile: null,
    error: null
  });
  const [loadingInstagram, setLoadingInstagram] = useState(false);

  const fetchWhatsappQr = async () => {
    try {
      setLoadingQr(true);
      const response = await apiClient.get('/ai-chat/whatsapp/qr');
      if (response.data.success && response.data.qrCode) {
        setWhatsappQr(response.data.qrCode);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp QR:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const response = await apiClient.get('/ai-chat/whatsapp/status');
      setWhatsappStatus(response.data);
      if (response.data.success && !response.data.authenticated) {
        fetchWhatsappQr();
      } else if (response.data.success && response.data.authenticated) {
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
    // Poll WhatsApp status every 12 seconds
    const interval = setInterval(fetchWhatsappStatus, 12000);
    return () => clearInterval(interval);
  }, []);

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
  const handleSaveIntegrations = () => {
    localStorage.setItem('renic_settings', JSON.stringify(integrations));
    setSnackbar({ open: true, message: 'Integration settings saved locally!', severity: 'success' });
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
  const handleSendSandbox = async (presetText = null) => {
    const textToSend = presetText || sandboxInput;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'customer',
      text: textToSend,
      timestamp: new Date()
    };
    setSandboxMessages(prev => [...prev, userMsg]);
    if (!presetText) setSandboxInput('');

    try {
      setSandboxSending(true);
      const response = await apiClient.post('/ai-chat/test-ai-response', { message: textToSend });
      if (response.data.success) {
        const aiMsg = {
          sender: 'ai',
          text: response.data.aiResponse,
          timestamp: new Date(),
          mediaUrl: response.data.mediaUrl,
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
    return `http://localhost:5000${url}`;
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }} gutterBottom>
          Jeweller CRM Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure automated responses, jewellery details, product items, and test chatbot flows
        </Typography>
      </Box>

      {/* Tabs Menu */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 1, px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 600,
              fontSize: '0.95rem',
              gap: 1
            }
          }}
        >
          <Tab icon={<SettingsIcon fontSize="small" />} label="Integrations" />
          <Tab icon={<StorefrontIcon fontSize="small" />} label="Knowledge Base" />
          <Tab icon={<ShoppingBagIcon fontSize="small" />} label="Jewelry Catalog" />
          <Tab icon={<ChatIcon fontSize="small" />} label="AI Sandbox" />
        </Tabs>
      </Paper>

      {/* Tab 1: System Integrations */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={0}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  API Keys & System Integrations
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                  Manage communication credentials and core AI keys
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Google Gemini API Key"
                    fullWidth
                    type="password"
                    value={integrations.geminiKey}
                    onChange={(e) => handleIntegrationChange('geminiKey', e.target.value)}
                    placeholder="AIzaSy..."
                    helperText="Used to power AI conversational responses in Rupees (INR) and capture customer details."
                  />
                  
                  <TextField
                    label="Twilio Account SID"
                    fullWidth
                    type="password"
                    value={integrations.twilioSid}
                    onChange={(e) => handleIntegrationChange('twilioSid', e.target.value)}
                    placeholder="AC..."
                  />

                  <TextField
                    label="Twilio Auth Token"
                    fullWidth
                    type="password"
                    value={integrations.twilioToken}
                    onChange={(e) => handleIntegrationChange('twilioToken', e.target.value)}
                    placeholder="Token string"
                  />

                  <TextField
                    label="Instagram Access Token"
                    fullWidth
                    type="password"
                    value={integrations.instagramToken}
                    onChange={(e) => handleIntegrationChange('instagramToken', e.target.value)}
                    placeholder="IG..."
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure system localization and auto-reply defaults
                </Typography>

                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>Default Language</InputLabel>
                    <Select
                      value={integrations.defaultLanguage}
                      label="Default Language"
                      onChange={(e) => handleIntegrationChange('defaultLanguage', e.target.value)}
                    >
                      <MenuItem value="en">English (India)</MenuItem>
                      <MenuItem value="hi">Hindi (हिंदी)</MenuItem>
                      <MenuItem value="ta">Tamil (தமிழ்)</MenuItem>
                      <MenuItem value="te">Telugu (తెలుగు)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={integrations.timezone}
                      label="Timezone"
                      onChange={(e) => handleIntegrationChange('timezone', e.target.value)}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrations.autoReply}
                        onChange={(e) => handleIntegrationChange('autoReply', e.target.checked)}
                      />
                    }
                    label="Enable Auto-Reply System"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrations.emailNotifications}
                        onChange={(e) => handleIntegrationChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Alerts on Hot Leads"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* WhatsApp Link Connection Manager */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e8eef7' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  WhatsApp Device Connection (WAHA Provider)
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Scan the WhatsApp Web QR code to link your phone number and authorize automation workflows.
                </Typography>

                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa', border: '1px dashed #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Connection Status:
                      </Typography>
                      
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: whatsappStatus.authenticated ? '#4caf50' : '#ff9800',
                            boxShadow: `0 0 8px ${whatsappStatus.authenticated ? '#4caf50' : '#ff9800'}`
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {whatsappStatus.authenticated ? 'Connected' :
                           whatsappStatus.status === 'SCAN_QR_CODE' ? 'Awaiting Scan' :
                           whatsappStatus.status === 'STARTING' ? 'Starting...' :
                           whatsappStatus.status === 'STOPPED' ? 'Disconnected' :
                           whatsappStatus.status || 'UNKNOWN'}
                        </Typography>
                        <Chip
                          label={whatsappStatus.authenticated ? 'AUTHENTICATED' : 'DISCONNECTED'}
                          color={whatsappStatus.authenticated ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                        />
                      </Stack>

                      {whatsappStatus.authenticated ? (
                        <Box>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                            Connected Number: <strong>{whatsappStatus.phoneNumber ? whatsappStatus.phoneNumber.split('@')[0] : 'N/A'}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Customers should send message "Hi" to this number to test.
                          </Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleWhatsappLogout}
                            disabled={loadingWhatsapp}
                            sx={{ borderRadius: 2 }}
                          >
                            Disconnect Session
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {whatsappStatus.phoneNumber && (
                            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Stale Connection Detected
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                A cached session for <strong>{whatsappStatus.phoneNumber.split('@')[0]}</strong> is currently disconnected or failed. To link a new number, please reset this connection first.
                              </Typography>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={handleWhatsappLogout}
                                disabled={loadingWhatsapp}
                                sx={{ borderRadius: 2 }}
                              >
                                Disconnect & Reset Session
                              </Button>
                            </Alert>
                          )}
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Your device is not linked. Select your preferred authentication method to link WhatsApp:
                          </Typography>
                          
                          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <Button 
                              variant={!showPairingForm ? "contained" : "outlined"}
                              onClick={() => setShowPairingForm(false)}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            >
                              Scan QR Code
                            </Button>
                            <Button 
                              variant={showPairingForm ? "contained" : "outlined"}
                              onClick={() => setShowPairingForm(true)}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            >
                              Use Pairing Code
                            </Button>
                          </Stack>

                          {!showPairingForm ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary" component="ol" sx={{ pl: 2, mb: 2, display: 'block' }}>
                                <li>Open WhatsApp on your phone</li>
                                <li>Tap Menu or Settings and select Linked Devices</li>
                                <li>Tap Link a Device and point your phone to the screen to scan QR</li>
                              </Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={fetchWhatsappStatus}
                                sx={{ borderRadius: 2 }}
                              >
                                Check Connection Status
                              </Button>
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="body2" color="text.secondary" mb={2}>
                                Enter your WhatsApp phone number (with country code, e.g. +91 98765 43210) to generate an 8-character pairing code:
                              </Typography>
                              <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                                <TextField
                                  label="WhatsApp Number"
                                  size="small"
                                  placeholder="+919876543210"
                                  value={pairingPhone}
                                  onChange={(e) => setPairingPhone(e.target.value)}
                                  sx={{ flexGrow: 1 }}
                                />
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  onClick={handleRequestPairingCode}
                                  disabled={requestingCode}
                                  sx={{ borderRadius: 2, px: 3 }}
                                >
                                  {requestingCode ? <CircularProgress size={20} color="inherit" /> : "Get Code"}
                                </Button>
                              </Stack>

                              {pairingCode && (
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ede7f6', border: '1px solid #d1c4e9', textAlign: 'center', mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                    Your WhatsApp Pairing Code:
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'secondary.main', letterSpacing: 2, fontFamily: 'monospace' }}>
                                    {pairingCode}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                    Go to WhatsApp ➔ Linked Devices ➔ Link with phone number instead, and enter this code.
                                  </Typography>
                                </Box>
                              )}

                              <Button
                                variant="outlined"
                                size="small"
                                onClick={fetchWhatsappStatus}
                                sx={{ borderRadius: 2 }}
                              >
                                Check Connection Status
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {whatsappStatus.authenticated ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                          sx={{
                            width: 100,
                            height: 100,
                            bgcolor: 'success.50',
                            color: 'success.main',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 8px 16px rgba(76, 175, 80, 0.12)'
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                          WhatsApp Automation Active
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Listening for incoming customer messages 24/7
                        </Typography>
                      </Box>
                    ) : (
                      !showPairingForm ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            width: 250,
                            height: 250,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 3,
                            bgcolor: '#ffffff',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                          }}
                        >
                          {whatsappQr ? (
                            <img
                              src={whatsappQr}
                              alt="Scan to login"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                {loadingQr ? 'Generating QR code...' : 'QR code is loading or WAHA container is starting...'}
                              </Typography>
                              <Button size="small" variant="text" onClick={fetchWhatsappStatus}>
                                Retry Connection
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 4, borderRadius: 3, bgcolor: '#f3e5f5', border: '1px dashed #d1c4e9', maxWidth: 280 }}>
                          <SmartToyIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1.5 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                            Pairing Code Auth Active
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                            Requesting an 8-character pairing code directly bypasses camera scanning limitations.
                          </Typography>
                        </Box>
                      )
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Instagram Link Connection Manager */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e8eef7' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Instagram DM Connection (Meta Graph API)
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Connect your Instagram Business / Creator profile directly to Meta's Cloud API to automate direct messages.
                </Typography>

                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa', border: '1px dashed #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Connection Status:
                      </Typography>
                      
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: instagramStatus.success ? '#4caf50' : '#ff9800',
                            boxShadow: `0 0 8px ${instagramStatus.success ? '#4caf50' : '#ff9800'}`
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {instagramStatus.success ? 'Connected' : 'Disconnected'}
                        </Typography>
                        <Chip
                          label={instagramStatus.success ? 'AUTHENTICATED' : 'NOT CONFIGURED'}
                          color={instagramStatus.success ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                        />
                      </Stack>

                      {instagramStatus.success && instagramStatus.profile ? (
                        <Box>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                            Connected Account: <strong>{instagramStatus.profile.name}</strong> (@{instagramStatus.profile.username})
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Direct Messages received on this Instagram account will be automatically handled by your Gemini AI assistant.
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={fetchInstagramStatus}
                            disabled={loadingInstagram}
                            sx={{ borderRadius: 2 }}
                            startIcon={<RefreshIcon fontSize="small" />}
                          >
                            Refresh Details
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Your Instagram profile is not linked or the credentials are invalid. Please check your Access Token and Page ID in the configuration.
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={fetchInstagramStatus}
                            disabled={loadingInstagram}
                            sx={{ borderRadius: 2 }}
                          >
                            Verify Connection
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {instagramStatus.success && instagramStatus.profile ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                          src={instagramStatus.profile.profilePic}
                          sx={{
                            width: 100,
                            height: 100,
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 8px 16px rgba(233, 30, 99, 0.12)',
                            border: '3px solid #e91e63'
                          }}
                        >
                          {instagramStatus.profile.name ? instagramStatus.profile.name[0] : 'I'}
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#e91e63' }}>
                          Instagram Automation Active
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          AI chatbot is actively listening for new Instagram DMs
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                          sx={{
                            width: 100,
                            height: 100,
                            bgcolor: 'grey.100',
                            color: 'grey.400',
                            mx: 'auto',
                            mb: 2
                          }}
                        >
                          <ChatIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          No Active Profile
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configure tokens above to link your Instagram account
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveIntegrations}
                disableElevation
              >
                Save Integration Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Knowledge Base */}
      <TabPanel value={activeTab} index={1}>
        {loadingConfig ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Metal Rates Configuration */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CurrencyRupeeIcon color="primary" fontSize="small" />
                    Metal Rates (INR / gram)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Set current pricing dynamically references by the AI for response generation
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Gold 22K (per gram)"
                        fullWidth
                        type="number"
                        value={shopConfig.goldRate22K}
                        onChange={(e) => handleConfigChange('goldRate22K', parseFloat(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Gold 24K (per gram)"
                        fullWidth
                        type="number"
                        value={shopConfig.goldRate24K}
                        onChange={(e) => handleConfigChange('goldRate24K', parseFloat(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Silver (per gram)"
                        fullWidth
                        type="number"
                        value={shopConfig.silverRate}
                        onChange={(e) => handleConfigChange('silverRate', parseFloat(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Platinum (per gram)"
                        fullWidth
                        type="number"
                        value={shopConfig.platinumRate}
                        onChange={(e) => handleConfigChange('platinumRate', parseFloat(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Custom Jewelry Starting Price"
                        fullWidth
                        type="number"
                        value={shopConfig.customStartPrice || 8500}
                        onChange={(e) => handleConfigChange('customStartPrice', parseFloat(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                        helperText="Starting price for customized bridal and luxury designs, displayed in price inquiries."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Shop Details Configuration */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Store Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Core store details that the AI uses to answer location and operating queries
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Store Name"
                      fullWidth
                      value={shopConfig.shopName}
                      onChange={(e) => handleConfigChange('shopName', e.target.value)}
                    />
                    <TextField
                      label="Jewelry Website URL (One URL)"
                      fullWidth
                      value={shopConfig.websiteUrl || ''}
                      placeholder="e.g. https://kanalli.in/"
                      onChange={(e) => handleConfigChange('websiteUrl', e.target.value)}
                    />
                    <TextField
                      label="Catalog Cover Image URL (One URL Image)"
                      fullWidth
                      value={shopConfig.catalogImageUrl || ''}
                      placeholder="e.g. https://kanalli.in/wp-content/uploads/...logo.png"
                      onChange={(e) => handleConfigChange('catalogImageUrl', e.target.value)}
                      helperText="If left blank, the system will automatically try to scrape the logo/banner from the Shop Website URL."
                    />

                    <TextField
                      label="Contact Phone"
                      fullWidth
                      value={shopConfig.contactPhone}
                      onChange={(e) => handleConfigChange('contactPhone', e.target.value)}
                    />
                    <TextField
                      label="Operating Hours"
                      fullWidth
                      value={shopConfig.operatingHours}
                      onChange={(e) => handleConfigChange('operatingHours', e.target.value)}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Address & Policy Settings */}
            <Grid item xs={12}>
              <Card elevation={0}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Policies & Custom AI Instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Address layout and return policies that the AI references
                  </Typography>

                  <Stack spacing={3}>
                    <TextField
                      label="Store Address"
                      fullWidth
                      multiline
                      rows={2}
                      value={shopConfig.address}
                      onChange={(e) => handleConfigChange('address', e.target.value)}
                    />
                    <TextField
                      label="Return & Buyback Policy"
                      fullWidth
                      multiline
                      rows={2}
                      value={shopConfig.returnPolicy}
                      onChange={(e) => handleConfigChange('returnPolicy', e.target.value)}
                    />
                    <TextField
                      label="Custom AI Behavior Instructions"
                      fullWidth
                      multiline
                      rows={3}
                      value={shopConfig.aiCustomInstructions}
                      onChange={(e) => handleConfigChange('aiCustomInstructions', e.target.value)}
                      placeholder="e.g. Always offer gold customization. Address customers politely."
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Dynamic FAQs Configuration */}
            <Grid item xs={12}>
              <Card elevation={0}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Frequently Asked Questions (FAQs)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Add specific questions and answers for direct AI lookup
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#fafbfe' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Add New FAQ
                    </Typography>
                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid item xs={12} md={5}>
                        <TextField
                          label="Question"
                          fullWidth
                          size="small"
                          value={newFaq.question}
                          onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                          placeholder="e.g. Do you offer engraving?"
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          label="Answer"
                          fullWidth
                          size="small"
                          value={newFaq.answer}
                          onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                          placeholder="e.g. Yes, we offer free name engraving on all gold rings."
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={handleAddFaq}
                          disableElevation
                        >
                          Add FAQ
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Current Store FAQs ({shopConfig.faqs.length})
                  </Typography>

                  {shopConfig.faqs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                      No custom FAQs defined yet.
                    </Typography>
                  ) : (
                    <List sx={{ border: '1px solid #e8eef7', borderRadius: 2, bgcolor: '#ffffff', p: 0 }}>
                      {shopConfig.faqs.map((faq, index) => (
                        <Box key={index}>
                          <ListItem sx={{ py: 2 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={600}>
                                  Q: {faq.question}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  A: {faq.answer}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                color="error"
                                onClick={() => handleDeleteFaq(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < shopConfig.faqs.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveShopConfig()}
                  disabled={savingConfig}
                  disableElevation
                >
                  {savingConfig ? 'Saving Knowledge Base...' : 'Save Knowledge Base'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 3: Catalog */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {/* Add Product Form */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} component="form" onSubmit={handleAddCatalogItem}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Add Product Item
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Add items to the jewelry catalog for the AI to dynamically offer and share
                </Typography>

                <Stack spacing={2.5}>
                  <TextField
                    label="Product Name *"
                    fullWidth
                    required
                    value={newCatalog.name}
                    onChange={(e) => setNewCatalog({ ...newCatalog, name: e.target.value })}
                    placeholder="e.g. Kundan Gold Ring"
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={newCatalog.category}
                          label="Category"
                          onChange={(e) => setNewCatalog({ ...newCatalog, category: e.target.value })}
                        >
                          <MenuItem value="Rings">Rings</MenuItem>
                          <MenuItem value="Necklaces">Necklaces</MenuItem>
                          <MenuItem value="Bangles">Bangles</MenuItem>
                          <MenuItem value="Earrings">Earrings</MenuItem>
                          <MenuItem value="Custom">Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Price (INR) *"
                        fullWidth
                        required
                        type="number"
                        value={newCatalog.price}
                        onChange={(e) => setNewCatalog({ ...newCatalog, price: e.target.value })}
                        placeholder="45000"
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>₹</Typography> }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Keywords (comma-separated)"
                    fullWidth
                    value={newCatalog.keywords}
                    onChange={(e) => setNewCatalog({ ...newCatalog, keywords: e.target.value })}
                    placeholder="gold, bridal, kundan, traditional"
                    helperText="Keywords used by the AI search lookup to match customer queries"
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={newCatalog.description}
                    onChange={(e) => setNewCatalog({ ...newCatalog, description: e.target.value })}
                    placeholder="Bespoke traditional gold ring with micro-engraving..."
                  />

                  {/* Drag and Drop File Input Area */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Product Image *
                    </Typography>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />

                    {newCatalog.imagePreview ? (
                      <Box sx={{ position: 'relative', width: '100%', height: 180, borderRadius: 2, overflow: 'hidden', border: '1px solid #e8eef7' }}>
                        <img
                          src={newCatalog.imagePreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                          size="small"
                          onClick={() => {
                            setNewCatalog(prev => ({ ...prev, imageFile: null, imagePreview: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Paper
                        variant="outlined"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderStyle: 'dashed',
                          borderColor: 'primary.light',
                          bgcolor: '#fafbfe',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f5fa' }
                        }}
                      >
                        <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" fontWeight={600}>
                          Click to upload product photo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PNG, JPG or JPEG up to 5MB
                        </Typography>
                      </Paper>
                    )}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={savingCatalog}
                    disableElevation
                  >
                    {savingCatalog ? 'Uploading Product...' : 'Add to Catalog'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Catalog Items Grid */}
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Catalog Listings
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                  Stored product cards offering real-time AI image dispatching
                </Typography>

                {loadingCatalog ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : catalogItems.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', bgcolor: '#fafafa', borderStyle: 'dashed' }}>
                    <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom fontWeight={600}>
                      No catalog items found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fill the form on the left to add your first jewelry item.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2} sx={{ maxHeight: '600px', overflowY: 'auto', pr: 1 }}>
                    {catalogItems.map((item) => (
                      <Grid item xs={12} sm={6} key={item._id}>
                        <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', border: '1px solid #e8eef7' }}>
                          <Box sx={{ height: 140, overflow: 'hidden', bgcolor: '#f0f0f0' }}>
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                          <CardContent sx={{ p: 2, flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700} sx={{ mb: 1 }}>
                              ₹{item.price.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}>
                              {item.description || 'No description provided.'}
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Chip label={item.category} size="small" variant="outlined" />
                              {item.keywords && item.keywords.split(',').map((kw, i) => (
                                <Chip key={i} label={kw.trim()} size="small" sx={{ fontSize: '0.65rem' }} />
                              ))}
                            </Stack>
                          </CardContent>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteCatalog(item._id)}
                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Sandbox Chat */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          {/* Chat Simulator */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ height: '620px', display: 'flex', flexDirection: 'column', border: '1px solid #e8eef7' }}>
              {/* Simulator Header */}
              <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e8eef7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Simulator (Customer profile: {sandboxName})
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                      AI Chat Autopilot Connected
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setSandboxMessages([
                      {
                        sender: 'ai',
                        text: 'Namaste! Welcome to Renic Jewellers. May I know your name, please?',
                        timestamp: new Date()
                      }
                    ]);
                    setSandboxName('Customer');
                  }}
                >
                  Reset Chat
                </Button>
              </Box>

              {/* Chat Bubble List */}
              <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: '#f4f6fa', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sandboxMessages.map((msg, index) => {
                  const isUser = msg.sender === 'customer';
                  return (
                    <Box key={index} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
                      <Box sx={{ maxWidth: '75%' }}>
                        {/* Chat Message Bubble */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            bgcolor: isUser ? 'primary.main' : 'background.paper',
                            color: isUser ? 'primary.contrastText' : 'text.primary',
                            border: isUser ? 'none' : '1px solid #e8eef7',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            overflow: 'hidden'
                          }}
                        >
                          {!isUser && msg.mediaUrl && (
                            <Box sx={{ mb: 1.5, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8eef7', maxHeight: 180, bgcolor: '#fafafa' }}>
                              <img
                                src={getImageUrl(msg.mediaUrl)}
                                alt="Shared Catalog Banner"
                                style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block' }}
                              />
                            </Box>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {isUser ? msg.text : formatAIResponse(msg.text)}
                          </Typography>
                        </Paper>

                        {/* Interactive Category Buttons for Catalog Prompts */}
                        {!isUser && msg.isCatalogPrompt && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendSandbox('Rings')}
                              sx={{ textTransform: 'none', borderRadius: 4, bgcolor: '#ffffff', py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
                            >
                              Rings 💍
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendSandbox('Necklaces')}
                              sx={{ textTransform: 'none', borderRadius: 4, bgcolor: '#ffffff', py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
                            >
                              Necklaces 📿
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendSandbox('Bangles')}
                              sx={{ textTransform: 'none', borderRadius: 4, bgcolor: '#ffffff', py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
                            >
                              Bangles ⭕
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendSandbox('Earrings')}
                              sx={{ textTransform: 'none', borderRadius: 4, bgcolor: '#ffffff', py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e8eef7', color: 'primary.main', '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
                            >
                              Earrings 💎
                            </Button>
                          </Box>
                        )}

                        {/* Extracted Name Banner Notice */}
                        {!isUser && msg.nameUpdated && msg.newName && (
                          <Alert severity="info" size="small" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                            Extracted Name: <strong>{msg.newName}</strong>. Updated in database.
                          </Alert>
                        )}

                        {/* Catalog Cards Attachment Preview */}
                        {!isUser && msg.catalogMatches && msg.catalogMatches.length > 0 && (
                          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, px: 0.5 }}>
                              📎 Product Attachment:
                            </Typography>
                            {msg.catalogMatches.map((item, idx) => (
                              <Card key={idx} variant="outlined" sx={{ display: 'flex', bgcolor: '#ffffff', border: '1px solid #e8eef7', borderRadius: 2, overflow: 'hidden', p: 0, height: 74 }}>
                                <Box sx={{ width: 74, minWidth: 74, height: '100%', overflow: 'hidden' }}>
                                  <img
                                    src={getImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </Box>
                                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                                    ₹{item.price.toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                              </Card>
                            ))}
                          </Box>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 1, textAlign: isUser ? 'right' : 'left' }}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                {sandboxSending && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>AI is thinking...</Typography>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>

              {/* Message Input Controls */}
              <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e8eef7', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  placeholder="Type a query to test (e.g. what is the 22k gold rate?)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendSandbox();
                  }}
                  disabled={sandboxSending}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSendSandbox()}
                  disabled={sandboxSending || !sandboxInput.trim()}
                  disableElevation
                  sx={{ p: 1, minWidth: 48 }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Test Quick Triggers */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ height: '620px', overflowY: 'auto' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Test Simulation Triggers
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Click any of the sample messages below to test the AI’s capability:
                </Typography>

                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('Hi')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Say "Hi" (Triggers name request)
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('My name is Priya')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Say "My name is Priya" (Name collection)
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('What is the 22K gold rate today?')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Ask: "What is the 22K gold rate today?"
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('Show me rings and tell me the price')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Ask: "Show me rings and tell me the price"
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('I want to custom book an appointment')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Ask: "I want to custom book an appointment"
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="inherit"
                    onClick={() => handleSendSandbox('Do you have a refund policy?')}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, borderColor: '#e8eef7' }}
                  >
                    💬 Ask: "Do you have a refund policy?"
                  </Button>
                </Stack>

                <Alert severity="warning" sx={{ mt: 4, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                  Rates and catalog items will match the live database values configured in the <strong>Knowledge Base</strong> and <strong>Jewelry Catalog</strong> tabs.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
