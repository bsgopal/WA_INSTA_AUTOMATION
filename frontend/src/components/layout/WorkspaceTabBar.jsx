// WA_INSTA_AUTOMATION/frontend/src/components/layout/WorkspaceTabBar.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ChatIcon from '@mui/icons-material/Chat';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RuleIcon from '@mui/icons-material/Rule';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TabIcon from '@mui/icons-material/Tab';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import MessageIcon from '@mui/icons-material/Message';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { subscribeToWorkspaceEvents } from '../../utils/workspaceSync';

// All available applications/workspaces that can be opened as tabs (SAP DM style)
const AVAILABLE_MODULES = [
  { id: 'dashboard', label: '📊 Dashboard', path: '/', icon: <DashboardIcon fontSize="small" sx={{ color: '#38bdf8' }} /> },
  { id: 'conversations', label: '💬 Conversations', path: '/conversations', icon: <ChatIcon fontSize="small" sx={{ color: '#8b5cf6' }} /> },
  { id: 'rules', label: '📜 Response Rules', path: '/response-rules', icon: <RuleIcon fontSize="small" sx={{ color: '#10b981' }} /> },
  { id: 'workflows', label: '🎨 Flow Studio', path: '/workflows', icon: <AccountTreeIcon fontSize="small" sx={{ color: '#3b82f6' }} /> },
  { id: 'campaigns', label: '📢 Campaigns', path: '/campaigns', icon: <CampaignIcon fontSize="small" sx={{ color: '#f59e0b' }} /> },
  { id: 'customers', label: '👥 Customers CRM', path: '/customers', icon: <PeopleIcon fontSize="small" sx={{ color: '#06b6d4' }} /> },
  { id: 'catalog', label: '🛍️ Catalog', path: '/catalog', icon: <StorefrontIcon fontSize="small" sx={{ color: '#ec4899' }} /> },
  { id: 'templates', label: '📋 Templates', path: '/templates', icon: <ViewQuiltIcon fontSize="small" sx={{ color: '#a855f7' }} /> },
  { id: 'quick-replies', label: '⚡ Quick Replies', path: '/quick-replies', icon: <MessageIcon fontSize="small" sx={{ color: '#14b8a6' }} /> },
  { id: 'messages', label: '✉️ Messages', path: '/messages', icon: <MessageIcon fontSize="small" sx={{ color: '#6366f1' }} /> },
  { id: 'ai-features', label: '🤖 AI Features', path: '/ai-features', icon: <SmartToyIcon fontSize="small" sx={{ color: '#84cc16' }} /> },
  { id: 'analytics', label: '📈 Analytics', path: '/analytics', icon: <AssessmentIcon fontSize="small" sx={{ color: '#22c55e' }} /> },
  { id: 'settings', label: '⚙️ Settings', path: '/settings', icon: <SettingsIcon fontSize="small" sx={{ color: '#94a3b8' }} /> }
];

const DEFAULT_WORKSPACE_TABS = [
  { id: 'rules', label: '📜 Response Rules', path: '/response-rules' },
  { id: 'workflows', label: '🎨 Flow Studio', path: '/workflows' },
  { id: 'conversations', label: '💬 Conversations', path: '/conversations' },
  { id: 'campaigns', label: '📢 Campaigns', path: '/campaigns' },
  { id: 'customers', label: '👥 Customers CRM', path: '/customers' }
];

export default function WorkspaceTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState(() => {
    try {
      const saved = localStorage.getItem('renic_workspace_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any old /rules path to /response-rules
        return parsed.map(t => t.path === '/rules' ? { ...t, path: '/response-rules' } : t);
      }
      return DEFAULT_WORKSPACE_TABS;
    } catch (e) {
      return DEFAULT_WORKSPACE_TABS;
    }
  });

  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [tabContextMenu, setTabContextMenu] = useState(null);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);
  const [syncPillVisible, setSyncPillVisible] = useState(false);

  // Subscribe to cross-tab live events
  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceEvents((event) => {
      setLastSyncEvent(event);
      setSyncPillVisible(true);
      const timer = setTimeout(() => setSyncPillVisible(false), 3000);
      return () => clearTimeout(timer);
    });
    return unsubscribe;
  }, []);

  // Automatically ensure current path is in the workspace tabs if matching an available module
  useEffect(() => {
    const current = location.pathname;
    if (!current || current === '/login' || current === '/register') return;

    const matchedMod = AVAILABLE_MODULES.find(mod => {
      if (mod.path === '/') {
        return current === '/';
      }
      if (mod.path === '/response-rules') {
        return current === '/response-rules' || current === '/rules';
      }
      return current.startsWith(mod.path);
    });

    if (matchedMod) {
      setTabs(prevTabs => {
        const exists = prevTabs.find(t => t.id === matchedMod.id || t.path === matchedMod.path);
        if (!exists) {
          const updated = [...prevTabs, { id: matchedMod.id, label: matchedMod.label, path: matchedMod.path }];
          try {
            localStorage.setItem('renic_workspace_tabs', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prevTabs;
      });
    }
  }, [location.pathname]);

  const handleCloseTab = (e, tabId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    localStorage.setItem('renic_workspace_tabs', JSON.stringify(newTabs));

    const currentTab = tabs.find(t => isPathActive(t.path));
    if (currentTab?.id === tabId) {
      navigate(newTabs[0].path);
    }
  };

  const handleCloseOtherTabs = (keepTabId) => {
    const keepTab = tabs.find(t => t.id === keepTabId);
    if (!keepTab) return;
    const newTabs = [keepTab];
    setTabs(newTabs);
    localStorage.setItem('renic_workspace_tabs', JSON.stringify(newTabs));
    navigate(keepTab.path);
    setTabContextMenu(null);
  };

  const handleSelectTab = (path) => {
    navigate(path);
  };

  const handleOpenAddMenu = (e) => {
    setAddMenuAnchor(e.currentTarget);
  };

  const handleCloseAddMenu = () => {
    setAddMenuAnchor(null);
  };

  const handleAddNewTab = (mod) => {
    handleCloseAddMenu();
    // Check if tab already open
    const exists = tabs.find(t => t.path === mod.path);
    if (!exists) {
      const newTabs = [...tabs, { id: mod.id, label: mod.label, path: mod.path }];
      setTabs(newTabs);
      localStorage.setItem('renic_workspace_tabs', JSON.stringify(newTabs));
    }
    navigate(mod.path);
  };

  const isPathActive = (tabPath) => {
    const current = location.pathname;
    if (tabPath === '/') {
      return current === '/';
    }
    if (tabPath === '/response-rules') {
      return current === '/response-rules' || current === '/rules';
    }
    return current.startsWith(tabPath);
  };

  return (
    <Box
      sx={{
        px: 2.5,
        py: 0.75,
        bgcolor: '#090d16',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }
      }}
    >
      {/* Tab Pills & Add Button */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 'max-content' }}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', mr: 0.5 }}>
          WORKSPACE
        </Typography>

        {tabs.map((tab) => {
          const isActive = isPathActive(tab.path);
          return (
            <Box
              key={tab.id}
              component="a"
              href={tab.path}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) {
                  return;
                }
                e.preventDefault();
                handleSelectTab(tab.path);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setTabContextMenu({
                  mouseX: e.clientX + 2,
                  mouseY: e.clientY - 6,
                  tab
                });
              }}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: isActive ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: isActive ? '#34d399' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: isActive ? 750 : 600,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#34d399' : '#e2e8f0',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {tab.label}
              {tabs.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  sx={{
                    p: 0.2,
                    color: 'inherit',
                    opacity: 0.6,
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>
          );
        })}

        {/* Renic Style [+] New Tab Button */}
        <Tooltip title="Open New Workspace Tab (Renic Multi-Tasking)">
          <Box
            onClick={handleOpenAddMenu}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '8px',
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10b981',
                color: '#34d399',
                transform: 'scale(1.05)'
              }
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </Box>
        </Tooltip>

        {/* Renic New Tab Selector Menu */}
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={handleCloseAddMenu}
          slotProps={{
            paper: {
              sx: {
                bgcolor: '#0f172a',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                minWidth: 220
              }
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>
              OPEN WORKSPACE TAB
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              Renic Multi-App Workspace
            </Typography>
          </Box>

          {AVAILABLE_MODULES.map((mod) => (
            <MenuItem
              key={mod.id}
              onClick={() => handleAddNewTab(mod)}
              sx={{
                py: 1,
                px: 2,
                fontSize: '0.8rem',
                gap: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto !important' }}>
                {mod.icon}
              </ListItemIcon>
              <ListItemText
                primary={mod.label}
                slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' } }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {/* Cross-Tab Sync Status Pill */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, flexShrink: 0 }}>
        {syncPillVisible ? (
          <Chip
            icon={<SyncAltIcon sx={{ fontSize: '13px !important', color: '#10b981' }} />}
            label={`⚡ Synced: ${lastSyncEvent?.type || 'Update'}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 800,
              bgcolor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.5)'
            }}
          />
        ) : (
          <Tooltip title="Real-time multi-tab state sync is active across all open tabs via BroadcastChannel">
            <Chip
              label="🟢 Multi-Tab Sync"
              size="small"
              sx={{
                height: 19,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Right-Click Tab Context Menu */}
      <Menu
        open={tabContextMenu !== null}
        onClose={() => setTabContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          tabContextMenu !== null
            ? { top: tabContextMenu.mouseY, left: tabContextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#0f172a',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              minWidth: 220,
              py: 0.5
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (tabContextMenu?.tab) {
              window.open(tabContextMenu.tab.path, '_blank');
            }
            setTabContextMenu(null);
          }}
          sx={{ fontSize: '0.8rem', py: 0.75, gap: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#38bdf8' }}>
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Open in New Browser Tab" slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600 } }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (tabContextMenu?.tab) {
              window.open(tabContextMenu.tab.path, '_blank', 'width=1280,height=800');
            }
            setTabContextMenu(null);
          }}
          sx={{ fontSize: '0.8rem', py: 0.75, gap: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#10b981' }}>
            <TabIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Open in New Window" slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600 } }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (tabContextMenu?.tab) {
              const fullUrl = window.location.origin + tabContextMenu.tab.path;
              navigator.clipboard?.writeText(fullUrl);
            }
            setTabContextMenu(null);
          }}
          sx={{ fontSize: '0.8rem', py: 0.75, gap: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#94a3b8' }}>
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Copy Link Address" slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600 } }} />
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />

        <MenuItem
          disabled={tabs.length <= 1}
          onClick={(e) => {
            if (tabContextMenu?.tab) {
              handleCloseTab(e, tabContextMenu.tab.id);
            }
            setTabContextMenu(null);
          }}
          sx={{ fontSize: '0.8rem', py: 0.75, gap: 1.25, '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#ef4444' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Close Tab" slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5' } }} />
        </MenuItem>

        <MenuItem
          disabled={tabs.length <= 1}
          onClick={() => {
            if (tabContextMenu?.tab) {
              handleCloseOtherTabs(tabContextMenu.tab.id);
            }
          }}
          sx={{ fontSize: '0.8rem', py: 0.75, gap: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#f59e0b' }}>
            <CloseFullscreenIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Close Other Tabs" slotProps={{ primary: { fontSize: '0.8rem', fontWeight: 600 } }} />
        </MenuItem>
      </Menu>
    </Box>
  );
}
