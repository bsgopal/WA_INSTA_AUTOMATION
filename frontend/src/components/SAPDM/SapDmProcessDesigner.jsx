import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  CircularProgress
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChatIcon from '@mui/icons-material/Chat';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LinkIcon from '@mui/icons-material/Link';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';

// Element Palette definitions for SAP DM Studio
const PALETTE_CATEGORIES = [
  {
    id: 'triggers',
    title: 'Triggers & Inputs',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    items: [
      { type: 'KEYWORD', label: 'Keyword Match', icon: '⚡', desc: 'Triggers on specific customer keywords' },
      { type: 'EXACT_MATCH', label: 'Exact Text Match', icon: '🎯', desc: 'Triggers on exact phrase match' },
      { type: 'AI_INTENT', label: 'AI Intent Detection', icon: '🤖', desc: 'Triggers when AI detects customer intent' },
      { type: 'LIST_SELECT', label: 'List Option Select', icon: '📋', desc: 'Triggers when user picks a list item' },
    ]
  },
  {
    id: 'logic',
    title: 'Logic & Conditions',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    items: [
      { type: 'IF_ELSE', label: 'If / Else Branch', icon: '🔀', desc: 'Split flow based on customer variables' },
      { type: 'MATCH_CONDITION', label: 'Match Rules', icon: '⚙️', desc: 'Evaluate specific criteria conditions' },
      { type: 'WAIT_TIMER', label: 'Delay / Wait', icon: '⏱️', desc: 'Pause execution for specified duration' },
    ]
  },
  {
    id: 'responses',
    title: 'Responses & Content',
    color: '#059669',
    bgColor: '#ECFDF5',
    items: [
      { type: 'SEND_TEXT', label: 'Send Message Text', icon: '💬', desc: 'Send customized text message' },
      { type: 'QUICK_REPLY', label: 'Interactive Buttons', icon: '🔘', desc: 'Send message with quick reply buttons' },
      { type: 'INTERACTIVE_LIST', label: 'Interactive List Menu', icon: '📑', desc: 'Send menu list options for WhatsApp' },
      { type: 'TEMPLATE', label: 'Message Template', icon: '📄', desc: 'Send approved WhatsApp template' },
      { type: 'CATALOG', label: 'Catalog Link', icon: '🛍️', desc: 'Send product catalog link' },
    ]
  },
  {
    id: 'actions',
    title: 'Actions & Connectors',
    color: '#0891B2',
    bgColor: '#F0FDFA',
    items: [
      { type: 'WORKFLOW', label: 'Trigger Sub-Workflow', icon: '🔄', desc: 'Hand off process to another workflow' },
      { type: 'WEBHOOK', label: 'Call External Webhook', icon: '🌐', desc: 'Send HTTP payload to remote API' },
      { type: 'URL', label: 'Open Web URL', icon: '🔗', desc: 'Send clickable link button' },
    ]
  }
];

export default function SapDmProcessDesigner({
  initialData = {},
  onSave,
  onClose,
  isWorkflow = false,
  availableTemplates = [],
  availableWorkflows = [],
  availableRules = []
}) {
  // Title & Status
  const [title, setTitle] = useState(initialData.name || (isWorkflow ? 'New Process Workflow' : 'New Response Rule'));
  const [status, setStatus] = useState(initialData.status || 'ACTIVE');
  const [saving, setSaving] = useState(false);

  // Nodes & Flow Connections
  const [nodes, setNodes] = useState(() => {
    if (initialData.nodes && initialData.nodes.length > 0) {
      return initialData.nodes;
    }
    // Default initial starter node structure
    return [
      {
        id: 'node_trigger',
        type: initialData.triggerType || 'KEYWORD',
        category: 'triggers',
        label: 'Process Trigger',
        config: {
          keywords: initialData.triggerValue ? [initialData.triggerValue] : ['hello', 'price', 'details'],
          matchType: 'CONTAINS'
        },
        position: { x: 100, y: 120 }
      },
      {
        id: 'node_action_1',
        type: initialData.actionType || 'SEND_TEXT',
        category: 'responses',
        label: 'Send Auto Response',
        config: {
          message: initialData.responseMessage || 'Namaste! Welcome to our store. How can we help you today?',
          buttons: [
            { id: 'b1', title: 'View Catalog', actionType: 'CATALOG' },
            { id: 'b2', title: 'Talk to Agent', actionType: 'WORKFLOW' }
          ]
        },
        position: { x: 450, y: 120 }
      }
    ];
  });

  // Selected Node for Inspector
  const [selectedNodeId, setSelectedNodeId] = useState('node_trigger');
  
  // Canvas State: Zoom, Grid, Pan
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState(0); // 0 = Properties, 1 = Preview

  // Drag and drop state
  const [draggedType, setDraggedType] = useState(null);

  // History stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const canvasRef = useRef(null);

  // Get current selected node object
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Helper to record history step
  const pushHistory = (newNodes) => {
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(JSON.stringify(newNodes));
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  // Update a node's configuration
  const updateSelectedNodeConfig = (newConfig) => {
    setNodes(prev => {
      const updated = prev.map(n => {
        if (n.id === selectedNodeId) {
          return { ...n, config: { ...n.config, ...newConfig } };
        }
        return n;
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Update a node's label
  const updateSelectedNodeLabel = (label) => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, label } : n));
  };

  // Add a new node to canvas
  const handleAddNode = (item, targetIndex = null) => {
    const newNodeId = `node_${Date.now().toString(36)}`;
    const categoryObj = PALETTE_CATEGORIES.find(c => c.items.some(i => i.type === item.type)) || PALETTE_CATEGORIES[2];
    
    const newNode = {
      id: newNodeId,
      type: item.type,
      category: categoryObj.id,
      label: item.label,
      config: getDefaultConfigForType(item.type),
      position: {
        x: targetIndex !== null ? 100 + (targetIndex + 1) * 320 : 100 + nodes.length * 300,
        y: 120
      }
    };

    setNodes(prev => {
      let nextNodes = [...prev];
      if (targetIndex !== null && targetIndex >= 0) {
        nextNodes.splice(targetIndex + 1, 0, newNode);
      } else {
        nextNodes.push(newNode);
      }
      pushHistory(nextNodes);
      return nextNodes;
    });

    setSelectedNodeId(newNodeId);
  };

  // Delete node
  const handleDeleteNode = (nodeId, e) => {
    if (e) e.stopPropagation();
    if (nodes.length <= 1) return; // keep at least 1 node
    setNodes(prev => {
      const filtered = prev.filter(n => n.id !== nodeId);
      pushHistory(filtered);
      return filtered;
    });
    if (selectedNodeId === nodeId) {
      const remaining = nodes.filter(n => n.id !== nodeId);
      if (remaining.length > 0) setSelectedNodeId(remaining[0].id);
    }
  };

  // Duplicate node
  const handleDuplicateNode = (nodeId, e) => {
    if (e) e.stopPropagation();
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;

    const dupId = `node_${Date.now().toString(36)}`;
    const dupNode = {
      ...JSON.parse(JSON.stringify(sourceNode)),
      id: dupId,
      label: `${sourceNode.label} (Copy)`
    };

    setNodes(prev => {
      const idx = prev.findIndex(n => n.id === nodeId);
      const updated = [...prev];
      updated.splice(idx + 1, 0, dupNode);
      pushHistory(updated);
      return updated;
    });

    setSelectedNodeId(dupId);
  };

  // Auto layout nodes neatly
  const handleAutoAlign = () => {
    setNodes(prev => {
      const aligned = prev.map((n, i) => ({
        ...n,
        position: { x: 80 + i * 340, y: 120 }
      }));
      pushHistory(aligned);
      return aligned;
    });
  };

  // Drag and drop events
  const handlePaletteDragStart = (item) => {
    setDraggedType(item);
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (draggedType) {
      handleAddNode(draggedType);
      setDraggedType(null);
    }
  };

  // Save handler
  const handleSaveClick = async () => {
    setSaving(true);
    try {
      const payload = {
        name: title,
        status,
        nodes,
        triggerType: nodes[0]?.type || 'KEYWORD',
        triggerValue: nodes[0]?.config?.keywords?.[0] || '',
        actionType: nodes[1]?.type || 'SEND_TEXT',
        responseMessage: nodes[1]?.config?.message || ''
      };
      if (onSave) await onSave(payload);
    } catch (err) {
      console.error('Failed to save SAP DM process:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 80px)',
        bgcolor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
      }}
    >
      {/* ========================================================
          1. SAP DM ENTERPRISE HEADER TOOLBAR
          ======================================================== */}
      <Box
        sx={{
          height: '60px',
          bgcolor: '#0F172A',
          color: '#FFFFFF',
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          zIndex: 10
        }}
      >
        {/* Left: Branding & Title */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#2563EB',
              p: 1,
              borderRadius: '8px',
              color: '#FFF',
              fontWeight: 800
            }}
          >
            <AccountTreeIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TextField
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: { color: '#F8FAFC', fontWeight: 700, fontSize: '1.05rem' }
                }}
                sx={{ width: 260 }}
              />
              <Chip
                label={status}
                size="small"
                color={status === 'ACTIVE' ? 'success' : 'default'}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              SAP DM Process Designer • {nodes.length} Nodes Configured
            </Typography>
          </Box>
        </Stack>

        {/* Center: Canvas Controls */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: '#1E293B', p: 0.5, borderRadius: '8px' }}>
          <Tooltip title="Auto Align Nodes">
            <IconButton size="small" onClick={handleAutoAlign} sx={{ color: '#94A3B8', '&:hover': { color: '#38BDF8' } }}>
              <FlashOnIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={snapToGrid ? "Snap to Grid Enabled" : "Snap to Grid Disabled"}>
            <IconButton
              size="small"
              onClick={() => setSnapToGrid(!snapToGrid)}
              sx={{ color: snapToGrid ? '#38BDF8' : '#94A3B8' }}
            >
              {snapToGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: '#334155', my: 0.5 }} />

          <Tooltip title="Zoom Out">
            <IconButton
              size="small"
              onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
              sx={{ color: '#94A3B8' }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography variant="caption" sx={{ color: '#E2E8F0', minWidth: 40, textAlign: 'center', fontWeight: 600 }}>
            {Math.round(zoom * 100)}%
          </Typography>

          <Tooltip title="Zoom In">
            <IconButton
              size="small"
              onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}
              sx={{ color: '#94A3B8' }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset View">
            <IconButton size="small" onClick={() => setZoom(1)} sx={{ color: '#94A3B8' }}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Right: Primary Actions */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveClick}
            disabled={saving}
            sx={{
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5
            }}
          >
            {saving ? 'Deploying...' : 'Save & Publish'}
          </Button>

          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
              <CloseIcon />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* ========================================================
          MAIN WORKSPACE (3-COLUMN LAYOUT)
          ======================================================== */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* ========================================================
            LEFT COLUMN: SAP DM ELEMENT PALETTE
            ======================================================== */}
        <Box
          sx={{
            width: '280px',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 5
          }}
        >
          {/* Palette Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 1 }}>
              SAP DM Element Palette
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search triggers, actions..."
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} />,
                style: { fontSize: '0.85rem', borderRadius: '8px', bgcolor: '#F8FAFC' }
              }}
            />
          </Box>

          {/* Palette Accordion Items */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {PALETTE_CATEGORIES.map(cat => {
              const filteredItems = cat.items.filter(i =>
                i.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
                i.desc.toLowerCase().includes(paletteSearch.toLowerCase())
              );

              if (filteredItems.length === 0) return null;

              return (
                <Accordion key={cat.id} defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 36, px: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', letterSpacing: 0.5 }}>
                        {cat.title.toUpperCase()}
                      </Typography>
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0.5 }}>
                    <Stack spacing={1}>
                      {filteredItems.map(item => (
                        <Paper
                          key={item.type}
                          draggable
                          onDragStart={() => handlePaletteDragStart(item)}
                          onClick={() => handleAddNode(item)}
                          sx={{
                            p: 1.2,
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            bgcolor: '#FFFFFF',
                            cursor: 'grab',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: cat.color,
                              boxShadow: `0 4px 12px ${cat.color}22`,
                              transform: 'translateY(-1px)'
                            },
                            '&:active': { cursor: 'grabbing' }
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={1.2}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '6px',
                                bgcolor: cat.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem'
                              }}
                            >
                              {item.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                                {item.label}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block', lineHeight: 1.2 }}>
                                {item.desc}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>

        {/* ========================================================
            CENTER COLUMN: SAP DM PROCESS BLUEPRINT CANVAS
            ======================================================== */}
        <Box
          ref={canvasRef}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          sx={{
            flex: 1,
            bgcolor: '#F8FAFC',
            position: 'relative',
            overflow: 'auto',
            backgroundImage: snapToGrid ? 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)' : 'none',
            backgroundSize: '24px 24px',
            p: 4
          }}
        >
          <Box
            sx={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
              minWidth: '100%',
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              py: 4
            }}
          >
            {/* Render Nodes Flow */}
            {nodes.map((node, index) => {
              const isSelected = node.id === selectedNodeId;
              const catObj = PALETTE_CATEGORIES.find(c => c.id === node.category) || PALETTE_CATEGORIES[2];

              return (
                <React.Fragment key={node.id}>
                  {/* Node Card */}
                  <Paper
                    onClick={() => setSelectedNodeId(node.id)}
                    elevation={isSelected ? 6 : 1}
                    sx={{
                      width: 280,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isSelected ? `2px solid ${catObj.color}` : '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? `0 10px 25px -5px ${catObj.color}33, 0 8px 10px -6px ${catObj.color}22`
                        : '0 4px 6px -1px rgba(0,0,0,0.05)',
                      '&:hover': {
                        borderColor: catObj.color,
                        boxShadow: `0 8px 20px -4px ${catObj.color}25`
                      }
                    }}
                  >
                    {/* Header Stripe */}
                    <Box
                      sx={{
                        bgcolor: catObj.color,
                        color: '#FFFFFF',
                        px: 1.5,
                        py: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={`#0${index + 1}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.25)',
                            color: '#FFF',
                            fontWeight: 800,
                            height: 18,
                            fontSize: '0.65rem'
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: 0.2 }}>
                          {node.label}
                        </Typography>
                      </Stack>

                      {/* Card Action Icons */}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDuplicateNode(node.id, e)}
                          sx={{ color: '#FFF', opacity: 0.8, '&:hover': { opacity: 1 } }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteNode(node.id, e)}
                          sx={{ color: '#FFF', opacity: 0.8, '&:hover': { opacity: 1 } }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Node Content Body */}
                    <Box sx={{ p: 2 }}>
                      {/* Body details depending on node type */}
                      {node.type === 'KEYWORD' && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                            TRIGGERS ON KEYWORDS:
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {(node.config.keywords || ['hello']).map((kw, i) => (
                              <Chip
                                key={i}
                                label={kw}
                                size="small"
                                sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {node.type === 'SEND_TEXT' && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                            TEXT RESPONSE:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              bgcolor: '#F8FAFC',
                              p: 1,
                              borderRadius: '6px',
                              border: '1px solid #F1F5F9',
                              fontSize: '0.78rem',
                              color: '#334155',
                              mt: 0.5,
                              lineHeight: 1.3
                            }}
                          >
                            {node.config.message || 'No message configured...'}
                          </Typography>
                        </Box>
                      )}

                      {node.type === 'QUICK_REPLY' && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                            BUTTON OPTIONS ({node.config.buttons?.length || 0}):
                          </Typography>
                          <Stack spacing={0.5} mt={0.5}>
                            {(node.config.buttons || []).map((btn, i) => (
                              <Chip
                                key={i}
                                label={`🔘 ${btn.title}`}
                                size="small"
                                sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 700, fontSize: '0.72rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Generic summary fallback */}
                      {!['KEYWORD', 'SEND_TEXT', 'QUICK_REPLY'].includes(node.type) && (
                        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem' }}>
                          Type: <strong>{node.type}</strong> • Click to edit configuration in inspector panel.
                        </Typography>
                      )}
                    </Box>

                    {/* Port Handles */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.5,
                        bgcolor: '#F8FAFC',
                        borderTop: '1px solid #F1F5F9'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: catObj.color }} />
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                          IN PORT
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                          OUT PORT
                        </Typography>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: catObj.color }} />
                      </Stack>
                    </Box>
                  </Paper>

                  {/* Connecting Arrow & Add Step Button */}
                  {index < nodes.length - 1 && (
                    <Stack alignItems="center" spacing={0.5}>
                      <Box sx={{ height: 2, width: 40, bgcolor: '#CBD5E1' }} />
                      <IconButton
                        size="small"
                        onClick={() => handleAddNode(PALETTE_CATEGORIES[2].items[0], index)}
                        sx={{
                          bgcolor: '#FFFFFF',
                          border: '1px dashed #94A3B8',
                          color: '#2563EB',
                          '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' },
                          width: 24,
                          height: 24
                        }}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Box sx={{ height: 2, width: 40, bgcolor: '#CBD5E1' }} />
                    </Stack>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </Box>

        {/* ========================================================
            RIGHT COLUMN: PROPERTY INSPECTOR & LIVE SMARTPHONE PREVIEW
            ======================================================== */}
        <Box
          sx={{
            width: '380px',
            bgcolor: '#FFFFFF',
            borderLeft: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 5
          }}
        >
          {/* Tabs: Properties vs Live Preview */}
          <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Tabs
              value={rightPanelTab}
              onChange={(e, val) => setRightPanelTab(val)}
              variant="fullWidth"
              sx={{ minHeight: 44 }}
            >
              <Tab
                icon={<SettingsIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Properties"
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', minHeight: 44 }}
              />
              <Tab
                icon={<PhoneAndroidIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Live Preview"
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', minHeight: 44 }}
              />
            </Tabs>
          </Box>

          {/* Tab 0: Property Inspector */}
          {rightPanelTab === 0 && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
              {selectedNode ? (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                      NODE LABEL
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={selectedNode.label}
                      onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Divider />

                  {/* Trigger Node Form */}
                  {selectedNode.type === 'KEYWORD' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        Trigger Keywords Configuration
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                        Enter comma separated keywords customer will type to activate this rule:
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        label="Keywords (comma separated)"
                        value={(selectedNode.config.keywords || []).join(', ')}
                        onChange={(e) =>
                          updateSelectedNodeConfig({
                            keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })
                        }
                      />
                    </Box>
                  )}

                  {/* Response Text Form */}
                  {selectedNode.type === 'SEND_TEXT' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        Automated Text Message Response
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        label="Response Message"
                        value={selectedNode.config.message || ''}
                        onChange={(e) => updateSelectedNodeConfig({ message: e.target.value })}
                        placeholder="Type message text... Use {{customer_name}} for dynamic tags."
                      />
                    </Box>
                  )}

                  {/* Quick Reply Buttons Form */}
                  {selectedNode.type === 'QUICK_REPLY' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        Interactive Quick Reply Buttons
                      </Typography>
                      <Stack spacing={1.5}>
                        {(selectedNode.config.buttons || []).map((btn, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: '8px' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                label={`Button #${idx + 1} Title`}
                                value={btn.title}
                                onChange={(e) => {
                                  const btns = [...selectedNode.config.buttons];
                                  btns[idx].title = e.target.value;
                                  updateSelectedNodeConfig({ buttons: btns });
                                }}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const btns = selectedNode.config.buttons.filter((_, i) => i !== idx);
                                  updateSelectedNodeConfig({ buttons: btns });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const btns = [...(selectedNode.config.buttons || [])];
                            btns.push({ id: `b_${Date.now()}`, title: `Option ${btns.length + 1}` });
                            updateSelectedNodeConfig({ buttons: btns });
                          }}
                          disabled={(selectedNode.config.buttons || []).length >= 3}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Add Interactive Button (Max 3)
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', mt: 4 }}>
                  Select a node on the canvas to configure properties.
                </Typography>
              )}
            </Box>
          )}

          {/* Tab 1: Live Smartphone Simulator */}
          {rightPanelTab === 1 && (
            <Box
              sx={{
                flex: 1,
                bgcolor: '#0F172A',
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Smartphone Container Mockup */}
              <Paper
                elevation={12}
                sx={{
                  width: '280px',
                  height: '460px',
                  borderRadius: '28px',
                  border: '6px solid #334155',
                  bgcolor: '#E5DDD5',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Phone Top Notch Bar */}
                <Box
                  sx={{
                    bgcolor: '#075E54',
                    color: '#FFF',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    spacing: 1
                  }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#25D366', mr: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                    Renic WhatsApp Assistant
                  </Typography>
                </Box>

                {/* Chat Messages Body */}
                <Box sx={{ flex: 1, p: 1.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Customer Incoming Trigger Message */}
                  <Box
                    sx={{
                      alignSelf: 'flex-end',
                      bgcolor: '#DCF8C6',
                      p: 1.2,
                      borderRadius: '12px 0px 12px 12px',
                      maxWidth: '80%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#0F172A' }}>
                      {nodes[0]?.config?.keywords?.[0] || 'Hello'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B', display: 'block', textAlign: 'right', mt: 0.3 }}>
                      10:42 AM ✓✓
                    </Typography>
                  </Box>

                  {/* Automated Bot Response Bubble */}
                  <Box
                    sx={{
                      alignSelf: 'flex-start',
                      bgcolor: '#FFFFFF',
                      p: 1.2,
                      borderRadius: '0px 12px 12px 12px',
                      maxWidth: '85%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#0F172A', whiteSpace: 'pre-line' }}>
                      {selectedNode?.config?.message || 'Namaste! Welcome to our automated WhatsApp assistance.'}
                    </Typography>

                    {/* Render Interactive Buttons if configured */}
                    {selectedNode?.config?.buttons && selectedNode.config.buttons.length > 0 && (
                      <Stack spacing={0.8} mt={1.5}>
                        {selectedNode.config.buttons.map((btn, i) => (
                          <Paper
                            key={i}
                            variant="outlined"
                            sx={{
                              p: 0.8,
                              textAlign: 'center',
                              color: '#075E54',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              borderColor: '#25D366',
                              bgcolor: '#F0FDF4',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#DCF8C6' }
                            }}
                          >
                            {btn.title}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Helper default configs
function getDefaultConfigForType(type) {
  switch (type) {
    case 'KEYWORD':
      return { keywords: ['hello', 'info'], matchType: 'CONTAINS' };
    case 'SEND_TEXT':
      return { message: 'Namaste! Thank you for reaching out.' };
    case 'QUICK_REPLY':
      return { message: 'Please select an option below:', buttons: [{ id: 'b1', title: 'Option 1' }] };
    default:
      return {};
  }
}
