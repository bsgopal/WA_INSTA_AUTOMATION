import { useState, useEffect, useRef } from 'react';
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
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', type: '', ruleId: null });

  const ROW_ACTION_OPTIONS = [
    { value: 'CUSTOM', label: 'Custom Trigger' },
    { value: 'QUICK_REPLY', label: 'Quick Reply' },
    { value: 'TEMPLATE', label: 'Message Template' },
    { value: 'URL', label: 'Open URL' },
    { value: 'CATALOG', label: 'Catalog Link' }
  ];

  const fmtAction = (v, fb = 'Custom') => {
    const n = String(v || '').trim();
    return n ? n.replace(/_/g, ' ') : fb;
  };

  const inputSx = { '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#e0e0e0' } } };
  const labelSx = { style: { color: '#666666' } };
  const inputPropsSx = { style: { color: '#1a1a1a' } };

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
        lines.push(rd ? `${rt} - ${rd}` : rt);
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
    try {
      setAiGenerating(true);
      if (!uploadedFile) { showSnackbar('Please upload a CSV file.', 'warning'); return; }
      if (!uploadedFile.name.toLowerCase().endsWith('.csv')) { showSnackbar('CSV files only.', 'warning'); return; }
      const tpls = detectAndParseTemplateCSV(await uploadedFile.text());
      if (tpls?.length) {
        setDraftReview({ mode: 'BULK_TEMPLATES', templates: tpls, count: tpls.length });
        setOpenReviewModal(true);
        showSnackbar(`Found ${tpls.length} templates!`, 'success');
      } else {
        showSnackbar('CSV must have question/name and answer/content columns.', 'error');
      }
    } catch (e) { showSnackbar(e?.message || 'CSV parsing failed', 'error'); }
    finally { setAiGenerating(false); }
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
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel sx={labelSx.style}>Action Type</InputLabel>
                  <Select value={btn.actionType || 'CUSTOM'} label="Action Type"
                    onChange={(e) => updateBtn(btnIdx, { actionType: e.target.value, actionValue: '', templateId: '', quickReplyId: '' })}
                    sx={{ color: '#1a1a1a' }}>
                    <MenuItem value="URL">🔗 Open URL/Link</MenuItem>
                    <MenuItem value="QUICK_REPLY">💬 Quick Reply</MenuItem>
                    <MenuItem value="TEMPLATE">📋 Message Template</MenuItem>
                    <MenuItem value="CALL">📞 Call Phone</MenuItem>
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
                  <FormControl fullWidth size="small" sx={inputSx}>
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
                  <FormControl fullWidth size="small" sx={inputSx}>
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
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel sx={labelSx.style}>Action Type</InputLabel>
                  <Select value={row.actionType || 'CUSTOM'} label="Action Type"
                    onChange={(e) => {
                      const t = e.target.value;
                      const patch = { actionType: t, actionValue: '', quickReplyId: '', templateId: '' };
                      if (t === 'CUSTOM') patch.rowId = row.rowId || `row_${Date.now()}`;
                      updateRow(rowIdx, patch);
                    }}
                    sx={{ color: '#1a1a1a' }}>
                    {ROW_ACTION_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={10} sm={5}>
                <FormControl fullWidth size="small" sx={inputSx}>
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
                  <FormControl fullWidth size="small" sx={inputSx}>
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
                  <FormControl fullWidth size="small" sx={inputSx}>
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
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />}
            onClick={() => { setOpenAICopilot(true); if (!openDrawer) handleOpenAddDrawer(); }}>
            AI Assistant
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDrawer} disableElevation>
            Create Rule
          </Button>
        </Stack>
      </Box>

      {/* CSV Guidelines */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f4f8', border: '1px solid #cbd5e1', borderRadius: 2 }} elevation={0}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
              📋 CSV Template Format Guidelines
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              When uploading templates via the AI Assistant, use this CSV format so each row becomes one rule:
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ bgcolor: 'white', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0', fontWeight: 600 }}>Header: question,keywords,answer,category</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0' }}>✅ Content with newlines must be quoted: "Line 1\nLine 2"</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2c5aa0' }}>keywords becomes the trigger key for the rule</Typography>
          </Stack>
          <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
            <strong>Pro Tip:</strong> Upload your templates CSV in the AI Assistant. For 20 questions, you create 20 rules with one click.
          </Alert>
        </Stack>
      </Paper>

      {/* Rules grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'transparent' }} elevation={0}>
              <CircularProgress size={30} />
              <Typography variant="body2" color="text.secondary" mt={2}>Loading configurations...</Typography>
            </Paper>
          </Grid>
        ) : rules.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 3 }} elevation={0}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>No active response rules yet</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>Create your first trigger layout or use the AI Assistant.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDrawer} disableElevation>Add Rule</Button>
            </Paper>
          </Grid>
        ) : rules.map(rule => (
          <Grid item xs={12} md={6} lg={4} key={rule._id}>
            <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 3 }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{rule.name}</Typography>
                  <FormControlLabel control={<Switch size="small" checked={rule.isActive} onChange={() => handleToggleActiveRule(rule._id, rule.isActive)} />} label="" sx={{ m: 0 }} />
                </Stack>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip label={rule.triggerType} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                  <Chip label={`"${rule.triggerValue}"`} size="small" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Blocks count: <strong>{rule.messageBlocks?.length || 0}</strong> widgets
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {rule.messageBlocks?.map((b, idx) => <Chip key={idx} label={b.type} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />)}
                </Stack>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={() => handleOpenEditDrawer(rule)}>Edit</Button>
                <Button size="small" color="error" onClick={() => confirmDeleteRule(rule._id)}>Delete</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

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
              </Stack>
            </Box>

            {/* Canvas scroll area */}
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
              <Grid container spacing={3}>
                {/* Config form */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0 !important', background: '#fff !important' }} elevation={1}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField label="Rule Name *" fullWidth value={ruleName} onChange={(e) => setRuleName(e.target.value)}
                          placeholder="e.g. Price Check Kundan Ring" InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                      </Grid>
                      <Grid item xs={12} md={2.5}>
                        <FormControl fullWidth sx={inputSx}>
                          <InputLabel sx={labelSx.style}>Trigger Type</InputLabel>
                          <Select value={triggerType} label="Trigger Type" onChange={(e) => setTriggerType(e.target.value)} sx={{ color: '#1a1a1a' }}>
                            <MenuItem value="EXACT_MATCH">Exact Match</MenuItem>
                            <MenuItem value="KEYWORD">Keyword Includes</MenuItem>
                            <MenuItem value="INTENT">AI Intent Category</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3.5}>
                        <TextField
                          label={triggerType === 'INTENT' ? 'Intent (e.g. general_inquiry)' : triggerType === 'KEYWORD' ? 'Keywords (comma-separated)' : 'Exact Trigger Text'}
                          fullWidth value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)}
                          placeholder={triggerType === 'INTENT' ? 'general_inquiry' : 'price, cost, rate'}
                          InputLabelProps={labelSx} inputProps={inputPropsSx} sx={inputSx} />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Active" sx={{ color: '#666' }} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={inputSx}>
                          <InputLabel sx={labelSx.style}>Rule Action</InputLabel>
                          <Select value={actionType} label="Rule Action" onChange={(e) => setActionType(e.target.value)} sx={{ color: '#1a1a1a' }}>
                            <MenuItem value="SEND_TEXT">Send Visual Layout</MenuItem>
                            <MenuItem value="SEND_TEMPLATE">Send Template Broadcast</MenuItem>
                            <MenuItem value="TRIGGER_WORKFLOW">Trigger Workflow</MenuItem>
                            <MenuItem value="HUMAN_HANDOVER">Escalate to Human</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {actionType === 'SEND_TEMPLATE' && (
                        <Grid item xs={12} md={6}>
                          <Box onDragOver={(e) => e.preventDefault()} onDrop={handleDropLinkTemplate}
                            sx={{ p: 2, border: '2px dashed #1976d2', borderRadius: 3, textAlign: 'center', bgcolor: templateId ? '#e0e0e0' : 'transparent' }}>
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                              <LinkIcon color="primary" />
                              {templateId
                                ? <Typography variant="body2" sx={{ fontWeight: 600 }}>Linked: {templates.find(t => t._id === templateId)?.name || 'Template'}</Typography>
                                : <Typography variant="body2" color="#666">Drag/drop template here or select below</Typography>}
                            </Stack>
                            <FormControl fullWidth size="small" sx={{ mt: 1, ...inputSx }}>
                              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} displayEmpty>
                                <MenuItem value="" disabled>Choose template...</MenuItem>
                                {templates.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Box>
                        </Grid>
                      )}
                      {actionType === 'TRIGGER_WORKFLOW' && (
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth sx={inputSx}>
                            <InputLabel sx={labelSx.style}>Select Workflow</InputLabel>
                            <Select value={workflowId} label="Select Workflow" onChange={(e) => setWorkflowId(e.target.value)} sx={{ color: '#1a1a1a' }}>
                              {workflows.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
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

          {/* Right: WhatsApp Preview */}
          <Box sx={{ width: '380px', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff !important', borderLeft: '1px solid #e0e0e0' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneAndroidIcon />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Live WhatsApp Preview</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, backgroundImage: 'radial-gradient(#e0e0e0 10%, transparent 10%)', backgroundSize: '16px 16px', bgcolor: '#0a0f1d' }}>
              {blocks.map((block, index) => {
                if (block.type === 'TEXT') return (
                  <Box key={index} sx={{ alignSelf: 'flex-start', maxWidth: '85%', bgcolor: '#e0e0e0', p: 2, borderRadius: '0px 16px 16px 16px', border: '1px solid #b0b0b0' }}>
                    <Typography variant="body2" color="#1a1a1a" sx={{ whiteSpace: 'pre-wrap' }}>{block.config?.text}</Typography>
                  </Box>
                );
                if (block.type === 'CARD') return (
                  <Card key={index} sx={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#e0e0e0 !important', border: '1px solid #b0b0b0 !important', borderRadius: 4, overflow: 'hidden' }}>
                    {block.config?.imageUrl && <Box component="img" src={block.config.imageUrl} sx={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />}
                    <CardContent sx={{ p: 2, pb: '12px !important' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a' }}>{block.config?.title}</Typography>
                      <Typography variant="caption" color="#555" display="block">{block.config?.description}</Typography>
                    </CardContent>
                    {block.config?.buttons?.length > 0 && (
                      <Stack spacing={1} sx={{ p: 1.5, pt: 0 }}>
                        {block.config.buttons.map((b, bi) => (
                          <Button key={bi} variant="outlined" size="small" fullWidth
                            onClick={() => { const t = String(b.actionType || b.type || '').toUpperCase(); const v = b.actionValue || ''; if (t === 'URL' && v) window.open(v, '_blank'); else showSnackbar(`${fmtAction(t, 'Action')}: ${b.label}`, 'info'); }}
                            sx={{ textTransform: 'none', color: '#1976d2', borderColor: '#1976d2', borderRadius: 2, fontSize: '0.75rem' }}>
                            {b.label}
                            <Chip size="small" label={fmtAction(b.actionType || b.type, 'Reply')} sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#eef6ff', color: '#1565c0' }} />
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Card>
                );
                if (block.type === 'BUTTONS') return (
                  <Stack key={index} spacing={1} sx={{ alignSelf: 'flex-start', width: '85%' }}>
                    {(block.config?.buttons || []).map((b, bi) => (
                      <Button key={bi} variant="contained" fullWidth
                        onClick={() => handlePreviewRowClick({ title: b.label, actionType: b.actionType || b.type, actionValue: b.actionValue || b.label })}
                        sx={{ textTransform: 'none', bgcolor: '#1976d2', color: '#fff', borderRadius: 3, fontWeight: 600, py: 1 }}>
                        {b.label}
                        <Chip size="small" label={fmtAction(b.actionType || b.type, 'Reply')} sx={{ ml: 1, height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }} />
                      </Button>
                    ))}
                  </Stack>
                );
                if (block.type === 'LIST') {
                  const lines = getListPreviewLines(block);
                  return (
                    <Stack key={index} spacing={1.25} sx={{ alignSelf: 'flex-start', width: '85%' }}>
                      {lines.length > 0 && (
                        <Box sx={{ bgcolor: '#fff', borderRadius: '0px 16px 16px 16px', border: '1px solid #d9dee7', p: 1.6 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, color: '#1a1a1a' }}>{lines.join('\n')}</Typography>
                        </Box>
                      )}
                      <Card sx={{ background: '#e0e0e0 !important', border: '1px solid #b0b0b0 !important', borderRadius: 4 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a1a' }}>📋 {block.config?.title}</Typography>
                          <Divider sx={{ borderColor: '#b0b0b0', mb: 1.5 }} />
                          <Stack spacing={1.5}>
                            {(block.config?.sections || []).map((sec, si) => (
                              <Box key={si}>
                                {sec.title && <Typography variant="caption" color="#64748b" display="block" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', mb: 0.5 }}>{sec.title}</Typography>}
                                <Stack spacing={1}>
                                  {(sec.rows || []).map((row, ri) => (
                                    <Box key={ri} onClick={() => handlePreviewRowClick(row)}
                                      sx={{ p: 1, bgcolor: '#fff', borderRadius: 2, cursor: 'pointer', border: '1px solid #e0e0e0', '&:hover': { borderColor: '#1976d2' } }}>
                                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{row.title}</Typography>
                                        <Chip size="small" label={fmtAction(row.actionType, 'Custom')}
                                          sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: row.actionType === 'URL' ? '#e3f2fd' : row.actionType === 'CATALOG' ? '#e8f5e9' : '#f3e5f5', color: row.actionType === 'URL' ? '#1565c0' : row.actionType === 'CATALOG' ? '#2e7d32' : '#6a1b9a' }} />
                                      </Stack>
                                      {row.description && <Typography variant="caption" color="#666" display="block" sx={{ fontSize: '0.7rem' }}>{row.description}</Typography>}
                                      {(row.actionType === 'URL' || row.actionType === 'CATALOG') && row.actionValue && (
                                        <Typography variant="caption" color="#64748b" display="block" sx={{ fontSize: '0.68rem', mt: 0.25 }}>
                                          {row.actionType === 'URL' ? '🔗' : '🛍️'} {row.actionValue}
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  );
                }
                if (block.type === 'RELATED_QUESTIONS') return (
                  <Box key={index} sx={{ alignSelf: 'flex-start', width: '90%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="#64748b" sx={{ fontWeight: 600 }}>Suggested Questions:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {(block.config?.questions || []).map((q, qi) => (
                        <Box key={qi} sx={{ bgcolor: '#b0b0b0', color: '#1a1a1a', px: 1.8, py: 0.8, borderRadius: '16px', border: '1px solid #888', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                          👉 {q}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
                return null;
              })}
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
          <Typography variant="body2" color="text.secondary" mb={2}>Upload a CSV template file to create one rule per row.</Typography>
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
                : <Typography variant="body2" color="#666">Upload CSV template (.csv)</Typography>}
            </Box>
          </Stack>
        </Box>
        <Box sx={{ pt: 3, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button onClick={() => setOpenAICopilot(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleAIDraftRule} disabled={aiGenerating} disableElevation>
            {aiGenerating ? 'Processing...' : 'Process CSV'}
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
                  <Paper sx={{ p: 2, background: '#f5f5f5 !important' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Rule Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{draftReview.name}</Typography>
                  </Paper>
                  {draftReview.messageBlocks?.map((b, i) => (
                    <Card key={i} sx={{ background: '#f9f9f9 !important', border: '1px solid #e0e0e0 !important' }}>
                      <Box sx={{ bgcolor: '#e0e0e0', px: 2, py: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Block #{i + 1}: {b.type}</Typography>
                      </Box>
                      <CardContent sx={{ p: 2 }}>
                        {b.type === 'TEXT' && <Typography variant="body2">{b.config?.text}</Typography>}
                        {b.type === 'BUTTONS' && <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>{b.config?.buttons?.map((btn, bi) => <Chip key={bi} label={btn.label} size="small" />)}</Stack>}
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
    </Box>
  );

  function handleToggleActiveRule(ruleId, currentStatus) {
    const rule = rules.find(r => r._id === ruleId);
    apiClient.put(`/response-rules/${ruleId}`, { ...rule, isActive: !currentStatus })
      .then(() => { fetchRules(); showSnackbar('Rule status updated!', 'success'); })
      .catch(() => showSnackbar('Failed to update status.', 'error'));
  }
}