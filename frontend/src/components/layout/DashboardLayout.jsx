import { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Box, CssBaseline, Drawer, IconButton, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, Button, Avatar, Tooltip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Grid, Chip, InputBase, Divider, LinearProgress, Stack
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, 
  People as PeopleIcon, Campaign as CampaignIcon,
  Message as MessageIcon, Assessment as AnalyticsIcon,
  Settings as SettingsIcon, ViewQuilt as TemplateIcon,
  SmartToy as BotIcon, AutoAwesome as AutoAwesomeIcon,
  Tune as WorkflowIcon, Chat as ChatIcon, Storefront as CatalogIcon,
  CameraAlt as CameraAltIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, WarningAmber as WarningAmberIcon,
  VerifiedUser as VerifiedUserIcon, Search as SearchIcon,
  Star as StarIcon, Security as SecurityIcon,
  Logout as LogoutIcon, Person as PersonIcon, ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon, DoneAll as DoneAllIcon, CheckCircle as CheckCircleIcon,
  DeleteSweep as DeleteSweepIcon, WhatsApp as WhatsAppIcon,
  Error as ErrorOutlineIcon, AccessTime as AccessTimeIcon,
  History as HistoryIcon, Receipt as QuotationIcon,
  EventAvailable as EventAvailableIcon, MedicalServices as ServiceIcon,
  Badge as StaffIcon, EventNote as CalendarIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import renicLogo from '../../assets/logo.jpeg';
import renicIcon from '../../assets/logo-icon.jpeg';
import WorkspaceTabBar from './WorkspaceTabBar';
import { useTenant } from '../../context/TenantContext';
import { useBackgroundMessaging } from '../../context/BackgroundMessagingContext';
import ScreenLocked from '../ScreenLocked';

const drawerWidth = 256;

const menuGroups = [
  {
    label: 'Workspace',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Conversations', icon: <ChatIcon />, path: '/conversations' },
      { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    ],
  },
  {
    label: 'Appointments',
    items: [
      { text: 'Calendar & Bookings', icon: <EventAvailableIcon />, path: '/appointments' },
      { text: 'Services Catalog', icon: <ServiceIcon />, path: '/appointment-services' },
      { text: 'Staff & Specialists', icon: <StaffIcon />, path: '/appointment-staff' },
      { text: 'Booking Rules & Shifts', icon: <CalendarIcon />, path: '/appointment-settings' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
      { text: 'Campaign History', icon: <HistoryIcon />, path: '/campaign-history' },
      { text: 'Templates', icon: <TemplateIcon />, path: '/templates' },
      { text: 'Catalog', icon: <CatalogIcon />, path: '/catalog' },
      { text: 'Quick Replies', icon: <MessageIcon />, path: '/quick-replies' },
      { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
    ],
  },
  {
    label: 'Automation',
    items: [
      { text: 'Workflows', icon: <WorkflowIcon />, path: '/workflows' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ],
  },
];

const canAccess = (item, role, permissions = {}) => {
  // OTA Screen-Gate from Renic_Soft dynamic PaaS catalog (strict feature governance)
  if (permissions && typeof permissions === 'object' && Object.keys(permissions).length > 0) {
    if (item.path === '/appointments' && permissions.appointments === false && permissions.appointmentBooking === false) return false;
    if (item.path === '/appointment-services' && permissions.appointmentServices === false && permissions.appointmentBooking === false) return false;
    if (item.path === '/appointment-staff' && permissions.appointmentStaff === false && permissions.appointmentBooking === false) return false;
    if (item.path === '/appointment-settings' && permissions.appointmentSettings === false && permissions.appointmentBooking === false) return false;
    if (item.path === '/workflows' && permissions.workflows === false) return false;
    if (item.path === '/response-rules' && permissions.responseRules === false) return false;
    if (item.path === '/ai-features' && (permissions.aiFeatures === false || permissions.aiAgent === false)) return false;
    if (item.path === '/catalog' && permissions.catalog === false) return false;
    if (item.path === '/templates' && permissions.templates === false) return false;
    if (item.path === '/quick-replies' && permissions.quickReplies === false) return false;
    if (item.path === '/campaigns' && (permissions.campaigns === false || permissions.bulkBroadcast === false)) return false;
    if (item.path === '/campaign-history' && (permissions.campaigns === false || permissions.bulkBroadcast === false)) return false;
    if (item.path === '/analytics' && (permissions.analytics === false || permissions.exportReports === false)) return false;
    if (item.path === '/quotations' && permissions.quotations === false) return false;
    if (item.path === '/conversations' && permissions.conversations === false && permissions.liveChat === false) return false;
    if (item.path === '/messages' && permissions.messages === false && permissions.liveChat === false) return false;
    if (item.path === '/settings') return true; // Settings is always accessible for workspace configuration & activation
  }

  return true;
};

// Renic Tech Official Brand Component with Logo Icon
const RenicBrand = ({ collapsed, onClick }) => (
  <Tooltip title="Renic Tech • Go to Home / Dashboard">
    <Box 
      component="a"
      href="/"
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.button === 1) return;
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.2, 
        textDecoration: 'none',
        color: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        p: 0.5,
        borderRadius: '8px',
        transition: 'background-color 0.2s ease',
        '&:hover': onClick ? { bgcolor: 'rgba(255,255,255,0.06)' } : {}
      }}
    >
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        p: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        flexShrink: 0,
        width: collapsed ? 34 : 36,
        height: collapsed ? 34 : 36,
        transition: 'all 0.2s ease'
      }}
    >
      <Box
        component="img"
        src={renicIcon}
        alt="Renic Tech Logo Icon"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </Box>
    {!collapsed && (
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ 
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800, 
            fontSize: '1.05rem', 
            letterSpacing: '0.4px',
            color: '#ffffff',
            lineHeight: 1
          }}>
            RENIC
          </Typography>
          <Typography sx={{ 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            bgcolor: '#84cc16', 
            px: 0.6,
            py: 0.15,
            borderRadius: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            TECH
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, mt: 0.35, letterSpacing: '0.4px' }}>
          Automation & CRM
        </Typography>
      </Box>
    )}
  </Box>
  </Tooltip>
);

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentDrawerWidth = sidebarCollapsed ? 68 : 256;

  // Background messaging & notifications context
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    activeJobs,
    runningJobs,
    restoreJob
  } = useBackgroundMessaging();
  
  // Profile state hooks
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    password: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [openRenewDialog, setOpenRenewDialog] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState({
    cycle: '3_MONTHS',
    days: 90,
    amount: 6999,
    label: '3 Months',
    badge: '5% OFF (Popular)'
  });

  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const {
    screenPermissions: tenantScreenPermissions,
    clientName,
    isLicenseLocked,
    isOauthLocked,
    licenseActive,
    licenseRequired
  } = useTenant();

  // Fetch license status once on mount for expiry warnings
  useEffect(() => {
    let cancelled = false;
    const fetchLicenseStatus = async () => {
      try {
        const response = await apiClient.get('/v1/license/current');
        if (!cancelled && response.data) {
          setLicenseStatus(response.data);
          return;
        }
      } catch (err) {
        // Fallback to legacy auth status endpoint
      }

      try {
        const response = await apiClient.get('/auth/license/status');
        if (!cancelled && response.data?.success) {
          setLicenseStatus(response.data.license);
        }
      } catch (err) {
        if (!cancelled) setLicenseStatus(null);
      }
    };
    fetchLicenseStatus();
    const interval = setInterval(fetchLicenseStatus, 6 * 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // WhatsApp connection health polling
  const [waHealth, setWaHealth] = useState({ status: 'CHECKING', label: 'Checking...' });

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/ai-chat/whatsapp/status');
        if (!active) return;
        const st = res.data?.status;
        if (st === 'WORKING' || st === 'CONNECTED' || res.data?.authenticated) {
          setWaHealth({ status: 'CONNECTED', label: 'WhatsApp Live' });
        } else if (st === 'SCAN_QR_CODE' || st === 'STARTING') {
          setWaHealth({ status: 'QR_READY', label: 'QR Ready' });
        } else {
          setWaHealth({ status: 'DISCONNECTED', label: 'Disconnected' });
        }
      } catch {
        if (active) setWaHealth({ status: 'DISCONNECTED', label: 'Disconnected' });
      }
    };

    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleRenewPlan = async () => {
    try {
      setRenewalLoading(true);
      const res = await apiClient.post('/v1/license/renew-in-app', {
        durationCycle: selectedDuration.cycle,
        daysToAdd: selectedDuration.days,
        amountPaid: selectedDuration.amount,
        paymentMethod: 'UPI'
      });
      setSnackbar({
        open: true,
        message: `🎉 Success! Subscription extended (+${selectedDuration.days} days). GST Invoice: ${res.data.invoiceNumber}`,
        severity: 'success'
      });
      setOpenRenewDialog(false);
      // Refresh license status
      const updated = await apiClient.get('/v1/license/current');
      if (updated.data) setLicenseStatus(updated.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to renew subscription',
        severity: 'error'
      });
    } finally {
      setRenewalLoading(false);
    }
  };

  const licenseNeedsWarning = licenseStatus &&
    (licenseStatus.isExpired || licenseStatus.isGracePeriod || licenseStatus.status === 'expiring' || licenseStatus.status === 'expired') &&
    user?.role !== 'PLATFORM_OWNER' && user?.role !== 'ADMIN';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    handleCloseUserMenu();
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      companyName: user?.companyName || '',
      password: ''
    });
    setOpenProfileDialog(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await apiClient.put('/auth/me', profileData);
      if (response.data?.success) {
        updateUser(response.data.user);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
        setOpenProfileDialog(false);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to update profile. Please try again.',
        severity: 'error'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      <Toolbar sx={{ 
        px: sidebarCollapsed ? 1 : 2, 
        py: 1, 
        display: 'flex', 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
        alignItems: 'center',
        bgcolor: '#0f172a',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <RenicBrand collapsed={sidebarCollapsed} onClick={() => navigate('/')} />
        <IconButton 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
          size="small" 
          sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: '#94a3b8', '&:hover': { color: '#ffffff' } }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      
      {/* Super Admin / Platform Owner Status Bar */}
      {!sidebarCollapsed && (
        <Box sx={{ 
          px: 2, 
          py: 1, 
          bgcolor: 'rgba(132, 204, 22, 0.08)', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <StarIcon sx={{ color: '#84cc16', fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#4d7c0f', fontSize: '0.72rem', letterSpacing: '0.4px' }}>
            {(user?.role === 'PLATFORM_OWNER' || user?.role === 'ADMIN') ? 'RENIC FULL ACCESS ADMIN' : 'USER'}
          </Typography>
        </Box>
      )}

      <Box sx={{ overflowX: 'hidden', overflowY: 'auto', mt: 1, flexGrow: 1 }}>
        {menuGroups.map((group) => {
          const permissions = tenantScreenPermissions || licenseStatus?.featurePermissions || licenseStatus?.screenPermissions || user?.screenPermissions || {};
          const visibleItems = group.items.filter((item) => canAccess(item, user?.role, permissions));
          if (visibleItems.length === 0) return null;
          return (
            <Box key={group.label} sx={{ mb: sidebarCollapsed ? 1.5 : 1 }}>
              {!sidebarCollapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 1,
                    display: 'block',
                    mb: 0.5,
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                  }}
                >
                  {group.label}
                </Typography>
              )}
              <List sx={{ px: 0, py: 0 }}>
                {visibleItems.map((item) => {
                  const isItemLocked = isOauthLocked && item.path !== '/settings';
                  const isActive = item.path === '/' 
                    ? location.pathname === '/' 
                    : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
                  const buttonContent = (
                    <ListItemButton
                      component="a"
                      href={item.path}
                      selected={isActive}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey || e.button === 1) {
                          return;
                        }
                        e.preventDefault();
                        navigate(item.path);
                        if (mobileOpen) setMobileOpen(false);
                      }}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        borderRadius: '0 6px 6px 0',
                        mr: sidebarCollapsed ? 0 : 1,
                        mb: 0.3,
                        px: sidebarCollapsed ? 1.5 : 2,
                        py: 1,
                        justifyContent: sidebarCollapsed ? 'center' : 'initial',
                        minHeight: 42,
                        opacity: isItemLocked ? 0.65 : 1,
                        borderLeft: isActive ? '4px solid #84cc16' : '4px solid transparent',
                        bgcolor: isActive ? 'rgba(132, 204, 22, 0.12)' : 'transparent',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(132, 204, 22, 0.2)' : 'rgba(132, 204, 22, 0.08)',
                          transform: sidebarCollapsed ? 'none' : 'translateX(3px)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: sidebarCollapsed ? 0 : 34,
                        mr: sidebarCollapsed ? 0 : 'auto',
                        justifyContent: 'center',
                        color: isItemLocked ? '#94a3b8' : (isActive ? '#65a30d' : '#64748b'),
                        transition: 'color 0.18s ease'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {!sidebarCollapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                          <ListItemText
                            primary={item.text}
                            slotProps={{
                              primary: {
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isItemLocked ? '#64748b' : (isActive ? '#3f6212' : '#334155'),
                                transition: 'color 0.18s ease',
                                noWrap: true
                              }
                            }}
                          />
                          {isItemLocked && (
                            <LockIcon sx={{ fontSize: 14, color: '#f59e0b', ml: 0.5, flexShrink: 0 }} />
                          )}
                        </Box>
                      )}
                    </ListItemButton>
                  );

                  const tooltipTitle = isItemLocked 
                    ? `${item.text} (Requires OAuth 2.0 Activation in Settings)`
                    : item.text;

                  return (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                      {sidebarCollapsed || isItemLocked ? (
                        <Tooltip title={tooltipTitle} placement="right" arrow>
                          {buttonContent}
                        </Tooltip>
                      ) : (
                        buttonContent
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Active Subscription & In-App Renewal Card */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 1.5, m: 1.5, borderRadius: '10px', bgcolor: 'rgba(15, 23, 42, 0.04)', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
              {licenseStatus?.planTier || 'PRO'} PLAN
            </Typography>
            <Chip
              label={licenseStatus?.daysLeft !== undefined ? `${licenseStatus.daysLeft}d left` : 'Active'}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: (licenseStatus?.daysLeft <= 7) ? '#fef3c7' : '#dcfce7',
                color: (licenseStatus?.daysLeft <= 7) ? '#92400e' : '#166534'
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', display: 'block', mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            https://{licenseStatus?.subdomain || 'app'}.renic.store
          </Typography>
          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={() => setOpenRenewDialog(true)}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.72rem',
              py: 0.6,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#65a30d' }
            }}
          >
            Renew / Upgrade ⚡
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', width: '100%', backgroundColor: '#f8fafc' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          bgcolor: '#0f172a',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,.2)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', px: { xs: 1.5, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' }, color: '#ffffff' }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Quick Back Navigation Button */}
          <Tooltip title="Go Back to Previous Page">
            <IconButton
              size="small"
              onClick={() => {
                if (window.history.length > 1 && location.pathname !== '/') {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              sx={{
                color: '#cbd5e1',
                mr: 1,
                p: 0.6,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)', color: '#ffffff' }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Official Renic Company Logo & Brand (Click to Go Home) */}
          <Tooltip title="Renic Tech • Go to Home / Dashboard">
            <Box
              component="a"
              href="/"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                navigate('/');
              }}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                mr: 1.5,
                px: 1,
                py: 0.5,
                borderRadius: '8px',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)', borderColor: '#84cc16' }
              }}
            >
              <Box
                component="img"
                src={renicIcon}
                alt="Renic Tech Logo"
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#ffffff',
                  p: 0.25,
                  borderRadius: '5px',
                  objectFit: 'contain',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
                }}
              />
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', letterSpacing: '0.4px', lineHeight: 1 }}>
                  {clientName ? clientName.toUpperCase() : (licenseStatus?.companyName ? licenseStatus.companyName.toUpperCase() : 'RENIC')}
                </Typography>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#0f172a', bgcolor: '#84cc16', px: 0.5, py: 0.1, borderRadius: '3px', lineHeight: 1 }}>
                  {licenseStatus?.planTier ? licenseStatus.planTier.toUpperCase() : 'APP'}
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>
              {menuGroups.flatMap((g) => g.items).find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          {/* Global Search Bar in Header */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            bgcolor: 'rgba(255, 255, 255, 0.08)', 
            borderRadius: '6px', 
            border: '1px solid rgba(255, 255, 255, 0.12)',
            px: 1.5, 
            py: 0.5, 
            mx: 3, 
            flexGrow: 1, 
            maxWidth: 460,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <InputBase 
              placeholder="Search conversations, customers, campaigns, catalog..." 
              fullWidth 
              sx={{ fontSize: '0.85rem', color: '#ffffff', '& input::placeholder': { color: '#94a3b8', opacity: 1 } }}
            />
            <SearchIcon sx={{ color: '#84cc16', fontSize: 20, cursor: 'pointer' }} />
          </Box>

          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          {/* WhatsApp Health Status Pill */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 1.5 }}>
            {/* Tenant Badge */}
            {licenseStatus?.customerCode && (
              <Chip
                label={`🏢 ${licenseStatus.companyName || licenseStatus.customerCode}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  display: { xs: 'none', md: 'inline-flex' }
                }}
              />
            )}
            {/* WA Connection Pill */}
            <Chip
              label={
                waHealth.status === 'CONNECTED' ? `🟢 ${waHealth.label}` :
                waHealth.status === 'QR_READY' ? `🟡 ${waHealth.label}` :
                waHealth.status === 'CHECKING' ? `⚪ ${waHealth.label}` :
                `🔴 ${waHealth.label}`
              }
              size="small"
              onClick={() => navigate('/settings')}
              sx={{
                cursor: 'pointer',
                bgcolor: waHealth.status === 'CONNECTED'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : waHealth.status === 'QR_READY'
                  ? 'rgba(234, 179, 8, 0.2)'
                  : waHealth.status === 'CHECKING'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(239, 68, 68, 0.2)',
                color: waHealth.status === 'CONNECTED'
                  ? '#34d399'
                  : waHealth.status === 'QR_READY'
                  ? '#fbbf24'
                  : waHealth.status === 'CHECKING'
                  ? '#94a3b8'
                  : '#f87171',
                border: waHealth.status === 'CONNECTED'
                  ? '1px solid rgba(16,185,129,0.4)'
                  : waHealth.status === 'QR_READY'
                  ? '1px solid rgba(234,179,8,0.4)'
                  : waHealth.status === 'CHECKING'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(239,68,68,0.4)',
                fontWeight: 700,
                fontSize: '0.72rem'
              }}
            />
          </Box>

          {/* Plus / Super Admin Badge */}
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {(user?.role === 'PLATFORM_OWNER' || user?.role === 'ADMIN') && (
              <Tooltip title={`Logged in as ${user?.role === 'PLATFORM_OWNER' ? 'Platform Admin' : 'Admin'} with full platform access`}>
                <Chip
                  icon={<StarIcon sx={{ color: '#84cc16 !important', fontSize: 16 }} />}
                  label={`✦ ${user?.role === 'PLATFORM_OWNER' ? 'Platform Admin' : 'Admin'} Full Access`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(132, 204, 22, 0.15)',
                    color: '#84cc16',
                    border: '1px solid rgba(132, 204, 22, 0.35)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.2px',
                    display: { xs: 'none', sm: 'inline-flex' }
                  }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Message Center & Background Notifications Icon */}
          <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Message Center & Background Deliveries">
              <IconButton
                onClick={(e) => {
                  setAnchorElNotif(e.currentTarget);
                  if (unreadCount > 0 && typeof markAllAsRead === 'function') {
                    markAllAsRead();
                  }
                }}
                sx={{
                  color: '#94a3b8',
                  bgcolor: runningJobs?.length > 0 ? 'rgba(132, 204, 22, 0.15)' : 'rgba(255,255,255,0.05)',
                  border: runningJobs?.length > 0 ? '1px solid #84cc16' : '1px solid rgba(255,255,255,0.1)',
                  p: 0.8,
                  position: 'relative',
                  '&:hover': {
                    bgcolor: 'rgba(132, 204, 22, 0.2)',
                    color: '#84cc16'
                  }
                }}
              >
                <MessageIcon sx={{ fontSize: 20, color: runningJobs?.length > 0 ? '#84cc16' : 'inherit' }} />
              </IconButton>
            </Tooltip>

            {/* Message Center Popover Menu */}
            <Menu
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={() => setAnchorElNotif(null)}
              slotProps={{
                paper: {
                  sx: {
                    width: { xs: 320, sm: 380 },
                    maxHeight: 540,
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    bgcolor: '#0f172a',
                    color: '#ffffff',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                    p: 0,
                    overflow: 'hidden'
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* Menu Header */}
              <Box sx={{
                p: 2,
                bgcolor: '#1e293b',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                    Message Center
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  {unreadCount > 0 && (
                    <Tooltip title="Mark all read">
                      <IconButton size="small" onClick={markAllAsRead} sx={{ color: '#94a3b8', '&:hover': { color: '#84cc16' } }}>
                        <DoneAllIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {notifications?.length > 0 && (
                    <Tooltip title="Clear history">
                      <IconButton size="small" onClick={clearNotifications} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                        <DeleteSweepIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>

              {/* Active Background Dispatching Jobs */}
              {activeJobs?.filter(j => j.status === 'RUNNING').length > 0 && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(132, 204, 22, 0.08)', borderBottom: '1px solid rgba(132, 204, 22, 0.2)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#84cc16', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                    ⚡ Active Background Sending
                  </Typography>
                  <Stack spacing={1}>
                    {activeJobs.filter(j => j.status === 'RUNNING').map(job => (
                      <Box key={job.id} sx={{ p: 1, bgcolor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#ffffff' }}>
                            {job.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#84cc16', fontWeight: 800 }}>
                            {job.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{
                            height: 5,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#84cc16' },
                            mb: 0.5
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {job.detail}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Delivery History List */}
              <Box sx={{ maxHeight: 320, overflowY: 'auto', p: 1 }}>
                {(!notifications || notifications.length === 0) ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>
                    <MessageIcon sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>No recent message activity</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Messages dispatched or background sends will appear here
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {notifications.map((notif) => {
                      const isDelivered = notif.status === 'DELIVERED' || notif.status === 'SENT';
                      const isReceived = notif.status === 'RECEIVED';
                      const isFailed = notif.status === 'FAILED';
                      return (
                        <Box
                          key={notif.id}
                          sx={{
                            p: 1.2,
                            borderRadius: '8px',
                            bgcolor: notif.read ? '#1e293b' : 'rgba(132, 204, 22, 0.06)',
                            border: notif.read ? '1px solid #334155' : '1px solid rgba(132, 204, 22, 0.3)',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#334155' }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <WhatsAppIcon sx={{ fontSize: 16, color: isReceived ? '#38bdf8' : '#25D366' }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff' }}>
                                {notif.recipient || 'Customer'}
                              </Typography>
                              {notif.phone && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                  ({notif.phone})
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={notif.status}
                              size="small"
                              icon={isDelivered ? <CheckCircleIcon sx={{ fontSize: '12px !important', color: '#22c55e !important' }} /> : isReceived ? <DoneAllIcon sx={{ fontSize: '12px !important', color: '#38bdf8 !important' }} /> : isFailed ? <ErrorOutlineIcon sx={{ fontSize: '12px !important', color: '#ef4444 !important' }} /> : undefined}
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: isDelivered ? 'rgba(34, 197, 94, 0.15)' : isReceived ? 'rgba(56, 189, 248, 0.15)' : isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                color: isDelivered ? '#4ade80' : isReceived ? '#38bdf8' : isFailed ? '#f87171' : '#94a3b8',
                                border: '1px solid ' + (isDelivered ? 'rgba(34, 197, 94, 0.3)' : isReceived ? 'rgba(56, 189, 248, 0.3)' : isFailed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.3)')
                              }}
                            />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.75rem', mb: 0.5, lineHeight: 1.3 }}>
                            {notif.title ? <strong>{notif.title}: </strong> : null}
                            {notif.message}
                          </Typography>

                          {notif.error && (
                            <Typography variant="caption" sx={{ color: '#f87171', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                              Error: {notif.error}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 12, color: '#64748b' }} />
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                              {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {/* Menu Bottom Actions */}
              <Box sx={{ p: 1.2, bgcolor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => { setAnchorElNotif(null); navigate('/conversations'); }}
                  sx={{
                    color: '#84cc16',
                    borderColor: 'rgba(132, 204, 22, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.4,
                    '&:hover': { bgcolor: 'rgba(132, 204, 22, 0.1)', borderColor: '#84cc16' }
                  }}
                >
                  Live Conversations
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  onClick={() => { setAnchorElNotif(null); navigate('/campaigns'); }}
                  sx={{
                    bgcolor: '#84cc16',
                    color: '#0f172a',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 0.4,
                    '&:hover': { bgcolor: '#65a30d' }
                  }}
                >
                  Broadcasts
                </Button>
              </Box>
            </Menu>
          </Box>

          {/* User Account Menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Account Settings & Profile">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5, border: '2px solid rgba(132, 204, 22, 0.5)' }}>
                <Avatar sx={{ bgcolor: '#84cc16', color: '#0f172a', width: 32, height: 32, fontWeight: 800, fontSize: '0.875rem' }}>
                  {user?.firstName?.[0] || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              slotProps={{
                paper: {
                  sx: {
                    width: 220,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    p: 0.5
                  }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#65a30d', fontWeight: 700, display: 'block' }}>
                  {(user?.role === 'PLATFORM_OWNER' || user?.role === 'ADMIN') ? '✦ Full Access Admin' : user?.role}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.7rem' }}>
                  Phone: {user?.phone}
                </Typography>
              </Box>
              <MenuItem onClick={handleOpenProfile} sx={{ py: 1, gap: 1 }}>
                <PersonIcon fontSize="small" sx={{ color: '#65a30d' }} />
                <Typography variant="body2">My Profile</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }} sx={{ py: 1, gap: 1 }}>
                <SecurityIcon fontSize="small" sx={{ color: '#65a30d' }} />
                <Typography variant="body2">Platform Settings</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1, gap: 1 }}>
                <LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} />
                <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.2s ease'
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 256 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth, 
              overflowX: 'hidden',
              transition: 'width 0.2s ease' 
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f1f3f6'
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', flexShrink: 0 }} />
        <WorkspaceTabBar />
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 1, sm: 1.25, md: 1.5 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#94a3b8'
            }
          }}
        >
          {licenseNeedsWarning && (
            <Alert
              severity={licenseStatus.status === 'expired' ? 'error' : 'warning'}
              sx={{ mb: 1.5, py: 0.5, borderRadius: 1, '& .MuiAlert-message': { fontWeight: 600, fontSize: '0.8rem' } }}
            >
              {licenseStatus.status === 'expired' ? (
                <>Your license expired on <b>{new Date(licenseStatus.expiresAt).toLocaleDateString()}</b>. Please contact administrator to renew.</>
              ) : (
                <>Your license expires in <b>{licenseStatus.daysRemaining} day{licenseStatus.daysRemaining === 1 ? '' : 's'}</b>.</>
              )}
            </Alert>
          )}
          <Box
            key={location.pathname}
            className="smooth-page-transition"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minHeight: 0,
              height: '100%',
              animation: 'pageFadeSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
          {(() => {
            const allNavItems = menuGroups.flatMap((g) => g.items);
            const currentItem = allNavItems.find(item => {
              if (item.path === '/') return location.pathname === '/';
              return location.pathname.startsWith(item.path);
            });
            const effectivePermissions = tenantScreenPermissions || licenseStatus?.screenPermissions || licenseStatus?.featurePermissions || {};
            const isCurrentScreenAllowed = currentItem ? canAccess(currentItem, user?.role, effectivePermissions) : true;

            if (isLicenseLocked && location.pathname !== '/settings') {
              return <ScreenLocked isLicenseLock={true} />;
            }
            if (isOauthLocked && location.pathname !== '/settings') {
              return <ScreenLocked isOauthLock={true} />;
            }
            if (!isCurrentScreenAllowed && location.pathname !== '/settings') {
              return <ScreenLocked isForbiddenScreen={true} screenName={currentItem?.text || location.pathname} />;
            }
            return (
              <Suspense
                fallback={
                  <Box sx={{ width: '100%', py: 1 }}>
                    <LinearProgress sx={{ height: 3, borderRadius: 1, bgcolor: 'rgba(37,99,235,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' } }} />
                  </Box>
                }
              >
                <Outlet />
              </Suspense>
            );
          })()}
          </Box>
        </Box>
      </Box>

      {/* Profile Dialog */}
      <Dialog 
        open={openProfileDialog} 
        onClose={() => !profileLoading && setOpenProfileDialog(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { 
              borderRadius: '4px', 
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
            }
          }
        }}
      >
        {/* Obsidian Slate Header Banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#84cc16', color: '#0f172a', width: 52, height: 52, fontSize: '1.3rem', fontWeight: 800 }}>
              {(user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || '')}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                Renic Profile
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.82rem', mt: 0.5 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Chip label="Full Access Admin" size="small" sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800 }} />
        </Box>

        <form onSubmit={handleSaveProfile}>
          <DialogContent sx={{ p: 3, pt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#878787', letterSpacing: '0.8px', display: 'block', mb: 2 }}>
              PERSONAL INFORMATION
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First name"
                  fullWidth
                  required
                  size="small"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last name"
                  fullWidth
                  required
                  size="small"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email address"
                  type="email"
                  fullWidth
                  size="small"
                  value={profileData.email}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phone number"
                  fullWidth
                  required
                  size="small"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Company"
                  fullWidth
                  required
                  size="small"
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Account Role"
                  fullWidth
                  disabled
                  size="small"
                  value={user?.role || 'PLATFORM_OWNER'}
                  helperText="Full Access Super Admin"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => setOpenProfileDialog(false)} 
              disabled={profileLoading}
              variant="outlined"
              sx={{ color: '#64748b', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8' } }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={profileLoading}
              sx={{ 
                bgcolor: '#84cc16', 
                color: '#0f172a', 
                fontWeight: 800, 
                boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                '&:hover': { bgcolor: '#65a30d' } 
              }}
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ============ In-App Subscription Renewal Dialog ============ */}
      <Dialog
        open={openRenewDialog}
        onClose={() => setOpenRenewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Renew Subscription · Renic Technology
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Choose your subscription duration. Your remaining days will be <strong>smoothly stacked</strong> so you never lose paid time!
          </Typography>

          <Grid container spacing={1.5}>
            {[
              { cycle: '1_MONTH', days: 30, amount: 2499, label: '1 Month', badge: 'Standard' },
              { cycle: '3_MONTHS', days: 90, amount: 6999, label: '3 Months', badge: '5% OFF (Popular)' },
              { cycle: '6_MONTHS', days: 180, amount: 12999, label: '6 Months', badge: '10% OFF' },
              { cycle: '1_YEAR', days: 365, amount: 23999, label: '1 Year', badge: '20% OFF (2 Mos Free)' }
            ].map((plan) => {
              const isSelected = selectedDuration.cycle === plan.cycle;
              return (
                <Grid item xs={6} key={plan.cycle}>
                  <Box
                    onClick={() => setSelectedDuration(plan)}
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #84cc16' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? 'rgba(132, 204, 22, 0.08)' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                        {plan.label}
                      </Typography>
                      <Chip label={plan.badge} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>
                      ₹{plan.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Adds +{plan.days} days validity
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ mt: 2.5, p: 2, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
              🔒 <strong>Instant Automated Sync</strong>: Upon completing payment, your renewal webhook is verified by Renic HQ, an official GST Tax Invoice is generated automatically, and your software instance is updated immediately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenRenewDialog(false)} disabled={renewalLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenewPlan}
            disabled={renewalLoading}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              px: 3,
              '&:hover': { bgcolor: '#65a30d' }
            }}
          >
            {renewalLoading ? 'Processing Renewal...' : `Pay ₹${selectedDuration.amount.toLocaleString()} & Stack Days`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%', borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
