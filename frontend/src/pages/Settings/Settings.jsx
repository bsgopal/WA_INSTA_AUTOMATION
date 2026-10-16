import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, TextField, Button, Switch,
  FormControlLabel, Stack, Card, CardContent, Alert,
  Tabs, Tab, IconButton, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChatIcon from '@mui/icons-material/Chat';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CloudIcon from '@mui/icons-material/Cloud';
import KeyIcon from '@mui/icons-material/Key';
import ShieldIcon from '@mui/icons-material/Shield';
import DescriptionIcon from '@mui/icons-material/Description';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import { useTenant } from '../../context/TenantContext';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Active WhatsApp Engine Mode ('DOCKER' | 'META')
  const [senderMode, setSenderMode] = useState('DOCKER');
  const [dockerThrottle, setDockerThrottle] = useState(6);
  const [savingEngine, setSavingEngine] = useState(false);

  // Tab 0: Knowledge Base / Store & Branding State (MongoDB / ShopConfig)
  const [shopConfig, setShopConfig] = useState({
    shopName: 'Renic Technology',
    companyName: 'RENIC TECHNOLOGY',
    tagline: 'IDEAS | SOLUTIONS | GROWTH',
    email: 'info@renictechnology.com',
    websiteUrl: 'https://www.renictechnology.com',
    catalogImageUrl: '',
    logoUrl: '',
    address: '123, Main Road, Gobichettipalayam, Erode - 638452, Tamil Nadu, India',
    operatingHours: '9:00 AM - 7:00 PM (Monday to Saturday)',
    contactPhone: '+91 88070 25752',
    gstin: '33AAAAA0000A1Z5',
    currency: 'INR',
    currencySymbol: '₹',
    themeColor: '#84CC16',
    signatoryName: 'Renic Team',
    signatoryTitle: 'Authorized Signature',
    signatoryCompany: 'RENIC TECHNOLOGY',
    defaultQuotationTerms: [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ]
  });

  const [newTermInput, setNewTermInput] = useState('');

  // Tab 1: WhatsApp Session Management State (Docker WAHA)
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
  const whatsappQrRef = useRef('');

  // WhatsApp Pairing Code Flow State
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);

  // Tab 1: Meta API Configuration State
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
    ngrok: { running: false },
    waha: { running: false }
  });

  // Tab 2: OAuth 2.0 State
  const { oauthEnforced, oauthStatus, isOauthLocked, isLicenseLocked, refreshScreens, whatsappSenderMode, clientName } = useTenant();
  const [tenantClientId, setTenantClientId] = useState('');
  const [tenantClientSecret, setTenantClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [verifyingOauth, setVerifyingOauth] = useState(false);
  const [savingOauth, setSavingOauth] = useState(false);
  const [oauthAlertBox, setOauthAlertBox] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    if (isOauthLocked || isLicenseLocked || (!oauthStatus?.verified && oauthEnforced)) {
      setActiveTab(2);
    }
  }, [isOauthLocked, isLicenseLocked, oauthStatus?.verified, oauthEnforced]);

  useEffect(() => {
    if (whatsappSenderMode) {
      setSenderMode(whatsappSenderMode.toUpperCase());
    }
  }, [whatsappSenderMode]);

  useEffect(() => {
    if (oauthStatus?.clientId) {
      setTenantClientId(oauthStatus.clientId);
    }
  }, [oauthStatus?.clientId]);

  // Load backend data on mount
  useEffect(() => {
    fetchShopConfig();
    fetchWhatsappEngine();
    fetchWhatsappStatus();
    fetchMetaConfig();
    fetchSystemStatus();

    // Poll status periodically
    const interval = setInterval(fetchWhatsappStatus, 12000);
    const sysInterval = setInterval(fetchSystemStatus, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(sysInterval);
    };
  }, []);

  // Fetch QR Code automatically when in Docker mode and not authenticated
  useEffect(() => {
    if (activeTab === 1 && senderMode === 'DOCKER' && !whatsappStatus.authenticated) {
      fetchWhatsappQr();
    }
  }, [activeTab, senderMode, whatsappStatus.authenticated]);

  const fetchShopConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await apiClient.get('/ai-chat/shop-config');
      if (response.data.success && response.data.config) {
        setShopConfig(prev => ({
          ...prev,
          ...response.data.config,
          defaultQuotationTerms: response.data.config.defaultQuotationTerms?.length > 0 
            ? response.data.config.defaultQuotationTerms 
            : prev.defaultQuotationTerms
        }));
      }
    } catch (error) {
      console.error('Failed to load shop config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchWhatsappEngine = async () => {
    try {
      const response = await apiClient.get('/shop-config/whatsapp-engine');
      if (response.data.success) {
        const mode = (response.data.whatsappSenderMode || 'DOCKER').toUpperCase();
        setSenderMode(mode);
        if (response.data.dockerThrottleSeconds) {
          setDockerThrottle(response.data.dockerThrottleSeconds);
        }
      }
    } catch (error) {
      console.warn('Failed to load WhatsApp engine mode:', error);
    }
  };

  const handleSaveDockerThrottle = async () => {
    try {
      setSavingEngine(true);
      await apiClient.post('/shop-config/whatsapp-engine', {
        whatsappSenderMode: senderMode,
        dockerThrottleSeconds: Number(dockerThrottle) || 6
      });
      setSnackbar({ open: true, message: 'Throttle delay saved successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save throttle delay.', severity: 'error' });
    } finally {
      setSavingEngine(false);
    }
  };

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
        setSnackbar({ open: true, message: 'Meta Cloud API configuration saved successfully!', severity: 'success' });
        fetchWhatsappStatus();
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
        const verifiedName = response.data?.data?.verified_name ? ` (${response.data.data.verified_name})` : '';
        setMetaTestResult({ success: true, message: `Meta API connection verified successfully!${verifiedName}` });
        setSnackbar({ open: true, message: 'Meta API connection verified successfully!', severity: 'success' });
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

  const handleVerifyOauth = async () => {
    if (!tenantClientId.trim() || !tenantClientSecret.trim()) {
      setOauthAlertBox({
        open: true,
        title: 'Missing OAuth Credentials',
        message: 'Please provide both the Client ID and Client Secret generated in Renic Soft Master HQ to verify connection.',
        severity: 'warning'
      });
      setSnackbar({
        open: true,
        message: 'Please enter both Client ID and Client Secret.',
        severity: 'warning',
        anchorOrigin: { vertical: 'center', horizontal: 'center' }
      });
      return;
    }
    try {
      setVerifyingOauth(true);
      const response = await apiClient.post('/settings/verify-oauth', {
        clientId: tenantClientId.trim(),
        clientSecret: tenantClientSecret.trim()
      });
      if (response.data?.success) {
        setSnackbar({
          open: true,
          message: '🎉 ' + (response.data.message || 'OAuth 2.0 Credentials successfully verified!'),
          severity: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        if (typeof refreshScreens === 'function') refreshScreens();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Verification failed';
      setSnackbar({
        open: true,
        message: '❌ ' + errMsg,
        severity: 'error',
        anchorOrigin: { vertical: 'center', horizontal: 'center' }
      });
      setOauthAlertBox({
        open: true,
        title: 'Authentication Rejected: Invalid Client Credentials',
        message: errMsg.toLowerCase().includes('client id not found')
          ? `The Client ID "${tenantClientId.trim()}" does not exist in Renic Soft Master HQ. A security notification has been dispatched to the platform administrator.`
          : `The Client Secret entered for "${tenantClientId.trim()}" is incorrect. Access is denied, and a security alert was dispatched to Renic Soft Master HQ.`,
        severity: 'error'
      });
    } finally {
      setVerifyingOauth(false);
    }
  };

  const handleSaveOauthCredentials = async () => {
    try {
      setSavingOauth(true);
      const response = await apiClient.post('/settings/oauth-credentials', {
        clientId: tenantClientId.trim(),
        clientSecret: tenantClientSecret.trim()
      });
      if (response.data?.success) {
        setSnackbar({ open: true, message: 'OAuth credentials saved successfully.', severity: 'success' });
        if (typeof refreshScreens === 'function') refreshScreens();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to save credentials';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setSavingOauth(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const response = await apiClient.get('/ai-chat/whatsapp/waha-status');
      setWhatsappStatus(response.data);
      if (response.data.success && !response.data.authenticated) {
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

  const fetchWhatsappQr = async () => {
    try {
      setLoadingQr(true);
      setQrError('');
      const response = await apiClient.get('/ai-chat/whatsapp/qr');
      // WAHAService.getQRCode() returns `qrCode`; older callers looked for
      // `qr`. Reading only `.qr` made this branch always fail and surface the
      // generic "Failed to load QR code." even when WAHA handed back a valid
      // image. Accept either key.
      const qr = response.data.qr || response.data.qrCode;
      if (response.data.success && qr) {
        whatsappQrRef.current = qr;
        setWhatsappQr(qr);
      } else {
        setQrError(response.data.error || 'Failed to load QR code.');
      }
    } catch (error) {
      setQrError('Failed to reach the WhatsApp service. Make sure the Docker (WAHA) container is running on localhost:3000.');
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
        setSnackbar({ open: true, message: response.data.error || 'Failed to restart session.', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to restart WhatsApp session.', severity: 'error' });
    } finally {
      setRestartingSession(false);
    }
  };

  const handleWhatsappLogout = async () => {
    try {
      setLoadingWhatsapp(true);
      await apiClient.post('/ai-chat/whatsapp/logout');
      setSnackbar({ open: true, message: 'Disconnected WhatsApp session.', severity: 'info' });
      fetchWhatsappStatus();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to disconnect session.', severity: 'error' });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const handleRequestPairingCode = async () => {
    if (!pairingPhone.trim()) {
      setSnackbar({ open: true, message: 'Please enter a valid phone number with country code.', severity: 'warning' });
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
      setSnackbar({ open: true, message: 'Failed to generate pairing code. Make sure Docker container is running.', severity: 'error' });
    } finally {
      setRequestingCode(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setShopConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    setShopConfig(prev => ({
      ...prev,
      defaultQuotationTerms: [...(prev.defaultQuotationTerms || []), newTermInput.trim()]
    }));
    setNewTermInput('');
  };

  const handleUpdateTerm = (index, value) => {
    const updated = [...(shopConfig.defaultQuotationTerms || [])];
    updated[index] = value;
    setShopConfig(prev => ({ ...prev, defaultQuotationTerms: updated }));
  };

  const handleRemoveTerm = (index) => {
    setShopConfig(prev => ({
      ...prev,
      defaultQuotationTerms: (prev.defaultQuotationTerms || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveShopConfig = async () => {
    try {
      setSavingConfig(true);
      const response = await apiClient.put('/ai-chat/shop-config', shopConfig);
      if (response.data.success) {
        setShopConfig(response.data.config);
        setSnackbar({ open: true, message: 'Store details and branding settings saved successfully!', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to save store settings:', error);
      setSnackbar({ open: true, message: 'Failed to save store settings.', severity: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  // SCROLL CONTAINER. Every ancestor in DashboardLayout (main -> content Box
  // -> page wrapper) is `overflow: hidden`, so without `overflowY: 'auto'` on
  // this root the page was clipped at the fold and no scrollbar could ever
  // form — which is why Settings could not be scrolled. `minHeight: 0` lets a
  // flex child shrink below its content size; without it min-height:auto keeps
  // the box at content height and it overflows again.
  return (
    <Box sx={{ width: '100%', flexGrow: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>
      {/* OAuth 2.0 Activation Required Alert Banner */}
      {isOauthLocked && (
        <Alert
          severity="warning"
          variant="filled"
          icon={<KeyIcon sx={{ fontSize: 18 }} />}
          action={
            <Button color="inherit" size="small" onClick={() => setActiveTab(2)} sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              Activate Now (Tab 3)
            </Button>
          }
          sx={{
            py: 0.5,
            px: 1.5,
            borderRadius: '8px',
            bgcolor: '#d97706',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2)'
          }}
        >
          🔒 <strong>OAuth 2.0 Activation Required</strong> — Please verify Client ID &amp; Secret from Renic Soft Master HQ to unlock this workspace.
        </Alert>
      )}

      {/* Top Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0.4, 
          bgcolor: '#f1f5f9', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0' 
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderRadius: '6px',
              color: '#64748b',
              transition: 'all 0.18s ease',
              gap: 1,
              '&.Mui-selected': {
                color: '#0f172a',
                bgcolor: '#84cc16',
                boxShadow: '0 2px 6px rgba(132, 204, 22, 0.3)',
                fontWeight: 800
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: 'rgba(255,255,255,0.6)',
                color: '#0f172a'
              }
            }
          }}
        >
          <Tab icon={<StorefrontIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Store Details & Branding" />
          <Tab icon={<ChatIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="WhatsApp Engine & Connection" />
          <Tab icon={<KeyIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="API & OAuth 2.0" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {loadingConfig ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} sx={{ color: '#84cc16' }} />
        </Box>
      ) : (
        <Box sx={{ width: '100%', flexGrow: 1 }}>
          {/* Tab 0: Store Details & Branding */}
          {activeTab === 0 && (
            <Grid container spacing={1.5} sx={{
              '@keyframes tabFadeIn': {
                from: { opacity: 0, transform: 'translateY(4px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              },
              animation: 'tabFadeIn 0.2s ease forwards'
            }}>
              {/* Shop Details Configuration */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    bgcolor: '#ffffff',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: 'rgba(132, 204, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StorefrontIcon sx={{ color: '#4d7c0f', fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                          Store Information
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Core store details referenced by AI for customer inquiries
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={1.2}>
                      <TextField
                        label="Store Name"
                        size="small"
                        fullWidth
                        value={shopConfig.shopName || ''}
                        onChange={(e) => handleConfigChange('shopName', e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                      />
                      <TextField
                        label="Store Address"
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={shopConfig.address || ''}
                        onChange={(e) => handleConfigChange('address', e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                      />
                      <Grid container spacing={1.2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Contact Phone"
                            size="small"
                            fullWidth
                            value={shopConfig.contactPhone || ''}
                            onChange={(e) => handleConfigChange('contactPhone', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Operating Hours"
                            size="small"
                            fullWidth
                            value={shopConfig.operatingHours || ''}
                            onChange={(e) => handleConfigChange('operatingHours', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        label="Website URL"
                        size="small"
                        fullWidth
                        value={shopConfig.websiteUrl || ''}
                        placeholder="e.g. https://www.renictechnology.com"
                        onChange={(e) => handleConfigChange('websiteUrl', e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                      />
                      <TextField
                        label="Catalog / Logo URL"
                        size="small"
                        fullWidth
                        value={shopConfig.catalogImageUrl || ''}
                        placeholder="e.g. https://domain.com/logo.png"
                        onChange={(e) => handleConfigChange('catalogImageUrl', e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quotation & Invoicing Branding Configuration */}
              <Grid item xs={12} md={6}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    bgcolor: '#ffffff',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: 'rgba(132, 204, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DescriptionIcon sx={{ color: '#4d7c0f', fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                          Quotation &amp; Billing Branding
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Business profile rendered across PDF proposals and invoices
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={1.2}>
                      <Grid container spacing={1.2}>
                        <Grid item xs={7}>
                          <TextField
                            label="Company Name"
                            size="small"
                            fullWidth
                            value={shopConfig.companyName || ''}
                            onChange={(e) => handleConfigChange('companyName', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            label="Tagline"
                            size="small"
                            fullWidth
                            value={shopConfig.tagline || ''}
                            onChange={(e) => handleConfigChange('tagline', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={1.2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Official Email"
                            size="small"
                            fullWidth
                            value={shopConfig.email || ''}
                            onChange={(e) => handleConfigChange('email', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="GSTIN Number"
                            size="small"
                            fullWidth
                            value={shopConfig.gstin || ''}
                            onChange={(e) => handleConfigChange('gstin', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={1.2}>
                        <Grid item xs={4}>
                          <TextField
                            label="Currency"
                            size="small"
                            fullWidth
                            value={shopConfig.currency || 'INR'}
                            onChange={(e) => handleConfigChange('currency', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            label="Symbol"
                            size="small"
                            fullWidth
                            value={shopConfig.currencySymbol || '₹'}
                            onChange={(e) => handleConfigChange('currencySymbol', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            label="Theme Accent"
                            size="small"
                            fullWidth
                            value={shopConfig.themeColor || '#84CC16'}
                            onChange={(e) => handleConfigChange('themeColor', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={1.2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Signatory Name"
                            size="small"
                            fullWidth
                            value={shopConfig.signatoryName || ''}
                            onChange={(e) => handleConfigChange('signatoryName', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Signatory Title"
                            size="small"
                            fullWidth
                            value={shopConfig.signatoryTitle || ''}
                            onChange={(e) => handleConfigChange('signatoryTitle', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                          />
                        </Grid>
                      </Grid>

                      {/* Default Quotation Terms */}
                      <Box sx={{ pt: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, display: 'block' }}>
                          Proposal Terms &amp; Conditions ({shopConfig.defaultQuotationTerms?.length || 0})
                        </Typography>
                        <Stack spacing={0.6} sx={{ mb: 1, maxHeight: 110, overflowY: 'auto' }}>
                          {(shopConfig.defaultQuotationTerms || []).map((term, tIdx) => (
                            <Box key={tIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', minWidth: 16, fontSize: '0.7rem' }}>
                                {tIdx + 1}.
                              </Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={term}
                                onChange={(e) => handleUpdateTerm(tIdx, e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '4px', fontSize: '0.75rem', py: 0.2 } } }}
                              />
                              <IconButton size="small" color="error" onClick={() => handleRemoveTerm(tIdx)} sx={{ p: 0.3 }}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 0.8 }}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add new proposal term..."
                            value={newTermInput}
                            onChange={(e) => setNewTermInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTerm(); } }}
                            slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.75rem' } } }}
                          />
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<AddIcon sx={{ fontSize: 14 }} />} 
                            onClick={handleAddTerm}
                            sx={{ textTransform: 'none', borderRadius: '6px', minWidth: 70, fontSize: '0.75rem', borderColor: '#84cc16', color: '#0f172a', '&:hover': { borderColor: '#65a30d', bgcolor: 'rgba(132, 204, 22, 0.08)' } }}
                          >
                            Add
                          </Button>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Save Button for Store & Branding */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleSaveShopConfig()}
                    disabled={savingConfig}
                    sx={{ 
                      borderRadius: '8px', 
                      fontWeight: 800, 
                      px: 3, 
                      py: 0.8, 
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      bgcolor: '#84cc16',
                      color: '#0f172a',
                      boxShadow: '0 2px 8px rgba(132, 204, 22, 0.35)',
                      '&:hover': { bgcolor: '#65a30d' }
                    }}
                  >
                    {savingConfig ? 'Saving Settings...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: WhatsApp Engine & Connection */}
          {activeTab === 1 && (
            <Box sx={{
              '@keyframes tabFadeIn': {
                from: { opacity: 0, transform: 'translateY(4px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              },
              animation: 'tabFadeIn 0.2s ease forwards',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              {/* Centrally Governed Engine Banner */}
              <Box sx={{
                p: 1.5,
                borderRadius: '8px',
                bgcolor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#84cc16', boxShadow: '0 0 8px #84cc16' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>
                      Assigned Engine: {senderMode === 'DOCKER' ? '🐳 Docker WAHA (Local QR Engine)' : '⚡ Official Meta WhatsApp Cloud API'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      Centrally managed for {clientName ? <b>{clientName}</b> : 'this workspace'}.
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="🔒 CENTRALLY ASSIGNED"
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(132, 204, 22, 0.18)', color: '#a3e635', fontWeight: 800, fontSize: '0.65rem', border: '1px solid rgba(132, 204, 22, 0.4)' }}
                />
              </Box>

              {/* VIEW 1: DOCKER / WAHA LOCAL QR ENGINE */}
              {senderMode === 'DOCKER' && (
                <Stack spacing={1.5}>
                  {/* Docker Header Status Card */}
                  <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid', borderColor: whatsappStatus.authenticated ? '#86efac' : '#fde68a', overflow: 'hidden' }}>
                    <Box sx={{
                      p: 1.5,
                      background: whatsappStatus.authenticated 
                        ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' 
                        : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 1.5
                    }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: whatsappStatus.authenticated ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: whatsappStatus.authenticated ? '#84cc16' : '#f59e0b',
                            boxShadow: whatsappStatus.authenticated ? '0 0 10px #84cc16' : '0 0 10px #f59e0b'
                          }} />
                          {whatsappStatus.authenticated ? 'Docker WhatsApp Active & Connected' : 'Docker WhatsApp Connection Required'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: whatsappStatus.authenticated ? '#15803d' : '#b45309', fontWeight: 600 }}>
                          {whatsappStatus.authenticated 
                            ? 'Your local WAHA Docker container is authorized and responding to messages.'
                            : 'Scan the QR code below or enter an 8-character pairing code to connect your WhatsApp number.'}
                        </Typography>
                      </Box>

                      {whatsappStatus.authenticated && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={handleWhatsappLogout}
                          disabled={loadingWhatsapp}
                          sx={{ 
                            borderRadius: '6px', 
                            fontWeight: 700, 
                            fontSize: '0.75rem',
                            borderColor: '#fca5a5', 
                            color: '#dc2626', 
                            bgcolor: '#ffffff',
                            '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' },
                            textTransform: 'none',
                            px: 2,
                            py: 0.4
                          }}
                        >
                          Disconnect Account
                        </Button>
                      )}
                    </Box>
                  </Card>

                  {/* Docker Connected View */}
                  {whatsappStatus.authenticated ? (
                    <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', p: 2, bgcolor: '#ffffff' }}>
                      <Grid container spacing={1.5} sx={{ maxWidth: 800, mx: 'auto', mb: 2 }}>
                        <Grid item xs={12} sm={4}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', textAlign: 'left', bgcolor: '#f8fafc', borderColor: '#e2e8f0', height: '100%' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>ENGINE PROVIDER</Typography>
                            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                              Docker WAHA (Local QR)
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', textAlign: 'left', bgcolor: '#f8fafc', borderColor: '#e2e8f0', height: '100%' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>LOCAL SERVICE</Typography>
                            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                              localhost:3000
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', textAlign: 'left', bgcolor: systemStatus.waha.running ? '#f0fdf4' : '#fef2f2', borderColor: systemStatus.waha.running ? '#86efac' : '#fecaca', height: '100%' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              CONTAINER STATUS
                              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: systemStatus.waha.running ? '#16a34a' : '#ef4444' }} />
                            </Typography>
                            <Typography sx={{ fontWeight: 800, color: systemStatus.waha.running ? '#166534' : '#991b1b', fontSize: '0.82rem' }}>
                              {systemStatus.waha.running ? 'Running Healthy' : 'Container Stopped'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Throttle Configuration */}
                      <Box sx={{ maxWidth: 800, mx: 'auto', p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', mb: 0.3 }}>
                          Docker Broadcast Throttle Delay
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
                          Pause duration between each outgoing message in bulk campaigns to prevent WhatsApp account rate limits.
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <TextField
                            size="small"
                            type="number"
                            label="Throttle Seconds"
                            value={dockerThrottle}
                            onChange={(e) => setDockerThrottle(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '6px', width: 120, fontSize: '0.8rem' } } }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleSaveDockerThrottle}
                            disabled={savingEngine}
                            sx={{
                              bgcolor: '#84cc16',
                              color: '#0f172a',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              textTransform: 'none',
                              px: 2.5,
                              py: 0.8,
                              '&:hover': { bgcolor: '#65a30d' }
                            }}
                          >
                            Save Delay
                          </Button>
                        </Stack>
                      </Box>
                    </Card>
                  ) : (
                    /* Docker Pairing View (Disconnected) */
                    <Grid container spacing={1.5}>
                      {/* Option 1: QR Code Card */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', height: '100%' }}>
                          <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Box sx={{ 
                              width: 38, 
                              height: 38, 
                              borderRadius: '8px', 
                              bgcolor: 'rgba(132, 204, 22, 0.15)', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              mb: 1
                            }}>
                              <ChatIcon sx={{ fontSize: 20, color: '#4d7c0f' }} />
                            </Box>
                            
                            <Typography sx={{ fontWeight: 800, mb: 0.3, color: '#0f172a', fontSize: '0.88rem' }}>
                              Option 1: Scan QR Code
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280, mb: 1.5, fontSize: '0.72rem' }}>
                              WhatsApp &rarr; Linked Devices &rarr; Link a Device, scan QR code below.
                            </Typography>

                            <Box sx={{ 
                              width: 170, 
                              height: 170, 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              bgcolor: '#ffffff',
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              p: 1, 
                              mb: 1.5
                            }}>
                              {loadingQr ? (
                                <CircularProgress size={28} sx={{ color: '#84cc16' }} />
                              ) : whatsappQr ? (
                                <img src={whatsappQr} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : qrError ? (
                                <Typography variant="caption" color="text.secondary" px={1} sx={{ textAlign: 'center', fontSize: '0.68rem' }}>
                                  {qrError}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary" px={1} sx={{ fontSize: '0.68rem' }}>
                                  Press refresh to load QR code.
                                </Typography>
                              )}
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                                onClick={fetchWhatsappQr}
                                disabled={loadingQr}
                                sx={{ borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'none', px: 1.5, borderColor: '#cbd5e1', color: '#334155' }}
                              >
                                Refresh QR
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                                onClick={handleRestartSession}
                                disabled={restartingSession}
                                sx={{ borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'none', px: 1.5, bgcolor: '#0f172a', color: '#ffffff', '&:hover': { bgcolor: '#1e293b' } }}
                              >
                                {restartingSession ? 'Restarting...' : 'Restart'}
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Option 2: Pairing Code Card */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', height: '100%' }}>
                          <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Box sx={{ 
                              width: 38, 
                              height: 38, 
                              borderRadius: '8px', 
                              bgcolor: '#f0fdf4', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              mb: 1
                            }}>
                              <SendIcon sx={{ fontSize: 18, color: '#16a34a', transform: 'rotate(-45deg)' }} />
                            </Box>
                            
                            <Typography sx={{ fontWeight: 800, mb: 0.3, color: '#0f172a', fontSize: '0.88rem' }}>
                              Option 2: 8-Character Pairing Code
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280, mb: 1.5, fontSize: '0.72rem' }}>
                              Enter phone number (e.g. 919876543210) to receive an 8-character pairing code.
                            </Typography>

                            <Stack spacing={1} sx={{ width: '100%', maxWidth: 260, mb: 1.5 }}>
                              <TextField
                                label="Phone with country code"
                                size="small"
                                placeholder="e.g. 919876543210"
                                value={pairingPhone}
                                onChange={(e) => setPairingPhone(e.target.value)}
                                fullWidth
                                slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                onClick={handleRequestPairingCode}
                                disabled={requestingCode}
                                sx={{ 
                                  borderRadius: '6px', 
                                  fontWeight: 800, 
                                  fontSize: '0.75rem',
                                  py: 0.8, 
                                  textTransform: 'none',
                                  bgcolor: '#84cc16',
                                  color: '#0f172a',
                                  '&:hover': { bgcolor: '#65a30d' }
                                }}
                              >
                                {requestingCode ? 'Requesting Code...' : 'Get Pairing Code'}
                              </Button>
                            </Stack>

                            {pairingCode && (
                              <Paper elevation={0} sx={{ 
                                bgcolor: '#f0fdf4', 
                                p: 1.5, 
                                borderRadius: '8px', 
                                border: '1px solid #86efac', 
                                width: '100%', 
                                maxWidth: 260
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5, color: '#166534', fontSize: '0.68rem' }}>
                                  ENTER ON PHONE
                                </Typography>
                                <Typography sx={{ fontWeight: 900, color: '#14532d', letterSpacing: 3, fontSize: '1.4rem' }}>
                                  {pairingCode}
                                </Typography>
                              </Paper>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </Stack>
              )}

              {/* VIEW 2: META WHATSAPP CLOUD API */}
              {senderMode === 'META' && (
                <Stack spacing={1.5}>
                  <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', maxWidth: 750, mx: 'auto', width: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: 'rgba(132, 204, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CloudIcon sx={{ color: '#4d7c0f', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                            Meta Cloud API Credentials
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            App ID, Phone Number ID, and Permanent Token from Meta Portal
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={1.2}>
                        <Box sx={{ p: 1.2, bgcolor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                              Meta Cloud API Engine State
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Governed centrally by Renic Soft Master HQ (Single source of truth)
                            </Typography>
                          </Box>
                          <Chip
                            label={senderMode === 'META' ? 'ACTIVE & ENABLED' : 'INACTIVE (DOCKER ACTIVE)'}
                            size="small"
                            sx={{
                              bgcolor: senderMode === 'META' ? '#dcfce7' : '#f1f5f9',
                              color: senderMode === 'META' ? '#166534' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              border: '1px solid',
                              borderColor: senderMode === 'META' ? '#86efac' : '#cbd5e1'
                            }}
                          />
                        </Box>

                        <Grid container spacing={1.2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Meta App ID"
                              size="small"
                              fullWidth
                              value={metaConfig.metaAppId || ''}
                              onChange={(e) => handleMetaConfigChange('metaAppId', e.target.value)}
                              slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Phone Number ID"
                              size="small"
                              fullWidth
                              value={metaConfig.metaPhoneNumberId || ''}
                              onChange={(e) => handleMetaConfigChange('metaPhoneNumberId', e.target.value)}
                              disabled={!metaConfig.metaApiEnabled}
                              slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                            />
                          </Grid>
                        </Grid>

                        <TextField
                          label="Meta App Secret"
                          size="small"
                          fullWidth
                          type="password"
                          value={metaConfig.metaAppSecret || ''}
                          onChange={(e) => handleMetaConfigChange('metaAppSecret', e.target.value)}
                          disabled={!metaConfig.metaApiEnabled}
                          slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                        />

                        <TextField
                          label="Permanent Access Token"
                          size="small"
                          fullWidth
                          type="password"
                          value={metaConfig.metaAccessToken || ''}
                          onChange={(e) => handleMetaConfigChange('metaAccessToken', e.target.value)}
                          disabled={!metaConfig.metaApiEnabled}
                          slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                        />

                        <Grid container spacing={1.2}>
                          <Grid item xs={6}>
                            <TextField
                              label="WABA ID"
                              size="small"
                              fullWidth
                              value={metaConfig.metaBusinessAccountId || ''}
                              onChange={(e) => handleMetaConfigChange('metaBusinessAccountId', e.target.value)}
                              disabled={!metaConfig.metaApiEnabled}
                              slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Webhook Verify Token"
                              size="small"
                              fullWidth
                              value={metaConfig.metaWebhookVerifyToken || ''}
                              onChange={(e) => handleMetaConfigChange('metaWebhookVerifyToken', e.target.value)}
                              disabled={!metaConfig.metaApiEnabled}
                              slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '0.8rem' } } }}
                            />
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 1, display: 'flex', gap: 1.5 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                            onClick={handleSaveMetaConfig}
                            disabled={savingConfig || !metaConfig.metaApiEnabled}
                            sx={{ 
                              borderRadius: '6px', 
                              fontWeight: 800, 
                              fontSize: '0.78rem',
                              textTransform: 'none',
                              px: 2.5,
                              py: 0.6,
                              bgcolor: '#84cc16',
                              color: '#0f172a',
                              '&:hover': { bgcolor: '#65a30d' }
                            }}
                          >
                            {savingConfig ? 'Saving...' : 'Save Meta Config'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CloudIcon sx={{ fontSize: 16 }} />}
                            onClick={handleTestMetaConnection}
                            disabled={metaTesting || !metaConfig.metaApiEnabled}
                            sx={{ 
                              borderRadius: '6px', 
                              fontWeight: 700, 
                              fontSize: '0.78rem',
                              textTransform: 'none',
                              px: 2.5,
                              py: 0.6,
                              borderColor: '#84cc16',
                              color: '#0f172a',
                              '&:hover': { borderColor: '#65a30d', bgcolor: 'rgba(132, 204, 22, 0.08)' }
                            }}
                          >
                            {metaTesting ? 'Testing...' : 'Test Connection'}
                          </Button>
                        </Box>

                        {metaTestResult && (
                          <Alert
                            severity={metaTestResult.success ? 'success' : 'error'}
                            sx={{ mt: 1, py: 0.3, borderRadius: '6px', '& .MuiAlert-message': { fontSize: '0.75rem' } }}
                          >
                            {metaTestResult.message}
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Box>
          )}

          {/* Tab 2: API & OAuth 2.0 Credentials */}
          {activeTab === 2 && (
            <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
              <Card sx={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                bgcolor: '#ffffff',
                p: 2.5
              }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(132, 204, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KeyIcon sx={{ color: '#65a30d', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                          Workspace Activation &amp; OAuth 2.0
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          Authenticate this tenant workspace with Renic Soft Master credentials
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={!oauthEnforced ? 'Optional' : (oauthStatus?.verified ? 'Verified & Active' : 'Activation Required')} 
                      size="small" 
                      sx={{ 
                        height: 22,
                        bgcolor: !oauthEnforced ? '#f1f5f9' : (oauthStatus?.verified ? '#dcfce7' : '#fef3c7'), 
                        color: !oauthEnforced ? '#64748b' : (oauthStatus?.verified ? '#166534' : '#92400e'), 
                        fontWeight: 800, 
                        fontSize: '0.7rem',
                        border: !oauthEnforced ? '1px solid #cbd5e1' : (oauthStatus?.verified ? '1px solid #86efac' : '1px solid #fde68a')
                      }} 
                    />
                  </Box>

                  {oauthStatus?.verified ? (
                    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2.5, py: 0.8, borderRadius: '8px', '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                      <strong>Workspace Active &amp; Verified</strong> — All modules (Appointments, Campaigns, Workflows, Templates, Catalog, AI features) are unlocked and operational.
                    </Alert>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 1.8, mb: 2.5, bgcolor: '#f8fafc', borderRadius: 2, borderColor: '#e2e8f0' }}>
                      <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        Paste your <strong>Client ID</strong> and <strong>Client Secret</strong> from Renic Soft Master HQ below, then click <strong>Verify Credentials</strong>. Once verified, all restricted features will unlock immediately.
                      </Typography>
                    </Paper>
                  )}

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                        Client ID
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. renic_apx-wa01_..."
                        value={tenantClientId}
                        onChange={(e) => setTenantClientId(e.target.value)}
                        slotProps={{
                          input: {
                            sx: { fontFamily: 'monospace', fontSize: '0.82rem', bgcolor: '#f8fafc', fontWeight: 600, borderRadius: '6px' }
                          }
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                        Client Secret
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type={showClientSecret ? 'text' : 'password'}
                        placeholder="Enter Client Secret from Renic Soft"
                        value={tenantClientSecret}
                        onChange={(e) => setTenantClientSecret(e.target.value)}
                        slotProps={{
                          input: {
                            sx: { fontFamily: 'monospace', bgcolor: '#f8fafc', borderRadius: '6px', fontSize: '0.82rem' },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowClientSecret(!showClientSecret)} edge="end">
                                  {showClientSecret ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.2, pt: 0.5 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={verifyingOauth || !tenantClientId.trim() || !tenantClientSecret.trim()}
                        onClick={handleVerifyOauth}
                        sx={{
                          bgcolor: '#84cc16',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          textTransform: 'none',
                          px: 3,
                          py: 0.8,
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                          '&:hover': { bgcolor: '#65a30d' }
                        }}
                      >
                        {verifyingOauth ? 'Verifying with HQ...' : 'Verify Credentials'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={savingOauth}
                        onClick={handleSaveOauthCredentials}
                        sx={{
                          borderColor: '#cbd5e1',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          textTransform: 'none',
                          px: 2.5,
                          py: 0.8,
                          borderRadius: '6px',
                          '&:hover': { borderColor: '#94a3b8' }
                        }}
                      >
                        {savingOauth ? 'Saving...' : 'Save Credentials'}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
        anchorOrigin={snackbar.anchorOrigin || { vertical: 'bottom', horizontal: 'right' }}
      />

      {/* Centered Box Format Toast / Dialog for Invalid Credentials */}
      <Dialog
        open={oauthAlertBox.open}
        onClose={() => setOauthAlertBox({ ...oauthAlertBox, open: false })}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            maxWidth: 500,
            width: '92%',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            border: '2px solid #ef4444',
            bgcolor: '#ffffff',
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, pt: 3 }}>
          <Box sx={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            bgcolor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25)',
            border: '2px solid #f87171'
          }}>
            <ShieldIcon sx={{ fontSize: 38 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 850, color: '#991b1b', fontSize: '1.2rem', mt: 0.5 }}>
            {oauthAlertBox.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{
            bgcolor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '14px',
            p: 2.5,
            mb: 2,
            textAlign: 'left'
          }}>
            <Typography variant="body2" sx={{ color: '#7f1d1d', fontWeight: 600, lineHeight: 1.6, fontSize: '0.92rem' }}>
              {oauthAlertBox.message}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>
            🚨 A security event was logged &amp; dispatched to <strong>Renic Soft Master HQ</strong> for platform auditing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button
            variant="contained"
            onClick={() => setOauthAlertBox({ ...oauthAlertBox, open: false })}
            sx={{
              bgcolor: '#dc2626',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: '12px',
              px: 4,
              py: 1.2,
              fontSize: '0.92rem',
              textTransform: 'none',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)',
              '&:hover': { bgcolor: '#b91c1c' }
            }}
          >
            Acknowledge &amp; Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
