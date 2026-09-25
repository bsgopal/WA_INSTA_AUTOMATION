import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PolylineIcon from '@mui/icons-material/Polyline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PanToolIcon from '@mui/icons-material/PanTool';
import MouseIcon from '@mui/icons-material/Mouse';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useNavigate } from 'react-router-dom';
import SmartTagToolbar from '../SmartTagToolbar';
import { broadcastWorkspaceEvent } from '../../utils/workspaceSync';

// ========================================================
// 1. PALETTE DEFINITIONS
// ========================================================
const FLOW_CONTROLS = [
  { type: 'START', label: 'Start Trigger', icon: '▷', desc: 'Process entry point trigger on keyword', color: '#D97706', shape: 'circle_start' },
  { type: 'IF_ELSE', label: 'Condition Split', icon: '✕', desc: 'Branch based on user selection or keyword', color: '#10B981', shape: 'diamond_condition' },
  { type: 'PARALLEL_SPLIT', label: 'Parallel Split', icon: '+', desc: 'Run concurrent actions simultaneously', color: '#0D9488', shape: 'diamond_parallel' },
  { type: 'WAIT_TIMER', label: 'Wait / Delay', icon: '⏱️', desc: 'Pause execution for seconds or minutes', color: '#059669', shape: 'circle_wait' },
  { type: 'AI_SCRIPT', label: 'AI Assistant', icon: '🤖', desc: 'AI smart response or custom prompt', color: '#6366F1', shape: 'circle_ai' },
  { type: 'END', label: 'End Flow', icon: '◎', desc: 'Flow completion termination', color: '#DC2626', shape: 'circle_end' }
];

const MESSAGING_ACTIONS = [
  { type: 'SEND_TEXT', label: 'Message & Buttons Card', icon: '💬', group: 'Messaging', color: '#0284C7', desc: 'Text response with interactive button handles' },
  { type: 'QUICK_REPLY', label: 'Menu Buttons', icon: '🔘', group: 'Interactive', color: '#7C3AED', desc: '1-3 clickable menu options' },
  { type: 'ASK_DATA', label: 'Ask & Collect Info', icon: '📝', group: 'Input Collection', color: '#059669', desc: 'Ask question and save customer response' },
  { type: 'CATALOG', label: 'Product Catalog', icon: '🛍️', group: 'E-Commerce', color: '#EA580C', desc: 'Send WhatsApp product catalog link' },
  { type: 'WORKFLOW', label: 'Sub-Workflow', icon: '🔄', group: 'Processes', color: '#2563EB', desc: 'Hand over execution to another workflow' }
];

const ALL_PALETTE_ITEMS = [...FLOW_CONTROLS, ...MESSAGING_ACTIONS];

// Helper: Distance from point P to line segment (v, w)
function distanceToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

// Helper: Generate SVG Path D based on style
function getEdgePathD(start, end, style = 'bezier') {
  if (style === 'straight') {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (style === 'orthogonal' || style === 'step') {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }

  if (style === 'rounded_step') {
    const midX = (start.x + end.x) / 2;
    const radius = Math.min(16, Math.abs(midX - start.x) / 2, Math.abs(end.y - start.y) / 2);
    if (radius <= 4) {
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    }
    const dirY = end.y > start.y ? 1 : -1;
    const dirX = end.x > start.x ? 1 : -1;
    return `M ${start.x} ${start.y} L ${midX - dirX * radius} ${start.y} Q ${midX} ${start.y} ${midX} ${start.y + dirY * radius} L ${midX} ${end.y - dirY * radius} Q ${midX} ${end.y} ${midX + dirX * radius} ${end.y} L ${end.x} ${end.y}`;
  }

  // Default: Smooth Bezier Curve
  const deltaX = Math.max(60, Math.abs(end.x - start.x) * 0.5);
  return `M ${start.x} ${start.y} C ${start.x + deltaX} ${start.y}, ${end.x - deltaX} ${end.y}, ${end.x} ${end.y}`;
}

// Dedicated Keyword Input Editor supporting free comma & space typing without cursor jump
function KeywordConfigEditor({ node, onChange }) {
  const [text, setText] = useState(() => (node?.config?.keywords || []).join(', '));
  const activeNodeIdRef = useRef(node?.id);

  useEffect(() => {
    if (activeNodeIdRef.current !== node?.id) {
      activeNodeIdRef.current = node?.id;
      setText((node?.config?.keywords || []).join(', '));
    }
  }, [node?.id, node?.config?.keywords]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
    onChange({ keywords: parsed });
  };

  return (
    <TextField
      size="small"
      fullWidth
      multiline
      rows={2}
      label="Trigger Keywords (comma separated)"
      value={text}
      onChange={handleChange}
      placeholder="e.g. hi, hello, menu, start, catalog"
      helperText="Type any words separated by commas (case-insensitive)"
      sx={{
        mt: 1,
        '& .MuiOutlinedInput-root': {
          bgcolor: '#FFFFFF'
        }
      }}
    />
  );
}

export default function SapDmProcessDesigner({
  initialData = {},
  onSave,
  onClose,
  isWorkflow = false,
  availableTemplates = [],
  availableWorkflows = [],
  availableRules = []
}) {
  const navigate = useNavigate();

  // Process Title & Metadata
  const [title, setTitle] = useState(initialData.name || (isWorkflow ? 'MENU_CATALOG_WORKFLOW' : 'JEWELRY_INTERACTIVE_FLOW'));
  const [status, setStatus] = useState(initialData.status || 'ACTIVE');
  const [saving, setSaving] = useState(false);

  // ========================================================
  // 2D NODES & EDGES STATE
  // ========================================================
  const [nodes, setNodes] = useState(() => {
    if (initialData.nodes && initialData.nodes.length > 0) {
      return initialData.nodes.map((n, idx) => ({
        ...n,
        position: n.position || { x: 80 + idx * 240, y: 180 }
      }));
    }
    // Default starter flow with 2D positions
    return [
      {
        id: 'node_start',
        type: 'START',
        label: 'Start Trigger',
        position: { x: 60, y: 220 },
        config: {
          triggerType: initialData.triggerType || 'KEYWORD',
          keywords: initialData.triggerValue ? [initialData.triggerValue] : ['hi', 'hello', 'hey', 'menu', 'start'],
          matchType: 'CONTAINS'
        }
      },
      {
        id: 'node_menu_card',
        type: 'SEND_TEXT',
        label: 'Welcome & Menu Card',
        position: { x: 220, y: 150 },
        config: {
          message: 'Namaste! Welcome to our store 💎\nPlease select a category or type your choice:',
          buttons: [
            { id: 'b1', title: '1. 💍 Rings', value: 'Rings' },
            { id: 'b2', title: '2. 📿 Necklaces', value: 'Necklaces' },
            { id: 'b3', title: '3. 🛍️ Full Catalog', value: 'Catalog' }
          ]
        }
      },
      {
        id: 'node_rings_card',
        type: 'SEND_TEXT',
        label: '💍 Rings Catalog',
        position: { x: 600, y: 30 },
        config: {
          message: '✨ Here are our best-selling Diamond & Gold Rings:\n1. Solitaire Classic ($499)\n2. Eternity Diamond Band ($799)\nType "size" to check your ring size!',
          buttons: [
            { id: 'b_size', title: 'Check Ring Size', value: 'Size' }
          ]
        }
      },
      {
        id: 'node_necklaces_card',
        type: 'SEND_TEXT',
        label: '📿 Necklaces Collection',
        position: { x: 600, y: 220 },
        config: {
          message: '📿 Explore our Handcrafted Royal Necklaces:\n1. Pearl Pendant ($299)\n2. Gold Choker ($1,299)\nWould you like custom engraving on your necklace?',
          buttons: []
        }
      },
      {
        id: 'node_catalog_card',
        type: 'CATALOG',
        label: '🛍️ Full Store Catalog',
        position: { x: 600, y: 410 },
        config: {
          message: '🛍️ Browse our complete 2026 Collection online:\nhttps://renicjewels.com/catalog\nOur team is also on standby to assist you!',
          catalogUrl: 'https://renicjewels.com/catalog'
        }
      },
      {
        id: 'node_end',
        type: 'END',
        label: 'End Flow',
        position: { x: 960, y: 220 },
        config: {
          terminationType: 'COMPLETE'
        }
      }
    ];
  });

  const [edges, setEdges] = useState(() => {
    if (initialData.edges && initialData.edges.length > 0) {
      return initialData.edges;
    }
    return [
      { id: 'edge_start_menu', fromNodeId: 'node_start', fromPort: 'out', toNodeId: 'node_menu_card', toPort: 'in', label: '' },
      { id: 'edge_b1_rings', fromNodeId: 'node_menu_card', fromPort: 'b1', toNodeId: 'node_rings_card', toPort: 'in', label: '1. Rings' },
      { id: 'edge_b2_necklaces', fromNodeId: 'node_menu_card', fromPort: 'b2', toNodeId: 'node_necklaces_card', toPort: 'in', label: '2. Necklaces' },
      { id: 'edge_b3_catalog', fromNodeId: 'node_menu_card', fromPort: 'b3', toNodeId: 'node_catalog_card', toPort: 'in', label: '3. Catalog' },
      { id: 'edge_rings_end', fromNodeId: 'node_rings_card', fromPort: 'out', toNodeId: 'node_end', toPort: 'in', label: '' },
      { id: 'edge_necklaces_end', fromNodeId: 'node_necklaces_card', fromPort: 'out', toNodeId: 'node_end', toPort: 'in', label: '' },
      { id: 'edge_catalog_end', fromNodeId: 'node_catalog_card', fromPort: 'out', toNodeId: 'node_end', toPort: 'in', label: '' }
    ];
  });

  // Selected State
  const [selectedNodeId, setSelectedNodeId] = useState('node_menu_card');
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Arrow Shape Style Configuration
  const [globalEdgeStyle, setGlobalEdgeStyle] = useState('bezier'); // 'bezier' | 'orthogonal' | 'rounded_step' | 'straight'

  // Canvas Pan & Zoom Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState(0); // 0 = Properties, 1 = Simulator
  const [leftPaletteOpen, setLeftPaletteOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Dragging Node on Canvas
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const nodeDragStartRef = useRef({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });

  // Interactive Wire Creation (Drawing new Wire from Port)
  const [connectingSource, setConnectingSource] = useState(null); // { nodeId, portId, portLabel, startPos: { x, y } }
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 });

  // Interactive Re-linking: Dragging existing Edge Endpoints on Canvas
  const [draggingEdgeEndpoint, setDraggingEdgeEndpoint] = useState(null); // { edgeId, type: 'target'|'source', currentPos: {x,y}, hoverTargetNodeId: null }

  // Drag & Drop Insertion Detection (Splitting existing edge on drop)
  const [insertCandidateEdgeId, setInsertCandidateEdgeId] = useState(null);
  const [paletteDragItem, setPaletteDragItem] = useState(null);

  // History stack for Undo/Redo
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [undoToast, setUndoToast] = useState(null);

  const canvasRef = useRef(null);
  const sendTextInputRef = useRef(null);

  // Touchpad pinch gesture tracking
  const touchPinchDistRef = useRef(null);

  // ========================================================
  // LIVE SMARTPHONE SIMULATOR STATE
  // ========================================================
  const [simMessages, setSimMessages] = useState([
    {
      id: 'sim_init_bot',
      sender: 'bot',
      text: 'Namaste! Send "hi" or "menu" to test this workflow.'
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [simTyping, setSimTyping] = useState(false);
  const [simCurrentNodeId, setSimCurrentNodeId] = useState(null);
  const simChatEndRef = useRef(null);

  useEffect(() => {
    if (rightPanelTab === 1) {
      simChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simMessages, simTyping, rightPanelTab]);

  // Push history state
  const pushState = useCallback((newNodes, newEdges, toastMsg = null) => {
    setPast(p => [...p.slice(-30), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setFuture([]);
    if (newNodes) setNodes(newNodes);
    if (newEdges) setEdges(newEdges);
    if (toastMsg) {
      setUndoToast(toastMsg);
      setTimeout(() => setUndoToast(null), 2500);
    }
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(f => [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...f]);
    setPast(p => p.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setUndoToast('Reverted changes (Ctrl+Z)');
    setTimeout(() => setUndoToast(null), 2000);
  }, [past, nodes, edges]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(p => [...p, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setFuture(f => f.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
    setUndoToast('Reapplied changes (Ctrl+Y)');
    setTimeout(() => setUndoToast(null), 2000);
  }, [future, nodes, edges]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toUpperCase();
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedEdgeId) {
          e.preventDefault();
          handleDeleteEdge(selectedEdgeId);
        } else if (selectedNodeId && !['node_start', 'node_end'].includes(selectedNodeId)) {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedEdgeId, selectedNodeId]);

  // Selected item reference
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  const updateSelectedNodeConfig = (newConfig) => {
    const updated = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, config: { ...n.config, ...newConfig } };
      }
      return n;
    });
    setNodes(updated);
  };

  const updateSelectedNodeLabel = (label) => {
    const updated = nodes.map(n => n.id === selectedNodeId ? { ...n, label } : n);
    setNodes(updated);
  };

  // Node Port Positions
  const getNodePortPos = useCallback((node, portId = 'out') => {
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    const isSpecialShape = ['START', 'END', 'IF_ELSE', 'PARALLEL_SPLIT'].includes(node.type);
    const width = isSpecialShape ? 54 : 260;
    const height = isSpecialShape ? 54 : 120;

    if (portId === 'in') {
      return { x: x, y: y + height / 2 };
    }

    // Condition Split / Parallel Split branches
    if (node.type === 'IF_ELSE') {
      if (portId === 'out' || portId === 'true') return { x: x + width, y: y + 14 };
      if (portId === 'else') return { x: x + width, y: y + 38 };
    }

    if (node.type === 'PARALLEL_SPLIT') {
      if (portId === 'branchA') return { x: x + width, y: y + 14 };
      if (portId === 'branchB') return { x: x + width, y: y + 38 };
    }

    // If port is a button (e.g. 'b1', 'b2') on SEND_TEXT / QUICK_REPLY
    if (portId.startsWith('b') && node.config?.buttons) {
      const bIdx = node.config.buttons.findIndex(b => b.id === portId);
      if (bIdx !== -1) {
        return { x: x + width, y: y + 78 + bIdx * 32 };
      }
    }

    return { x: x + width, y: y + height / 2 };
  }, []);

  // Find if a canvas coordinate is close to an existing connection edge
  const findClosestEdge = useCallback((posX, posY, threshold = 65) => {
    let closestEdge = null;
    let minDistance = threshold;

    for (const edge of edges) {
      const fromNode = nodes.find(n => n.id === edge.fromNodeId);
      const toNode = nodes.find(n => n.id === edge.toNodeId);
      if (!fromNode || !toNode) continue;

      const pStart = getNodePortPos(fromNode, edge.fromPort);
      const pEnd = getNodePortPos(toNode, 'in');

      const dist = distanceToSegment({ x: posX, y: posY }, pStart, pEnd);
      if (dist < minDistance) {
        minDistance = dist;
        closestEdge = edge;
      }
    }

    return closestEdge;
  }, [edges, nodes, getNodePortPos]);

  // Insert a node between an existing edge connection
  const insertNodeIntoEdge = (nodeToInsert, targetEdgeId) => {
    const targetEdge = edges.find(e => e.id === targetEdgeId);
    if (!targetEdge) return;

    const sourceNode = nodes.find(n => n.id === targetEdge.fromNodeId);
    const destNode = nodes.find(n => n.id === targetEdge.toNodeId);
    if (!sourceNode || !destNode) return;

    // Remove the old edge
    const remainingEdges = edges.filter(e => e.id !== targetEdgeId);

    // Create 1st edge: Source -> New Node
    const edge1 = {
      id: `edge_${Date.now().toString(36)}_in`,
      fromNodeId: targetEdge.fromNodeId,
      fromPort: targetEdge.fromPort,
      toNodeId: nodeToInsert.id,
      toPort: 'in',
      label: targetEdge.label || ''
    };

    // Determine outgoing port for the new node
    let outPort = 'out';
    let outLabel = '';
    if (nodeToInsert.type === 'IF_ELSE') {
      outPort = 'out';
      outLabel = 'True';
    } else if (nodeToInsert.type === 'PARALLEL_SPLIT') {
      outPort = 'branchA';
      outLabel = 'Branch 1';
    } else if (nodeToInsert.type === 'SEND_TEXT' && nodeToInsert.config?.buttons?.length > 0) {
      outPort = nodeToInsert.config.buttons[0].id;
      outLabel = nodeToInsert.config.buttons[0].title;
    }

    // Create 2nd edge: New Node -> Dest Node
    const edge2 = {
      id: `edge_${Date.now().toString(36)}_out`,
      fromNodeId: nodeToInsert.id,
      fromPort: outPort,
      toNodeId: targetEdge.toNodeId,
      toPort: targetEdge.toPort || 'in',
      label: outLabel
    };

    const newEdgesList = [...remainingEdges, edge1, edge2];
    pushState(nodes, newEdgesList, `⚡ Inserted "${nodeToInsert.label}" into flow!`);
    setSelectedNodeId(nodeToInsert.id);
  };

  // Add Node onto Canvas (either direct or with auto-fit)
  const handleAddNodeAt = (item, canvasX = 300, canvasY = 200, targetEdgeId = null) => {
    const newNodeId = `node_${Date.now().toString(36)}`;
    const newNode = {
      id: newNodeId,
      type: item.type,
      label: item.label,
      position: { x: Math.round(canvasX), y: Math.round(canvasY) },
      config: getDefaultConfigForType(item.type)
    };

    if (targetEdgeId) {
      const targetEdge = edges.find(e => e.id === targetEdgeId);
      const remainingEdges = edges.filter(e => e.id !== targetEdgeId);

      const edge1 = {
        id: `edge_${Date.now().toString(36)}_in`,
        fromNodeId: targetEdge.fromNodeId,
        fromPort: targetEdge.fromPort,
        toNodeId: newNodeId,
        toPort: 'in',
        label: targetEdge.label || ''
      };

      let outPort = 'out';
      let outLabel = '';
      if (newNode.type === 'IF_ELSE') {
        outPort = 'out';
        outLabel = 'True';
      } else if (newNode.type === 'PARALLEL_SPLIT') {
        outPort = 'branchA';
        outLabel = 'Branch 1';
      } else if (newNode.type === 'SEND_TEXT' && newNode.config?.buttons?.length > 0) {
        outPort = newNode.config.buttons[0].id;
        outLabel = newNode.config.buttons[0].title;
      }

      const edge2 = {
        id: `edge_${Date.now().toString(36)}_out`,
        fromNodeId: newNodeId,
        fromPort: outPort,
        toNodeId: targetEdge.toNodeId,
        toPort: targetEdge.toPort || 'in',
        label: outLabel
      };

      pushState([...nodes, newNode], [...remainingEdges, edge1, edge2], `⚡ Inserted "${newNode.label}" into flow!`);
    } else {
      pushState([...nodes, newNode], edges);
    }

    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId, e) => {
    if (e) e.stopPropagation();
    const filteredNodes = nodes.filter(n => n.id !== nodeId);
    const filteredEdges = edges.filter(ed => ed.fromNodeId !== nodeId && ed.toNodeId !== nodeId);
    pushState(filteredNodes, filteredEdges, 'Card deleted');
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(filteredNodes[0]?.id || null);
    }
  };

  const handleDeleteEdge = (edgeId, e) => {
    if (e) e.stopPropagation();
    const filtered = edges.filter(ed => ed.id !== edgeId);
    pushState(nodes, filtered, 'Connection deleted');
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  // Relink an Edge to a new Target Node
  const handleRelinkEdge = (edgeId, newTargetNodeId) => {
    const updatedEdges = edges.map(ed => {
      if (ed.id === edgeId) {
        return { ...ed, toNodeId: newTargetNodeId };
      }
      return ed;
    });
    pushState(nodes, updatedEdges, 'Connection re-routed');
  };

  // Update edge style / shape
  const handleUpdateEdgeStyle = (edgeId, style) => {
    const updated = edges.map(ed => (ed.id === edgeId ? { ...ed, style } : ed));
    pushState(nodes, updated);
  };

  // ========================================================
  // CANVAS MOUSE, TOUCHPAD & WHEEL INTERACTIONS
  // ========================================================
  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // Trackpad Pinch Gesture (e.ctrlKey === true) or Ctrl + Mousewheel
    if (e.ctrlKey) {
      const zoomFactor = Math.exp(-e.deltaY * 0.008);
      const newZoom = Math.min(2.5, Math.max(0.25, +(zoom * zoomFactor).toFixed(3)));

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      // 2-Finger Trackpad Pan or Mouse Wheel
      if (e.shiftKey) {
        setPan(p => ({ ...p, x: Math.round(p.x - e.deltaY) }));
      } else if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
        // If it's a standard vertical-only discrete wheel without X delta, zoom smoothly
        if (e.deltaX === 0 && Math.abs(e.deltaY) >= 40) {
          const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
          const newZoom = Math.min(2.5, Math.max(0.25, +(zoom * zoomFactor).toFixed(2)));
          const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
          const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
          setZoom(newZoom);
          setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        } else {
          // Smooth 2D Pan (trackpad swipe)
          setPan(p => ({
            x: Math.round(p.x - e.deltaX),
            y: Math.round(p.y - e.deltaY)
          }));
        }
      }
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleNodeMouseDown = (nodeId, e) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    nodeDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.position?.x || 0,
      nodeY: node.position?.y || 0
    };
  };

  const handleStartWire = (nodeId, portId, portLabel, e) => {
    e.stopPropagation();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const startX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const startY = (e.clientY - canvasRect.top - pan.y) / zoom;

    setConnectingSource({
      nodeId,
      portId,
      portLabel: portLabel || '',
      startPos: { x: startX, y: startY }
    });
    setConnectingMousePos({ x: startX, y: startY });
  };

  // Start Dragging an existing Edge's Target Handle to move / re-link it
  const handleStartDragEdgeTarget = (edgeId, e) => {
    e.stopPropagation();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom;

    setDraggingEdgeEndpoint({
      edgeId,
      type: 'target',
      currentPos: { x: mouseX, y: mouseY },
      hoverTargetNodeId: null
    });
  };

  const handleEndWire = (targetNodeId, targetPort = 'in', e) => {
    e.stopPropagation();
    if (!connectingSource || connectingSource.nodeId === targetNodeId) {
      setConnectingSource(null);
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      ed => ed.fromNodeId === connectingSource.nodeId &&
            ed.fromPort === connectingSource.portId &&
            ed.toNodeId === targetNodeId
    );

    if (!exists) {
      const newEdge = {
        id: `edge_${Date.now().toString(36)}`,
        fromNodeId: connectingSource.nodeId,
        fromPort: connectingSource.portId,
        toNodeId: targetNodeId,
        toPort: targetPort,
        label: connectingSource.portLabel || ''
      };
      pushState(nodes, [...edges, newEdge], 'Connection linked!');
    }
    setConnectingSource(null);
  };

  const handleCanvasMouseMove = (e) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

    // 1. Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    // 2. Dragging node on canvas
    if (draggingNodeId) {
      const dx = (e.clientX - nodeDragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - nodeDragStartRef.current.mouseY) / zoom;

      let newX = nodeDragStartRef.current.nodeX + dx;
      let newY = nodeDragStartRef.current.nodeY + dy;

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n));

      // Check proximity to existing edges for auto-fit insertion
      const closeEdge = findClosestEdge(newX + 100, newY + 50, 70);
      if (closeEdge && closeEdge.fromNodeId !== draggingNodeId && closeEdge.toNodeId !== draggingNodeId) {
        setInsertCandidateEdgeId(closeEdge.id);
      } else {
        setInsertCandidateEdgeId(null);
      }
      return;
    }

    // 3. Drawing new wire
    if (connectingSource) {
      setConnectingMousePos({ x: mouseCanvasX, y: mouseCanvasY });
      return;
    }

    // 4. Dragging Edge Endpoint (Interactive Re-link)
    if (draggingEdgeEndpoint) {
      // Find hovered node
      const hoveredNode = nodes.find(n => {
        if (n.type === 'START') return false;
        const width = ['IF_ELSE', 'PARALLEL_SPLIT', 'END'].includes(n.type) ? 60 : 260;
        const height = ['IF_ELSE', 'PARALLEL_SPLIT', 'END'].includes(n.type) ? 60 : 120;
        return (
          mouseCanvasX >= n.position.x - 10 &&
          mouseCanvasX <= n.position.x + width + 10 &&
          mouseCanvasY >= n.position.y - 10 &&
          mouseCanvasY <= n.position.y + height + 10
        );
      });

      setDraggingEdgeEndpoint(prev => ({
        ...prev,
        currentPos: { x: mouseCanvasX, y: mouseCanvasY },
        hoverTargetNodeId: hoveredNode?.id || null
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    // If we were dragging a node and dropped it near an edge -> auto insert!
    if (draggingNodeId && insertCandidateEdgeId) {
      const draggedNode = nodes.find(n => n.id === draggingNodeId);
      if (draggedNode) {
        insertNodeIntoEdge(draggedNode, insertCandidateEdgeId);
      }
      setInsertCandidateEdgeId(null);
    }

    // If we were re-linking an edge by dragging its endpoint
    if (draggingEdgeEndpoint) {
      if (draggingEdgeEndpoint.hoverTargetNodeId) {
        handleRelinkEdge(draggingEdgeEndpoint.edgeId, draggingEdgeEndpoint.hoverTargetNodeId);
      }
      setDraggingEdgeEndpoint(null);
    }

    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSource(null);
  };

  // Palette drag over canvas -> detect edge candidate
  const handlePaletteDragOver = (e) => {
    e.preventDefault();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

    const closeEdge = findClosestEdge(mouseCanvasX, mouseCanvasY, 70);
    setInsertCandidateEdgeId(closeEdge ? closeEdge.id : null);
  };

  // Palette drop on canvas
  const handlePaletteDrop = (e) => {
    e.preventDefault();
    if (!paletteDragItem) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const canvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const canvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

    handleAddNodeAt(paletteDragItem, canvasX, canvasY, insertCandidateEdgeId);
    setPaletteDragItem(null);
    setInsertCandidateEdgeId(null);
  };

  // Center Canvas Focus
  const handleCenterFocus = () => {
    if (nodes.length === 0) {
      setPan({ x: 40, y: 40 });
      setZoom(1);
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x + 260);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y + 140);
    });

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const cWidth = canvasRect?.width || 800;
    const cHeight = canvasRect?.height || 600;

    const flowWidth = maxX - minX;
    const flowHeight = maxY - minY;

    const targetZoom = Math.min(1.2, Math.max(0.4, Math.min(cWidth / (flowWidth + 120), cHeight / (flowHeight + 120))));
    const targetPanX = (cWidth - flowWidth * targetZoom) / 2 - minX * targetZoom;
    const targetPanY = (cHeight - flowHeight * targetZoom) / 2 - minY * targetZoom;

    setZoom(+targetZoom.toFixed(2));
    setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
  };

  // Save handler
  const handleSaveClick = async () => {
    setSaving(true);
    try {
      const payload = {
        name: title,
        status,
        nodes,
        edges,
        triggerType: nodes.find(n => n.type === 'START')?.config?.triggerType || 'KEYWORD',
        triggerValue: nodes.find(n => n.type === 'START')?.config?.keywords?.[0] || '',
        actionType: nodes.find(n => n.type === 'SEND_TEXT')?.type || 'SEND_TEXT',
        responseMessage: nodes.find(n => n.type === 'SEND_TEXT')?.config?.message || ''
      };
      if (onSave) await onSave(payload);
      broadcastWorkspaceEvent('RULE_SAVED', { name: title, isWorkflow });
      setUndoToast('Workflow deployed successfully!');
      setTimeout(() => setUndoToast(null), 2500);
    } catch (err) {
      console.error('Failed to save WhatsApp workflow:', err);
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // LIVE SIMULATOR REAL-TIME FLOW GRAPH TRAVERSAL
  // ========================================================
  const handleSendSimMessage = (textToSend = null) => {
    const userInput = (textToSend !== null ? textToSend : simInput).trim();
    if (!userInput) return;

    // Append User Message
    const userMsgObj = {
      id: `sim_user_${Date.now()}`,
      sender: 'user',
      text: userInput
    };
    setSimMessages(prev => [...prev, userMsgObj]);
    setSimInput('');
    setSimTyping(true);

    const normInput = userInput.toLowerCase().replace(/[*_~`]/g, '').trim();

    setTimeout(() => {
      setSimTyping(false);

      // 1. Initial State / Start Trigger
      const startNode = nodes.find(n => n.type === 'START');
      const startKeywords = (startNode?.config?.keywords || ['hi', 'hello', 'hey', 'menu', 'start'])
        .map(k => k.toLowerCase().trim());

      const isStartTrigger = startKeywords.some(kw => normInput.includes(kw) || kw.includes(normInput));

      if (isStartTrigger || !simCurrentNodeId) {
        // Follow edge from START node
        const firstEdge = edges.find(e => e.fromNodeId === (startNode?.id || 'node_start'));
        const nextNode = nodes.find(n => n.id === firstEdge?.toNodeId) || nodes.find(n => n.type === 'SEND_TEXT');

        if (nextNode) {
          setSimCurrentNodeId(nextNode.id);
          setSimMessages(prev => [
            ...prev,
            {
              id: `sim_bot_${Date.now()}`,
              sender: 'bot',
              text: nextNode.config?.message || 'Namaste! Please select an option:',
              buttons: nextNode.config?.buttons || []
            }
          ]);
          return;
        }
      }

      // 2. We are at a specific node -> Trace outgoing edges matching user choice
      const currentNode = nodes.find(n => n.id === simCurrentNodeId);
      if (currentNode) {
        // Find outgoing edges from this node
        const outgoingEdges = edges.filter(e => e.fromNodeId === currentNode.id);

        let matchedEdge = null;

        // Check button match by ID or title
        for (const edge of outgoingEdges) {
          const btn = (currentNode.config?.buttons || []).find(b => b.id === edge.fromPort);
          const btnTitle = (btn?.title || edge.label || '').toLowerCase();
          const btnValue = (btn?.value || '').toLowerCase();

          if (
            edge.fromPort === normInput ||
            btnTitle.includes(normInput) ||
            (btnValue && btnValue.includes(normInput)) ||
            (normInput === '1' && btnTitle.includes('1')) ||
            (normInput === '2' && btnTitle.includes('2')) ||
            (normInput === '3' && btnTitle.includes('3'))
          ) {
            matchedEdge = edge;
            break;
          }
        }

        // If not matched directly on buttons, check if outgoing edge is default 'out'
        if (!matchedEdge && outgoingEdges.length === 1 && outgoingEdges[0].fromPort === 'out') {
          matchedEdge = outgoingEdges[0];
        }

        if (matchedEdge) {
          const targetNode = nodes.find(n => n.id === matchedEdge.toNodeId);
          if (targetNode) {
            setSimCurrentNodeId(targetNode.id);

            let replyText = targetNode.config?.message || targetNode.config?.question || `Navigated to ${targetNode.label}`;
            if (targetNode.type === 'CATALOG') {
              replyText = `🛍️ Product Catalog:\n${targetNode.config?.catalogUrl || 'https://example.com/catalog'}\n\n${targetNode.config?.message || ''}`;
            }

            setSimMessages(prev => [
              ...prev,
              {
                id: `sim_bot_${Date.now()}`,
                sender: 'bot',
                text: replyText,
                buttons: targetNode.config?.buttons || []
              }
            ]);
            return;
          }
        }
      }

      // 3. Fallback
      setSimMessages(prev => [
        ...prev,
        {
          id: `sim_bot_${Date.now()}`,
          sender: 'bot',
          text: `Received: "${userInput}". Reply with "menu" or "hi" to restart the flow.`
        }
      ]);
    }, 600);
  };

  const handleResetSimulator = () => {
    setSimMessages([
      {
        id: `sim_init_${Date.now()}`,
        sender: 'bot',
        text: '🔄 Simulator Reset. Send "hi" or "menu" to test your workflow.'
      }
    ]);
    setSimCurrentNodeId(null);
    setSimInput('');
    setSimTyping(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        bgcolor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* ========================================================
          1. TOPBAR
          ======================================================== */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 20
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Back">
            <IconButton size="small" onClick={onClose || (() => navigate(-1))} sx={{ color: '#475569' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '6px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1.1rem' }}>
              💬
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', display: 'block', lineHeight: 1 }}>
                Visual Flow Designer (2D Canvas)
              </Typography>
              <TextField
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: { color: '#0F172A', fontWeight: 800, fontSize: '1.05rem', letterSpacing: 0.2 }
                }}
                sx={{ width: { xs: 160, sm: 260, md: 320 } }}
              />
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Arrow Style Selector */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: '#F1F5F9', borderRadius: '8px', p: 0.3 }}>
            <Tooltip title="Curved Bezier Arrows">
              <IconButton
                size="small"
                onClick={() => setGlobalEdgeStyle('bezier')}
                sx={{
                  bgcolor: globalEdgeStyle === 'bezier' ? '#FFFFFF' : 'transparent',
                  color: globalEdgeStyle === 'bezier' ? '#0284C7' : '#64748B',
                  boxShadow: globalEdgeStyle === 'bezier' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  borderRadius: '6px',
                  p: 0.5
                }}
              >
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step / Orthogonal Elbow Arrows">
              <IconButton
                size="small"
                onClick={() => setGlobalEdgeStyle('orthogonal')}
                sx={{
                  bgcolor: globalEdgeStyle === 'orthogonal' ? '#FFFFFF' : 'transparent',
                  color: globalEdgeStyle === 'orthogonal' ? '#0284C7' : '#64748B',
                  boxShadow: globalEdgeStyle === 'orthogonal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  borderRadius: '6px',
                  p: 0.5
                }}
              >
                <PolylineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Straight Line Arrows">
              <IconButton
                size="small"
                onClick={() => setGlobalEdgeStyle('straight')}
                sx={{
                  bgcolor: globalEdgeStyle === 'straight' ? '#FFFFFF' : 'transparent',
                  color: globalEdgeStyle === 'straight' ? '#0284C7' : '#64748B',
                  boxShadow: globalEdgeStyle === 'straight' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  borderRadius: '6px',
                  p: 0.5
                }}
              >
                <ShowChartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
            sx={{ bgcolor: '#0284C7', color: '#FFF', fontWeight: 700, textTransform: 'none', px: 2 }}
            onClick={() => {
              setRightPanelOpen(true);
              setRightPanelTab(1);
            }}
          >
            Run / Test
          </Button>

          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveClick}
            disabled={saving}
            sx={{
              bgcolor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
              '&:hover': { bgcolor: '#15803D' }
            }}
          >
            {saving ? 'Saving...' : 'Deploy Workflow'}
          </Button>
        </Stack>
      </Box>

      {/* Sub-Header Metadata Bar & Viewport Controls */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          px: 3,
          py: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#475569'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            <strong>Nodes:</strong> {nodes.length} | <strong>Connections:</strong> {edges.length}
          </Typography>
          <Chip
            icon={<FlashOnIcon sx={{ fontSize: '13px !important', color: '#D97706' }} />}
            label="Drop card onto any arrow to automatically insert into flow"
            size="small"
            sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 700, height: 22, fontSize: '0.7rem', border: '1px solid #FDE68A' }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={past.length === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={future.length === 0}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ my: 0.5, mx: 0.5 }} />
          <Tooltip title="Center View">
            <IconButton size="small" onClick={handleCenterFocus}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In (+)">
            <IconButton size="small" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Click to Reset 100%">
            <Chip
              label={`${Math.round(zoom * 100)}%`}
              size="small"
              onClick={() => setZoom(1)}
              sx={{ fontWeight: 800, cursor: 'pointer', height: 22, bgcolor: '#F1F5F9' }}
            />
          </Tooltip>
          <Tooltip title="Zoom Out (-)">
            <IconButton size="small" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(1)))}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ========================================================
          MAIN 2D WORKSPACE (PALETTE | CANVAS | INSPECTOR)
          ======================================================== */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', position: 'relative' }}>
        
        {/* ========================================================
            LEFT COLUMN: PALETTE
            ======================================================== */}
        <Box
          sx={{
            width: leftPaletteOpen ? 240 : 0,
            minWidth: leftPaletteOpen ? 240 : 0,
            maxWidth: 240,
            flexShrink: 0,
            bgcolor: '#FFFFFF',
            borderRight: leftPaletteOpen ? '1px solid #E2E8F0' : 'none',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            transition: 'width 0.2s ease',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {/* Flow Controls */}
            <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent', mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 32, px: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1E293B' }}>
                  Flow Gateways
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {FLOW_CONTROLS.map(item => (
                    <Box
                      key={item.type}
                      draggable
                      onDragStart={() => setPaletteDragItem(item)}
                      onClick={() => handleAddNodeAt(item, 300, 200)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 0.8,
                        borderRadius: '6px',
                        border: '1px solid #F1F5F9',
                        cursor: 'grab',
                        bgcolor: '#F8FAFC',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: '#FFFFFF',
                          borderColor: item.color,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: item.color, lineHeight: 1 }}>
                        {item.icon}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#334155', mt: 0.5, textAlign: 'center' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Conversational Actions */}
            <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 32, px: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1E293B' }}>
                  Conversational Cards
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0.5 }}>
                <Stack spacing={0.8}>
                  {MESSAGING_ACTIONS.map(service => (
                    <Paper
                      key={service.type}
                      draggable
                      onDragStart={() => setPaletteDragItem(service)}
                      onClick={() => handleAddNodeAt(service, 350, 220)}
                      sx={{
                        p: 1,
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        bgcolor: '#FFFFFF',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: service.color,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <Box sx={{ width: 26, height: 26, borderRadius: '4px', bgcolor: `${service.color}15`, color: service.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                        {service.icon}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.74rem', color: '#1E293B', display: 'block' }}>
                          {service.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748B', display: 'block' }}>
                          {service.desc}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* ========================================================
            CENTER COLUMN: 2D FREEFORM SVG CANVAS
            ======================================================== */}
        <Box
          ref={canvasRef}
          onWheel={handleCanvasWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDragOver={handlePaletteDragOver}
          onDrop={handlePaletteDrop}
          sx={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            bgcolor: '#FAFAFA',
            position: 'relative',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'default',
            backgroundImage: snapToGrid ? 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)' : 'none',
            backgroundSize: '24px 24px',
            touchAction: 'none'
          }}
        >
          {/* Zoom/Pan Scaled Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          >
            {/* ========================================================
                SVG LAYER: DIRECTIONAL ARROWS & CONNECTION WIRES
                ======================================================== */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 6000,
                height: 6000,
                overflow: 'visible',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284C7" />
                </marker>
                <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
                </marker>
                <marker id="arrow-ghost" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
                </marker>
                <marker id="arrow-candidate" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
                </marker>
              </defs>

              {/* Render Existing Edges */}
              {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.fromNodeId);
                const toNode = nodes.find(n => n.id === edge.toNodeId);
                if (!fromNode || !toNode) return null;

                const start = getNodePortPos(fromNode, edge.fromPort);
                let end = getNodePortPos(toNode, 'in');

                const isSelected = selectedEdgeId === edge.id;
                const isCandidate = insertCandidateEdgeId === edge.id;
                const edgeStyle = edge.style || globalEdgeStyle;

                // If currently dragging this edge's target endpoint to re-link
                if (draggingEdgeEndpoint && draggingEdgeEndpoint.edgeId === edge.id && draggingEdgeEndpoint.type === 'target') {
                  end = draggingEdgeEndpoint.currentPos;
                }

                const pathD = getEdgePathD(start, end, edgeStyle);
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                const strokeColor = isCandidate ? '#F59E0B' : (isSelected ? '#DC2626' : (edge.color || '#0284C7'));
                const markerEnd = isCandidate ? 'url(#arrow-candidate)' : (isSelected ? 'url(#arrow-selected)' : 'url(#arrow)');

                return (
                  <g key={edge.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}>
                    {/* Broad invisible stroke for easy clicking */}
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth="24" />
                    
                    {/* Visual Edge Path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isCandidate ? '4' : (isSelected ? '3.5' : '2.2')}
                      markerEnd={markerEnd}
                      strokeDasharray={isCandidate ? '6 4' : (isSelected ? '6 3' : 'none')}
                    />

                    {/* Auto-Insert Indicator Glow */}
                    {isCandidate && (
                      <g transform={`translate(${midX}, ${midY - 20})`}>
                        <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                        <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="900" fill="#B45309">
                          ⚡ Drop to Insert
                        </text>
                      </g>
                    )}

                    {/* Edge Label Badge with Clickable Actions */}
                    {!isCandidate && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-45"
                          y="-12"
                          width="90"
                          height="24"
                          rx="12"
                          fill={isSelected ? '#FEF2F2' : '#FFFFFF'}
                          stroke={isSelected ? '#DC2626' : '#0284C7'}
                          strokeWidth={isSelected ? '1.5' : '1'}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                        />
                        <text x="-8" y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill={isSelected ? '#DC2626' : '#0284C7'} style={{ userSelect: 'none' }}>
                          {edge.label || 'Link'}
                        </text>
                        
                        {/* Direct Clickable Delete Socket on Edge */}
                        <g onClick={(e) => handleDeleteEdge(edge.id, e)} style={{ cursor: 'pointer' }}>
                          <circle cx="28" cy="0" r="8" fill="#DC2626" />
                          <text x="28" y="3" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFF">×</text>
                        </g>
                      </g>
                    )}

                    {/* Interactive Endpoint Drag Handle when Selected */}
                    {isSelected && (
                      <g>
                        {/* Target Re-link Drag Handle */}
                        <circle
                          cx={end.x}
                          cy={end.y}
                          r="7"
                          fill="#DC2626"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          style={{ cursor: 'crosshair', filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.5))' }}
                          onMouseDown={(e) => handleStartDragEdgeTarget(edge.id, e)}
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Live Wire Being Drawn */}
              {connectingSource && (
                <path
                  d={getEdgePathD(connectingSource.startPos, connectingMousePos, globalEdgeStyle)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  markerEnd="url(#arrow-ghost)"
                />
              )}
            </svg>

            {/* ========================================================
                RENDER NODES ON 2D CANVAS
                ======================================================== */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const pItem = ALL_PALETTE_ITEMS.find(i => i.type === node.type) || { color: '#0284C7' };
              const isTargetHovered = draggingEdgeEndpoint?.hoverTargetNodeId === node.id;

              return (
                <Box
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  sx={{
                    position: 'absolute',
                    left: node.position?.x || 0,
                    top: node.position?.y || 0,
                    pointerEvents: 'auto',
                    cursor: 'move',
                    transition: draggingNodeId === node.id ? 'none' : 'box-shadow 0.15s ease',
                    filter: isTargetHovered ? 'drop-shadow(0 0 10px #10B981)' : 'none'
                  }}
                >
                  {/* 1. START NODE (Circle ▷) */}
                  {node.type === 'START' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          border: isSelected ? '3.5px solid #D97706' : '2.5px solid #D97706',
                          bgcolor: '#FFFBEB',
                          color: '#D97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 0 5px rgba(217, 119, 6, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, ml: 0.4 }}>▷</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 800, fontSize: '0.75rem', color: '#D97706' }}>
                        Start
                      </Typography>

                      {/* Out Port Handle */}
                      <Tooltip title="Drag arrow to connect start trigger to first card">
                        <Box
                          onMouseDown={(e) => handleStartWire(node.id, 'out', '', e)}
                          sx={{
                            position: 'absolute',
                            right: -8,
                            top: 17,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: '#D97706',
                            border: '2px solid #FFFFFF',
                            cursor: 'crosshair',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.3)' }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}

                  {/* 2. END NODE (Double Circle ◎) */}
                  {node.type === 'END' && (
                    <Box
                      onMouseUp={(e) => handleEndWire(node.id, 'in', e)}
                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                    >
                      {/* In Port Handle */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: -8,
                          top: 17,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: '#DC2626',
                          border: '2px solid #FFFFFF',
                          boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                        }}
                      />

                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          border: isSelected ? '4px double #DC2626' : '3px double #DC2626',
                          bgcolor: '#FEF2F2',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 0 5px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #DC2626' }} />
                      </Box>
                      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 800, fontSize: '0.75rem', color: '#DC2626' }}>
                        End
                      </Typography>
                    </Box>
                  )}

                  {/* 3. CONDITION SPLIT (Diamond ✕) */}
                  {node.type === 'IF_ELSE' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {/* In Port */}
                      <Box
                        onMouseUp={(e) => handleEndWire(node.id, 'in', e)}
                        sx={{
                          position: 'absolute',
                          left: -12,
                          top: 16,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: '#16A34A',
                          border: '2px solid #FFFFFF',
                          boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                        }}
                      />

                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          transform: 'rotate(45deg)',
                          border: isSelected ? '3px solid #16A34A' : '2px solid #16A34A',
                          bgcolor: '#F0FDF4',
                          color: '#16A34A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          boxShadow: isSelected ? '0 0 0 5px rgba(22, 163, 74, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Typography sx={{ transform: 'rotate(-45deg)', fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>
                          ✕
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 1.2, fontWeight: 800, fontSize: '0.75rem', color: '#16A34A' }}>
                        {node.label}
                      </Typography>

                      {/* Out Branch Handles */}
                      <Tooltip title="Drag 'True' branch to card">
                        <Box
                          onMouseDown={(e) => handleStartWire(node.id, 'out', 'True', e)}
                          sx={{
                            position: 'absolute',
                            right: -12,
                            top: 8,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: '#16A34A',
                            border: '2px solid #FFFFFF',
                            cursor: 'crosshair',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.3)' }
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Drag 'Else' fallback to card">
                        <Box
                          onMouseDown={(e) => handleStartWire(node.id, 'else', 'Else', e)}
                          sx={{
                            position: 'absolute',
                            right: -12,
                            top: 28,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: '#DC2626',
                            border: '2px solid #FFFFFF',
                            cursor: 'crosshair',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.3)' }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}

                  {/* 4. PARALLEL SPLIT (Diamond +) */}
                  {node.type === 'PARALLEL_SPLIT' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {/* In Port */}
                      <Box
                        onMouseUp={(e) => handleEndWire(node.id, 'in', e)}
                        sx={{
                          position: 'absolute',
                          left: -12,
                          top: 16,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: '#0D9488',
                          border: '2px solid #FFFFFF',
                          boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                        }}
                      />

                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          transform: 'rotate(45deg)',
                          border: isSelected ? '3px solid #0D9488' : '2px solid #0D9488',
                          bgcolor: '#F0FDFA',
                          color: '#0D9488',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          boxShadow: isSelected ? '0 0 0 5px rgba(13, 148, 136, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Typography sx={{ transform: 'rotate(-45deg)', fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>
                          +
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 1.2, fontWeight: 800, fontSize: '0.75rem', color: '#0D9488' }}>
                        {node.label}
                      </Typography>

                      {/* Out Branch Handles */}
                      <Tooltip title="Drag 'Branch 1' to concurrent card">
                        <Box
                          onMouseDown={(e) => handleStartWire(node.id, 'branchA', 'Branch 1', e)}
                          sx={{
                            position: 'absolute',
                            right: -12,
                            top: 8,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: '#0D9488',
                            border: '2px solid #FFFFFF',
                            cursor: 'crosshair',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.3)' }
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Drag 'Branch 2' to concurrent card">
                        <Box
                          onMouseDown={(e) => handleStartWire(node.id, 'branchB', 'Branch 2', e)}
                          sx={{
                            position: 'absolute',
                            right: -12,
                            top: 28,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: '#0284C7',
                            border: '2px solid #FFFFFF',
                            cursor: 'crosshair',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                            '&:hover': { transform: 'scale(1.3)' }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}

                  {/* 5. CONVERSATIONAL MESSAGE & BUTTONS CARD */}
                  {!['START', 'END', 'IF_ELSE', 'PARALLEL_SPLIT'].includes(node.type) && (
                    <Paper
                      elevation={isSelected ? 6 : 2}
                      sx={{
                        width: 260,
                        borderRadius: '8px',
                        overflow: 'visible',
                        border: isSelected ? `2.5px solid ${pItem.color || '#0284C7'}` : '1px solid #CBD5E1',
                        bgcolor: '#FFFFFF',
                        position: 'relative',
                        boxShadow: isSelected ? `0 0 0 4px ${pItem.color}25, 0 8px 20px rgba(0,0,0,0.1)` : '0 2px 10px rgba(0,0,0,0.06)'
                      }}
                    >
                      {/* Left Input Port Handle */}
                      <Box
                        onMouseUp={(e) => handleEndWire(node.id, 'in', e)}
                        sx={{
                          position: 'absolute',
                          left: -8,
                          top: 16,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: pItem.color || '#0284C7',
                          border: '2.5px solid #FFFFFF',
                          boxShadow: '0 0 4px rgba(0,0,0,0.25)',
                          zIndex: 5
                        }}
                      />

                      {/* Default Right Output Port Handle (for cards without buttons) */}
                      {(!node.config?.buttons || node.config.buttons.length === 0) && (
                        <Tooltip title="Drag arrow to link to next card">
                          <Box
                            onMouseDown={(e) => handleStartWire(node.id, 'out', '', e)}
                            sx={{
                              position: 'absolute',
                              right: -8,
                              top: 16,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: pItem.color || '#0284C7',
                              border: '2.5px solid #FFFFFF',
                              cursor: 'crosshair',
                              boxShadow: '0 0 4px rgba(0,0,0,0.25)',
                              zIndex: 5,
                              '&:hover': { transform: 'scale(1.3)' }
                            }}
                          />
                        </Tooltip>
                      )}

                      {/* Header Stripe */}
                      <Box
                        sx={{
                          bgcolor: pItem.color || '#0284C7',
                          color: '#FFFFFF',
                          px: 1.5,
                          py: 0.8,
                          borderRadius: '6px 6px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <span>{pItem.icon}</span>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>
                            {node.label}
                          </Typography>
                        </Stack>
                        <IconButton size="small" onClick={(e) => handleDeleteNode(node.id, e)} sx={{ color: '#FFF', p: 0.2 }}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>

                      {/* Card Content Body */}
                      <Box sx={{ p: 1.5 }}>
                        {node.config?.message && (
                          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#334155', display: 'block', mb: 1, whiteSpace: 'pre-line', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {node.config.message}
                          </Typography>
                        )}

                        {/* Interactive Buttons List with Dedicated Connection Dots */}
                        {node.config?.buttons && node.config.buttons.length > 0 && (
                          <Stack spacing={0.8} sx={{ mt: 1 }}>
                            {node.config.buttons.map((btn, bIdx) => (
                              <Box
                                key={btn.id || bIdx}
                                sx={{
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  bgcolor: '#F0F9FF',
                                  border: '1px solid #BAE6FD',
                                  borderRadius: '6px',
                                  px: 1.2,
                                  py: 0.5
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#0284C7' }}>
                                  🔘 {btn.title}
                                </Typography>

                                {/* Direct Connection Handle on Button */}
                                <Tooltip title={`Drag to connect "${btn.title}" to target card`}>
                                  <Box
                                    onMouseDown={(e) => handleStartWire(node.id, btn.id, btn.title, e)}
                                    sx={{
                                      position: 'absolute',
                                      right: -7,
                                      width: 14,
                                      height: 14,
                                      borderRadius: '50%',
                                      bgcolor: '#0284C7',
                                      border: '2px solid #FFFFFF',
                                      cursor: 'crosshair',
                                      boxShadow: '0 0 3px rgba(0,0,0,0.3)',
                                      '&:hover': { transform: 'scale(1.4)', bgcolor: '#0369A1' }
                                    }}
                                  />
                                </Tooltip>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* ========================================================
              FLOATING CANVAS CONTROLS (BOTTOM-LEFT)
              ======================================================== */}
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              p: 0.5,
              borderRadius: '24px',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 10
            }}
          >
            <Tooltip title="Zoom In (+)">
              <IconButton size="small" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Click to Reset 100%">
              <Typography variant="caption" onClick={() => setZoom(1)} sx={{ px: 1, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}>
                {Math.round(zoom * 100)}%
              </Typography>
            </Tooltip>
            <Tooltip title="Zoom Out (-)">
              <IconButton size="small" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(1)))}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
            <Tooltip title="Center Canvas View">
              <IconButton size="small" onClick={handleCenterFocus}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Quick Delete Selected Item */}
            {(selectedNodeId || selectedEdgeId) && (
              <>
                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                <Tooltip title={selectedEdgeId ? "Delete Connection Arrow" : "Delete Selected Card"}>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      if (selectedEdgeId) handleDeleteEdge(selectedEdgeId);
                      else if (selectedNodeId) handleDeleteNode(selectedNodeId);
                    }}
                    sx={{
                      height: 26,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '14px',
                      textTransform: 'none',
                      px: 1.2
                    }}
                  >
                    Delete {selectedEdgeId ? 'Link' : 'Card'}
                  </Button>
                </Tooltip>
              </>
            )}
          </Paper>
        </Box>

        {/* ========================================================
            RIGHT COLUMN: PROPERTIES & LIVE SIMULATOR
            ======================================================== */}
        <Box
          sx={{
            width: rightPanelOpen ? (rightPanelTab === 1 ? 380 : 340) : 0,
            minWidth: rightPanelOpen ? (rightPanelTab === 1 ? 380 : 340) : 0,
            maxWidth: 390,
            flexShrink: 0,
            bgcolor: '#FFFFFF',
            borderLeft: rightPanelOpen ? '1px solid #E2E8F0' : 'none',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            transition: 'width 0.2s ease',
            overflow: 'hidden'
          }}
        >
          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Tabs
              value={rightPanelTab}
              onChange={(e, val) => setRightPanelTab(val)}
              variant="fullWidth"
              sx={{ minHeight: 40 }}
            >
              <Tab
                icon={<SettingsIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Properties"
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 40 }}
              />
              <Tab
                icon={<PhoneAndroidIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Live Simulator"
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 40 }}
              />
            </Tabs>
          </Box>

          {/* Tab 0: Properties Inspector */}
          {rightPanelTab === 0 && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {/* If an EDGE is selected: show Connection Relinking & Shape Options */}
              {selectedEdge ? (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LinkIcon sx={{ color: '#0284C7' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                        Connection Link
                      </Typography>
                    </Stack>
                    <IconButton size="small" onClick={() => setSelectedEdgeId(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ p: 1.5, bgcolor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                    <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 800, display: 'block', mb: 0.5 }}>
                      Connection Path:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                      {nodes.find(n => n.id === selectedEdge.fromNodeId)?.label || 'Source'}
                      {selectedEdge.label ? ` (${selectedEdge.label})` : ''} ➔ {nodes.find(n => n.id === selectedEdge.toNodeId)?.label || 'Target'}
                    </Typography>
                  </Box>

                  {/* Arrow Shape Style Selector */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.8 }}>
                      Arrow Routing & Shape:
                    </Typography>
                    <ToggleButtonGroup
                      value={selectedEdge.style || globalEdgeStyle}
                      exclusive
                      onChange={(e, val) => { if (val) handleUpdateEdgeStyle(selectedEdge.id, val); }}
                      fullWidth
                      size="small"
                      sx={{ bgcolor: '#FFFFFF' }}
                    >
                      <ToggleButton value="bezier" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                        〰️ Curved
                      </ToggleButton>
                      <ToggleButton value="orthogonal" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                        🔲 Step
                      </ToggleButton>
                      <ToggleButton value="rounded_step" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                        ↪️ Round
                      </ToggleButton>
                      <ToggleButton value="straight" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                        ➖ Straight
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Relink Target Card Selector */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.8 }}>
                      Change / Redirect Target Card:
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedEdge.toNodeId}
                        onChange={(e) => handleRelinkEdge(selectedEdge.id, e.target.value)}
                        sx={{ bgcolor: '#FFFFFF', borderRadius: '8px' }}
                      >
                        {nodes
                          .filter(n => n.id !== selectedEdge.fromNodeId && n.type !== 'START')
                          .map(targetN => (
                            <MenuItem key={targetN.id} value={targetN.id}>
                              {targetN.label}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Delete Link Button */}
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<LinkOffIcon />}
                    onClick={() => handleDeleteEdge(selectedEdge.id)}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                  >
                    Delete Connection (Disconnect)
                  </Button>
                </Stack>
              ) : selectedNode ? (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', pb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                      {selectedNode.label}
                    </Typography>
                    <IconButton size="small" onClick={() => setRightPanelOpen(false)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Node Label */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Card Label:
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={selectedNode.label}
                      onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                    />
                  </Box>

                  {/* START Trigger */}
                  {selectedNode.type === 'START' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        Customer Trigger Keywords
                      </Typography>
                      <KeywordConfigEditor node={selectedNode} onChange={updateSelectedNodeConfig} />
                    </Box>
                  )}

                  {/* SEND_TEXT & BUTTONS */}
                  {selectedNode.type === 'SEND_TEXT' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        WhatsApp Message Text
                      </Typography>
                      <SmartTagToolbar
                        targetInputRef={sendTextInputRef}
                        currentText={selectedNode.config?.message || ''}
                        onInsertTag={(_, newText) => updateSelectedNodeConfig({ message: newText })}
                      />
                      <TextField
                        inputRef={sendTextInputRef}
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        value={selectedNode.config?.message || ''}
                        onChange={(e) => updateSelectedNodeConfig({ message: e.target.value })}
                        sx={{ mb: 1.5 }}
                      />

                      {/* Button List Configuration */}
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>
                        Menu Buttons (Links to Next Cards):
                      </Typography>
                      <Stack spacing={1}>
                        {(selectedNode.config?.buttons || []).map((btn, idx) => (
                          <Stack key={btn.id || idx} direction="row" spacing={1} alignItems="center">
                            <TextField
                              size="small"
                              fullWidth
                              label={`Button ${idx + 1}`}
                              value={btn.title}
                              onChange={(e) => {
                                const btns = [...selectedNode.config.buttons];
                                btns[idx] = { ...btns[idx], title: e.target.value };
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
                        ))}

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const btns = [...(selectedNode.config?.buttons || [])];
                            btns.push({ id: `b_${Date.now()}`, title: `Option ${btns.length + 1}` });
                            updateSelectedNodeConfig({ buttons: btns });
                          }}
                          disabled={(selectedNode.config?.buttons || []).length >= 4}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          + Add Menu Option
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  {/* CATALOG */}
                  {selectedNode.type === 'CATALOG' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
                        Product Catalog Link
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        label="Catalog URL"
                        value={selectedNode.config?.catalogUrl || ''}
                        onChange={(e) => updateSelectedNodeConfig({ catalogUrl: e.target.value })}
                        sx={{ mb: 1.5 }}
                      />
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        label="Accompanying Message"
                        value={selectedNode.config?.message || ''}
                        onChange={(e) => updateSelectedNodeConfig({ message: e.target.value })}
                      />
                    </Box>
                  )}

                  {/* Delete Card Button */}
                  {!['node_start', 'node_end'].includes(selectedNode.id) && (
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<DeleteIcon />}
                      onClick={(e) => handleDeleteNode(selectedNode.id, e)}
                      sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', mt: 2 }}
                    >
                      Delete Card
                    </Button>
                  )}
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center', mt: 4, display: 'block' }}>
                  Select an element on the canvas to inspect properties.
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
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <Paper
                elevation={12}
                sx={{
                  width: '320px',
                  height: '520px',
                  borderRadius: '28px',
                  border: '6px solid #334155',
                  bgcolor: '#EFEAE2',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <Box sx={{ bgcolor: '#075E54', color: '#FFF', px: 2, py: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '0.85rem' }}>
                      🤖
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.1 }}>
                        Renic Assistant
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#86EFAC' }}>
                        online (simulator active)
                      </Typography>
                    </Box>
                  </Stack>
                  <Tooltip title="Reset Simulator">
                    <IconButton size="small" onClick={handleResetSimulator} sx={{ color: '#FFF' }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Chat Body */}
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2,
                    backgroundImage: 'radial-gradient(#CBD5E1 0.7px, transparent 0.7px)',
                    backgroundSize: '16px 16px'
                  }}
                >
                  {simMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: msg.sender === 'user' ? '#DCF8C6' : '#FFFFFF',
                          color: '#0F172A',
                          p: 1.2,
                          borderRadius: msg.sender === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          fontSize: '0.78rem',
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {msg.text}
                      </Box>

                      {/* Clickable Buttons */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <Stack spacing={0.6} sx={{ mt: 0.8 }}>
                          {msg.buttons.map((btn, bIdx) => (
                            <Button
                              key={bIdx}
                              variant="contained"
                              size="small"
                              onClick={() => handleSendSimMessage(btn.value || btn.title)}
                              sx={{
                                bgcolor: '#FFFFFF',
                                color: '#0284C7',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                border: '1px solid #BAE6FD',
                                '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' }
                              }}
                            >
                              🔘 {btn.title}
                            </Button>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}

                  {simTyping && (
                    <Box sx={{ alignSelf: 'flex-start', bgcolor: '#FFFFFF', px: 1.5, py: 0.8, borderRadius: '0 12px 12px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                        bot typing...
                      </Typography>
                    </Box>
                  )}

                  <div ref={simChatEndRef} />
                </Box>

                {/* Input Bar */}
                <Box
                  sx={{
                    p: 1,
                    bgcolor: '#F0F2F5',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Type a message (e.g. hi, 1, rings)..."
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendSimMessage();
                      }
                    }}
                    InputProps={{
                      style: { fontSize: '0.75rem', height: 34, bgcolor: '#FFFFFF', borderRadius: 20 }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleSendSimMessage()}
                    disabled={!simInput.trim()}
                    sx={{ bgcolor: '#075E54', color: '#FFF', '&:hover': { bgcolor: '#128C7E' }, width: 34, height: 34 }}
                  >
                    <SendIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Undo Toast */}
      {undoToast && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#0F172A',
            color: '#86EFAC',
            border: '1px solid #334155',
            px: 2.5,
            py: 1,
            borderRadius: '24px',
            fontSize: '0.82rem',
            fontWeight: 800,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}
        >
          {undoToast}
        </Box>
      )}
    </Box>
  );
}

// Helper default configs
function getDefaultConfigForType(type) {
  switch (type) {
    case 'START':
      return { triggerType: 'KEYWORD', keywords: ['hi', 'hello', 'menu'], matchType: 'CONTAINS' };
    case 'END':
      return { terminationType: 'COMPLETE' };
    case 'IF_ELSE':
      return {
        expressions: [
          { id: '1', label: 'Option 1', expr: "choice == '1'", message: 'You selected Option 1.' },
          { id: '2', label: 'Option 2', expr: "choice == '2'", message: 'You selected Option 2.' }
        ],
        elseBranch: { message: 'Standard Fallback Response' }
      };
    case 'PARALLEL_SPLIT':
      return {
        branchA: { label: 'Customer Message', message: 'Acknowledgment sent to customer.' },
        branchB: { label: 'Internal Staff Alert', message: 'Staff notification triggered.' }
      };
    case 'SEND_TEXT':
      return {
        message: 'Namaste! How can we assist you today?',
        buttons: [{ id: 'b1', title: '1. Catalog' }, { id: 'b2', title: '2. Talk to Agent' }]
      };
    case 'QUICK_REPLY':
      return {
        message: 'Please select an option below:',
        buttons: [{ id: 'b1', title: '1. Jewelry' }, { id: 'b2', title: '2. Support' }]
      };
    case 'ASK_DATA':
      return { question: 'Please enter your delivery address:', saveField: 'address' };
    case 'WAIT_TIMER':
      return { delaySeconds: 5 };
    case 'AI_SCRIPT':
      return { aiPrompt: 'Help customer with product recommendations and details.' };
    case 'CATALOG':
      return { catalogUrl: 'https://renicjewels.com/catalog', message: 'Here is our full product catalog!' };
    default:
      return {};
  }
}
