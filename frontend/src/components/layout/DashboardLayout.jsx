import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Box, CssBaseline, Drawer, IconButton, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, Button, Avatar, Tooltip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Grid
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, 
  People as PeopleIcon, Campaign as CampaignIcon,
  Message as MessageIcon, Assessment as AnalyticsIcon,
  Settings as SettingsIcon, ViewQuilt as TemplateIcon,
  SmartToy as BotIcon, AutoAwesome as AutoAwesomeIcon,
  Tune as WorkflowIcon, Chat as ChatIcon, Storefront as CatalogIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';

const drawerWidth = 256; // Google standard drawer width

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Unified Inbox', icon: <ChatIcon />, path: '/conversations' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  { text: 'Templates', icon: <TemplateIcon />, path: '/templates' },
  { text: 'Catalog', icon: <CatalogIcon />, path: '/catalog' },
  { text: 'Quick Replies', icon: <MessageIcon />, path: '/quick-replies' },
  { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
  { text: 'Workflows', icon: <WorkflowIcon />, path: '/workflows' },
  { text: 'AI Response Rules', icon: <BotIcon />, path: '/response-rules' },
  { text: 'AI Features', icon: <AutoAwesomeIcon />, path: '/ai-features' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  
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

  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

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
      <Toolbar sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BotIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Renic AI CRM
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 1, flexGrow: 1 }}>
        <List>
          {menuItems
            .filter((item) => item.path !== '/ai-features' || user?.role === 'ADMIN')
            .map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    slotProps={{
                      primary: {
                        fontSize: '0.875rem',
                        fontWeight: location.pathname === item.path ? 600 : 500 
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

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
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 4 }, 
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Outlet />
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
