import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Box, CssBaseline, Drawer, IconButton, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, Button, Avatar, Tooltip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Grid, Chip
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
  Verified as VerifiedIcon, VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import logo from '../../assets/logo.jpeg';

const drawerWidth = 256; // Google standard drawer width

const menuGroups = [
  {
    label: 'Workspace',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Unified Inbox', icon: <ChatIcon />, path: '/conversations' },
      { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
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
      { text: 'AI Response Rules', icon: <BotIcon />, path: '/response-rules' },
      { text: 'AI Features', icon: <AutoAwesomeIcon />, path: '/ai-features' },
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

const canAccess = (item, role) => {
  if (role === 'PLATFORM_OWNER' || role === 'ADMIN') return true;
  
  const restricted =
    (item.path === '/workflows' || item.path === '/response-rules' || item.path === '/ai-features' || item.path === '/settings');
  return !restricted;
};

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentDrawerWidth = sidebarCollapsed ? 64 : 256;
  
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

  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Fetch license status once on mount for expiry warnings
  useEffect(() => {
    let cancelled = false;
    const fetchLicenseStatus = async () => {
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
    const interval = setInterval(fetchLicenseStatus, 6 * 60 * 60 * 1000); // refresh every 6h
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const licenseNeedsWarning = licenseStatus &&
    (licenseStatus.status === 'expiring' || licenseStatus.status === 'expired');

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: sidebarCollapsed ? 1 : 2, py: 1, display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
        {!sidebarCollapsed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#ffffff', 
              p: 0.5, 
              borderRadius: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <img src={logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px', fontSize: '1rem' }}>
              Renic AI CRM
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            bgcolor: '#ffffff', 
            p: 0.5, 
            borderRadius: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <img src={logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} />
          </Box>
        )}
        <IconButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Box sx={{ overflowX: 'hidden', overflowY: 'auto', mt: 1, flexGrow: 1 }}>
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item, user?.role));
          if (visibleItems.length === 0) return null;
          return (
            <Box key={group.label} sx={{ mb: sidebarCollapsed ? 2 : 1.5 }}>
              {!sidebarCollapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    display: 'block',
                    mb: 0.5,
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                  }}
                >
                  {group.label}
                </Typography>
              )}
              <List sx={{ px: sidebarCollapsed ? 1 : 1.5, py: 0 }}>
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const buttonContent = (
                    <ListItemButton
                      selected={isActive}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: '8px',
                        mb: 0.25,
                        px: sidebarCollapsed ? 1.5 : 2,
                        justifyContent: sidebarCollapsed ? 'center' : 'initial',
                        minHeight: 40,
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: sidebarCollapsed ? 0 : 36,
                        mr: sidebarCollapsed ? 0 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? 'primary.main' : 'text.secondary'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {!sidebarCollapsed && (
                        <ListItemText
                          primary={item.text}
                          slotProps={{
                            primary: {
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? 'primary.main' : 'text.primary'
                            }
                          }}
                        />
                      )}
                    </ListItemButton>
                  );

                  return (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                      {sidebarCollapsed ? (
                        <Tooltip title={item.text} placement="right" arrow>
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
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), margin 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              bgcolor: '#ffffff', 
              p: 0.3, 
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <img src={logo} alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '3px' }} />
            </Box>
            {menuGroups.flatMap((g) => g.items).find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {licenseStatus && (
            <Box sx={{ mr: 2 }}>
              {licenseStatus.status === 'expiring' && (
                <Tooltip title={`License expires on ${new Date(licenseStatus.expiresAt).toLocaleDateString()}. Please renew soon.`}>
                  <Chip
                    icon={<WarningAmberIcon sx={{ color: '#b45309 !important', fontSize: 18 }} />}
                    label={`License expires in ${licenseStatus.daysRemaining} day${licenseStatus.daysRemaining === 1 ? '' : 's'}`}
                    size="small"
                    sx={{
                      bgcolor: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  />
                </Tooltip>
              )}
              {licenseStatus.status === 'expired' && (
                <Tooltip title="Your license has expired. Please contact Renic Technology.">
                  <Chip
                    icon={<WarningAmberIcon sx={{ color: '#b91c1c !important', fontSize: 18 }} />}
                    label="License Expired"
                    size="small"
                    sx={{
                      bgcolor: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  />
                </Tooltip>
              )}
              {licenseStatus.status === 'active' && (
                <Tooltip title={`License valid until ${new Date(licenseStatus.expiresAt).toLocaleDateString()}`}>
                  <Chip
                    icon={<VerifiedUserIcon sx={{ color: '#15803d !important', fontSize: 18 }} />}
                    label="License Active"
                    size="small"
                    sx={{
                      bgcolor: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  {user?.firstName?.[0] || 'U'}
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
            >
              <MenuItem onClick={handleOpenProfile}>
                <Typography sx={{ textAlign: 'center' }}>Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography sx={{ textAlign: 'center', color: 'error.main' }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
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
              transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' 
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1.5, sm: 2.5 }, 
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        {licenseNeedsWarning && (
          <Alert
            severity={licenseStatus.status === 'expired' ? 'error' : 'warning'}
            sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600, fontSize: '0.875rem' } }}
          >
            {licenseStatus.status === 'expired' ? (
              <>Your license expired on <b>{new Date(licenseStatus.expiresAt).toLocaleDateString()}</b>. Please contact Renic Technology to renew your license immediately.</>
            ) : (
              <>Your license expires in <b>{licenseStatus.daysRemaining} day{licenseStatus.daysRemaining === 1 ? '' : 's'}</b> (on <b>{new Date(licenseStatus.expiresAt).toLocaleDateString()}</b>). Please renew it soon to avoid interruption of service.</>
            )}
          </Alert>
        )}
        <Box
          key={location.pathname}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minHeight: 0,
            height: '100%',
            '@keyframes fadeInSlideUp': {
              from: {
                opacity: 0,
                transform: 'translateY(4px)'
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            animation: 'fadeInSlideUp 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Edit Profile Dialog - Customized Profile Header Style */}
      <Dialog 
        open={openProfileDialog} 
        onClose={() => !profileLoading && setOpenProfileDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* Blue Header Banner */}
        <Box sx={{
          background: 'linear-gradient(90deg, #1e88e5 0%, #1565c0 100%)',
          color: '#ffffff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#ffffff', color: '#1565c0', width: 56, height: 56, fontSize: '1.5rem', fontWeight: 700 }}>
              {(user?.firstName?.[0] || 'U') + (user?.lastName?.[0] || '')}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Renic Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', mt: 0.5 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <IconButton sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <CameraAltIcon fontSize="small" />
          </IconButton>
        </Box>

        <form onSubmit={handleSaveProfile}>
          <DialogContent sx={{ p: 3, pt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', letterSpacing: '0.8px', display: 'block', mb: 2 }}>
              PERSONAL INFORMATION
            </Typography>
            
            <Grid container spacing={2.5}>
              <Grid item xs={6}>
                <TextField
                  label="First name"
                  fullWidth
                  required
                  size="small"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  InputProps={{ sx: { borderRadius: 2 } }}
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
                  InputProps={{ sx: { borderRadius: 2 } }}
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
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8, color: '#5f6368' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    ⓘ Managed by your organization — cannot be changed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phone number"
                  fullWidth
                  required
                  size="small"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  InputProps={{ sx: { borderRadius: 2 } }}
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
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Account Role"
                  fullWidth
                  disabled
                  size="small"
                  value={user?.role || 'USER'}
                  InputProps={{ sx: { borderRadius: 2 } }}
                  helperText="Your profile role permissions level"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => setOpenProfileDialog(false)} 
              disabled={profileLoading}
              variant="outlined"
              sx={{ 
                borderColor: '#dadce0',
                color: '#202124',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 0.8,
                '&:hover': {
                  borderColor: '#dadce0',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="outlined" 
              disabled={profileLoading}
              sx={{ 
                borderColor: '#dadce0',
                color: '#202124',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  borderColor: '#dadce0',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              {profileLoading ? 'Saving...' : '✓ Save changes'}
            </Button>
          </DialogActions>
        </form>
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
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
