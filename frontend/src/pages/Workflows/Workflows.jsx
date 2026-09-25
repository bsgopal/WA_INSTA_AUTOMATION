import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, Switch, FormControlLabel, Divider, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip, Alert, Avatar, Tabs, Tab, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CloseIcon from '@mui/icons-material/Close';

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';
import SapDmProcessDesigner from '../../components/SAPDM/SapDmProcessDesigner';
import SmartTagToolbar from '../../components/SmartTagToolbar';

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, workflowId: null, workflowName: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState('ALL');

  // Integrated Rules & Studio state
  const [rules, setRules] = useState([]);
  const [hubTab, setHubTab] = useState('WORKFLOWS'); // 'WORKFLOWS' or 'RULES'
  const [openFlowStudio, setOpenFlowStudio] = useState(false);
  const [studioWorkflow, setStudioWorkflow] = useState(null);
  const [ruleSearchQuery, setRuleSearchQuery] = useState('');
  const [openCreateRuleModal, setOpenCreateRuleModal] = useState(false);
  const [quickRuleForm, setQuickRuleForm] = useState({
    name: '',
    triggerKeywords: '',
    responseText: '',
    actionType: 'SEND_TEXT'
  });
  const ruleInputRef = useRef(null);

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#84cc16',
    icon: 'folder'
  });

  // Visual Workflow Form State
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    category: '',
    triggerField: 'intent',
    triggerOperator: 'equals',
    triggerValue: 'order_inquiry',
    steps: [
      {
        id: 'step_1',
        type: 'SEND_MESSAGE',
        name: 'Send Automated Reply',
        config: { value: 'Namaste! Thank you for reaching out to Renic Tech. How can our team assist you today?' }
      }
    ]
  });

  // High-converting E-Commerce Seller Presets
  const workflowPresets = [
    {
      label: '🛒 Abandoned Cart',
      name: 'Abandoned Cart 10% Discount Follow-up',
      description: 'Auto-nudges customers who left checkout with 10% coupon code',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'abandoned_cart',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send 10% Coupon Offer',
          config: { value: 'Hi {{customer_name}}! We noticed you left favorite items in your cart. Complete your purchase now and enjoy 10% OFF with code FLASH10: https://renic.store/checkout' }
        },
        {
          id: 'step_2',
          type: 'TAG',
          name: 'Tag Customer Profile',
          config: { value: 'CART_ABANDONED_RECOVERED' }
        }
      ]
    },
    {
      label: '👑 VIP Bridal Concierge',
      name: 'VIP Bridal Customization Escalation',
      description: 'Instantly tags bridal jewelry shoppers and alerts master designer',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'customization',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Welcome VIP Bridal Shopper',
          config: { value: 'Namaste! We would be honored to craft your bespoke bridal set. Our head jewelry consultant is reviewing your request and will share design sketches shortly.' }
        },
        {
          id: 'step_2',
          type: 'TAG',
          name: 'Tag Profile as VIP',
          config: { value: 'VIP_BRIDAL_CLIENT' }
        },
        {
          id: 'step_3',
          type: 'AI_ACTION',
          name: 'Route to Master Stylist',
          config: { value: 'Notify senior designer on duty with customer specs' }
        }
      ]
    },
    {
      label: '📦 Live Order Tracking',
      name: 'Order Tracking & Shipment Lookup',
      description: 'Instantly guides customers to track their shipment status',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'order_tracking',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send Tracking Instructions',
          config: { value: 'Hello! To check the live tracking status of your parcel, reply with your 6-digit Order ID (e.g. #RN-8921) or click: https://renic.store/track' }
        }
      ]
    },
    {
      label: '⭐ Review Collector',
      name: 'Post-Delivery 5-Star Feedback',
      description: 'Requests customer review and photos after order is delivered',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'feedback',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Request Star Rating',
          config: { value: 'Thank you for choosing Renic Tech! We hope you love your new jewelry. Could you take 30 seconds to rate your unboxing experience from 1 to 5 stars?' }
        }
      ]
    }
  ];

  useEffect(() => {
    fetchWorkflows();
    fetchCategories();
    fetchRules();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/workflows');
      setWorkflows(response.data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch workflows', severity: 'error' });
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories/workflow');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await apiClient.get('/response-rules');
      setRules(response.data || []);
    } catch (error) {
      console.error('Failed to fetch response rules in Workflows:', error);
    }
  };

  const handleToggleRuleStatus = async (rule) => {
    try {
      const updated = { ...rule, isActive: !rule.isActive };
      await apiClient.put(`/response-rules/${rule._id}`, updated);
      setSnackbar({ open: true, message: `Rule ${!rule.isActive ? 'activated' : 'paused'}!`, severity: 'success' });
      fetchRules();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update rule status', severity: 'error' });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this response rule?')) return;
    try {
      await apiClient.delete(`/response-rules/${ruleId}`);
      setSnackbar({ open: true, message: 'Response rule deleted successfully!', severity: 'success' });
      fetchRules();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete response rule', severity: 'error' });
    }
  };

  const handleSaveQuickRule = async () => {
    if (!quickRuleForm.name.trim() || !quickRuleForm.triggerKeywords.trim() || !quickRuleForm.responseText.trim()) {
      setSnackbar({ open: true, message: 'Please provide rule name, keywords, and automated reply text', severity: 'warning' });
      return;
    }
    try {
      const payload = {
        name: quickRuleForm.name.trim(),
        triggerType: 'KEYWORD',
        triggerValue: quickRuleForm.triggerKeywords.trim(),
        actionType: quickRuleForm.actionType,
        messageBlocks: [{ type: 'TEXT', config: { text: quickRuleForm.responseText.trim() } }],
        isActive: true
      };
      await apiClient.post('/response-rules', payload);
      setSnackbar({ open: true, message: 'Response rule created successfully!', severity: 'success' });
      setOpenCreateRuleModal(false);
      setQuickRuleForm({ name: '', triggerKeywords: '', responseText: '', actionType: 'SEND_TEXT' });
      fetchRules();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to create response rule', severity: 'error' });
    }
  };

  const handleOpenStudioForWorkflow = (workflow) => {
    setStudioWorkflow(workflow);
    setOpenFlowStudio(true);
  };

  const handleOpenNewStudioWorkflow = () => {
    setStudioWorkflow(null);
    setOpenFlowStudio(true);
  };

  const handleToggleStatus = async (workflow) => {
    try {
      const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await apiClient.post(`/workflows/${workflow._id}/${newStatus === 'ACTIVE' ? 'activate' : 'pause'}`);
      setSnackbar({
        open: true,
        message: `Workflow ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully`,
        severity: 'success'
      });
      fetchWorkflows();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleOpenQuickCreate = () => {
    setEditingId(null);
    setWorkflowForm({
      name: '',
      description: '',
      category: '',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'order_inquiry',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send Automated Reply',
          config: { value: 'Namaste! Thank you for reaching out to Renic Tech. How can our team assist you today?' }
        }
      ]
    });
    setOpenDialog(true);
  };

  const handleApplyPreset = (preset) => {
    setWorkflowForm({
      name: preset.name,
      description: preset.description,
      category: workflowForm.category,
      triggerField: preset.triggerField,
      triggerOperator: preset.triggerOperator,
      triggerValue: preset.triggerValue,
      steps: JSON.parse(JSON.stringify(preset.steps))
    });
    setSnackbar({ open: true, message: `Loaded "${preset.label}" preset!`, severity: 'success' });
  };

  const handleOpenEdit = (workflow) => {
    if (workflow.trigger?.type === 'RESPONSE_RULE_SELECTION' || !workflow.steps || workflow.steps.length > 3) {
      navigate(`/workflows/${workflow._id}`);
      return;
    }
    setEditingId(workflow._id);
    const firstCondition = workflow.trigger?.conditions?.[0] || {};
    setWorkflowForm({
      name: workflow.name || '',
      description: workflow.description || '',
      category: workflow.category || '',
      triggerField: firstCondition.field || 'intent',
      triggerOperator: firstCondition.operator || 'equals',
      triggerValue: firstCondition.value || '',
      steps: (workflow.steps && workflow.steps.length > 0)
        ? workflow.steps.map((s, i) => ({
            id: s.id || `step_${i + 1}`,
            type: s.type || 'SEND_MESSAGE',
            name: s.name || 'Step Action',
            config: { value: s.config?.value || '' }
          }))
        : [{ id: 'step_1', type: 'SEND_MESSAGE', name: 'Send Automated Reply', config: { value: '' } }]
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (workflowId, workflowName) => {
    setDeleteConfirm({ open: true, workflowId, workflowName });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/workflows/${deleteConfirm.workflowId}`);
      setSnackbar({
        open: true,
        message: `Workflow deleted successfully`,
        severity: 'success'
      });
      setDeleteConfirm({ open: false, workflowId: null, workflowName: '' });
      fetchWorkflows();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete workflow', severity: 'error' });
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflowForm.name.trim()) {
      setSnackbar({ open: true, message: 'Workflow name is required', severity: 'warning' });
      return;
    }

    const payload = {
      name: workflowForm.name.trim(),
      description: workflowForm.description.trim(),
      category: workflowForm.category || undefined,
      trigger: {
        type: 'EVENT',
        event: 'message_received',
        conditions: [{
          field: workflowForm.triggerField,
          operator: workflowForm.triggerOperator,
          value: workflowForm.triggerValue
        }]
      },
      steps: workflowForm.steps.map((step, idx) => ({
        id: step.id || `step_${idx + 1}`,
        type: step.type,
        name: step.name,
        config: {
          value: step.config?.value || ''
        }
      }))
    };

    try {
      if (editingId) {
        await apiClient.put(`/workflows/${editingId}`, payload);
        setSnackbar({ open: true, message: 'Workflow updated successfully!', severity: 'success' });
      } else {
        await apiClient.post('/workflows', { ...payload, status: 'ACTIVE' });
        setSnackbar({ open: true, message: 'Workflow created and activated!', severity: 'success' });
      }
      setOpenDialog(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save workflow',
        severity: 'error'
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      setSnackbar({ open: true, message: 'Category name is required', severity: 'warning' });
      return;
    }

    try {
      const response = await apiClient.post('/categories', {
        ...categoryForm,
        type: 'workflow'
      });
      setCategories([...categories, response.data]);
      setSnackbar({ open: true, message: 'Category created successfully!', severity: 'success' });
      setCategoryForm({ name: '', description: '', color: '#84cc16', icon: 'folder' });
      setOpenCategoryDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create category', severity: 'error' });
      console.error('Failed to create category:', error);
    }
  };

  const handleAddStep = () => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: 'SEND_MESSAGE',
      name: 'Send Automated Reply',
      config: { value: '' }
    };
    setWorkflowForm(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...workflowForm.steps];
    if (field === 'type') {
      updated[index].type = value;
      updated[index].name = value === 'SEND_MESSAGE' ? 'Send Automated Reply'
                          : value === 'TAG' ? 'Tag Customer Profile'
                          : 'AI Escalation Action';
    } else if (field === 'value') {
      updated[index].config.value = value;
    } else if (field === 'name') {
      updated[index].name = value;
    }
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
  };

  const handleMoveStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= workflowForm.steps.length) return;
    const reordered = [...workflowForm.steps];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setWorkflowForm(prev => ({ ...prev, steps: reordered }));
  };

  const handleRemoveStep = (index) => {
    if (workflowForm.steps.length === 1) {
      setSnackbar({ open: true, message: 'A workflow must have at least one execution step.', severity: 'warning' });
      return;
    }
    const updated = workflowForm.steps.filter((_, i) => i !== index);
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
  };

  const getTriggerIcon = (triggerType) => {
    const icons = {
      EVENT: '⚡',
      SCHEDULED: '⏰',
      MANUAL: '👆',
      WEBHOOK: '🔗'
    };
    return icons[triggerType] || '⚡';
  };

  // Stats calculation
  const totalCount = workflows.length;
  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length;
  const pausedCount = workflows.filter(w => w.status !== 'ACTIVE').length;
  const totalRuns = workflows.reduce((acc, w) => acc + (w.stats?.successfulExecutions || 0), 0);

  const filteredWorkflows = workflows.filter(w => {
    if (selectedCategory && w.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (w.name || '').toLowerCase().includes(q);
      const matchDesc = (w.description || '').toLowerCase().includes(q);
      const matchTrigger = (w.trigger?.conditions?.[0]?.value || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTrigger) return false;
    }
    if (activeTab === 'ACTIVE') return w.status === 'ACTIVE';
    if (activeTab === 'PAUSED') return w.status !== 'ACTIVE';
    return true;
  });

  const primaryMessageStep = workflowForm.steps.find(s => s.type === 'SEND_MESSAGE');

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      {/* SLEEK COMPACT ENTERPRISE HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 1.75,
          mb: 1.5,
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
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
              <AccountTreeIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                  Automation Workflows
                </Typography>
                <Chip
                  label="Flow Engine"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(132, 204, 22, 0.15)',
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
                  label={`Total: ${totalCount}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
                />
                <Chip
                  label={`Active: ${activeCount}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}
                />
                <Chip
                  label={`Paused: ${pausedCount}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}
                />
                <Chip
                  label={`Executions: ${totalRuns.toLocaleString()}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}
                />
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderIcon sx={{ fontSize: 16 }} />}
              onClick={() => setOpenCategoryDialog(true)}
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                '&:hover': { borderColor: '#84cc16', backgroundColor: 'rgba(132,204,22,0.06)', color: '#0f172a' }
              }}
            >
              Category
            </Button>
            <Button
              variant="outlined"
              size="small"
              component="a"
              href="/workflows"
              startIcon={<AccountTreeIcon sx={{ color: '#0284c7', fontSize: 16 }} />}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                handleOpenNewStudioWorkflow();
              }}
              sx={{
                borderColor: '#cbd5e1',
                color: '#0f172a',
                textDecoration: 'none',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                '&:hover': { borderColor: '#0284c7', backgroundColor: 'rgba(2,132,199,0.06)' }
              }}
            >
              Flow Studio
            </Button>
            <Button
              variant="contained"
              size="small"
              component="a"
              href="/response-rules"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                setOpenCreateRuleModal(true);
              }}
              sx={{
                backgroundColor: '#84cc16',
                color: '#0f172a',
                textDecoration: 'none',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                px: 1.5,
                boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                '&:hover': { backgroundColor: '#65a30d' }
              }}
            >
              + New Rule
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AccountTreeIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenQuickCreate}
              sx={{
                backgroundColor: '#2563EB',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                height: 34,
                borderRadius: '8px',
                px: 1.75,
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                '&:hover': { backgroundColor: '#1d4ed8' }
              }}
            >
              + New Automation
            </Button>
          </Stack>
        </Box>

        {/* Unified Hub Switcher: Workflows & Rules in Single Place */}
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
                  <span>⚡ Response Rules Hub</span>
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
          </Tabs>
        </Box>
      </Paper>

      {hubTab === 'WORKFLOWS' ? (
        <>

      {/* FILTER & SEARCH TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search workflows by name, trigger keyword, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Filter by Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories ({workflows.length})</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cat.color || '#84cc16' }} />
                      {cat.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Showing {filteredWorkflows.length} of {workflows.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* STATUS TABS */}
      {!loading && workflows.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.875rem' },
              '& .Mui-selected': { color: '#0f172a' },
              '& .MuiTabs-indicator': { backgroundColor: '#84cc16', height: 3 }
            }}
          >
            <Tab
              value="ALL"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>All Automations</span>
                  <Chip label={workflows.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                </Box>
              }
            />
            <Tab
              value="ACTIVE"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Active</span>
                  <Chip label={activeCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#84cc16', color: '#0f172a' }} />
                </Box>
              }
            />
            <Tab
              value="PAUSED"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Paused / Drafts</span>
                  <Chip label={pausedCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                </Box>
              }
            />
          </Tabs>
        </Box>
      )}

      {/* WORKFLOWS TABLE */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#84cc16' }} />
        </Box>
      ) : filteredWorkflows.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: '#ffffff' }}>
          <AutoAwesomeIcon sx={{ fontSize: 60, color: '#84cc16', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a' }}>
            No workflows found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, maxWidth: 450, mx: 'auto' }}>
            Create an automated rule to engage leads on WhatsApp & Instagram instantly when they message your store.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenQuickCreate}
            sx={{
              backgroundColor: '#84cc16',
              color: '#0f172a',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              px: 3,
              '&:hover': { backgroundColor: '#65a30d' }
            }}
          >
            Create Quick Automation
          </Button>
        </Paper>
      ) : (
        <Box component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 860 }}>
              {/* Obsidian Slate Header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '60px 2fr 1.2fr 1.2fr 1fr 120px 110px',
                  gap: 2,
                  p: 2,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#84cc16' }}>#</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>WORKFLOW NAME & DETAILS</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>TRIGGER EVENT</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>CATEGORY</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>EXECUTIONS</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>STATUS</Box>
                <Box sx={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'right', pr: 1 }}>ACTIONS</Box>
              </Box>

              {/* Data Rows */}
              {filteredWorkflows.map((workflow, idx) => {
                const category = categories.find(c => c._id === workflow.category);
                const firstCond = workflow.trigger?.conditions?.[0];
                return (
                  <Box
                    key={workflow._id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '60px 2fr 1.2fr 1.2fr 1fr 120px 110px',
                      gap: 2,
                      p: 2,
                      borderBottom: '1px solid #f1f5f9',
                      alignItems: 'center',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: '#f1f5f9' }
                    }}
                  >
                    {/* Index */}
                    <Box sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{idx + 1}</Box>

                    {/* Name & Description */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.3 }}>
                        {workflow.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.4 }}>
                        {workflow.description || 'Automated workflow pipeline'}
                      </Typography>
                    </Box>

                    {/* Trigger */}
                    <Box>
                      <Chip
                        icon={<span style={{ fontSize: '0.85rem' }}>{getTriggerIcon(workflow.trigger?.type)}</span>}
                        label={firstCond?.value ? `${firstCond.field || 'intent'}: ${firstCond.value}` : (workflow.trigger?.type || 'EVENT')}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                    </Box>

                    {/* Category */}
                    <Box>
                      {category ? (
                        <Chip
                          label={category.name}
                          size="small"
                          sx={{
                            backgroundColor: `${category.color || '#84cc16'}18`,
                            color: category.color || '#65a30d',
                            border: `1px solid ${category.color || '#84cc16'}40`,
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>General</Typography>
                      )}
                    </Box>

                    {/* Executions */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>
                        {workflow.stats?.successfulExecutions || 0} runs
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {workflow.steps?.length || 1} action step{(workflow.steps?.length || 1) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {/* Status Switch */}
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={workflow.status === 'ACTIVE'}
                            onChange={() => handleToggleStatus(workflow)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#84cc16' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#84cc16' }
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 700, color: workflow.status === 'ACTIVE' ? '#16a34a' : '#64748b' }}>
                            {workflow.status === 'ACTIVE' ? 'Active' : 'Paused'}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 0.5 }}>
                      <Tooltip title="Edit in Visual Flow Studio">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenStudioForWorkflow(workflow)}
                          sx={{ color: '#ffffff', bgcolor: '#2563EB', '&:hover': { bgcolor: '#1d4ed8' } }}
                        >
                          <AccountTreeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Automation">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(workflow)}
                          sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(workflow._id, workflow.name)}
                          sx={{ color: '#ef4444', bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' } }}
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
        </Box>
      )}
      </>
      ) : (
        <Box sx={{ width: '100%', mb: 4 }}>
          {/* Rules KPI Metric Ribbon */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#65a30d', width: 48, height: 48 }}>
                  <SmartToyIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Response Rules</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>{rules.length}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', width: 48, height: 48 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Keyword Responders</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>{rules.filter(r => r.isActive).length}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', width: 48, height: 48 }}>
                  <PauseIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Paused / Inactive</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ca8a04' }}>{rules.filter(r => !r.isActive).length}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Search & Actions Bar for Response Rules */}
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <TextField
                size="small"
                placeholder="Search response rules by keyword, name, action..."
                value={ruleSearchQuery}
                onChange={(e) => setRuleSearchQuery(e.target.value)}
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
                  {rules.filter(r => {
                    if (!ruleSearchQuery.trim()) return true;
                    const q = ruleSearchQuery.toLowerCase();
                    return (r.name || '').toLowerCase().includes(q) || (r.triggerValue || '').toLowerCase().includes(q);
                  }).length} Rules
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateRuleModal(true)}
                  sx={{
                    bgcolor: '#84cc16',
                    color: '#0f172a',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    '&:hover': { bgcolor: '#65a30d' }
                  }}
                >
                  + New Response Rule
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Response Rules Table */}
          {rules.filter(r => {
            if (!ruleSearchQuery.trim()) return true;
            const q = ruleSearchQuery.toLowerCase();
            return (r.name || '').toLowerCase().includes(q) || (r.triggerValue || '').toLowerCase().includes(q);
          }).length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }} elevation={0}>
              <SmartToyIcon sx={{ fontSize: 48, color: '#84cc16', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                No Response Rules Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', mb: 2.5 }}>
                Create automated responses for pricing inquiries, catalogs, greetings, and keyword triggers.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateRuleModal(true)}
                sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#65a30d' } }}
              >
                Create Response Rule
              </Button>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 860 }}>
                  {/* Rules Header */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '50px 2.2fr 1.5fr 1fr 120px 100px',
                    gap: 2,
                    p: 2,
                    bgcolor: '#0f172a',
                    color: '#ffffff',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#84cc16' }}>#</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>RULE NAME</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>CUSTOMER TRIGGER KEYWORDS</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>ACTION TYPE</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>STATUS</Box>
                    <Box sx={{ fontWeight: 700, fontSize: '0.82rem', textAlign: 'right', pr: 1 }}>ACTIONS</Box>
                  </Box>

                  {/* Rules Rows */}
                  {rules
                    .filter(r => {
                      if (!ruleSearchQuery.trim()) return true;
                      const q = ruleSearchQuery.toLowerCase();
                      return (r.name || '').toLowerCase().includes(q) || (r.triggerValue || '').toLowerCase().includes(q);
                    })
                    .map((r, idx) => (
                      <Box
                        key={r._id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '50px 2.2fr 1.5fr 1fr 120px 100px',
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
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {r.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {r.messageBlocks?.[0]?.config?.text?.slice(0, 70) || 'Automated response text'}...
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(r.triggerValue || '').split(',').slice(0, 3).map((kw, ki) => (
                            <Chip
                              key={ki}
                              label={kw.trim()}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: '#f1f5f9', border: '1px solid #cbd5e1' }}
                            />
                          ))}
                        </Box>
                        <Box>
                          <Chip
                            label={r.actionType?.replace('_', ' ') || 'SEND TEXT'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: 'rgba(132, 204, 22, 0.12)', color: '#4d7c0f' }}
                          />
                        </Box>
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={Boolean(r.isActive)}
                                onChange={() => handleToggleRuleStatus(r)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#84cc16' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#84cc16' }
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ fontWeight: 700, color: r.isActive ? '#16a34a' : '#64748b' }}>
                                {r.isActive ? 'Active' : 'Paused'}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 0.5 }}>
                          <Tooltip title="Delete Rule">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRule(r._id)}
                              sx={{ color: '#ef4444', bgcolor: '#fee2e2', borderRadius: '8px', '&:hover': { bgcolor: '#fecaca' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Visual Flow Studio (SAP DM Process Designer Fullscreen Modal) ── */}
      <Dialog
        fullScreen
        open={openFlowStudio}
        onClose={() => {
          setOpenFlowStudio(false);
          setStudioWorkflow(null);
        }}
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
          isWorkflow={true}
          initialData={studioWorkflow ? {
            name: studioWorkflow.name,
            status: studioWorkflow.status || 'ACTIVE',
            triggerValue: studioWorkflow.trigger?.conditions?.[0]?.value || 'inquiry',
            nodes: studioWorkflow.conditions && studioWorkflow.conditions.length > 0 ? [
              {
                id: 'node_trigger',
                type: 'LIST_SELECT',
                category: 'triggers',
                label: studioWorkflow.trigger?.responseRuleName || 'List Selection Trigger',
                config: { ruleId: studioWorkflow.trigger?.responseRuleId },
                position: { x: 80, y: 120 }
              },
              ...studioWorkflow.conditions.map((cond, i) => ({
                id: cond.id || `cond_${i}`,
                type: 'MATCH_CONDITION',
                category: 'logic',
                label: `Condition: ${cond.label || cond.value || 'Match'}`,
                config: { ...cond },
                position: { x: 400 + i * 320, y: 120 }
              }))
            ] : undefined
          } : {
            name: 'New Process Workflow',
            status: 'ACTIVE'
          }}
          onSave={async (dmData) => {
            const triggerNode = (dmData.nodes || []).find(n => n.category === 'triggers' || n.type === 'KEYWORD') || dmData.nodes?.[0];
            const actionNodes = (dmData.nodes || []).filter(n => n.id !== triggerNode?.id);
            const triggerKeywords = triggerNode?.config?.keywords || (dmData.triggerValue ? [dmData.triggerValue] : ['hi', 'hey', 'hello']);

            const payload = {
              name: dmData.name || 'New Automated Workflow',
              description: 'Designed via Visual Flow Studio',
              status: dmData.status || 'ACTIVE',
              trigger: {
                type: 'KEYWORD',
                keywords: triggerKeywords,
                value: triggerKeywords.join(', '),
                conditions: [{
                  field: 'keywords',
                  operator: 'equals',
                  value: triggerKeywords.join(', ')
                }]
              },
              steps: actionNodes.map((node, idx) => ({
                id: node.id || `step_${idx + 1}`,
                type: node.type,
                name: node.label || 'Action Step',
                config: {
                  ...node.config,
                  message: node.config?.message || node.config?.value || 'Namaste! Thank you for reaching out.',
                  value: node.config?.message || node.config?.value || 'Namaste! Thank you for reaching out.'
                }
              }))
            };
            if (payload.steps.length === 0) {
              payload.steps = [{
                id: 'step_1',
                type: 'SEND_MESSAGE',
                name: 'Send Automated Reply',
                config: { message: dmData.responseMessage || 'Namaste! How can we help you?' }
              }];
            }

            try {
              if (studioWorkflow?._id) {
                await apiClient.put(`/workflows/${studioWorkflow._id}`, payload);
                setSnackbar({ open: true, message: 'Workflow updated successfully!', severity: 'success' });
              } else {
                await apiClient.post('/workflows', payload);
                setSnackbar({ open: true, message: 'Workflow created and deployed!', severity: 'success' });
              }
              setOpenFlowStudio(false);
              setStudioWorkflow(null);
              fetchWorkflows();
            } catch (error) {
              console.error(error);
              setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save workflow', severity: 'error' });
            }
          }}
          onClose={() => {
            setOpenFlowStudio(false);
            setStudioWorkflow(null);
          }}
          availableWorkflows={workflows}
          availableRules={rules}
        />
      </Dialog>

      {/* Quick Create Response Rule Dialog (inside Workflows) */}
      <Dialog
        open={openCreateRuleModal}
        onClose={() => setOpenCreateRuleModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon sx={{ color: '#84cc16' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                Create Response Rule
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenCreateRuleModal(false)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Rule Name"
              required
              size="small"
              placeholder="e.g. Catalog Price Responder"
              value={quickRuleForm.name}
              onChange={(e) => setQuickRuleForm({ ...quickRuleForm, name: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Trigger Keywords (comma-separated)"
              required
              size="small"
              placeholder="e.g. PRICE, COST, RATE, CATALOG"
              value={quickRuleForm.triggerKeywords}
              onChange={(e) => setQuickRuleForm({ ...quickRuleForm, triggerKeywords: e.target.value })}
              helperText="When any customer message includes one of these keywords, this rule triggers immediately."
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
            />
            <Box>
              <SmartTagToolbar
                targetInputRef={ruleInputRef}
                currentText={quickRuleForm.responseText}
                onInsertTag={(_, newText) => setQuickRuleForm(prev => ({ ...prev, responseText: newText }))}
              />
              <TextField
                inputRef={ruleInputRef}
                fullWidth
                multiline
                rows={3}
                label="Automated WhatsApp Response"
                required
                placeholder="Type response... Click variable tags above to insert!"
                value={quickRuleForm.responseText}
                onChange={(e) => setQuickRuleForm({ ...quickRuleForm, responseText: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenCreateRuleModal(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveQuickRule}
            sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, borderRadius: '8px', px: 2.5, '&:hover': { bgcolor: '#65a30d' } }}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* ELEVATED 2-COLUMN QUICK AUTOMATION DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
        {/* Obsidian Slate Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#0f172a',
            color: '#ffffff',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#84cc16',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FlashOnIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {editingId ? 'Edit Automation Workflow' : 'Create Automation Workflow'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Instant auto-responder and customer funnel triggers
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveWorkflow}
              sx={{
                backgroundColor: '#84cc16',
                color: '#0f172a',
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: '8px',
                px: 2.5,
                '&:hover': { backgroundColor: '#65a30d' }
              }}
            >
              {editingId ? 'Update Workflow' : 'Deploy & Activate'}
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {/* 1-Click Seller Presets Bar */}
          {!editingId && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                ⚡ Quick E-Commerce Presets (Click to Auto-fill):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {workflowPresets.map((preset, i) => (
                  <Chip
                    key={i}
                    label={preset.label}
                    onClick={() => handleApplyPreset(preset)}
                    clickable
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      '&:hover': { bgcolor: '#84cc16', color: '#0f172a', borderColor: '#84cc16' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Left Column: Workflow Configuration */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2.5}>
                {/* Meta details */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                    1. Basic Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Workflow Name *"
                      size="small"
                      fullWidth
                      value={workflowForm.name}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                      placeholder="e.g. Abandoned Cart Recovery Funnel"
                    />
                    <TextField
                      label="Description"
                      size="small"
                      fullWidth
                      value={workflowForm.description}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                      placeholder="Brief note about when this automation triggers..."
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Category Folder</InputLabel>
                      <Select
                        value={workflowForm.category}
                        label="Category Folder"
                        onChange={(e) => setWorkflowForm({ ...workflowForm, category: e.target.value })}
                      >
                        <MenuItem value="">Unassigned (General)</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>

                {/* Trigger Condition */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>⚡</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      2. Trigger Condition (When message is received)
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Condition Type</InputLabel>
                        <Select
                          value={workflowForm.triggerField}
                          label="Condition Type"
                          onChange={(e) => setWorkflowForm({ ...workflowForm, triggerField: e.target.value })}
                        >
                          <MenuItem value="intent">Customer Intent</MenuItem>
                          <MenuItem value="sentiment">Sentiment</MenuItem>
                          <MenuItem value="budget">Estimated Budget</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={workflowForm.triggerOperator}
                          label="Operator"
                          onChange={(e) => setWorkflowForm({ ...workflowForm, triggerOperator: e.target.value })}
                        >
                          <MenuItem value="equals">Equals</MenuItem>
                          <MenuItem value="contains">Contains</MenuItem>
                          <MenuItem value="greater_than">Is Greater Than</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Trigger Value"
                        fullWidth
                        size="small"
                        value={workflowForm.triggerValue}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, triggerValue: e.target.value })}
                        placeholder="e.g. abandoned_cart"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Execution Steps */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>⚙️</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        3. Action Steps ({workflowForm.steps.length})
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddStep}
                      sx={{ textTransform: 'none', fontWeight: 700, color: '#16a34a', bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}
                    >
                      Add Step
                    </Button>
                  </Box>

                  <Stack spacing={2}>
                    {workflowForm.steps.map((step, index) => (
                      <Box
                        key={step.id || index}
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          bgcolor: '#f8fafc',
                          position: 'relative'
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 800, bgcolor: '#0f172a', color: '#ffffff' }}>
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {step.name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" disabled={index === 0} onClick={() => handleMoveStep(index, -1)}>
                              <ArrowUpwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton size="small" disabled={index === workflowForm.steps.length - 1} onClick={() => handleMoveStep(index, 1)}>
                              <ArrowDownwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleRemoveStep(index)}>
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Step Action</InputLabel>
                              <Select
                                value={step.type}
                                label="Step Action"
                                onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                              >
                                <MenuItem value="SEND_MESSAGE">Send WhatsApp Reply</MenuItem>
                                <MenuItem value="TAG">Tag Customer Profile</MenuItem>
                                <MenuItem value="AI_ACTION">AI Escalation Action</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            {step.type === 'SEND_MESSAGE' ? (
                              <TextField
                                label="WhatsApp Message Copy"
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                value={step.config.value}
                                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                placeholder="Type your response copy here..."
                              />
                            ) : (
                              <TextField
                                label={step.type === 'TAG' ? 'Tag Name (e.g. VIP_CLIENT)' : 'Escalation Note'}
                                fullWidth
                                size="small"
                                value={step.config.value}
                                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                placeholder={step.type === 'TAG' ? 'e.g. VIP_CLIENT' : 'e.g. Notify manager'}
                              />
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* Right Column: Live WhatsApp Mobile Simulator Preview */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  position: 'sticky',
                  top: 20
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    📱 Customer WhatsApp Simulator
                  </Typography>
                  <Chip
                    label="LIVE PREVIEW"
                    size="small"
                    sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.65rem' }}
                  />
                </Box>

                {/* Mobile Device Frame */}
                <Box
                  sx={{
                    borderRadius: '20px',
                    border: '4px solid #1e293b',
                    overflow: 'hidden',
                    bgcolor: '#efeae2',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                  }}
                >
                  {/* WhatsApp Chat Header */}
                  <Box sx={{ bgcolor: '#075e54', p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, color: '#ffffff' }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.8rem' }}>
                      R
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        RENIC TECH Official
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem' }}>
                        Business Account • Automated
                      </Typography>
                    </Box>
                  </Box>

                  {/* WhatsApp Messages Canvas */}
                  <Box sx={{ p: 2, minHeight: 260, display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'flex-end' }}>
                    {/* Incoming customer trigger simulated bubble */}
                    <Box sx={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                      <Box sx={{ bgcolor: '#ffffff', p: 1.2, borderRadius: '8px 8px 8px 0px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}>
                          Customer Inquiry (Matches: {workflowForm.triggerValue || 'intent'})
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.8rem' }}>
                          {workflowForm.triggerField === 'intent' && workflowForm.triggerValue === 'abandoned_cart'
                            ? 'I was checking out jewelry on your website earlier.'
                            : workflowForm.triggerField === 'intent' && workflowForm.triggerValue === 'customization'
                            ? 'Can you make a customized bridal necklace set?'
                            : 'Hello, can you help me with my order?'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', textAlign: 'right', display: 'block', mt: 0.3 }}>
                          10:42 AM
                        </Typography>
                      </Box>
                    </Box>

                    {/* Outgoing automated reply simulated bubble */}
                    <Box sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                      <Box sx={{ bgcolor: '#d9fdd3', p: 1.2, borderRadius: '8px 8px 0px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        <Typography variant="body2" sx={{ color: '#111b21', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {primaryMessageStep?.config?.value || 'Configure automated reply copy in Step 1 to see preview here...'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#667781', fontSize: '0.6rem' }}>
                            10:42 AM
                          </Typography>
                          <span style={{ color: '#53bdeb', fontSize: '0.75rem', lineHeight: 1 }}>✓✓</span>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Flow studio promo */}
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mb: 0.5 }}>
                    Need Complex Branching Logic?
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                    Launch the visual flowchart canvas to design branching decision nodes, wait delays, and webhooks.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<AccountTreeIcon />}
                    onClick={() => {
                      setOpenDialog(false);
                      navigate('/workflows/create');
                    }}
                    sx={{
                      borderColor: '#0f172a',
                      color: '#0f172a',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#0f172a', color: '#ffffff' }
                    }}
                  >
                    Open Flow Studio
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* CREATE CATEGORY DIALOG */}
      <Dialog
        open={openCategoryDialog}
        onClose={() => setOpenCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          📁 New Category Folder
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Category Name *"
              fullWidth
              size="small"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g., Abandoned Cart, VIP Welcome, Support"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Describe what workflows belong in this category..."
            />
            <FormControl fullWidth size="small">
              <InputLabel>Folder Tag Color</InputLabel>
              <Select
                value={categoryForm.color}
                label="Folder Tag Color"
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              >
                <MenuItem value="#84cc16">Renic Lime (#84cc16)</MenuItem>
                <MenuItem value="#2563eb">Electric Blue (#2563eb)</MenuItem>
                <MenuItem value="#16a34a">Forest Green (#16a34a)</MenuItem>
                <MenuItem value="#ea580c">Warm Orange (#ea580c)</MenuItem>
                <MenuItem value="#9333ea">Royal Purple (#9333ea)</MenuItem>
                <MenuItem value="#06b6d4">Cyan (#06b6d4)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenCategoryDialog(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCategory}
            sx={{
              backgroundColor: '#84cc16',
              color: '#0f172a',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              px: 2.5,
              '&:hover': { backgroundColor: '#65a30d' }
            }}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 2, px: 3, fontWeight: 800 }}>
          ⚠️ Delete Automation Workflow?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
            Are you sure you want to delete <strong>"{deleteConfirm.workflowName}"</strong>? This will immediately stop execution of this automation. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '8px', px: 2.5 }}
          >
            Delete Automation
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
