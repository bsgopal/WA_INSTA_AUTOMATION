import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, TextField, Button, Switch,
  FormControlLabel, Divider, Stack, Card, CardContent, IconButton,
  MenuItem, FormControl, InputLabel, Select, Drawer, Tooltip,
  Alert, Chip, CircularProgress, Tabs, Tab, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import AIProviderStatus from '../../components/AIProviderStatus';
import SapDmProcessDesigner from '../../components/SAPDM/SapDmProcessDesigner';
import SmartTagToolbar from '../../components/SmartTagToolbar';

export default function ResponseRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('KEYWORD');
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState('SEND_TEXT');
  const [templateId, setTemplateId] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [blocks, setBlocks] = useState([]);
  const [historyStack, setHistoryStack] = useState({ past: [], future: [] });
  const [paletteTab, setPaletteTab] = useState(0);

  const [openAICopilot, setOpenAICopilot] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const modalResponseInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [draftReview, setDraftReview] = useState(null);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', type: '', ruleId: null });
  const [activeTab, setActiveTab] = useState('ALL');
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE');
  const [selectedDetailRule, setSelectedDetailRule] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: '',
    triggerKeywords: '',
    actionType: 'SEND_TEXT',
    workflowId: '',
    responseText: '',
    buttons: ['View Catalog', 'Talk to Human']
  });

  // Unified Hub State ('RULES' or 'WORKFLOWS')
  const [hubTab, setHubTab] = useState('RULES');
  const [isWorkflowDesigner, setIsWorkflowDesigner] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState('');

  const ROW_ACTION_OPTIONS = [
    { value: 'CUSTOM', label: 'Custom Trigger' },
    { value: 'QUICK_REPLY', label: 'Quick Reply' },
    { value: 'TEMPLATE', label: 'Message Template' },
    { value: 'RESPONSE_RULE', label: 'Trigger Response Rule' },
    { value: 'WORKFLOW', label: 'Trigger Workflow' },
    { value: 'URL', label: 'Open URL' },
    { value: 'CATALOG', label: 'Catalog Link' }
  ];

  const fmtAction = (v, fb = 'Custom') => {
    const n = String(v || '').trim();
    return n ? n.replace(/_/g, ' ') : fb;
  };

  // Enhanced modern input styling with comprehensive Material-UI design
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease-in-out',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: '#d0d8e0',
        transition: 'all 0.2s ease-in-out',
        borderWidth: '1px'
      },
      '&:hover fieldset': {
        borderColor: '#b8c3d1'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#0084ff',
        borderWidth: '2px'
      },
      '&.Mui-focused': {
        backgroundColor: '#ffffff',
        boxShadow: '0 0 0 3px rgba(0, 132, 255, 0.1)'
      },
      '&.Mui-error fieldset': {
        borderColor: '#d32f2f',
        boxShadow: '0 0 0 3px rgba(211, 47, 47, 0.1)'
      },
      '&.Mui-disabled': {
        backgroundColor: '#f5f5f5'
      }
    },
    '& .MuiOutlinedInput-input': {
      padding: '12px 14px',
      fontSize: '0.95rem',
      color: '#1a1a1a',
      fontWeight: 400,
      lineHeight: 1.5,
      '&::placeholder': {
        color: '#999999',
        opacity: 0.7
      }
    },
    '& .MuiOutlinedInput-input.Mui-disabled': {
      color: '#999999',
      WebkitTextFillColor: '#999999'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderWidth: '1px'
    },
    '& .MuiFormHelperText-root': {
      marginTop: '6px',
      fontSize: '0.8rem',
      color: '#666666',
      fontWeight: 400
    },
    '& .MuiFormHelperText-root.Mui-error': {
      color: '#d32f2f',
      fontWeight: 500
    }
  };

  const labelSx = {
    style: {
      color: '#555555',
      fontWeight: 500,
      fontSize: '0.9rem',
      transform: 'translate(14px, -6px) scale(0.75)',
      transformOrigin: 'top left',
      letterSpacing: '-0.3px'
    },
    // For focus state styling
    required: false
  };

  const inputPropsSx = {
    style: {
      color: '#1a1a1a',
      fontSize: '0.95rem',
      fontWeight: 400
    }
  };

  // FormControl styling for Select components
  const formControlSx = {
    '& .MuiOutlinedInput-root': inputSx['& .MuiOutlinedInput-root'],
    '& .MuiFormLabel-root': {
      color: '#555555',
      fontWeight: 500
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: '#0084ff'
    },
    '& .MuiFormLabel-root.Mui-error': {
      color: '#d32f2f'
    },
    '& .MuiFormHelperText-root': {
      marginTop: '6px',
      fontSize: '0.8rem',
      color: '#666666'
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────────
  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const saveToHistory = (newBlocks) => {
    setHistoryStack(prev => ({ past: [...prev.past, blocks], future: [] }));
    setBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (!historyStack.past.length) return;
    const previous = historyStack.past[historyStack.past.length - 1];
    setHistoryStack({ past: historyStack.past.slice(0, -1), future: [blocks, ...historyStack.future] });
    setBlocks(previous);
  };

  const handleRedo = () => {
    if (!historyStack.future.length) return;
    const next = historyStack.future[0];
    setHistoryStack({ past: [...historyStack.past, blocks], future: historyStack.future.slice(1) });
    setBlocks(next);
  };

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y (Redo)
  useEffect(() => {
    if (openDrawer) return; // Flow Studio handles its own undo/redo
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toUpperCase();
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          if (!isInput) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openDrawer, historyStack, blocks]);

  const handleUpdateBlockConfig = (index, newConfig) => {
    saveToHistory(blocks.map((b, idx) => idx === index ? { ...b, config: { ...b.config, ...newConfig } } : b));
  };

  const handleMoveBlock = (index, dir) => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === blocks.length - 1) return;
    const swap = dir === 'up' ? index - 1 : index + 1;
    const nb = [...blocks];
    [nb[index], nb[swap]] = [nb[swap], nb[index]];
    saveToHistory(nb);
  };

  const handleDuplicateBlock = (index) => {
    const nb = [...blocks];
    nb.splice(index + 1, 0, JSON.parse(JSON.stringify(blocks[index])));
    saveToHistory(nb);
    showSnackbar('Block duplicated!', 'success');
  };

  const handleDeleteBlock = (index) => saveToHistory(blocks.filter((_, i) => i !== index));

  const handleCopyLayout = () => {
    try { navigator.clipboard.writeText(JSON.stringify(blocks, null, 2)); showSnackbar('Layout copied!', 'success'); }
    catch { showSnackbar('Failed to copy.', 'error'); }
  };

  const handlePasteLayout = async () => {
    try {
      const parsed = JSON.parse(await navigator.clipboard.readText());
      if (Array.isArray(parsed)) { saveToHistory(parsed); showSnackbar('Layout loaded!', 'success'); }
      else showSnackbar('Invalid layout structure.', 'warning');
    } catch { showSnackbar('Failed to paste. Check clipboard.', 'error'); }
  };

  const handlePreviewRowClick = (row) => {
    const t = String(row?.actionType || 'CUSTOM').toUpperCase();
    const v = row?.actionValue || row?.rowId || row?.title || '';
    if (t === 'URL' && v) { window.open(v, '_blank', 'noopener,noreferrer'); return; }
    if (t === 'CATALOG') { if (v && /^https?:\/\//i.test(v)) window.open(v, '_blank', 'noopener,noreferrer'); else window.location.hash = '#/catalog'; return; }
    showSnackbar(`${fmtAction(t)}: ${row?.title || v}`, 'info');
  };

  const getListPreviewLines = (block) => {
    const lines = [];
    const title = String(block?.config?.title || '').trim();
    if (title) lines.push(title);
    for (const sec of (block?.config?.sections || [])) {
      const st = String(sec?.title || '').trim();
      if (st) lines.push(st);
      for (const row of (sec?.rows || [])) {
        const rt = String(row?.title || '').trim();
        if (!rt) continue;
        const rd = String(row?.description || '').trim();
        let itemText = rd ? `${rt} - ${rd}` : rt;
        if (row.actionUrl) {
          itemText += `\n   🔗 ${row.actionUrl}`;
        }
        if (row.image) {
          itemText += `\n   🖼️ Image: ${row.image}`;
        }
        lines.push(itemText);
      }
    }
    return lines;
  };

  // ── API ───────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchRules(); fetchTemplates(); fetchWorkflows(); fetchQuickReplies(); }, []);

  const fetchRules = async () => {
    try { setLoading(true); setRules((await apiClient.get('/response-rules')).data); }
    catch { showSnackbar('Failed to load rules.', 'error'); }
    finally { setLoading(false); }
  };

  const fetchTemplates = async () => {
    try { setTemplates((await apiClient.get('/templates')).data); } catch (e) { console.error(e); }
  };

  const fetchWorkflows = async () => {
    try {
      const r = (await apiClient.get('/workflows')).data;
      setWorkflows(Array.isArray(r) ? r : (r.workflows || []));
    } catch (e) { console.error(e); }
  };

  const fetchQuickReplies = async () => {
    try {
      const r = (await apiClient.get('/quick-replies')).data;
      setQuickReplies(Array.isArray(r) ? r : (r.quickReplies || []));
    } catch (e) { console.error(e); }
  };

  // ── Drawer open/close ─────────────────────────────────────────────────────────
  const handleCloseDrawerWithCheck = () =>
    setConfirmDialog({ open: true, title: 'Discard Changes?', message: 'You have unsaved changes. Are you sure you want to close without saving?', type: 'close', ruleId: null });

  const handleConfirmAction = async () => {
    if (confirmDialog.type === 'close') {
      setOpenDrawer(false);
    } else if (confirmDialog.type === 'delete') {
      try { await apiClient.delete(`/response-rules/${confirmDialog.ruleId}`); showSnackbar('Rule deleted!', 'success'); fetchRules(); }
      catch { showSnackbar('Failed to delete rule.', 'error'); }
    }
    setConfirmDialog({ open: false, title: '', message: '', type: '', ruleId: null });
  };

  const handleCancelDialog = () => setConfirmDialog({ open: false, title: '', message: '', type: '', ruleId: null });

  const handleOpenCreateModal = () => {
    setModalForm({
      name: '',
      triggerKeywords: '',
      actionType: 'SEND_TEXT',
      responseText: '',
      buttons: ['View Catalog', 'Talk to Human']
    });
    setOpenCreateModal(true);
  };

  const handleSaveQuickRule = async () => {
    if (!modalForm.name.trim() || !modalForm.triggerKeywords.trim() || !modalForm.responseText.trim()) {
      showSnackbar('Please provide rule name, trigger keywords, and response message.', 'warning');
      return;
    }
    const cleanKeywords = modalForm.triggerKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .join(',');

    const messageBlocks = [
      {
        type: 'TEXT',
        config: {
          text: modalForm.responseText.trim(),
          buttons: modalForm.buttons.filter(b => b && b.trim()).map(b => ({
            label: b.trim(),
            type: 'QUICK_REPLY',
            actionValue: b.trim().toLowerCase().replace(/\s+/g, '_')
          }))
        }
      }
    ];

    const payload = {
      name: modalForm.name.trim(),
      triggerType: 'KEYWORD',
      triggerValue: cleanKeywords,
      actionType: modalForm.actionType,
      workflowId: modalForm.actionType === 'TRIGGER_WORKFLOW' ? modalForm.workflowId : undefined,
      messageBlocks,
      isActive: true
    };

    try {
      await apiClient.post('/response-rules', payload);
      showSnackbar('AI Response Rule created successfully!', 'success');
      setOpenCreateModal(false);
      fetchRules();
    } catch (err) {
      console.error('Failed to create quick rule:', err);
      showSnackbar(err.response?.data?.error || 'Failed to create rule.', 'error');
    }
  };

  // ── Single-Place Workflow Management Handlers ────────────────────────────────
  const handleOpenCreateWorkflow = () => {
    setEditingWorkflow(null);
    setIsWorkflowDesigner(true);
    setRuleName('New Journey Workflow');
    setTriggerType('KEYWORD');
    setTriggerValue('');
    setActionType('SEND_TEXT');
    setBlocks([{ type: 'TEXT', config: { text: '' } }]);
    setHistoryStack({ past: [], future: [] });
    setOpenDrawer(true);
  };

  const handleOpenEditWorkflow = (wf) => {
    setEditingWorkflow(wf);
    setIsWorkflowDesigner(true);
    setRuleName(wf.name || 'Automated Journey');
    const firstCond = wf.trigger?.conditions?.[0];
    setTriggerType('KEYWORD');
    setTriggerValue(firstCond?.value || 'inquiry');
    setActionType('SEND_TEXT');
    const mappedBlocks = (wf.steps || []).map(s => ({
      type: s.type === 'TAG' ? 'BUTTONS' : 'TEXT',
      config: { text: s.config?.value || s.name || 'Step' }
    }));
    setBlocks(mappedBlocks.length > 0 ? mappedBlocks : [{ type: 'TEXT', config: { text: 'Namaste!' } }]);
    setHistoryStack({ past: [], future: [] });
    setOpenDrawer(true);
  };

  const handleDeleteWorkflow = async (wfId) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await apiClient.delete(`/workflows/${wfId}`);
      showSnackbar('Workflow deleted successfully!', 'success');
      fetchWorkflows();
    } catch (err) {
      showSnackbar('Failed to delete workflow.', 'error');
    }
  };

  const handleToggleWorkflowStatus = async (wf) => {
    try {
      const nextStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await apiClient.put(`/workflows/${wf._id}`, { ...wf, status: nextStatus });
      showSnackbar(`Workflow ${nextStatus === 'ACTIVE' ? 'activated' : 'paused'}!`, 'success');
      fetchWorkflows();
    } catch (err) {
      showSnackbar('Failed to update workflow status.', 'error');
    }
  };

  const handleOpenAddDrawer = () => {
    setEditingRule(null);
    setIsWorkflowDesigner(false);
    setEditingWorkflow(null);
    setRuleName(''); setTriggerType('KEYWORD'); setTriggerValue('');
    setActionType('SEND_TEXT'); setTemplateId(''); setWorkflowId(''); setIsActive(true);
    setBlocks([{ type: 'TEXT', config: { text: 'Hello! How can we help you today? ✨' } }]);
    setHistoryStack({ past: [], future: [] });
    setOpenDrawer(true);
  };

  const handleOpenEditDrawer = (rule) => {
    setEditingRule(rule); setRuleName(rule.name); setTriggerType(rule.triggerType);
    setTriggerValue(rule.triggerValue); setActionType(rule.actionType || 'SEND_TEXT');
    setTemplateId(rule.templateId || ''); setWorkflowId(rule.workflowId || ''); setIsActive(rule.isActive);
    setBlocks(Array.isArray(rule.messageBlocks) ? rule.messageBlocks : []);
    setHistoryStack({ past: [], future: [] });
    setTimeout(() => setOpenDrawer(true), 0);
  };

  const handleSaveRule = async () => {
    if (!ruleName || !triggerValue || blocks.length === 0) {
      showSnackbar('Please complete the rule name, triggers, and add at least one block.', 'warning');
      return;
    }
    const payload = {
      name: ruleName, triggerType, triggerValue, actionType,
      templateId: actionType === 'SEND_TEMPLATE' ? templateId : undefined,
      workflowId: actionType === 'TRIGGER_WORKFLOW' ? workflowId : undefined,
      messageBlocks: blocks, isActive
    };
    try {
      if (editingRule) await apiClient.put(`/response-rules/${editingRule._id}`, payload);
      else await apiClient.post('/response-rules', payload);
      showSnackbar(`Rule ${editingRule ? 'updated' : 'created'} successfully!`, 'success');
      setOpenDrawer(false); fetchRules();
    } catch { showSnackbar('Failed to save rule.', 'error'); }
  };

  const confirmDeleteRule = (ruleId) =>
    setConfirmDialog({ open: true, title: 'Delete Rule?', message: 'This action cannot be undone.', type: 'delete', ruleId });

  // ── Drag & Drop ───────────────────────────────────────────────────────────────
  const handleDragStartPalette = (e, type, data = {}) => {
    e.dataTransfer.setData('source', 'palette');
    e.dataTransfer.setData('type', type);
    if (data.text) e.dataTransfer.setData('text', data.text);
    if (data.id) e.dataTransfer.setData('templateId', data.id);
  };

  const handleDragStartCanvas = (e, index) => {
    e.dataTransfer.setData('source', 'canvas');
    e.dataTransfer.setData('index', index.toString());
  };

  const handleDropOnCanvas = (e, dropIndex = null) => {
    e.preventDefault();
    const source = e.dataTransfer.getData('source');
    if (source === 'palette') {
      const type = e.dataTransfer.getData('type');
      let newBlock;
      if (type === 'TEMPLATE_IMPORT') {
        newBlock = { type: 'TEXT', config: { text: e.dataTransfer.getData('text') } };
      } else {
        const configs = {
          TEXT: { text: 'New custom text... ✨' },
          CARD: { title: 'Card Title', description: 'Description...', imageUrl: '', buttons: [] },
          BUTTONS: { buttons: [{ label: 'Action Button', type: 'QUICK_REPLY', actionValue: 'action' }] },
          LIST: { title: 'Title', buttonText: 'Select', sections: [{ title: 'Options', rows: [{ title: 'Row 1', rowId: 'row_1', actionType: 'CUSTOM', inputType: 'TEXT' }] }] },
          RELATED_QUESTIONS: { questions: ['Question 1?'] }
        };
        newBlock = { type, config: configs[type] || {} };
      }
      const nb = [...blocks];
      if (dropIndex !== null) nb.splice(dropIndex, 0, newBlock); else nb.push(newBlock);
      saveToHistory(nb);
      if (type === 'TEMPLATE_IMPORT') showSnackbar('Template imported!', 'success');
    } else if (source === 'canvas') {
      const dragIndex = parseInt(e.dataTransfer.getData('index'));
      if (isNaN(dragIndex) || dragIndex === dropIndex) return;
      const nb = [...blocks];
      const [drag] = nb.splice(dragIndex, 1);
      const target = dropIndex !== null ? (dragIndex < dropIndex ? dropIndex - 1 : dropIndex) : nb.length;
      nb.splice(target, 0, drag);
      saveToHistory(nb);
    }
  };

  const handleDropLinkTemplate = (e) => {
    e.preventDefault();
    if (e.dataTransfer.getData('source') === 'palette' && e.dataTransfer.getData('type') === 'TEMPLATE_IMPORT') {
      const id = e.dataTransfer.getData('templateId');
      if (id) { setTemplateId(id); showSnackbar('Template bound! 🔗', 'success'); }
    }
  };

  // ── CSV parsing ───────────────────────────────────────────────────────────────
  const parseCSVContent = (fileContent) => {
    const rows = []; let cf = '', cr = [], iq = false;
    for (let i = 0; i < fileContent.length; i++) {
      const ch = fileContent[i], nx = fileContent[i + 1];
      if (ch === '"') { if (iq && nx === '"') { cf += '"'; i++; } else iq = !iq; }
      else if (ch === ',' && !iq) { cr.push(cf.trim()); cf = ''; }
      else if ((ch === '\n' || ch === '\r') && !iq) {
        if (cf || cr.length) { cr.push(cf.trim()); if (cr.some(Boolean)) rows.push(cr); cr = []; cf = ''; }
        if (ch === '\r' && nx === '\n') i++;
      } else cf += ch;
    }
    if (cf || cr.length) { cr.push(cf.trim()); if (cr.some(Boolean)) rows.push(cr); }
    return rows;
  };

  const detectAndParseTemplateCSV = (fileContent) => {
    const rows = parseCSVContent(fileContent);
    if (rows.length < 2) return null;
    const headers = rows[0].map(h => String(h || '').replace(/^\ufeff/, '').trim().toLowerCase());
    const fi = (aliases) => headers.findIndex(h => aliases.some(a => h.includes(a)));
    const ni = fi(['name', 'question', 'title', 'key']);
    const ci = fi(['content', 'answer', 'response', 'message', 'body']);
    const ki = fi(['keywords', 'keyword', 'trigger', 'triggervalue']);
    const cati = fi(['category']);
    if (ni < 0 || ci < 0) return null;
    const tpls = rows.slice(1).map(row => {
      const name = (row[ni] || row[ki] || '').trim();
      const content = (row[ci] || '').trim();
      if (!name || !content) return null;
      return { name, content, keywords: (row[ki] || '').trim(), triggerValue: (row[ki] || row[ni] || '').trim(), category: (cati >= 0 ? row[cati] : 'CUSTOM') || 'CUSTOM', type: 'TEXT', format: 'QA', sourceType: 'TEMPLATE_CSV' };
    }).filter(Boolean);
    return tpls.length > 0 ? tpls : null;
  };

  const handleAIDraftRule = async () => {
    if (!aiPrompt.trim() && !uploadedFile) {
      showSnackbar('Please enter a description or upload a CSV file.', 'warning');
      return;
    }

    try {
      setAiGenerating(true);
      
      if (uploadedFile) {
        if (!uploadedFile.name.toLowerCase().endsWith('.csv')) { 
          showSnackbar('CSV files only.', 'warning'); 
          return; 
        }
        const tpls = detectAndParseTemplateCSV(await uploadedFile.text());
        if (tpls?.length) {
          setDraftReview({ mode: 'BULK_TEMPLATES', templates: tpls, count: tpls.length });
          setOpenReviewModal(true);
          showSnackbar(`Found ${tpls.length} templates!`, 'success');
        } else {
          showSnackbar('CSV must have question/name and answer/content columns.', 'error');
        }
      } else {
        // Generate single rule from prompt description
        const response = await apiClient.post('/response-rules/ai/draft', { prompt: aiPrompt });
        const drafted = response.data;
        if (drafted && drafted.name) {
          setDraftReview({
            mode: 'SINGLE_DRAFT',
            name: drafted.name,
            triggerType: drafted.triggerType || 'KEYWORD',
            triggerValue: drafted.triggerValue || '',
            messageBlocks: drafted.messageBlocks || []
          });
          setOpenReviewModal(true);
          showSnackbar('AI generated a draft rule!', 'success');
        } else {
          showSnackbar('Failed to generate draft with AI.', 'error');
        }
      }
    } catch (e) { 
      showSnackbar(e.response?.data?.error || e?.message || 'AI generation failed', 'error'); 
    } finally { 
      setAiGenerating(false); 
    }
  };

  const applyAIDraft = async () => {
    if (!draftReview) return;
    if (draftReview.mode === 'BULK_TEMPLATES') {
      try {
        setAiGenerating(true);
        const r = await apiClient.post('/response-rules/bulk-create-from-templates', { templates: draftReview.templates });
        if (r.data.success) {
          showSnackbar(`✅ Created ${r.data.created} rules!${r.data.failed ? ` ${r.data.failed} failed.` : ''}`, r.data.failed ? 'warning' : 'success');
          setOpenReviewModal(false); setDraftReview(null); setOpenAICopilot(false); setAiPrompt(''); setUploadedFile(null);
          await fetchRules();
        }
      } catch (e) { showSnackbar(e.response?.data?.error || 'Failed to create rules', 'error'); }
      finally { setAiGenerating(false); }
    } else {
      setRuleName(draftReview.name || ''); setTriggerType(draftReview.triggerType || 'KEYWORD');
      setTriggerValue(draftReview.triggerValue || ''); setBlocks(draftReview.messageBlocks || []);
      setHistoryStack({ past: [], future: [] });
      setOpenReviewModal(false); setDraftReview(null); setOpenAICopilot(false); setAiPrompt(''); setUploadedFile(null);
      showSnackbar('AI draft loaded onto canvas!', 'success');
    }
  };

  // ── Shared button editor ──────────────────────────────────────────────────────
  const renderButtonEditor = (block, index, max = 3) => {
    const updateBtn = (btnIdx, patch) => {
      const nb = [...block.config.buttons];
      nb[btnIdx] = { ...nb[btnIdx], ...patch };
      handleUpdateBlockConfig(index, { buttons: nb });
    };
    return (
      <Stack spacing={2}>
        {block.type === 'BUTTONS' && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Maximum {max} buttons allowed on WhatsApp
          </Typography>
        )}
        {(block.config?.buttons || []).map((btn, btnIdx) => (
          <Paper key={btnIdx} sx={{ p: 2, bgcolor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField label={block.type === 'BUTTONS' ? `Button ${btnIdx + 1} Label` : 'Button Label'} size="small" fullWidth
                  value={btn.label} onChange={(e) => updateBtn(btnIdx, { label: e.target.value })}
                  InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={formControlSx}>
                  <InputLabel sx={labelSx.style}>Action Type</InputLabel>
                  <Select value={btn.actionType || 'CUSTOM'} label="Action Type"
                    onChange={(e) => updateBtn(btnIdx, { actionType: e.target.value, actionValue: '', templateId: '', quickReplyId: '', ruleId: '', workflowId: '' })}
                    sx={{ color: '#1a1a1a' }}>
                    <MenuItem value="URL">🔗 Open URL/Link</MenuItem>
                    <MenuItem value="QUICK_REPLY">💬 Quick Reply</MenuItem>
                    <MenuItem value="TEMPLATE">📋 Message Template</MenuItem>
                    <MenuItem value="CALL">📞 Call Phone</MenuItem>
                    <MenuItem value="RESPONSE_RULE">🤖 Trigger Response Rule</MenuItem>
                    <MenuItem value="WORKFLOW">🔀 Trigger Workflow</MenuItem>
                    <MenuItem value="CUSTOM">⚡ Custom Trigger</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {btn.actionType === 'URL' && (
                <Grid item xs={12}>
                  <TextField label="Website URL" size="small" fullWidth value={btn.actionValue || ''}
                    onChange={(e) => updateBtn(btnIdx, { actionValue: e.target.value })}
                    placeholder="https://example.com" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              {btn.actionType === 'QUICK_REPLY' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Select Quick Reply</InputLabel>
                    <Select value={btn.quickReplyId || ''} label="Select Quick Reply"
                      onChange={(e) => { const s = quickReplies.find(q => q._id === e.target.value); updateBtn(btnIdx, { quickReplyId: e.target.value, actionValue: s?.title || '' }); }}
                      sx={{ color: '#1a1a1a' }}>
                      {quickReplies.length === 0 ? <MenuItem disabled>No quick replies</MenuItem>
                        : quickReplies.map(qr => <MenuItem key={qr._id} value={qr._id}>{qr.title} ({qr.category})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {btn.actionType === 'TEMPLATE' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Select Template</InputLabel>
                    <Select value={btn.templateId || ''} label="Select Template"
                      onChange={(e) => { const s = templates.find(t => t._id === e.target.value); updateBtn(btnIdx, { templateId: e.target.value, actionValue: s?.name || '' }); }}
                      sx={{ color: '#1a1a1a' }}>
                      {templates.length === 0 ? <MenuItem disabled>No templates</MenuItem>
                        : templates.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {btn.actionType === 'RESPONSE_RULE' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Select Response Rule</InputLabel>
                    <Select value={btn.ruleId || ''} label="Select Response Rule"
                      onChange={(e) => {
                        const s = rules.find(r => r._id === e.target.value);
                        updateBtn(btnIdx, { ruleId: e.target.value, actionValue: s?.name || '', id: s?.name || btn.value || `rule_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {rules.length === 0 ? <MenuItem disabled>No rules available</MenuItem>
                        : rules.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {btn.actionType === 'WORKFLOW' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Select Workflow</InputLabel>
                    <Select value={btn.workflowId || ''} label="Select Workflow"
                      onChange={(e) => {
                        const w = workflows.find(wf => wf._id === e.target.value);
                        updateBtn(btnIdx, { workflowId: e.target.value, actionValue: w?.name || '', id: w?.name || btn.value || `wf_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {workflows.length === 0 ? <MenuItem disabled>No workflows available</MenuItem>
                        : workflows.map(wf => <MenuItem key={wf._id} value={wf._id}>{wf.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {btn.actionType === 'CALL' && (
                <Grid item xs={12} sm={6}>
                  <TextField label="Phone Number" size="small" fullWidth value={btn.actionValue || ''}
                    onChange={(e) => updateBtn(btnIdx, { actionValue: e.target.value })}
                    placeholder="+91 98765 43210" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              {(!btn.actionType || btn.actionType === 'CUSTOM') && (
                <Grid item xs={12} sm={6}>
                  <TextField label="Custom Trigger Value" size="small" fullWidth value={btn.actionValue || ''}
                    onChange={(e) => updateBtn(btnIdx, { actionValue: e.target.value })}
                    placeholder="trigger_event_name" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" color="error"
                  onClick={() => handleUpdateBlockConfig(index, { buttons: block.config.buttons.filter((_, i) => i !== btnIdx) })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
        {(!block.config?.buttons || block.config.buttons.length < max) && (
          <Button size="small" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start', mt: 1 }}
            onClick={() => handleUpdateBlockConfig(index, {
              buttons: [...(block.config.buttons || []),
              block.type === 'CARD' ? { label: 'Card Button', type: 'QUICK_REPLY', actionValue: 'action' }
                : { label: 'Action Button', actionType: 'CUSTOM', actionValue: 'action' }]
            })}>
            {block.type === 'CARD' ? 'Add Card Action' : 'Add Button'}
          </Button>
        )}
      </Stack>
    );
  };

  // ── LIST row editor (fixed) ───────────────────────────────────────────────────
  const renderListRowEditor = (block, index, sec, secIdx) => {
    const updateRow = (rowIdx, patch) => {
      const newSecs = [...block.config.sections];
      newSecs[secIdx].rows[rowIdx] = { ...newSecs[secIdx].rows[rowIdx], ...patch };
      handleUpdateBlockConfig(index, { sections: newSecs });
    };
    return (
      <Stack spacing={1.5}>
        {(sec.rows || []).map((row, rowIdx) => (
          <Box key={rowIdx} sx={{ pl: 1.5, borderLeft: '2px solid #e0e0e0', py: 0.5 }}>
            <Grid container spacing={1.5}>
              {/* Row Title + Description */}
              <Grid item xs={12} sm={6}>
                <TextField label="Row Title" size="small" fullWidth value={row.title || ''}
                  onChange={(e) => updateRow(rowIdx, { title: e.target.value })}
                  InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Row Description" size="small" fullWidth value={row.description || ''}
                  onChange={(e) => updateRow(rowIdx, { description: e.target.value })}
                  InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
              </Grid>

              {/* Action Type + Input Type + Delete */}
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small" sx={formControlSx}>
                  <InputLabel sx={labelSx.style}>Action Type</InputLabel>
                  <Select value={row.actionType || 'CUSTOM'} label="Action Type"
                    onChange={(e) => {
                      const t = e.target.value;
                      const patch = { actionType: t, actionValue: '', quickReplyId: '', templateId: '', ruleId: '', workflowId: '' };
                      if (t === 'CUSTOM') patch.rowId = row.rowId || `row_${Date.now()}`;
                      updateRow(rowIdx, patch);
                    }}
                    sx={{ color: '#1a1a1a' }}>
                    {ROW_ACTION_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={10} sm={5}>
                <FormControl fullWidth size="small" sx={formControlSx}>
                  <InputLabel sx={labelSx.style}>Input Type</InputLabel>
                  <Select value={row.inputType || 'TEXT'} label="Input Type"
                    onChange={(e) => updateRow(rowIdx, { inputType: e.target.value })}
                    sx={{ color: '#1a1a1a' }}>
                    <MenuItem value="TEXT">Text</MenuItem>
                    <MenuItem value="NUMBER">Number</MenuItem>
                    <MenuItem value="BUTTON">Button</MenuItem>
                    <MenuItem value="LIST">List</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton size="small" color="error" onClick={() => {
                  const newSecs = [...block.config.sections];
                  newSecs[secIdx].rows = newSecs[secIdx].rows.filter((_, i) => i !== rowIdx);
                  handleUpdateBlockConfig(index, { sections: newSecs });
                }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>

              {/* Image URL field */}
              <Grid item xs={12}>
                <TextField label="Row Image URL" size="small" fullWidth value={row.image || ''}
                  onChange={(e) => updateRow(rowIdx, { image: e.target.value })}
                  placeholder="https://example.com/image.jpg (optional)" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
              </Grid>

              {/* Conditional fields — always full width */}
              {(row.actionType === 'CUSTOM' || !row.actionType) && (
                <Grid item xs={12}>
                  <TextField label="Row Trigger ID (rowId)" size="small" fullWidth value={row.rowId || ''}
                    onChange={(e) => updateRow(rowIdx, { rowId: e.target.value })}
                    InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              {row.actionType === 'URL' && (
                <Grid item xs={12}>
                  <TextField label="URL" size="small" fullWidth value={row.actionValue || ''}
                    onChange={(e) => updateRow(rowIdx, { actionValue: e.target.value, rowId: row.rowId || e.target.value })}
                    placeholder="https://example.com" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              {row.actionType === 'CATALOG' && (
                <Grid item xs={12}>
                  <TextField label="Catalog Link / Category" size="small" fullWidth value={row.actionValue || ''}
                    onChange={(e) => updateRow(rowIdx, { actionValue: e.target.value, rowId: row.rowId || e.target.value })}
                    placeholder="rings / https://..." InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                </Grid>
              )}
              {row.actionType === 'QUICK_REPLY' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Quick Reply</InputLabel>
                    <Select value={row.quickReplyId || ''} label="Quick Reply"
                      onChange={(e) => {
                        const s = quickReplies.find(q => q._id === e.target.value);
                        updateRow(rowIdx, { quickReplyId: e.target.value, actionValue: s?.title || '', rowId: s?.title || row.rowId || `qr_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {quickReplies.length === 0 ? <MenuItem disabled>No quick replies</MenuItem>
                        : quickReplies.map(qr => <MenuItem key={qr._id} value={qr._id}>{qr.title}{qr.category ? ` (${qr.category})` : ''}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {row.actionType === 'TEMPLATE' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Template</InputLabel>
                    <Select value={row.templateId || ''} label="Template"
                      onChange={(e) => {
                        const s = templates.find(t => t._id === e.target.value);
                        updateRow(rowIdx, { templateId: e.target.value, actionValue: s?.name || '', rowId: s?.name || row.rowId || `tpl_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {templates.length === 0 ? <MenuItem disabled>No templates</MenuItem>
                        : templates.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {row.actionType === 'RESPONSE_RULE' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Response Rule</InputLabel>
                    <Select value={row.ruleId || ''} label="Response Rule"
                      onChange={(e) => {
                        const s = rules.find(r => r._id === e.target.value);
                        updateRow(rowIdx, { ruleId: e.target.value, actionValue: s?.name || '', rowId: s?.name || row.rowId || `rule_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {rules.length === 0 ? <MenuItem disabled>No rules available</MenuItem>
                        : rules.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {row.actionType === 'WORKFLOW' && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={formControlSx}>
                    <InputLabel sx={labelSx.style}>Workflow</InputLabel>
                    <Select value={row.workflowId || ''} label="Workflow"
                      onChange={(e) => {
                        const w = workflows.find(wf => wf._id === e.target.value);
                        updateRow(rowIdx, { workflowId: e.target.value, actionValue: w?.name || '', rowId: w?.name || row.rowId || `wf_${Date.now()}` });
                      }}
                      sx={{ color: '#1a1a1a' }}>
                      {workflows.length === 0 ? <MenuItem disabled>No workflows available</MenuItem>
                        : workflows.map(wf => <MenuItem key={wf._id} value={wf._id}>{wf.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* URL Display / Link field (optional, for link indicator) */}
              <Grid item xs={12}>
                <TextField label="Link Display URL (Optional - Shows link indicator)" size="small" fullWidth value={row.actionUrl || ''}
                  onChange={(e) => updateRow(rowIdx, { actionUrl: e.target.value })}
                  placeholder="https://example.com (optional - for link preview)" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx}
                  helperText="URL shown as a link indicator in the preview" />
              </Grid>
            </Grid>
          </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }}
          onClick={() => {
            const newSecs = [...block.config.sections];
            newSecs[secIdx].rows = [...(newSecs[secIdx].rows || []), { title: 'New Row', description: '', rowId: `row_${Date.now()}`, actionType: 'QUICK_REPLY', inputType: 'TEXT' }];
            handleUpdateBlockConfig(index, { sections: newSecs });
          }}>
          Add Row Item
        </Button>
      </Stack>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────────
  const filteredRules = rules.filter(rule => {
    // Tab filter
    if (activeTab === 'ACTIVE' && !rule.isActive) return false;
    if (activeTab === 'INACTIVE' && rule.isActive) return false;
    if (activeTab === 'KEYWORD' && rule.triggerType !== 'KEYWORD' && rule.triggerType) return false;
    if (activeTab === 'BUTTONS' && rule.actionType !== 'QUICK_REPLY' && !rule.messageBlocks?.some(b => b.type === 'BUTTONS')) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rule.name?.toLowerCase().includes(q);
      const matchTrigger = rule.triggerValue?.toLowerCase().includes(q);
      const matchCreator = `${rule.userId?.firstName || ''} ${rule.userId?.lastName || ''}`.toLowerCase().includes(q);
      const matchAction = rule.actionType?.toLowerCase().includes(q);
      if (!matchName && !matchTrigger && !matchCreator && !matchAction) return false;
    }
    return true;
  });

  const ruleStats = [
    {
      icon: FlashOnIcon,
      label: 'Total Automation Rules',
      sublabel: 'All Triggers Configured',
      value: rules.length,
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accent: '#84cc16',
      iconColor: '#84cc16'
    },
    {
      icon: CheckCircleIcon,
      label: 'Active Triggers',
      sublabel: 'Responding 24/7 Live',
      value: rules.filter(r => r.isActive).length,
      gradient: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      accent: '#34d399',
      iconColor: '#a7f3d0'
    },
    {
      icon: SmartToyIcon,
      label: 'Keyword Responders',
      sublabel: 'Exact & Intent Matches',
      value: rules.filter(r => r.triggerType === 'KEYWORD' || !r.triggerType).length,
      gradient: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
      accent: '#818cf8',
      iconColor: '#c7d2fe'
    },
    {
      icon: AutoAwesomeIcon,
      label: 'Interactive Flows',
      sublabel: 'Buttons & List Menus',
      value: rules.filter(r => r.actionType === 'QUICK_REPLY' || r.messageBlocks?.some(b => b.type === 'BUTTONS')).length,
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
      accent: '#fbbf24',
      iconColor: '#fef3c7'
    }
  ];

  return (
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 4 }}>
      {/* Sleek Compact Enterprise Header */}
      <Card
        elevation={0}
        sx={{
          mb: 1.5,
          p: 1.75,
          borderRadius: '12px',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: 'rgba(132, 204, 22, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4d7c0f'
              }}
            >
              <FlashOnIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                  Response Rules
                </Typography>
                <Chip
                  label="24/7 Automation"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(132, 204, 22, 0.15)',
                    color: '#4d7c0f',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 20
                  }}
                />
              </Box>
              {/* Inline Stat Pills */}
              <Stack direction="row" spacing={0.8} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`Total: ${rules.length}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
                />
                <Chip
                  label={`Active: ${rules.filter(r => r.isActive).length}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}
                />
                <Chip
                  label={`Keywords: ${rules.filter(r => r.triggerType === 'KEYWORD' || !r.triggerType).length}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}
                />
                <Chip
                  label={`Interactive: ${rules.filter(r => r.actionType === 'QUICK_REPLY' || r.messageBlocks?.some(b => b.type === 'BUTTONS')).length}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }}
                />
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenHelpDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                color: '#475569',
                borderColor: '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(15,23,42,0.04)', borderColor: '#94a3b8', color: '#0f172a' }
              }}
            >
              Guidelines
            </Button>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon sx={{ color: '#65a30d', fontSize: 16 }} />}
              size="small"
              onClick={() => { setOpenAICopilot(true); if (!openDrawer) handleOpenAddDrawer(); }}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                color: '#4d7c0f',
                borderColor: 'rgba(132, 204, 22, 0.5)',
                bgcolor: 'rgba(132, 204, 22, 0.08)',
                '&:hover': { bgcolor: 'rgba(132, 204, 22, 0.16)', borderColor: '#84cc16' }
              }}
            >
              AI Copilot
            </Button>
            <Button
              variant="outlined"
              component="a"
              href="/workflows"
              startIcon={<AccountTreeIcon sx={{ color: '#0284c7', fontSize: 16 }} />}
              size="small"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                handleOpenAddDrawer();
              }}
              sx={{
                textTransform: 'none',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                color: '#0f172a',
                borderColor: '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(2,132,199,0.06)', borderColor: '#0284c7' }
              }}
            >
              Flow Studio
            </Button>
            <Button
              variant="contained"
              component="a"
              href="/workflows"
              startIcon={<AccountTreeIcon sx={{ fontSize: 16 }} />}
              size="small"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                handleOpenCreateWorkflow();
              }}
              sx={{
                bgcolor: '#2563EB',
                color: '#ffffff',
                textDecoration: 'none',
                px: 1.5,
                height: 34,
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                '&:hover': {
                  bgcolor: '#1d4ed8'
                }
              }}
            >
              + Create Workflow
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              size="small"
              onClick={handleOpenCreateModal}
              sx={{
                bgcolor: '#84cc16',
                color: '#0f172a',
                px: 1.5,
                height: 34,
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                '&:hover': {
                  bgcolor: '#65a30d',
                  color: '#ffffff'
                }
              }}
            >
              + Create Rule
            </Button>
          </Stack>
        </Box>

        {/* Unified Hub Switcher: Rules & Workflows in Single Place */}
        <Box sx={{ borderTop: '1px solid #f1f5f9', pt: 1, mt: 1.25 }}>
          <Tabs
            value={hubTab}
            onChange={(_, val) => setHubTab(val)}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#64748b',
                minHeight: 32,
                py: 0.2,
                px: 1.5,
                borderRadius: '6px',
                mr: 1,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                '&.Mui-selected': { color: '#0f172a', bgcolor: '#f8fafc' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#84cc16', height: 3, borderRadius: '3px' }
            }}
          >
            <Tab
              value="RULES"
              component="a"
              href="/response-rules"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                setHubTab('RULES');
              }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                  <span>⚡ Instant Response Rules</span>
                  <Chip
                    label={rules.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: hubTab === 'RULES' ? '#65a30d' : '#e2e8f0',
                      color: hubTab === 'RULES' ? '#ffffff' : '#475569'
                    }}
                  />
                </Box>
              }
            />
            <Tab
              value="WORKFLOWS"
              component="a"
              href="/workflows"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                setHubTab('WORKFLOWS');
              }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                  <span>🔀 Multi-Step Journey Workflows</span>
                  <Chip
                    label={workflows.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: hubTab === 'WORKFLOWS' ? '#0284c7' : '#e2e8f0',
                      color: hubTab === 'WORKFLOWS' ? '#ffffff' : '#475569'
                    }}
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>
      </Card>

      {hubTab === 'RULES' ? (
        <>

      {/* Filter, Search & View Controls Bar */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <TextField
          placeholder="Search automations by keyword, rule name, or intent..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          sx={{
            flex: 1,
            maxWidth: { md: 460 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#f8fafc',
              height: '42px',
              fontSize: '0.875rem',
              '&:hover fieldset': { borderColor: '#84cc16' },
              '&.Mui-focused fieldset': { borderColor: '#84cc16' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <Chip
                label="Clear"
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer', bgcolor: '#e2e8f0' }}
              />
            ) : null
          }}
        />

        {/* Filter Pills & View Mode Toggle */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {[
              { val: 'ALL', label: 'All Rules', count: rules.length },
              { val: 'ACTIVE', label: 'Active', count: rules.filter(r => r.isActive).length },
              { val: 'INACTIVE', label: 'Paused', count: rules.filter(r => !r.isActive).length },
              { val: 'KEYWORD', label: 'Keywords', count: rules.filter(r => r.triggerType === 'KEYWORD' || !r.triggerType).length },
              { val: 'BUTTONS', label: 'Interactive', count: rules.filter(r => r.actionType === 'QUICK_REPLY' || r.messageBlocks?.some(b => b.type === 'BUTTONS')).length }
            ].map((tab) => (
              <Chip
                key={tab.val}
                label={`${tab.label} (${tab.count})`}
                clickable
                onClick={() => setActiveTab(tab.val)}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 32,
                  px: 0.75,
                  bgcolor: activeTab === tab.val ? '#0f172a' : '#f1f5f9',
                  color: activeTab === tab.val ? '#ffffff' : '#475569',
                  border: activeTab === tab.val ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  '&:hover': {
                    bgcolor: activeTab === tab.val ? '#1e293b' : '#e2e8f0'
                  }
                }}
              />
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

          {/* View Mode Toggle: Cards vs Table */}
          <Stack direction="row" spacing={0.5} sx={{ bgcolor: '#f1f5f9', p: 0.5, borderRadius: '8px' }}>
            <Tooltip title="Visual Automation Cards">
              <IconButton
                size="small"
                onClick={() => setViewMode('CARDS')}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  bgcolor: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                  color: viewMode === 'CARDS' ? '#0f172a' : '#94a3b8',
                  boxShadow: viewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <GridViewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Data Grid Table">
              <IconButton
                size="small"
                onClick={() => setViewMode('TABLE')}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  bgcolor: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                  color: viewMode === 'TABLE' ? '#0f172a' : '#94a3b8',
                  boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <TableRowsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>

      {/* Rules Content */}
      {loading ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }} elevation={0}>
          <CircularProgress size={32} sx={{ color: '#84cc16' }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 2, fontWeight: 600 }}>Loading automation rules...</Typography>
        </Paper>
      ) : rules.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '16px', bgcolor: '#f8fafc' }} elevation={0}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              bgcolor: 'rgba(132, 204, 22, 0.15)',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            <FlashOnIcon sx={{ fontSize: 32, color: '#84cc16' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            No Response Rules Yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 440, mx: 'auto', mb: 3 }}>
            Create automated instant replies for pricing queries, catalog orders, support greetings, or let AI generate them for you.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              borderRadius: '10px'
            }}
          >
            Create Your First Rule
          </Button>
        </Paper>
      ) : filteredRules.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '16px', bgcolor: '#f8fafc' }} elevation={0}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            No automations match your search
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Try adjusting your search terms or filter selection.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
          >
            Reset Filters
          </Button>
        </Paper>
      ) : viewMode === 'CARDS' ? (
        /* Visual IF/THEN Automation Cards Layout */
        <Grid container spacing={2.5}>
          {filteredRules.map((rule) => (
            <Grid item xs={12} sm={6} lg={4} key={rule._id}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.22s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.14)',
                    borderColor: rule.isActive ? '#84cc16' : '#cbd5e1'
                  }
                }}
              >
                {/* Card Top: Rule Name, Creator & Switch */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1, pr: 1.5, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: rule.isActive ? '#84cc16' : '#94a3b8',
                        boxShadow: rule.isActive ? '0 0 8px rgba(132, 204, 22, 0.8)' : 'none'
                      }} />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          fontSize: '15px',
                          color: '#0f172a',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {rule.name}
                      </Typography>
                    </Stack>
                    {rule.userId ? (
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                        By {rule.userId.firstName || ''} {rule.userId.lastName || ''}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>
                        System Automation
                      </Typography>
                    )}
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={rule.isActive}
                        onChange={() => handleToggleActiveRule(rule._id, rule.isActive)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#84cc16',
                            '&:hover': { backgroundColor: 'rgba(132, 204, 22, 0.08)' }
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#84cc16'
                          }
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '11px', color: rule.isActive ? '#15803d' : '#64748b' }}>
                        {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                    labelPlacement="end"
                  />
                </Box>

                {/* Visual IF / THEN Automation Flow */}
                <Box sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  mb: 2,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25
                }}>
                  {/* IF Block */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      IF INCOMING MESSAGE MATCHES:
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={<FlashOnIcon sx={{ fontSize: '13px !important', color: '#0f172a !important' }} />}
                        label={rule.triggerType || 'KEYWORD'}
                        size="small"
                        sx={{
                          bgcolor: '#84cc16',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '11px',
                          height: 22
                        }}
                      />
                      <Chip
                        label={`"${rule.triggerValue}"`}
                        size="small"
                        sx={{
                          bgcolor: '#0f172a',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '11px',
                          height: 22,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      />
                    </Stack>
                  </Box>

                  {/* Flow Arrow */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                    <Box sx={{ height: '1px', flex: 1, bgcolor: '#cbd5e1' }} />
                    <ArrowDownwardIcon sx={{ fontSize: 13, color: '#84cc16' }} />
                    <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Then Execute
                    </Typography>
                    <Box sx={{ height: '1px', flex: 1, bgcolor: '#cbd5e1' }} />
                  </Box>

                  {/* THEN Block */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      THEN INSTANT REPLY:
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        label={rule.actionType ? rule.actionType.replace(/_/g, ' ') : 'SEND TEXT'}
                        size="small"
                        sx={{
                          bgcolor: '#ffffff',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '11px',
                          height: 22
                        }}
                      />
                      {rule.messageBlocks?.slice(0, 2).map((b, i) => (
                        <Chip
                          key={i}
                          label={b.type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '10px', height: 20, bgcolor: '#ffffff', color: '#475569' }}
                        />
                      ))}
                      {rule.messageBlocks?.length > 2 && (
                        <Chip
                          label={`+${rule.messageBlocks.length - 2}`}
                          size="small"
                          sx={{ fontSize: '10px', height: 20, bgcolor: '#e2e8f0', color: '#475569' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#f1f5f9', mb: 1.5 }} />

                {/* Card Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setOpenPreviewDialog(true);
                      setPreviewContent(rule);
                    }}
                    sx={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      color: '#0f172a',
                      borderColor: '#cbd5e1',
                      bgcolor: '#ffffff',
                      '&:hover': { borderColor: '#0f172a', bgcolor: '#f8fafc' }
                    }}
                  >
                    Preview
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                    onClick={() => handleOpenEditDrawer(rule)}
                    sx={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      bgcolor: '#0f172a',
                      color: '#84cc16',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#1e293b', boxShadow: 'none' }
                    }}
                  >
                    Edit Rule
                  </Button>

                  <Tooltip title="Delete Rule">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => confirmDeleteRule(rule._id)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        bgcolor: '#fff5f5',
                        '&:hover': { bgcolor: '#fee2e2' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Modernized Data Grid Table Layout */
        <Box component={Paper} sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px -2px rgba(15,23,42,0.06)' }} elevation={0}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 800 }}>
              {/* Table Header Row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 1.5fr 1fr 1fr 120px 180px',
                gap: 2,
                p: 2,
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 'bold',
                width: '100%',
                boxSizing: 'border-box',
                borderBottom: '2px solid #84cc16'
              }}>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#84cc16' }}>#</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Rule Name & Creator</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Trigger Match</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Action Payload</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Live Status</Box>
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right', pr: 2 }}>Actions</Box>
              </Box>

              {/* Table Data Rows */}
              {filteredRules.map((rule, idx) => (
                <Box
                  key={rule._id}
                  onClick={() => setSelectedDetailRule(rule)}
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '60px 1.5fr 1fr 1fr 120px 180px',
                    gap: 2,
                    p: 2,
                    borderBottom: '1px solid #e2e8f0',
                    alignItems: 'center',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    width: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { 
                      backgroundColor: 'rgba(132, 204, 22, 0.08)',
                      transform: 'scale(1.002)'
                    },
                  }}
                >
                  {/* Index */}
                  <Box sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.85rem' }}>{idx + 1}</Box>

                  {/* Name & Creator */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.25 }}>
                      {rule.name}
                    </Typography>
                    {rule.userId && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        By {rule.userId.firstName || ''} {rule.userId.lastName || ''}
                      </Typography>
                    )}
                  </Box>

                  {/* Trigger */}
                  <Box>
                    <Chip label={rule.triggerType || 'KEYWORD'} size="small" sx={{ fontWeight: 800, mb: 0.5, bgcolor: '#84cc16', color: '#0f172a', height: 20, fontSize: '0.7rem' }} />
                    <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{rule.triggerValue}"
                    </Typography>
                  </Box>

                  {/* Blocks */}
                  <Box>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {rule.messageBlocks?.slice(0, 2).map((b, i) => (
                        <Chip key={i} label={b.type} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      ))}
                      {rule.messageBlocks?.length > 2 && (
                        <Chip label={`+${rule.messageBlocks.length - 2}`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                      )}
                    </Stack>
                  </Box>

                  {/* Status */}
                  <Box onClick={(e) => e.stopPropagation()}>
                    <FormControlLabel 
                      control={
                        <Switch
                          size="small"
                          checked={rule.isActive}
                          onChange={() => handleToggleActiveRule(rule._id, rule.isActive)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#84cc16' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#84cc16' }
                          }}
                        />
                      } 
                      label={
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '11px', color: rule.isActive ? '#15803d' : '#64748b' }}>
                          {rule.isActive ? 'Active' : 'Paused'}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                      labelPlacement="end"
                    />
                  </Box>

                  {/* Actions */}
                  <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => setSelectedDetailRule(rule)}
                        sx={{ color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', bgcolor: '#ffffff', '&:hover': { bgcolor: '#f1f5f9' } }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Rule">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenEditDrawer(rule)}
                        sx={{ color: '#84cc16', bgcolor: '#0f172a', borderRadius: '8px', '&:hover': { bgcolor: '#1e293b' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Rule">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => confirmDeleteRule(rule._id)}
                        sx={{ border: '1px solid #fee2e2', borderRadius: '8px', bgcolor: '#fff5f5' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Rule Details Popup Modal on Row Click ── */}
      <Dialog
        open={Boolean(selectedDetailRule)}
        onClose={() => setSelectedDetailRule(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)'
          }
        }}
      >
        {selectedDetailRule && (
          <>
            {/* Popup Header */}
            <Box
              sx={{
                px: 3,
                py: 2.25,
                bgcolor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #84cc16'
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#84cc16',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900
                  }}
                >
                  ⚡
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', lineHeight: 1.2 }}>
                    {selectedDetailRule.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Trigger Type: <strong>{selectedDetailRule.triggerType || 'KEYWORD'}</strong> • Status:{' '}
                    <span style={{ color: selectedDetailRule.isActive ? '#84cc16' : '#94a3b8', fontWeight: 800 }}>
                      {selectedDetailRule.isActive ? 'ACTIVE (Live)' : 'PAUSED'}
                    </span>
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setSelectedDetailRule(null)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Popup Body */}
            <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
              <Grid container spacing={2.5}>
                {/* Left Column: Rule Details & Automation Info */}
                <Grid item xs={12} md={7}>
                  <Stack spacing={2}>
                    {/* Trigger Condition Box */}
                    <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                        Incoming WhatsApp Trigger
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={selectedDetailRule.triggerType || 'KEYWORD'}
                          size="small"
                          sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem' }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          "{selectedDetailRule.triggerValue}"
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
                        When a customer sends a message matching these keywords (case-insensitive), this automated reply fires instantly.
                      </Typography>
                    </Card>

                    {/* Action Payload Box */}
                    <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                        Action & Response Payload
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip
                          label={selectedDetailRule.actionType ? selectedDetailRule.actionType.replace(/_/g, ' ') : 'SEND TEXT'}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 700 }}
                        />
                        <Chip
                          label={`${selectedDetailRule.messageBlocks?.length || 0} Blocks`}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}
                        />
                      </Stack>

                      {/* Content preview of blocks */}
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {selectedDetailRule.messageBlocks && selectedDetailRule.messageBlocks.length > 0 ? (
                          selectedDetailRule.messageBlocks.map((b, i) => (
                            <Box key={i} sx={{ mb: i < selectedDetailRule.messageBlocks.length - 1 ? 1.5 : 0 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb', display: 'block' }}>
                                #{i + 1} {b.type} Block:
                              </Typography>
                              {b.type === 'TEXT' && (
                                <Typography variant="body2" sx={{ color: '#0f172a', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                                  {b.config?.text || b.config?.message || 'Empty text'}
                                </Typography>
                              )}
                              {b.type === 'CARD' && (
                                <Box sx={{ pl: 1, borderLeft: '2px solid #84cc16' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{b.config?.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">{b.config?.description}</Typography>
                                </Box>
                              )}
                              {b.type === 'BUTTONS' && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                  {b.config?.buttons?.map((btn, bi) => (
                                    <Chip key={bi} label={btn.label} size="small" sx={{ bgcolor: '#ffffff', border: '1px solid #cbd5e1' }} />
                                  ))}
                                </Stack>
                              )}
                              {b.type === 'LIST' && (
                                <Box sx={{ pl: 1, borderLeft: '2px solid #0284c7', mt: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7' }}>{b.config?.title}</Typography>
                                  {b.config?.sections?.map((s, si) => (
                                    <Typography key={si} variant="caption" display="block" color="text.secondary">
                                      {s.title}: {s.rows?.map(r => r.title).join(', ')}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {selectedDetailRule.actionType === 'SEND_TEMPLATE' ? 'Message Template Payload' : 'No message blocks configured'}
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  </Stack>
                </Grid>

                {/* Right Column: WhatsApp Live Preview Box */}
                <Grid item xs={12} md={5}>
                  <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1, textAlign: 'center' }}>
                      📱 Customer Chat Simulation
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#efeae2',
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        minHeight: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Customer incoming bubble */}
                      <Box
                        sx={{
                          bgcolor: '#ffffff',
                          p: 1.25,
                          borderRadius: '10px',
                          borderTopLeftRadius: 0,
                          maxWidth: '85%',
                          alignSelf: 'flex-start',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          mb: 1
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', fontSize: '10px' }}>
                          Customer
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                          {selectedDetailRule.triggerValue?.split(',')[0] || 'Hello'}
                        </Typography>
                      </Box>

                      {/* Bot response bubble */}
                      <Box
                        sx={{
                          bgcolor: '#dcf8c6',
                          p: 1.25,
                          borderRadius: '10px',
                          borderTopRightRadius: 0,
                          maxWidth: '90%',
                          alignSelf: 'flex-end',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#075e54', display: 'block', fontSize: '10px' }}>
                          ⚡ AI Automated Reply
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#0f172a', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {selectedDetailRule.messageBlocks?.[0]?.config?.text ||
                            selectedDetailRule.messageBlocks?.[0]?.config?.message ||
                            selectedDetailRule.messageBlocks?.[0]?.config?.title ||
                            'Automated reply ready'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '9px', color: '#075e54' }}>
                            Just now ✓✓
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>

            {/* Popup Footer Actions */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  const toDeleteId = selectedDetailRule._id;
                  setSelectedDetailRule(null);
                  confirmDeleteRule(toDeleteId);
                }}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
              >
                Delete Rule
              </Button>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhoneAndroidIcon />}
                  onClick={() => {
                    setPreviewContent(selectedDetailRule);
                    setOpenPreviewDialog(true);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  Full Phone Mockup
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    const r = selectedDetailRule;
                    setSelectedDetailRule(null);
                    handleOpenEditDrawer(r);
                  }}
                  sx={{
                    bgcolor: '#0f172a',
                    color: '#84cc16',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2.5,
                    '&:hover': { bgcolor: '#1e293b' }
                  }}
                >
                  Edit in Studio
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      </>
      ) : (
        <Box sx={{ width: '100%', mb: 4 }}>
          {/* Workflows KPI Metrics Ribbon */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountTreeIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>{workflows.length}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Total Workflows</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayArrowIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16a34a' }}>{workflows.filter(w => w.status === 'ACTIVE').length}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Active Funnels</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#65a30d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircleIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {workflows.reduce((acc, w) => acc + (w.stats?.successfulExecutions || 0), 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Total Executions</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FlashOnIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#ca8a04' }}>{workflows.filter(w => w.status !== 'ACTIVE').length}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Paused / Drafts</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Search & Actions Bar for Workflows */}
          <Card elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <TextField
                size="small"
                placeholder="Search journey workflows, trigger events, action steps..."
                value={workflowSearchQuery}
                onChange={(e) => setWorkflowSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: { sm: 460 },
                  '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc', height: 40 }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {workflows.filter(w => {
                    if (!workflowSearchQuery.trim()) return true;
                    const q = workflowSearchQuery.toLowerCase();
                    return (w.name || '').toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q);
                  }).length} Workflows
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AccountTreeIcon />}
                  onClick={handleOpenCreateWorkflow}
                  sx={{
                    bgcolor: '#2563EB',
                    color: '#ffffff',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  + Create Workflow
                </Button>
              </Stack>
            </Stack>
          </Card>

          {/* Workflows Table */}
          {workflows.filter(w => {
            if (!workflowSearchQuery.trim()) return true;
            const q = workflowSearchQuery.toLowerCase();
            return (w.name || '').toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q);
          }).length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }} elevation={0}>
              <AccountTreeIcon sx={{ fontSize: 48, color: '#38bdf8', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                No Workflows Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', mb: 2.5 }}>
                Create interactive customer journeys, lead funnels, and multi-step WhatsApp flows right here from the Rules studio.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AccountTreeIcon />}
                onClick={handleOpenCreateWorkflow}
                sx={{ bgcolor: '#2563EB', color: '#ffffff', fontWeight: 800, textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                Create Workflow Journey
              </Button>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 860 }}>
                  {/* Table Header */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '50px 2.2fr 1.2fr 1fr 120px 110px',
                    gap: 2,
                    p: 2,
                    bgcolor: '#0f172a',
                    color: '#ffffff',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#84cc16' }}>#</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>WORKFLOW NAME & DETAILS</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>TRIGGER EVENT</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>EXECUTIONS</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>STATUS</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem', textAlign: 'right', pr: 1 }}>ACTIONS</Box>
                  </Box>

                  {/* Table Rows */}
                  {workflows
                    .filter(w => {
                      if (!workflowSearchQuery.trim()) return true;
                      const q = workflowSearchQuery.toLowerCase();
                      return (w.name || '').toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q);
                    })
                    .map((wf, idx) => {
                      const firstCond = wf.trigger?.conditions?.[0];
                      return (
                        <Box
                          key={wf._id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '50px 2.2fr 1.2fr 1fr 120px 110px',
                            gap: 2,
                            p: 2,
                            borderBottom: '1px solid #f1f5f9',
                            alignItems: 'center',
                            bgcolor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            '&:hover': { bgcolor: '#f1f5f9' }
                          }}
                        >
                          <Box sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{idx + 1}</Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.25 }}>
                              {wf.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.4 }}>
                              {wf.description || 'Automated customer journey workflow'}
                            </Typography>
                          </Box>
                          <Box>
                            <Chip
                              label={firstCond?.value ? `${firstCond.field || 'intent'}: ${firstCond.value}` : (wf.trigger?.type || 'EVENT')}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: '#f1f5f9', border: '1px solid #cbd5e1' }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>
                              {wf.stats?.successfulExecutions || 0} runs
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {wf.steps?.length || 1} action step{(wf.steps?.length || 1) !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={wf.status === 'ACTIVE'}
                                  onChange={() => handleToggleWorkflowStatus(wf)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#84cc16' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#84cc16' }
                                  }}
                                />
                              }
                              label={
                                <Typography variant="caption" sx={{ fontWeight: 700, color: wf.status === 'ACTIVE' ? '#16a34a' : '#64748b' }}>
                                  {wf.status === 'ACTIVE' ? 'Active' : 'Paused'}
                                </Typography>
                              }
                              sx={{ m: 0 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', pr: 0.5 }}>
                            <Tooltip title="Edit in Visual Flow Studio">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditWorkflow(wf)}
                                sx={{ color: '#ffffff', bgcolor: '#2563EB', borderRadius: '8px', '&:hover': { bgcolor: '#1d4ed8' } }}
                              >
                                <AccountTreeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Workflow">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteWorkflow(wf._id)}
                                sx={{ color: '#ef4444', bgcolor: '#fee2e2', borderRadius: '8px', '&:hover': { bgcolor: '#fecaca' } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Preview Dialog - Enhanced Phone Mockup */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={() => setOpenPreviewDialog(false)} 
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e8e8e8'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
          px: 3,
          py: 2.5,
          borderBottom: '2px solid #0084ff',
          gap: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhoneAndroidIcon sx={{ 
              color: '#0084ff',
              fontSize: '28px',
              fontWeight: 700
            }} />
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#1a1a1a',
              fontSize: '1.1rem',
              letterSpacing: '0.3px'
            }}>
              Live WhatsApp Preview
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenPreviewDialog(false)} 
            size="small"
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 132, 255, 0.08)',
                color: '#0084ff',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
          {previewContent && previewContent.messageBlocks && (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '520px'
            }}>
              {/* Phone Frame Container */}
              <Box sx={{
                width: '100%',
                maxWidth: '360px',
                backgroundColor: '#000',
                borderRadius: '40px',
                padding: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35), 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 24px 72px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '0px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '150px',
                  height: '24px',
                  backgroundColor: '#000',
                  borderRadius: '0 0 30px 30px',
                  zIndex: 10
                }
              }}>
                {/* Phone Screen */}
                <Box sx={{
                  backgroundColor: '#fff',
                  borderRadius: '36px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '680px',
                  position: 'relative',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                }}>
                  {/* Status Bar */}
                  <Box sx={{
                    backgroundColor: '#075e54',
                    color: '#fff',
                    px: 2.5,
                    pt: 2,
                    pb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '36px 36px 0 0'
                  }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      📡 📶 🔋
                    </Box>
                    <Box>9:41</Box>
                  </Box>

                  {/* WhatsApp Header */}
                  <Box sx={{
                    backgroundColor: '#075e54',
                    color: '#fff',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
                        {previewContent.name || 'Bot'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                        {previewContent.triggerType}: "{previewContent.triggerValue}"
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>🟢</Typography>
                  </Box>

                  {/* Messages Container */}
                  <Box sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    px: 1.5,
                    py: 2,
                    backgroundColor: '#ecf0f1',
                    backgroundImage: 'radial-gradient(#d8dfe6 8%, transparent 8%)',
                    backgroundSize: '14px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'background-color 0.2s ease'
                  }}>
                    {/* Messages Preview */}
                    {previewContent.messageBlocks.map((block, index) => {
                      if (block.type === 'TEXT') return (
                        <Box key={index} sx={{ 
                          alignSelf: 'flex-start', 
                          maxWidth: '80%',
                          backgroundColor: '#dfe5e9',
                          color: '#000',
                          p: 1.5,
                          borderRadius: '18px 18px 18px 4px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                          wordWrap: 'break-word',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 2px 3px rgba(0, 0, 0, 0.1)'
                          }
                        }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, fontSize: '0.95rem', color: '#1a1a1a' }}>
                            {block.config?.text}
                          </Typography>
                        </Box>
                      );

                      if (block.type === 'CARD') return (
                        <Box key={index} sx={{
                          alignSelf: 'flex-start',
                          maxWidth: '85%',
                          backgroundColor: '#dfe5e9',
                          borderRadius: '18px 18px 18px 4px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 2px 3px rgba(0, 0, 0, 0.1)'
                          }
                        }}>
                          {block.config?.imageUrl && (
                            <Box 
                              component="img" 
                              src={block.config.imageUrl} 
                              sx={{ 
                                width: '100%',
                                height: '140px',
                                objectFit: 'cover',
                                backgroundColor: '#ddd'
                              }} 
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <Box sx={{ p: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#000', fontSize: '0.95rem' }}>
                              {block.config?.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', display: 'block', fontSize: '0.85rem', lineHeight: 1.3 }}>
                              {block.config?.description}
                            </Typography>
                            {block.config?.buttons?.length > 0 && (
                              <Stack spacing={0.8} sx={{ mt: 1 }}>
                                {block.config.buttons.map((b, bi) => (
                                  <Button 
                                    key={bi} 
                                    size="small"
                                    onClick={() => handlePreviewRowClick(b)}
                                    sx={{
                                      textTransform: 'none',
                                      color: '#0084ff',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      p: 0.75,
                                      border: '1px solid #0084ff',
                                      borderRadius: '8px',
                                      transition: 'all 0.2s ease',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(0, 132, 255, 0.12)',
                                        borderColor: '#0073e6'
                                      }
                                    }}
                                  >
                                    {b.label}
                                  </Button>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Box>
                      );

                      if (block.type === 'BUTTONS') return (
                        <Stack key={index} spacing={0.8} sx={{ alignSelf: 'flex-start', width: '85%' }}>
                          {(block.config?.buttons || []).map((b, bi) => (
                            <Button 
                              key={bi}
                              onClick={() => handlePreviewRowClick(b)}
                              fullWidth
                              sx={{
                                textTransform: 'none',
                                backgroundColor: '#0084ff',
                                color: '#fff',
                                borderRadius: '24px',
                                fontWeight: 700,
                                py: 1,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0, 132, 255, 0.3)',
                                '&:hover': { 
                                  backgroundColor: '#0073e6',
                                  boxShadow: '0 4px 8px rgba(0, 132, 255, 0.4)'
                                }
                              }}
                            >
                              {b.label}
                            </Button>
                          ))}
                        </Stack>
                      );

                      if (block.type === 'LIST') {
                        return (
                          <Box key={index} sx={{
                            alignSelf: 'flex-start',
                            width: '85%',
                            backgroundColor: '#dfe5e9',
                            borderRadius: '18px 18px 18px 4px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 2px 3px rgba(0, 0, 0, 0.1)'
                            }
                          }}>
                            <Box sx={{ p: 1.5, borderBottom: '1px solid #c0c7cc' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000', fontSize: '0.95rem' }}>
                                {block.config?.title}
                              </Typography>
                            </Box>
                            <Stack spacing={0.5} sx={{ p: 1 }}>
                              {(block.config?.sections || []).map((sec, si) => (
                                <Box key={si}>
                                  {sec.title && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                        color: '#64748b',
                                        display: 'block',
                                        px: 1,
                                        py: 0.5
                                      }}
                                    >
                                      {sec.title}
                                    </Typography>
                                  )}
                                  <Stack spacing={0.5}>
                                    {(sec.rows || []).map((row, ri) => (
                                      <Box 
                                        key={ri}
                                        onClick={() => handlePreviewRowClick(row)}
                                        sx={{
                                          p: 1,
                                          backgroundColor: '#fff',
                                          cursor: 'pointer',
                                          border: 'none',
                                          borderBottomColor: '#e8e8e8',
                                          borderBottom: ri < (sec.rows || []).length - 1 ? '1px solid #e8e8e8' : 'none',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor: '#f8f9fa'
                                          }
                                        }}
                                      >
                                        {/* Row Image if provided */}
                                        {row.image && (
                                          <Box sx={{ mb: 0.8, borderRadius: '8px', overflow: 'hidden', maxHeight: '120px' }}>
                                            <img 
                                              src={row.image} 
                                              alt="row item"
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                          </Box>
                                        )}
                                        
                                        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                                          <Box sx={{ flex: 1 }}>
                                            {/* Numbered title with bold styling */}
                                            <Typography 
                                              variant="body2" 
                                              sx={{ 
                                                fontWeight: 700, 
                                                color: '#000', 
                                                fontSize: '0.9rem',
                                                lineHeight: 1.3
                                              }}
                                            >
                                              {ri + 1}. {row.title}
                                            </Typography>
                                            
                                            {/* Description on separate line if present */}
                                            {row.description && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  color: '#666', 
                                                  display: 'block', 
                                                  fontSize: '0.75rem',
                                                  mt: 0.4
                                                }}
                                              >
                                                {row.description}
                                              </Typography>
                                            )}
                                            
                                            {/* URL/Link indicator if action URL exists */}
                                            {(row.actionUrl || (row.actionType === 'URL' && row.actionValue)) && (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                                                <LinkIcon sx={{ fontSize: '0.65rem', color: '#0084ff' }} />
                                                <Typography 
                                                  variant="caption" 
                                                  sx={{ 
                                                    color: '#0084ff', 
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500
                                                  }}
                                                >
                                                  {row.actionUrl || row.actionValue}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                          
                                          <Typography variant="caption" sx={{ color: '#999', fontSize: '1.2rem', mt: 0.2 }}>
                                            ›
                                          </Typography>
                                        </Stack>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        );
                      }

                      if (block.type === 'RELATED_QUESTIONS') return (
                        <Stack key={index} spacing={0.8} sx={{ alignSelf: 'flex-start', width: '85%' }}>
                          {(block.config?.questions || []).map((q, qi) => (
                            <Button 
                              key={qi}
                              onClick={() => handlePreviewRowClick({ title: q })}
                              fullWidth
                              sx={{
                                textTransform: 'none',
                                backgroundColor: '#e8eef5',
                                color: '#1a1a1a',
                                border: '1px solid #d0d8e0',
                                borderRadius: '18px',
                                fontWeight: 500,
                                py: 0.8,
                                fontSize: '0.85rem',
                                justifyContent: 'flex-start',
                                pl: 1.5,
                                transition: 'all 0.2s ease',
                                '&:hover': { 
                                  backgroundColor: '#dce3ed',
                                  borderColor: '#0084ff',
                                  color: '#0084ff'
                                }
                              }}
                            >
                              {q}
                            </Button>
                          ))}
                        </Stack>
                      );

                      return null;
                    })}
                  </Box>

                  {/* Input Bar */}
                  <Box sx={{
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e8e8e8',
                    p: 1.5,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    borderRadius: '0 0 36px 36px',
                    transition: 'all 0.2s ease'
                  }}>
                    <Typography sx={{ flex: 1, color: '#999', fontSize: '0.85rem', fontWeight: 500 }}>
                      Type a message...
                    </Typography>
                    <Typography sx={{ color: '#0084ff', fontSize: '1.2rem', fontWeight: 700 }}>
                      ↑
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Quick Create Rule Modal (Elevated Seller Hub Dialog) ── */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)'
          }
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#84cc16',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '16px'
              }}
            >
              ⚡
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                  Create AI Response Rule
                </Typography>
                <Chip
                  label="INSTANT COPILOT"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(132, 204, 22, 0.15)',
                    color: '#84cc16',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    height: 20
                  }}
                />
              </Stack>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Automatically reply 24/7 whenever a customer sends specific words on WhatsApp.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenCreateModal(false)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Quick Trigger Presets */}
        <Box
          sx={{
            px: 3,
            py: 1.25,
            bgcolor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
            💡 QUICK TEMPLATES:
          </Typography>
          {[
            {
              name: 'Pricing & Offers',
              keywords: 'PRICE, DISCOUNT, RATE, OFFER, COST',
              response: 'Namaste! Here are our ongoing seasonal discounts and current price lists. Would you like to view our full digital catalog?'
            },
            {
              name: 'Catalog & Products',
              keywords: 'CATALOG, PRODUCTS, COLLECTION, SHOW',
              response: '✨ Explore our exclusive trending collections with special factory-direct pricing. Tap below to browse!'
            },
            {
              name: 'Order Tracking',
              keywords: 'ORDER, TRACK, STATUS, WHERE',
              response: '📦 Please share your 6-digit Order ID, and our automated dispatch tracker will look up live delivery status immediately.'
            },
            {
              name: 'Store Hours & Location',
              keywords: 'TIMING, OPEN, LOCATION, ADDRESS',
              response: '📍 We are open Monday to Saturday, 10:00 AM to 8:30 PM. Visit us or place your order directly on WhatsApp!'
            }
          ].map(tpl => (
            <Chip
              key={tpl.name}
              label={tpl.name}
              size="small"
              onClick={() => {
                setModalForm(prev => ({
                  ...prev,
                  name: tpl.name + ' Responder',
                  triggerKeywords: tpl.keywords,
                  responseText: tpl.response
                }));
              }}
              clickable
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#0f172a',
                '&:hover': { bgcolor: '#0f172a', color: '#84cc16' }
              }}
            />
          ))}
        </Box>

        {/* Modal Form Content */}
        <DialogContent sx={{ p: 3, overflowY: 'auto', bgcolor: '#f8fafc' }}>
          <Grid container spacing={3}>
            {/* Form Fields (60%) */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  required
                  size="small"
                  placeholder="e.g. Flash Pricing Auto-Responder"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                />

                <TextField
                  fullWidth
                  label="Customer Trigger Keywords (comma-separated)"
                  required
                  size="small"
                  placeholder="e.g. PRICE, COST, DISCOUNT, RATE, OFFER"
                  value={modalForm.triggerKeywords}
                  onChange={(e) => setModalForm({ ...modalForm, triggerKeywords: e.target.value })}
                  helperText="When any customer message includes one of these keywords, this rule activates."
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Action to Execute</InputLabel>
                  <Select
                    value={modalForm.actionType}
                    label="Action to Execute"
                    onChange={(e) => setModalForm({ ...modalForm, actionType: e.target.value })}
                    sx={{ bgcolor: '#ffffff', borderRadius: '10px' }}
                  >
                    <MenuItem value="SEND_TEXT">💬 Instant Message Reply (with Buttons)</MenuItem>
                    <MenuItem value="SEND_TEMPLATE">📄 Send Pre-Approved WhatsApp Template</MenuItem>
                    <MenuItem value="TRIGGER_WORKFLOW">⚡ Trigger Multi-Step Journey Workflow</MenuItem>
                    <MenuItem value="HUMAN_HANDOVER">👤 Handover to Live Support Agent</MenuItem>
                  </Select>
                </FormControl>

                {modalForm.actionType === 'TRIGGER_WORKFLOW' && (
                  <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mb: 1 }}>
                      🔗 Target Automated Journey Workflow
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl fullWidth size="small">
                        <InputLabel>Choose Workflow</InputLabel>
                        <Select
                          value={modalForm.workflowId || ''}
                          label="Choose Workflow"
                          onChange={(e) => setModalForm(prev => ({ ...prev, workflowId: e.target.value }))}
                          sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                        >
                          {workflows.map(wf => (
                            <MenuItem key={wf._id} value={wf._id}>{wf.name} ({wf.status})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setOpenCreateModal(false);
                          handleOpenCreateWorkflow();
                        }}
                        sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 800, borderRadius: '8px' }}
                      >
                        + Create Workflow
                      </Button>
                    </Stack>
                  </Box>
                )}

                <Box>
                  <SmartTagToolbar
                    targetInputRef={modalResponseInputRef}
                    currentText={modalForm.responseText || ''}
                    onInsertTag={(_, newText) => setModalForm(prev => ({ ...prev, responseText: newText }))}
                  />
                  <TextField
                    inputRef={modalResponseInputRef}
                    fullWidth
                    multiline
                    rows={4}
                    label="Automated WhatsApp Response Text"
                    required
                    placeholder="Type the message to send automatically... Click any tag above to insert!"
                    value={modalForm.responseText}
                    onChange={(e) => setModalForm({ ...modalForm, responseText: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '0.85rem' }}>
                    Quick Reply Buttons (Customer can tap)
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {modalForm.buttons.map((btn, idx) => (
                      <Chip
                        key={idx}
                        label={btn}
                        size="small"
                        onDelete={() => {
                          const updated = modalForm.buttons.filter((_, i) => i !== idx);
                          setModalForm({ ...modalForm, buttons: updated });
                        }}
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 700, borderRadius: '8px' }}
                      />
                    ))}
                    {modalForm.buttons.length < 3 && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          const label = prompt('Enter button label (max 20 chars):', 'More Info');
                          if (label && label.trim()) {
                            setModalForm({ ...modalForm, buttons: [...modalForm.buttons, label.trim().slice(0, 20)] });
                          }
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }}
                      >
                        Add Button
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            {/* Live WhatsApp Preview (40%) */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, textAlign: 'center', fontSize: '0.85rem' }}>
                  WhatsApp Response Preview
                </Typography>

                <Box
                  sx={{
                    bgcolor: '#efeae2',
                    p: 2,
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#ffffff',
                      p: 1.5,
                      borderRadius: '10px',
                      borderTopLeftRadius: 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      mb: 1
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                      {modalForm.responseText || 'Type a response message to preview...'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748b' }}>
                        Just now ✓✓
                      </Typography>
                    </Box>
                  </Box>

                  {modalForm.buttons.map((btn, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1,
                        mb: 0.5,
                        bgcolor: '#ffffff',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#075e54',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        border: '1px solid #dcfce7'
                      }}
                    >
                      {btn}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Modal Actions */}
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={() => {
              setOpenCreateModal(false);
              handleOpenAddDrawer();
            }}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}
          >
            Advanced Flow Studio ➔
          </Button>

          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={() => setOpenCreateModal(false)}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#475569', borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveQuickRule}
              sx={{
                bgcolor: '#84cc16',
                color: '#0f172a',
                fontWeight: 900,
                borderRadius: '10px',
                px: 3,
                boxShadow: '0 4px 14px rgba(132, 204, 22, 0.45)',
                '&:hover': {
                  bgcolor: '#65a30d',
                  color: '#ffffff'
                }
              }}
            >
              Save & Activate Rule
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ── Visual Builder Studio (SAP DM Process Designer Fullscreen Modal) ── */}
      <Dialog
        fullScreen
        open={openDrawer}
        onClose={handleCloseDrawerWithCheck}
        slotProps={{
          paper: {
            sx: {
              m: 0,
              p: 0,
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
              bgcolor: '#0F172A',
              overflow: 'hidden'
            }
          }
        }}
      >
        <SapDmProcessDesigner
          isWorkflow={isWorkflowDesigner}
          initialData={{
            name: ruleName,
            status: isActive ? 'ACTIVE' : 'PAUSED',
            triggerType,
            triggerValue,
            actionType,
            responseMessage: blocks[0]?.config?.text || blocks[0]?.config?.message || ''
          }}
          onSave={async (dmData) => {
            if (isWorkflowDesigner) {
              const wfPayload = {
                name: dmData.name || 'New Customer Journey Flow',
                description: 'Created via Unified Rules Studio',
                status: dmData.status || 'ACTIVE',
                trigger: {
                  type: 'EVENT',
                  conditions: [{
                    field: 'intent',
                    operator: 'equals',
                    value: dmData.triggerValue || 'order_inquiry'
                  }]
                },
                steps: (dmData.nodes || []).map((node, idx) => ({
                  id: node.id || `step_${idx + 1}`,
                  type: node.type === 'TAG' ? 'TAG' : 'SEND_MESSAGE',
                  name: node.label || 'Action Step',
                  config: {
                    value: node.config?.message || node.config?.value || 'Namaste! Thank you for contacting us.'
                  }
                }))
              };
              if (wfPayload.steps.length === 0) {
                wfPayload.steps = [{
                  id: 'step_1',
                  type: 'SEND_MESSAGE',
                  name: 'Send Automated Reply',
                  config: { value: dmData.responseMessage || 'Namaste! Thank you for contacting us.' }
                }];
              }

              try {
                if (editingWorkflow) {
                  await apiClient.put(`/workflows/${editingWorkflow._id}`, wfPayload);
                  showSnackbar('Workflow updated successfully!', 'success');
                } else {
                  await apiClient.post('/workflows', wfPayload);
                  showSnackbar('Workflow created & deployed successfully!', 'success');
                }
                setOpenDrawer(false);
                setIsWorkflowDesigner(false);
                setEditingWorkflow(null);
                fetchWorkflows();
              } catch (err) {
                console.error('Failed to save workflow:', err);
                showSnackbar(err.response?.data?.error || 'Failed to save workflow.', 'error');
              }
              return;
            }

            setRuleName(dmData.name);
            setIsActive(dmData.status === 'ACTIVE');
            if (dmData.triggerType) setTriggerType(dmData.triggerType);
            if (dmData.triggerValue) setTriggerValue(dmData.triggerValue);
            
            // Auto map nodes into blocks structure for backwards compatibility
            const mappedBlocks = (dmData.nodes || []).filter(n => n.category === 'responses').map(n => ({
              type: n.type === 'QUICK_REPLY' ? 'BUTTONS' : 'TEXT',
              config: n.config
            }));

            const payload = {
              name: dmData.name,
              triggerType: dmData.triggerType || triggerType,
              triggerValue: dmData.triggerValue || triggerValue,
              actionType: dmData.actionType || actionType,
              templateId: actionType === 'SEND_TEMPLATE' ? templateId : undefined,
              workflowId: actionType === 'TRIGGER_WORKFLOW' ? workflowId : undefined,
              messageBlocks: mappedBlocks.length > 0 ? mappedBlocks : blocks,
              isActive: dmData.status === 'ACTIVE'
            };

            try {
              if (editingRule) await apiClient.put(`/response-rules/${editingRule._id}`, payload);
              else await apiClient.post('/response-rules', payload);
              showSnackbar(`Rule ${editingRule ? 'updated' : 'created'} successfully!`, 'success');
              setOpenDrawer(false);
              fetchRules();
            } catch (err) {
              showSnackbar('Failed to save rule.', 'error');
            }
          }}
          onClose={() => {
            if (isWorkflowDesigner) {
              setOpenDrawer(false);
              setIsWorkflowDesigner(false);
              setEditingWorkflow(null);
            } else {
              handleCloseDrawerWithCheck();
            }
          }}
          availableTemplates={templates}
          availableWorkflows={workflows}
          availableRules={rules}
        />
      </Dialog>

      {/* AI Copilot Drawer */}
      <Drawer anchor="right" open={openAICopilot} onClose={() => setOpenAICopilot(false)}
        PaperProps={{ sx: { width: '420px', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff !important' } }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SmartToyIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Rules Copilot</Typography>
            </Stack>
            <IconButton onClick={() => setOpenAICopilot(false)}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {uploadedFile 
              ? 'Ready to process your CSV file to create rules in bulk.' 
              : 'Describe what the rule should do to generate it instantly, or upload a CSV template to bulk import multiple rules.'}
          </Typography>
          <AIProviderStatus compact sx={{ mb: 3 }} />
          <Stack spacing={2.5}>
            <TextField label="Describe rule behavior" fullWidth multiline rows={4} value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Generate a welcoming layout for gold rate..."
              InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
            <Box onClick={() => fileInputRef.current?.click()}
              sx={{ p: 3, border: '2px dashed #b0b0b0', borderRadius: 3, textAlign: 'center', cursor: 'pointer', bgcolor: '#f5f5f5', '&:hover': { borderColor: '#1976d2' } }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
              <CloudUploadIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              {uploadedFile
                ? <Typography variant="body2" sx={{ fontWeight: 600 }}>Selected: {uploadedFile.name}</Typography>
                : <Typography variant="body2" color="#666">Upload CSV template (.csv) [Optional]</Typography>}
            </Box>
          </Stack>
        </Box>
        <Box sx={{ pt: 3, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button onClick={() => setOpenAICopilot(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleAIDraftRule} disabled={aiGenerating} disableElevation>
            {aiGenerating ? (uploadedFile ? 'Processing...' : 'Generating...') : (uploadedFile ? 'Process CSV' : 'Generate Rule')}
          </Button>
        </Box>
      </Drawer>

      {/* AI Review Drawer */}
      <Drawer anchor="right" open={openReviewModal} onClose={() => setOpenReviewModal(false)}
        PaperProps={{ sx: { width: '460px', p: 3, display: 'flex', flexDirection: 'column', background: '#fff !important' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {draftReview?.mode === 'BULK_TEMPLATES' ? `📋 Preview ${draftReview?.count || 0} CSV Templates` : 'Review AI Draft'}
          </Typography>
          <IconButton onClick={() => setOpenReviewModal(false)}><CloseIcon /></IconButton>
        </Box>
        {draftReview && (
          <Box sx={{ flex: 1, overflowY: 'auto', mb: 3 }}>
            <Stack spacing={2.5}>
              {draftReview.mode === 'BULK_TEMPLATES' ? (
                <>
                  <Alert severity="success">✅ CSV detected! Ready to create {draftReview.count} rules.</Alert>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Templates Preview:</Typography>
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <Stack spacing={1}>
                      {draftReview.templates?.map((t, i) => (
                        <Card key={i} sx={{ background: '#f9f9f9 !important', border: '1px solid #e0e0e0 !important' }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c5aa0' }}>{i + 1}. {t.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.content}</Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                </>
              ) : (
                <>
                  <Paper sx={{ p: 2, background: '#f5f5f5 !important', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Rule Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{draftReview.name}</Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }} gutterBottom>Triggers</Typography>
                    <Chip label={`${draftReview.triggerType}: "${draftReview.triggerValue}"`} size="small" color="primary" />
                  </Paper>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Generated Layout Blocks:</Typography>
                  {draftReview.messageBlocks?.map((b, i) => (
                    <Card key={i} sx={{ background: '#f9f9f9 !important', border: '1px solid #e0e0e0 !important' }}>
                      <Box sx={{ bgcolor: '#e0e0e0', px: 2, py: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Block #{i + 1}: {b.type}</Typography>
                      </Box>
                      <CardContent sx={{ p: 2 }}>
                        {b.type === 'TEXT' && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{b.config?.text || b.config?.message || ''}</Typography>}
                        {b.type === 'CARD' && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{b.config?.title}</Typography>
                            {b.config?.description && <Typography variant="body2" color="text.secondary">{b.config.description}</Typography>}
                            {b.config?.imageUrl && <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#1976d2' }}>Image: {b.config.imageUrl}</Typography>}
                            {b.config?.buttons?.length > 0 && (
                              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                                {b.config.buttons.map((btn, bi) => <Chip key={bi} label={btn.label} size="small" />)}
                              </Stack>
                            )}
                          </Box>
                        )}
                        {b.type === 'BUTTONS' && (
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                            {b.config?.buttons?.map((btn, bi) => <Chip key={bi} label={btn.label} size="small" />)}
                          </Stack>
                        )}
                        {b.type === 'LIST' && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{b.config?.title || 'Menu List'}</Typography>
                            {b.config?.buttonText && <Typography variant="caption" display="block" color="text.secondary">Menu Button: {b.config.buttonText}</Typography>}
                            <Stack spacing={1} sx={{ mt: 1.5 }}>
                              {b.config?.sections?.map((sec, si) => (
                                <Box key={si} sx={{ pl: 1, borderLeft: '2px solid #1976d2' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1976d2' }}>{sec.title || 'Section'}</Typography>
                                  {sec.rows?.map((row, ri) => (
                                    <Typography key={ri} variant="body2" sx={{ pl: 1, mt: 0.5 }}>
                                      • {row.title} {row.description ? `— ${row.description}` : ''}
                                    </Typography>
                                  ))}
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                        {b.type === 'RELATED_QUESTIONS' && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Related FAQs</Typography>
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                              {b.config?.questions?.map((q, qi) => (
                                <Typography key={qi} variant="body2">• {q}</Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </Stack>
          </Box>
        )}
        <Box sx={{ pt: 3, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button onClick={() => setOpenReviewModal(false)} sx={{ color: '#666' }}>Discard</Button>
          <Button variant="contained" color="success" onClick={applyAIDraft} disabled={aiGenerating}>
            {aiGenerating ? 'Creating...' : draftReview?.mode === 'BULK_TEMPLATES' ? `Create All ${draftReview?.count || 0} Rules` : 'Apply Draft'}
          </Button>
        </Box>
      </Drawer>

      <CustomSnackbar open={snackbar.open} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} severity={snackbar.severity} />

      <Dialog open={confirmDialog.open} onClose={handleCancelDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{confirmDialog.message}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCancelDialog} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained" color={confirmDialog.type === 'delete' ? 'error' : 'warning'} disableElevation>
            {confirmDialog.type === 'delete' ? 'Delete' : 'Discard'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help / Guidelines Dialog */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 CSV Template Format Guidelines</span>
          <IconButton onClick={() => setOpenHelpDialog(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              When uploading templates via the AI Assistant, use a CSV file format so each row automatically becomes one response rule:
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0', fontWeight: 700, display: 'block', mb: 1 }}>
                Required Headers:
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0', display: 'block', mb: 0.5 }}>
                • <strong>question</strong> / <strong>name</strong>: The title or name of the rule.
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0', display: 'block', mb: 0.5 }}>
                • <strong>keywords</strong>: Comma-separated trigger words (e.g. <i>price,cost,discount</i>).
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0', display: 'block' }}>
                • <strong>answer</strong> / <strong>content</strong>: The reply message sent to customers.
              </Typography>
            </Box>

            <Alert severity="success">
              ✅ Multi-line answers (with newlines) must be enclosed in double quotes: <br/>
              <code>"Line 1\nLine 2"</code>
            </Alert>

            <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
              <strong>Pro Tip:</strong> You can upload a single CSV file with up to 100+ items to generate rules in bulk with just one click.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHelpDialog(false)} variant="contained" disableElevation>Got it</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  function handleToggleActiveRule(ruleId, currentStatus) {
    const rule = rules.find(r => r._id === ruleId);
    apiClient.put(`/response-rules/${ruleId}`, { ...rule, isActive: !currentStatus })
      .then(() => { fetchRules(); showSnackbar('Rule status updated!', 'success'); })
      .catch(() => showSnackbar('Failed to update status.', 'error'));
  }
}