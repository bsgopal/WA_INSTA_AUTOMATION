import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, TextField, Button, Switch,
  FormControlLabel, Divider, Stack, Card, CardContent, IconButton,
  MenuItem, FormControl, InputLabel, Select, Drawer, Tooltip,
  Alert, Chip, CircularProgress, Tabs, Tab,
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

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import SmartTextEditor from '../../components/SmartTextEditor';
import AIProviderStatus from '../../components/AIProviderStatus';

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
    if (t === 'CATALOG') { if (v && /^https?:\/\//i.test(v)) window.open(v, '_blank', 'noopener,noreferrer'); else window.location.href = '/catalog'; return; }
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

  const handleOpenAddDrawer = () => {
    setEditingRule(null); setRuleName(''); setTriggerType('KEYWORD'); setTriggerValue('');
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
  return (
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }} gutterBottom>
            AI Response Rules Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure dynamic rules and design interactive layout templates using visual drag-and-drop
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="info" onClick={() => setOpenHelpDialog(true)}>
            Help / Guidelines
          </Button>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />}
            onClick={() => { setOpenAICopilot(true); if (!openDrawer) handleOpenAddDrawer(); }}>
            AI Assistant
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDrawer} disableElevation>
            Create Rule
          </Button>
        </Stack>
      </Box>

      {/* Status tabs filter */}
      {!loading && rules.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3.5 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => setActiveTab(val)} 
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab 
              value="ALL" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>All Rules</Typography>
                  <Chip label={rules.length} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                </Box>
              } 
            />
            <Tab 
              value="ACTIVE" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Active</Typography>
                  <Chip label={rules.filter(r => r.isActive).length} size="small" color="success" sx={{ height: 20, fontSize: '0.75rem', color: '#fff' }} />
                </Box>
              } 
            />
            <Tab 
              value="INACTIVE" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Draft / Inactive</Typography>
                  <Chip label={rules.filter(r => !r.isActive).length} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                </Box>
              } 
            />
          </Tabs>
        </Box>
      )}

      {/* Rules Grid - Card Layout */}
      {loading ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'transparent' }} elevation={0}>
          <CircularProgress size={30} />
          <Typography variant="body2" color="text.secondary" mt={2}>Loading configurations...</Typography>
        </Paper>
      ) : rules.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 3 }} elevation={0}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>No active response rules yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Create your first trigger layout or use the AI Assistant.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDrawer} disableElevation>Add Rule</Button>
        </Paper>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, pb: 4 }}>
          {rules.filter(rule => {
            if (activeTab === 'ACTIVE') return rule.isActive;
            if (activeTab === 'INACTIVE') return !rule.isActive;
            return true;
          }).length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 3 }} elevation={0}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>No rules match this status filter</Typography>
            </Paper>
          ) : (
            <Box component={Paper} sx={{ mb: 3 }} elevation={0} border="1px solid #e0e0e0">
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 800 }}>
                  {/* Header Row */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '60px 1.5fr 1fr 1fr 120px 180px',
                    gap: 2,
                    p: 2,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 'bold',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>#</Box>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rule Name & Creator</Box>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Trigger</Box>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Blocks</Box>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Status</Box>
                    <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right', pr: 2 }}>Actions</Box>
                  </Box>

                  {/* Data Rows */}
                  {rules.filter(rule => {
                    if (activeTab === 'ACTIVE') return rule.isActive;
                    if (activeTab === 'INACTIVE') return !rule.isActive;
                    return true;
                  }).map((rule, idx) => (
                    <Box key={rule._id} sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '60px 1.5fr 1fr 1fr 120px 180px',
                      gap: 2,
                      p: 2,
                      borderBottom: '1px solid #e0e0e0',
                      alignItems: 'center',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                      width: '100%',
                      boxSizing: 'border-box',
                      '&:hover': { backgroundColor: '#f1f5f9' },
                    }}>
                      {/* Index */}
                      <Box sx={{ fontWeight: 'bold', color: '#1976d2' }}>{idx + 1}</Box>

                      {/* Name & Creator */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {rule.name}
                        </Typography>
                        {rule.userId && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
                            Created by: {rule.userId.firstName || ''} {rule.userId.lastName || ''}
                          </Typography>
                        )}
                      </Box>

                      {/* Trigger */}
                      <Box>
                        <Chip label={rule.triggerType} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, mb: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{rule.triggerValue}"
                        </Typography>
                      </Box>

                      {/* Blocks */}
                      <Box>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {rule.messageBlocks?.slice(0, 2).map((b, i) => (
                            <Chip key={i} label={b.type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                          {rule.messageBlocks?.length > 2 && (
                            <Chip label={`+${rule.messageBlocks.length - 2}`} size="small" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Stack>
                      </Box>

                      {/* Status */}
                      <Box>
                        <FormControlLabel 
                          control={<Switch size="small" checked={rule.isActive} onChange={() => handleToggleActiveRule(rule._id, rule.isActive)} />} 
                          label={rule.isActive ? 'Active' : 'Inactive'}
                          sx={{ m: 0 }}
                          labelPlacement="end"
                        />
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 1 }}>
                        <Tooltip title="Preview">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => {
                              setOpenPreviewDialog(true);
                              setPreviewContent(rule);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenEditDrawer(rule)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => confirmDeleteRule(rule._id)}
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

      {/* ── Visual Builder Drawer ── */}
      <Drawer anchor="right" open={openDrawer} onClose={handleCloseDrawerWithCheck}
        PaperProps={{ sx: { width: '95vw', maxWidth: '1600px', p: 0, overflow: 'hidden', background: '#ffffff !important' } }}>
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

          {/* Left: Palette */}
          <Box sx={{ width: '320px', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Component Palette</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Drag blocks onto the canvas</Typography>
            </Box>
            <Tabs value={paletteTab} onChange={(_, v) => setPaletteTab(v)} variant="fullWidth"
              sx={{ borderBottom: '1px solid #e0e0e0', '& .MuiTab-root': { color: '#666', fontWeight: 600 }, '& .Mui-selected': { color: '#1976d2 !important' }, '& .MuiTabs-indicator': { backgroundColor: '#1976d2' } }}>
              <Tab label="Widgets" />
              <Tab label="Templates" />
            </Tabs>
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
              {paletteTab === 0 ? (
                <Stack spacing={1.5}>
                  {[
                    { type: 'TEXT', label: '💬 Text Block', desc: 'Plain text with emoji support' },
                    { type: 'CARD', label: '🖼️ Media Card', desc: 'Image, header and action buttons' },
                    { type: 'BUTTONS', label: '🔘 Action Buttons', desc: 'Up to 3 quick action options' },
                    { type: 'LIST', label: '📋 Option List', desc: 'Select menu list options' },
                    { type: 'RELATED_QUESTIONS', label: '❓ Related FAQs', desc: 'Recommended query suggestions' }
                  ].map(item => (
                    <Card key={item.type} variant="outlined" draggable onDragStart={(e) => handleDragStartPalette(e, item.type)}
                      sx={{ cursor: 'grab', background: '#fff !important', borderColor: '#d0d0d0 !important', '&:hover': { borderColor: '#1976d2 !important', background: '#f0f7ff !important' } }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{item.label}</Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mt: 0.5 }}>{item.desc}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  {templates.length === 0
                    ? <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No templates found.</Typography>
                    : templates.map(t => (
                      <Card key={t._id} variant="outlined" draggable onDragStart={(e) => handleDragStartPalette(e, 'TEMPLATE_IMPORT', { text: t.content, id: t._id })}
                        sx={{ cursor: 'grab', background: '#fff !important', borderColor: '#d0d0d0 !important', '&:hover': { borderColor: '#4caf50 !important', background: '#f1f8f4 !important' } }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>📄 {t.name}</Typography>
                          <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#666', fontSize: '0.85rem', mt: 0.5 }}>{t.content}</Typography>
                        </CardContent>
                      </Card>
                    ))
                  }
                </Stack>
              )}
            </Box>
          </Box>

          {/* Center: Canvas */}
          <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
            {/* Canvas header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={handleCloseDrawerWithCheck} sx={{ color: '#666' }}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.3rem' }}>
                  {editingRule ? 'Edit Response Rule Layout' : 'Create Response Rule Layout'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Tooltip title="Undo"><span><IconButton size="small" onClick={handleUndo} disabled={!historyStack.past.length} sx={{ color: '#666' }}><UndoIcon /></IconButton></span></Tooltip>
                <Tooltip title="Redo"><span><IconButton size="small" onClick={handleRedo} disabled={!historyStack.future.length} sx={{ color: '#666' }}><RedoIcon /></IconButton></span></Tooltip>
                <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyLayout} size="small">Copy JSON</Button>
                <Button variant="outlined" startIcon={<ContentPasteIcon />} onClick={handlePasteLayout} size="small">Paste JSON</Button>
                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
                <Tooltip title="Preview layout">
                  <Button variant="contained" startIcon={<PhoneAndroidIcon />} onClick={() => {
                    setPreviewContent({
                      name: ruleName || 'Response Rule',
                      triggerType: triggerType,
                      triggerValue: triggerValue,
                      messageBlocks: blocks
                    });
                    setOpenPreviewDialog(true);
                  }} size="small" sx={{ bgcolor: '#1976d2' }}>
                    Preview
                  </Button>
                </Tooltip>
              </Stack>
            </Box>

            {/* Canvas scroll area */}
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
              <Grid container spacing={3}>
                {/* Config form - Numbered fields */}
                <Grid item xs={12}>
                  <Paper sx={{
                    p: 4,
                    borderRadius: 2.5,
                    background: '#ffffff',
                    backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), 0 4px 24px rgba(0, 0, 0, 0.04)',
                    borderTop: '4px solid #1976d2',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 6px 32px rgba(0, 0, 0, 0.06)'
                    }
                  }} elevation={0}>
                    <Stack spacing={2.5} mt={0}>
                      {/* 1. Rule Name */}
                      <TextField
                        fullWidth
                        label="1. Rule Name"
                        placeholder="e.g., Price Check Kundan Ring"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        helperText="Short name for this response rule"
                        size="small"
                        InputLabelProps={labelSx}
                        inputProps={inputPropsSx}
                        sx={inputSx}
                      />

                      {/* 2. Trigger Type */}
                      <FormControl fullWidth size="small" sx={formControlSx}>
                        <InputLabel sx={labelSx.style}>2. Trigger Type</InputLabel>
                        <Select
                          value={triggerType}
                          label="2. Trigger Type"
                          onChange={(e) => setTriggerType(e.target.value)}
                          sx={{ color: '#1a1a1a' }}
                        >
                          <MenuItem value="EXACT_MATCH">Exact Match</MenuItem>
                          <MenuItem value="KEYWORD">Keyword Includes</MenuItem>
                          <MenuItem value="INTENT">AI Intent Category</MenuItem>
                        </Select>
                      </FormControl>

                      {/* 3. Trigger Value */}
                      <TextField
                        fullWidth
                        label="3. Trigger Value"
                        placeholder={triggerType === 'INTENT' ? 'general_inquiry' : triggerType === 'KEYWORD' ? 'price, cost, rate' : 'exact text to match'}
                        value={triggerValue}
                        onChange={(e) => setTriggerValue(e.target.value)}
                        helperText={
                          triggerType === 'INTENT'
                            ? 'Intent category to match (e.g., general_inquiry)'
                            : triggerType === 'KEYWORD'
                            ? 'Keywords to match (comma-separated)'
                            : 'Exact text that will trigger this rule'
                        }
                        size="small"
                        InputLabelProps={labelSx}
                        inputProps={inputPropsSx}
                        sx={inputSx}
                      />

                      {/* 4. Rule Action */}
                      <FormControl fullWidth size="small" sx={formControlSx}>
                        <InputLabel sx={labelSx.style}>4. Rule Action</InputLabel>
                        <Select
                          value={actionType}
                          label="4. Rule Action"
                          onChange={(e) => setActionType(e.target.value)}
                          sx={{ color: '#1a1a1a' }}
                        >
                          <MenuItem value="SEND_TEXT">Send Visual Layout</MenuItem>
                          <MenuItem value="SEND_TEMPLATE">Send Template Broadcast</MenuItem>
                          <MenuItem value="TRIGGER_WORKFLOW">Trigger Workflow</MenuItem>
                          <MenuItem value="HUMAN_HANDOVER">Escalate to Human</MenuItem>
                        </Select>
                      </FormControl>

                      {/* 5. Template/Workflow Selection - Conditional */}
                      {actionType === 'SEND_TEMPLATE' && (
                        <Box onDragOver={(e) => e.preventDefault()} onDrop={handleDropLinkTemplate}
                          sx={{ p: 2, border: '2px dashed #1976d2', borderRadius: 3, textAlign: 'center', bgcolor: templateId ? '#e0e0e0' : 'transparent' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#1a1a1a' }}>5. Template Selection</Typography>
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                            <LinkIcon color="primary" />
                            {templateId
                              ? <Typography variant="body2" sx={{ fontWeight: 600 }}>Linked: {templates.find(t => t._id === templateId)?.name || 'Template'}</Typography>
                              : <Typography variant="body2" color="#666">Drag/drop template here or select below</Typography>}
                          </Stack>
                          <FormControl fullWidth size="small" sx={formControlSx}>
                            <InputLabel sx={labelSx.style}>Choose template...</InputLabel>
                            <Select value={templateId} label="Choose template..." onChange={(e) => setTemplateId(e.target.value)} sx={{ color: '#1a1a1a' }}>
                              <MenuItem value="" disabled>Choose template...</MenuItem>
                              {templates.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Box>
                      )}

                      {actionType === 'TRIGGER_WORKFLOW' && (
                        <FormControl fullWidth size="small" sx={formControlSx}>
                          <InputLabel sx={labelSx.style}>5. Workflow Selection</InputLabel>
                          <Select value={workflowId} label="5. Workflow Selection" onChange={(e) => setWorkflowId(e.target.value)} sx={{ color: '#1a1a1a' }}>
                            {workflows.length === 0 ? (
                              <MenuItem disabled>No workflows available</MenuItem>
                            ) : (
                              workflows.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)
                            )}
                          </Select>
                        </FormControl>
                      )}

                      {/* 6. Active Status */}
                      <FormControlLabel
                        control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                        label="6. Active Status"
                        sx={{ color: '#666', fontWeight: 500 }}
                      />
                    </Stack>
                  </Paper>
                </Grid>

                {/* Canvas drop zone */}
                <Grid item xs={12}>
                  <Paper onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnCanvas(e)}
                    sx={{ p: 3, borderRadius: 3, border: '2px dashed #b0b0b0 !important', minHeight: 400, background: '#f5f5f5 !important' }} elevation={0}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#1a1a1a' }}>Visual Layout Canvas Workspace</Typography>

                    {blocks.length === 0 ? (
                      <Box onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnCanvas(e)}
                        sx={{ p: 6, border: '1px dashed #b0b0b0', borderRadius: 3, textAlign: 'center', background: '#fff !important' }}>
                        <Typography variant="body2" color="text.secondary">Canvas is empty. Drag a widget from the palette.</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {blocks.map((block, index) => (
                          <Card key={index} variant="outlined" draggable
                            onDragStart={(e) => handleDragStartCanvas(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnCanvas(e, index)}
                            sx={{ background: '#fff !important', borderColor: '#e0e0e0 !important', borderRadius: 3 }}>
                            {/* Block header */}
                            <Box sx={{ bgcolor: '#e0e0e0', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconButton size="small" sx={{ cursor: 'grab', color: '#666' }}><DragIndicatorIcon fontSize="small" /></IconButton>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{index + 1}. {block.type} BLOCK</Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => handleMoveBlock(index, 'up')} disabled={index === 0}><ArrowUpwardIcon fontSize="inherit" /></IconButton>
                                <IconButton size="small" onClick={() => handleMoveBlock(index, 'down')} disabled={index === blocks.length - 1}><ArrowDownwardIcon fontSize="inherit" /></IconButton>
                                <Tooltip title="Duplicate"><IconButton size="small" color="primary" onClick={() => handleDuplicateBlock(index)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                                <IconButton size="small" color="error" onClick={() => handleDeleteBlock(index)}><DeleteIcon fontSize="inherit" /></IconButton>
                              </Stack>
                            </Box>

                            <Box sx={{ p: 3 }}>
                              {/* TEXT */}
                              {block.type === 'TEXT' && (
                                <SmartTextEditor label="Message Text Content" rows={3} value={block.config?.text || ''}
                                  onChange={(e) => handleUpdateBlockConfig(index, { text: e.target.value })}
                                  placeholder="Enter reply message text. Use Insert Variable for dynamic fields." showPreview />
                              )}

                              {/* CARD */}
                              {block.type === 'CARD' && (
                                <Stack spacing={2}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                      <TextField label="Card Title" fullWidth value={block.config?.title || ''}
                                        onChange={(e) => handleUpdateBlockConfig(index, { title: e.target.value })}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <TextField label="Image URL (Optional)" fullWidth value={block.config?.imageUrl || ''}
                                        onChange={(e) => handleUpdateBlockConfig(index, { imageUrl: e.target.value })}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                    </Grid>
                                    <Grid item xs={12}>
                                      <TextField label="Card Description" fullWidth multiline rows={2} value={block.config?.description || ''}
                                        onChange={(e) => handleUpdateBlockConfig(index, { description: e.target.value })}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                    </Grid>
                                  </Grid>
                                  <Divider />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Card Action Buttons (Max 3)</Typography>
                                  {renderButtonEditor(block, index, 3)}
                                </Stack>
                              )}

                              {/* BUTTONS */}
                              {block.type === 'BUTTONS' && renderButtonEditor(block, index, 3)}

                              {/* LIST — uses fixed Grid layout */}
                              {block.type === 'LIST' && (
                                <Stack spacing={2}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                      <TextField label="List Drawer Title" fullWidth value={block.config?.title || ''}
                                        onChange={(e) => handleUpdateBlockConfig(index, { title: e.target.value })}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <TextField label="Button Text" fullWidth value={block.config?.buttonText || ''}
                                        onChange={(e) => handleUpdateBlockConfig(index, { buttonText: e.target.value })}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                    </Grid>
                                  </Grid>
                                  <Typography variant="caption" color="text.secondary">Configure sections and select rows</Typography>

                                  {(block.config?.sections || []).map((sec, secIdx) => (
                                    <Paper key={secIdx} variant="outlined" sx={{ p: 2, borderRadius: 2, background: '#f9f9f9 !important', borderColor: '#e0e0e0 !important' }}>
                                      <Stack spacing={2}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                          <TextField label="Section Header Title" size="small" value={sec.title || ''}
                                            onChange={(e) => {
                                              const ns = [...block.config.sections];
                                              ns[secIdx] = { ...sec, title: e.target.value };
                                              handleUpdateBlockConfig(index, { sections: ns });
                                            }}
                                            sx={{ flex: 1, ...inputSx }} InputLabelProps={labelSx} inputProps={inputPropsSx} />
                                          <IconButton size="small" color="error"
                                            onClick={() => handleUpdateBlockConfig(index, { sections: block.config.sections.filter((_, i) => i !== secIdx) })}>
                                            <DeleteIcon fontSize="inherit" />
                                          </IconButton>
                                        </Stack>
                                        {renderListRowEditor(block, index, sec, secIdx)}
                                      </Stack>
                                    </Paper>
                                  ))}

                                  <Button size="small" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }}
                                    onClick={() => handleUpdateBlockConfig(index, {
                                      sections: [...(block.config.sections || []), { title: 'New Section', rows: [{ title: 'Item 1', description: '', rowId: `row_${Date.now()}`, actionType: 'CUSTOM', inputType: 'TEXT' }] }]
                                    })}>
                                    Add List Section
                                  </Button>
                                </Stack>
                              )}

                              {/* RELATED_QUESTIONS */}
                              {block.type === 'RELATED_QUESTIONS' && (
                                <Stack spacing={2}>
                                  <Typography variant="caption" color="text.secondary">Configure suggested question chips</Typography>
                                  {(block.config?.questions || []).map((qn, qnIdx) => (
                                    <Stack key={qnIdx} direction="row" spacing={2} alignItems="center">
                                      <TextField label={`Question ${qnIdx + 1}`} fullWidth size="small" value={qn}
                                        onChange={(e) => {
                                          const nq = [...block.config.questions];
                                          nq[qnIdx] = e.target.value;
                                          handleUpdateBlockConfig(index, { questions: nq });
                                        }}
                                        InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                                      <IconButton size="small" color="error"
                                        onClick={() => handleUpdateBlockConfig(index, { questions: block.config.questions.filter((_, i) => i !== qnIdx) })}>
                                        <DeleteIcon fontSize="inherit" />
                                      </IconButton>
                                    </Stack>
                                  ))}
                                  <Button size="small" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }}
                                    onClick={() => handleUpdateBlockConfig(index, { questions: [...(block.config.questions || []), 'How much does customization cost?'] })}>
                                    Add Related FAQ
                                  </Button>
                                </Stack>
                              )}
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Canvas footer */}
            <Box sx={{ p: 2.5, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#fff' }}>
              <Button onClick={handleCloseDrawerWithCheck} sx={{ color: '#666' }}>Cancel</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveRule} disableElevation>Save Response Rule</Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

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