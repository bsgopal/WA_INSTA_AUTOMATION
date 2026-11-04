import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, Switch, FormControlLabel, Divider, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip, Alert, Avatar, Tabs, Tab, InputAdornment, Stepper, Step, StepLabel, StepButton
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';

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
  const [wizardStep, setWizardStep] = useState(0); // 0: Choose Template, 1: Trigger Setup, 2: Response & Buttons
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
    triggerType: 'KEYWORD',
    triggerField: 'KEYWORD',
    triggerKeywords: 'hi, hello, menu, start, catalog',
    triggerOperator: 'equals',
    triggerValue: 'order_inquiry',
    selectedRuleId: '',
    steps: [
      {
        id: 'step_1',
        type: 'SEND_MESSAGE',
        name: 'Send Automated Reply',
        config: { value: 'Hello {{customerName}}! Welcome to our enterprise portal 🌟\nHow can we help you today?' },
        buttons: [
          { id: 'b1', title: '📅 Book Slot', value: 'Book' },
          { id: 'b2', title: '🛍️ View Services', value: 'Services' },
          { id: 'b3', title: '💬 Speak to Desk', value: 'Support' }
        ]
      }
    ]
  });

  // Enterprise Industry Blueprints (Wipro / ServiceNow grade)
  const workflowPresets = [
    {
      id: 'appointment_booking',
      badge: 'Healthcare & Consultations',
      badgeColor: '#0284c7',
      label: '📅 Smart Appointment Booking',
      name: 'Smart Appointment & Consultation Booking',
      description: 'Auto-schedules appointments, presents available service slots, and routes to booking specialists',
      triggerField: 'KEYWORD',
      triggerKeywords: 'book, appointment, doctor, consultation, schedule, slot, visit',
      triggerOperator: 'contains',
      triggerValue: 'appointment_booking',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Welcome & Appointment Menu',
          config: {
            value: 'Hello {{customerName}}! 👋 Welcome to our Appointment Desk.\n\nWe are pleased to assist you in scheduling your consultation or service visit.\n\nPlease choose an option below to proceed:'
          },
          buttons: [
            { id: 'b1', title: '📅 Pick Date & Slot', value: 'Book_Slot' },
            { id: 'b2', title: '👨‍⚕️ View Specialists', value: 'Specialists' },
            { id: 'b3', title: '💬 Speak to Desk', value: 'Support_Desk' }
          ]
        }
      ]
    },
    {
      id: 'lead_qualification',
      badge: 'Sales & Growth',
      badgeColor: '#16a34a',
      label: '👋 24/7 Smart Welcome & Leads',
      name: '24/7 Smart Welcome & Lead Qualification',
      description: 'Instant conversational greeting that qualifies prospect inquiries and routes leads to representatives',
      triggerField: 'KEYWORD',
      triggerKeywords: 'hi, hello, hey, start, info, menu, welcome',
      triggerOperator: 'contains',
      triggerValue: 'lead_qualification',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Company Greeting & Service Menu',
          config: {
            value: 'Hello {{customerName}}! 🌟 Thank you for reaching out to us.\n\nHow can our enterprise team assist your organization today? Select from the options below to get started immediately:'
          },
          buttons: [
            { id: 'b1', title: '🚀 Explore Solutions', value: 'Solutions' },
            { id: 'b2', title: '💰 Request Quote', value: 'Pricing_Quote' },
            { id: 'b3', title: '📞 Talk to Executive', value: 'Live_Agent' }
          ]
        }
      ]
    },
    {
      id: 'order_tracking',
      badge: 'Logistics & Dispatch',
      badgeColor: '#ea580c',
      label: '📦 Order & Shipment Tracking',
      name: 'Live Order & Shipment Tracking Lookup',
      description: 'Real-time automated status lookup for order confirmations, delivery schedules, and fulfillment progress',
      triggerField: 'KEYWORD',
      triggerKeywords: 'order, track, status, shipment, delivery, dispatch, parcel',
      triggerOperator: 'contains',
      triggerValue: 'order_inquiry',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Order Lookup Prompt',
          config: {
            value: 'Hello {{customerName}}! 📦 Welcome to Order Support.\n\nPlease reply with your Order or Tracking ID (e.g. #ORD-82910) or choose an action below to view your real-time delivery status:'
          },
          buttons: [
            { id: 'b1', title: '🔍 Track Order ID', value: 'Track_Order' },
            { id: 'b2', title: '📦 Recent Orders', value: 'Recent_Orders' },
            { id: 'b3', title: '🚚 Delivery Help', value: 'Delivery_Help' }
          ]
        }
      ]
    },
    {
      id: 'support_desk',
      badge: 'Customer Helpdesk',
      badgeColor: '#7c3aed',
      label: '🛠️ Support Ticket Escalation',
      name: 'Enterprise Support & Ticket Escalation Desk',
      description: '24/7 IT helpdesk bot that diagnoses common issues, provides instant KB articles, or escalates to live support',
      triggerField: 'KEYWORD',
      triggerKeywords: 'help, support, query, issue, ticket, agent, problem',
      triggerOperator: 'contains',
      triggerValue: 'support',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Support Triaging & Ticket Route',
          config: {
            value: 'Hello {{customerName}}! 🛠️ Welcome to Enterprise Support.\n\nOur technical support desk is available 24/7. Select an option below to resolve your query or connect with an engineer:'
          },
          buttons: [
            { id: 'b1', title: '❓ Knowledge Base', value: 'Knowledge_Base' },
            { id: 'b2', title: '🎫 Raise Ticket', value: 'Raise_Ticket' },
            { id: 'b3', title: '👨‍💼 Live Engineer', value: 'Live_Engineer' }
          ]
        }
      ]
    },
    {
      id: 'service_catalog',
      badge: 'Enterprise Products',
      badgeColor: '#0d9488',
      label: '📋 Solutions & Catalog Showcase',
      name: 'Solutions & Service Catalog Showcase',
      description: 'Showcase enterprise product portfolios, service tier pricing, and digital brochures with instant interactive replies',
      triggerField: 'KEYWORD',
      triggerKeywords: 'catalog, services, brochure, pricing, plans, solutions',
      triggerOperator: 'contains',
      triggerValue: 'catalog_inquiry',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Service Portfolio Menu',
          config: {
            value: 'Hello {{customerName}}! 📈 Explore our comprehensive enterprise products and tailored service packages.\n\nBrowse through our solutions below or request a customized proposal:'
          },
          buttons: [
            { id: 'b1', title: '📑 Download Brochure', value: 'Brochure' },
            { id: 'b2', title: '💼 Enterprise Plans', value: 'Enterprise_Plans' },
            { id: 'b3', title: '💬 Chat with Sales', value: 'Sales_Chat' }
          ]
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
      const list = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.workflows) ? response.data.workflows : []);
      setWorkflows(list);
    } catch (error) {
      setWorkflows([]);
      setSnackbar({ open: true, message: 'Failed to fetch workflows', severity: 'error' });
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories/workflow');
      const list = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.categories) ? response.data.categories : []);
      setCategories(list);
    } catch (error) {
      setCategories([]);
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await apiClient.get('/response-rules');
      const list = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.rules) ? response.data.rules : []);
      setRules(list);
    } catch (error) {
      setRules([]);
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
    setWizardStep(0);
    setWorkflowForm({
      name: '',
      description: '',
      category: '',
      triggerType: 'KEYWORD',
      triggerField: 'KEYWORD',
      triggerKeywords: 'hi, hello, menu, start, book, support',
      triggerOperator: 'equals',
      triggerValue: 'appointment_booking',
      selectedRuleId: '',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send Automated Reply',
          config: { value: 'Hello {{customerName}}! Welcome to our enterprise desk 🌟\nHow can our team help you today?' },
          buttons: [
            { id: 'b1', title: '📅 Book Slot', value: 'Book' },
            { id: 'b2', title: '🛍️ View Services', value: 'Services' },
            { id: 'b3', title: '💬 Speak to Desk', value: 'Support' }
          ]
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
      triggerType: preset.triggerField === 'intent' ? 'INTENT' : 'KEYWORD',
      triggerField: preset.triggerField || 'KEYWORD',
      triggerKeywords: preset.triggerKeywords || preset.triggerValue || 'hi, hello',
      triggerOperator: preset.triggerOperator || 'equals',
      triggerValue: preset.triggerValue || 'order_inquiry',
      selectedRuleId: '',
      steps: JSON.parse(JSON.stringify(preset.steps)).map(s => ({
        ...s,
        buttons: s.buttons || [
          { id: 'b1', title: '📅 Book Slot', value: 'Book' },
          { id: 'b2', title: '🛍️ View Services', value: 'Services' },
          { id: 'b3', title: '💬 Speak to Desk', value: 'Support' }
        ]
      }))
    });
    setWizardStep(1);
    setSnackbar({ open: true, message: `Loaded "${preset.label}" blueprint!`, severity: 'success' });
  };

  const handleOpenEdit = (workflow) => {
    if (workflow.trigger?.type === 'RESPONSE_RULE_SELECTION' || !workflow.steps || workflow.steps.length > 3) {
      navigate(`/workflows/${workflow._id}`);
      return;
    }
    setEditingId(workflow._id);
    setWizardStep(1);
    const triggerType = workflow.trigger?.type || (workflow.trigger?.conditions?.[0]?.field === 'intent' ? 'INTENT' : 'KEYWORD');
    const firstCondition = workflow.trigger?.conditions?.[0] || {};
    setWorkflowForm({
      name: workflow.name || '',
      description: workflow.description || '',
      category: workflow.category || '',
      triggerType: triggerType === 'RESPONSE_RULE' ? 'RESPONSE_RULE' : triggerType === 'INTENT' ? 'INTENT' : 'KEYWORD',
      triggerField: triggerType,
      triggerKeywords: workflow.trigger?.keywords?.join(', ') || workflow.trigger?.value || '',
      triggerOperator: firstCondition.operator || 'equals',
      triggerValue: firstCondition.value || workflow.trigger?.value || '',
      selectedRuleId: workflow.trigger?.responseRuleId || '',
      steps: (workflow.steps && workflow.steps.length > 0)
        ? workflow.steps.map((s, i) => ({
            id: s.id || `step_${i + 1}`,
            type: s.type || 'SEND_MESSAGE',
            name: s.name || 'Step Action',
            config: { value: s.config?.value || s.config?.message || '' },
            buttons: s.config?.buttons || s.buttons || []
          }))
        : [{ id: 'step_1', type: 'SEND_MESSAGE', name: 'Send Automated Reply', config: { value: '' }, buttons: [] }]
    });
    setOpenDialog(true);
  };

  const handleAddKeywordChip = (keyword) => {
    const current = (workflowForm.triggerKeywords || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    if (!current.includes(keyword)) {
      current.push(keyword);
      setWorkflowForm(prev => ({ ...prev, triggerKeywords: current.join(', ') }));
    }
  };

  const handleInsertVariable = (stepIndex, variableTag) => {
    const currentVal = workflowForm.steps[stepIndex]?.config?.value || '';
    const spacer = currentVal.length > 0 && !currentVal.endsWith(' ') && !currentVal.endsWith('\n') ? ' ' : '';
    handleStepChange(stepIndex, 'value', currentVal + spacer + variableTag + ' ');
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

    let triggerPayload = {};
    if (workflowForm.triggerType === 'RESPONSE_RULE') {
      if (!workflowForm.selectedRuleId) {
        setSnackbar({ open: true, message: 'Please select an AI Response Rule to link', severity: 'warning' });
        return;
      }
      const selectedRule = rules.find(r => r._id === workflowForm.selectedRuleId);
      triggerPayload = {
        type: 'RESPONSE_RULE',
        responseRuleId: workflowForm.selectedRuleId,
        responseRuleName: selectedRule?.name || 'AI Response Rule',
        keywords: [],
        conditions: []
      };
    } else if (workflowForm.triggerType === 'KEYWORD') {
      const keywords = (workflowForm.triggerKeywords || 'hi, hello').split(',').map(s => s.trim()).filter(Boolean);
      triggerPayload = {
        type: 'KEYWORD',
        keywords,
        value: keywords.join(', '),
        conditions: [{ field: 'keywords', operator: 'contains', value: keywords.join(', ') }]
      };
    } else {
      triggerPayload = {
        type: 'INTENT',
        value: workflowForm.triggerValue || 'order_inquiry',
        conditions: [{
          field: 'intent',
          operator: workflowForm.triggerOperator || 'equals',
          value: workflowForm.triggerValue || 'order_inquiry'
        }]
      };
    }

    // Auto-generate 2D Visual Flow nodes so the workflow opens seamlessly in Visual Studio too!
    const startNode = {
      id: 'node_start',
      type: workflowForm.triggerType === 'RESPONSE_RULE' ? 'RESPONSE_RULE' : 'START',
      label: workflowForm.triggerType === 'RESPONSE_RULE'
        ? `Rule: ${triggerPayload.responseRuleName}`
        : 'Start Trigger',
      position: { x: 80, y: 220 },
      config: workflowForm.triggerType === 'RESPONSE_RULE'
        ? { ruleId: workflowForm.selectedRuleId, ruleName: triggerPayload.responseRuleName }
        : { triggerType: 'KEYWORD', keywords: triggerPayload.keywords || ['hi'] }
    };

    const actionNodes = workflowForm.steps.map((step, idx) => ({
      id: `node_step_${idx + 1}`,
      type: step.type === 'TAG' ? 'TAG' : step.type === 'AI_ACTION' ? 'AI_SCRIPT' : 'SEND_TEXT',
      label: step.name || 'Send Reply',
      position: { x: 380 + idx * 340, y: 220 },
      config: {
        message: step.config?.value || '',
        value: step.config?.value || '',
        buttons: (step.buttons || []).map((b, bIdx) => ({
          id: b.id || `b_${bIdx + 1}`,
          title: String(b.title || b.label || `Option ${bIdx + 1}`).replace(/^\d+[\.\)]\s*/, '').trim(),
          value: b.value || b.title || `Option ${bIdx + 1}`
        }))
      }
    }));

    const endNode = {
      id: 'node_end',
      type: 'END',
      label: 'End Flow',
      position: { x: 380 + workflowForm.steps.length * 340, y: 220 },
      config: { terminationType: 'COMPLETE' }
    };

    const nodes = [startNode, ...actionNodes, endNode];
    const edges = [];
    if (actionNodes.length > 0) {
      edges.push({ id: 'edge_start_1', fromNodeId: startNode.id, fromPort: 'out', toNodeId: actionNodes[0].id, toPort: 'in', label: '' });
      for (let i = 0; i < actionNodes.length - 1; i++) {
        edges.push({ id: `edge_${i + 1}_${i + 2}`, fromNodeId: actionNodes[i].id, fromPort: 'out', toNodeId: actionNodes[i + 1].id, toPort: 'in', label: '' });
      }
      edges.push({ id: 'edge_last_end', fromNodeId: actionNodes[actionNodes.length - 1].id, fromPort: 'out', toNodeId: endNode.id, toPort: 'in', label: '' });
    } else {
      edges.push({ id: 'edge_start_end', fromNodeId: startNode.id, fromPort: 'out', toNodeId: endNode.id, toPort: 'in', label: '' });
    }

    const payload = {
      name: workflowForm.name.trim(),
      description: workflowForm.description.trim(),
      category: workflowForm.category || undefined,
      trigger: triggerPayload,
      nodes,
      edges,
      steps: workflowForm.steps.map((step, idx) => ({
        id: step.id || `step_${idx + 1}`,
        type: step.type,
        name: step.name,
        config: {
          value: step.config?.value || '',
          message: step.config?.value || '',
          buttons: (step.buttons || []).map((b, bIdx) => ({
            id: b.id || `b_${bIdx + 1}`,
            title: String(b.title || b.label || `Option ${bIdx + 1}`).replace(/^\d+[\.\)]\s*/, '').trim(),
            value: b.value || b.title || `Option ${bIdx + 1}`
          }))
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
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save workflow', severity: 'error' });
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
      id: `step_${workflowForm.steps.length + 1}`,
      type: 'SEND_MESSAGE',
      name: `Step Action ${workflowForm.steps.length + 1}`,
      config: { value: '' },
      buttons: []
    };
    setWorkflowForm(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleAddButtonToStep = (stepIndex) => {
    const updated = [...workflowForm.steps];
    const curButtons = updated[stepIndex].buttons || [];
    if (curButtons.length >= 3) return;
    const newBtn = {
      id: `b_${Date.now()}_${curButtons.length + 1}`,
      title: `Option ${curButtons.length + 1}`,
      value: `Option ${curButtons.length + 1}`
    };
    updated[stepIndex].buttons = [...curButtons, newBtn];
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
  };

  const handleButtonChange = (stepIndex, btnIndex, field, val) => {
    const updated = [...workflowForm.steps];
    const btns = [...(updated[stepIndex].buttons || [])];
    btns[btnIndex] = { ...btns[btnIndex], [field]: val };
    updated[stepIndex].buttons = btns;
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
  };

  const handleRemoveButtonFromStep = (stepIndex, btnIndex) => {
    const updated = [...workflowForm.steps];
    updated[stepIndex].buttons = (updated[stepIndex].buttons || []).filter((_, i) => i !== btnIndex);
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
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
  const safeWorkflows = Array.isArray(workflows) ? workflows : [];
  const safeRules = Array.isArray(rules) ? rules : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const totalCount = safeWorkflows.length;
  const activeCount = safeWorkflows.filter(w => w.status === 'ACTIVE').length;
  const pausedCount = safeWorkflows.filter(w => w.status !== 'ACTIVE').length;
  const totalRuns = safeWorkflows.reduce((acc, w) => acc + (w.stats?.successfulExecutions || 0), 0);

  const filteredWorkflows = safeWorkflows.filter(w => {
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
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>{safeRules.length}</Typography>
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
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>{safeRules.filter(r => r.isActive).length}</Typography>
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
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ca8a04' }}>{safeRules.filter(r => !r.isActive).length}</Typography>
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
                  {safeRules.filter(r => {
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
          {safeRules.filter(r => {
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
                  {safeRules
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
            triggerValue: studioWorkflow.trigger?.keywords?.[0] || studioWorkflow.trigger?.conditions?.[0]?.value || 'hi',
            nodes: (studioWorkflow.nodes && studioWorkflow.nodes.length > 0) ? studioWorkflow.nodes : undefined,
            edges: (studioWorkflow.edges && studioWorkflow.edges.length > 0) ? studioWorkflow.edges : undefined,
            edgeRouting: studioWorkflow.edgeRouting || 'bezier'
          } : {
            name: 'New Process Workflow',
            status: 'ACTIVE'
          }}
          onSave={async (dmData) => {
            const triggerNode = (dmData.nodes || []).find(n => n.type === 'START' || n.category === 'triggers' || n.type === 'KEYWORD') || dmData.nodes?.[0];
            const actionNodes = (dmData.nodes || []).filter(n => n.id !== triggerNode?.id);
            const triggerKeywords = (triggerNode?.config?.keywords && triggerNode.config.keywords.length > 0)
              ? triggerNode.config.keywords
              : (dmData.triggerKeywords && dmData.triggerKeywords.length > 0)
                ? dmData.triggerKeywords
                : (dmData.triggerValue ? dmData.triggerValue.split(',').map(s => s.trim()).filter(Boolean) : ['hi', 'hello', 'hey', 'menu']);

            const payload = {
              name: dmData.name || 'New Automated Workflow',
              description: 'Designed via Visual Flow Studio',
              status: dmData.status || 'ACTIVE',
              priority: 10,
              nodes: dmData.nodes || [],
              edges: dmData.edges || [],
              edgeRouting: dmData.edgeRouting || 'bezier',
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

      {/* ENTERPRISE GUIDED WORKFLOW BUILDER (WIPRO / SERVICENOW STYLE) */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(15,23,42,0.4)',
            bgcolor: '#ffffff'
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
            px: 3,
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'rgba(132, 204, 22, 0.15)',
                color: '#84cc16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FlashOnIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2, fontSize: '1.1rem' }}>
                {editingId ? 'Edit Enterprise Automation Flow' : 'Enterprise Workflow Builder'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Design conversational customer journeys with smart triggers, dynamic variables, and interactive quick replies
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
                borderRadius: '10px',
                px: 2.5,
                boxShadow: '0 2px 10px rgba(132, 204, 22, 0.3)',
                '&:hover': { backgroundColor: '#65a30d', color: '#ffffff' }
              }}
            >
              {editingId ? 'Update Workflow' : 'Deploy & Activate'}
            </Button>
          </Stack>
        </DialogTitle>

        {/* 3-Step Breadcrumb Stepper Navigation */}
        <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, bgcolor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Stepper nonLinear activeStep={wizardStep}>
            <Step completed={wizardStep > 0}>
              <StepButton
                onClick={() => setWizardStep(0)}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: wizardStep === 0 ? '#84cc16 !important' : '#94a3b8 !important',
                    fontWeight: wizardStep === 0 ? 800 : 600,
                    fontSize: '0.82rem'
                  },
                  '& .MuiStepIcon-root': {
                    color: wizardStep === 0 ? '#84cc16 !important' : wizardStep > 0 ? '#22c55e !important' : '#475569 !important'
                  }
                }}
              >
                1. Choose Blueprint
              </StepButton>
            </Step>
            <Step completed={wizardStep > 1}>
              <StepButton
                onClick={() => setWizardStep(1)}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: wizardStep === 1 ? '#84cc16 !important' : '#94a3b8 !important',
                    fontWeight: wizardStep === 1 ? 800 : 600,
                    fontSize: '0.82rem'
                  },
                  '& .MuiStepIcon-root': {
                    color: wizardStep === 1 ? '#84cc16 !important' : wizardStep > 1 ? '#22c55e !important' : '#475569 !important'
                  }
                }}
              >
                2. Trigger ("When...")
              </StepButton>
            </Step>
            <Step completed={wizardStep === 2}>
              <StepButton
                onClick={() => setWizardStep(2)}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: wizardStep === 2 ? '#84cc16 !important' : '#94a3b8 !important',
                    fontWeight: wizardStep === 2 ? 800 : 600,
                    fontSize: '0.82rem'
                  },
                  '& .MuiStepIcon-root': {
                    color: wizardStep === 2 ? '#84cc16 !important' : '#475569 !important'
                  }
                }}
              >
                3. Reply & Buttons ("Do this...")
              </StepButton>
            </Step>
          </Stepper>
        </Box>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', maxHeight: 'calc(85vh - 150px)', overflowY: 'auto' }}>
          
          {/* STEP 0: ENTERPRISE BLUEPRINTS GALLERY */}
          {wizardStep === 0 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                  Select an Enterprise Blueprint or Start from Scratch
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Each blueprint includes pre-configured trigger words, verified response templates, and official WhatsApp interactive buttons. You can customize all settings in the next steps.
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {/* 5 Enterprise Industry Blueprints */}
                {workflowPresets.map((preset) => (
                  <Grid item xs={12} sm={6} md={4} key={preset.id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.25s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#84cc16',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 24px -6px rgba(132, 204, 22, 0.2)'
                        }
                      }}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Chip
                            label={preset.badge}
                            size="small"
                            sx={{
                              bgcolor: `${preset.badgeColor}15`,
                              color: preset.badgeColor,
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              height: 22,
                              borderRadius: '6px'
                            }}
                          />
                          <Chip
                            label="READY TO USE"
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 800, fontSize: '0.62rem', height: 20 }}
                          />
                        </Box>

                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8, fontSize: '0.95rem' }}>
                          {preset.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem', mb: 2, flexGrow: 1, lineHeight: 1.4 }}>
                          {preset.description}
                        </Typography>

                        {/* Trigger preview tag */}
                        <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', display: 'block', mb: 0.5 }}>
                            ⚡ Triggers on keywords:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {preset.triggerKeywords.split(',').slice(0, 4).map((kw, idx) => (
                              <Chip
                                key={idx}
                                label={kw.trim()}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e2e8f0', color: '#334155' }}
                              />
                            ))}
                            {preset.triggerKeywords.split(',').length > 4 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', alignSelf: 'center' }}>
                                +{preset.triggerKeywords.split(',').length - 4} more
                              </Typography>
                            )}
                          </Stack>
                        </Box>

                        {/* WhatsApp Buttons Preview */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', display: 'block', mb: 0.5 }}>
                            🔘 WhatsApp Quick Replies:
                          </Typography>
                          <Stack spacing={0.5}>
                            {(preset.steps[0]?.buttons || []).map((b, bIdx) => (
                              <Box
                                key={bIdx}
                                sx={{
                                  px: 1,
                                  py: 0.4,
                                  bgcolor: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  color: '#2563eb',
                                  fontWeight: 700,
                                  textAlign: 'center'
                                }}
                              >
                                {b.title}
                              </Box>
                            ))}
                          </Stack>
                        </Box>

                        <Button
                          fullWidth
                          variant="contained"
                          endIcon={<ArrowForwardIcon />}
                          sx={{
                            bgcolor: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            borderRadius: '8px',
                            mt: 'auto',
                            '&:hover': { bgcolor: '#84cc16', color: '#0f172a' }
                          }}
                        >
                          Use Blueprint
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}

                {/* Custom Blank Flow Card */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '14px',
                      border: '2px dashed #cbd5e1',
                      bgcolor: '#ffffff',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: 'rgba(37, 99, 235, 0.02)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                    onClick={() => {
                      setWorkflowForm({
                        name: 'Custom Workflow',
                        description: 'Custom automated response journey',
                        category: '',
                        triggerType: 'KEYWORD',
                        triggerField: 'KEYWORD',
                        triggerKeywords: 'hello, start, menu',
                        triggerOperator: 'contains',
                        triggerValue: 'order_inquiry',
                        selectedRuleId: '',
                        steps: [
                          {
                            id: 'step_1',
                            type: 'SEND_MESSAGE',
                            name: 'Send Automated Reply',
                            config: { value: 'Hello {{customerName}}! How can we assist you today?' },
                            buttons: [
                              { id: 'b1', title: '1. View Options', value: 'Options' },
                              { id: 'b2', title: '2. Help Desk', value: 'Help' }
                            ]
                          }
                        ]
                      });
                      setWizardStep(1);
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: '16px',
                          bgcolor: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2
                        }}
                      >
                        <AddIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8 }}>
                        Start from Scratch
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem', mb: 3 }}>
                        Build a completely bespoke flow with custom triggers, logic, and WhatsApp interactive actions.
                      </Typography>
                      <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderColor: '#2563eb',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          '&:hover': { bgcolor: '#2563eb', color: '#ffffff' }
                        }}
                      >
                        Create Blank Flow
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* STEP 1 & 2: TWO-COLUMN LAYOUT WITH LIVE PHONE SIMULATOR */}
          {wizardStep > 0 && (
            <Grid container spacing={3} alignItems="flex-start">
              {/* Left Column: Form Configuration */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2.5}>
                  
                  {/* STEP 1: TRIGGER & BASIC SETUP */}
                  {wizardStep === 1 && (
                    <>
                      {/* Flow Identification */}
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                          📌 1. Basic Flow Identification
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Workflow Name *"
                            size="small"
                            fullWidth
                            value={workflowForm.name}
                            onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                            placeholder="e.g. Smart Appointment & Consultation Booking"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                          />
                          <TextField
                            label="Description (Optional)"
                            size="small"
                            fullWidth
                            value={workflowForm.description}
                            onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                            placeholder="Brief summary of when this automation triggers and what it resolves..."
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                          />
                          <FormControl fullWidth size="small">
                            <InputLabel>Category Folder (Optional)</InputLabel>
                            <Select
                              label="Category Folder (Optional)"
                              value={workflowForm.category}
                              onChange={(e) => setWorkflowForm({ ...workflowForm, category: e.target.value })}
                              sx={{ borderRadius: '10px' }}
                            >
                              <MenuItem value=""><em>None (General)</em></MenuItem>
                              {categories.map((c) => (
                                <MenuItem key={c._id} value={c._id}>📁 {c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </Paper>

                      {/* Trigger Source Selection */}
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                          ⚡ 2. WHEN THIS HAPPENS (Select Trigger Source)
                        </Typography>

                        {/* 3 Selector Cards */}
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={4}>
                            <Box
                              onClick={() => setWorkflowForm(prev => ({ ...prev, triggerType: 'KEYWORD' }))}
                              sx={{
                                p: 1.8,
                                borderRadius: '12px',
                                border: workflowForm.triggerType === 'KEYWORD' ? '2px solid #84cc16' : '1px solid #cbd5e1',
                                bgcolor: workflowForm.triggerType === 'KEYWORD' ? 'rgba(132, 204, 22, 0.08)' : '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontSize: '1.6rem', mb: 0.5 }}>💬</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                                Customer Keywords
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block', mt: 0.3 }}>
                                e.g. book, help, order, hi
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Box
                              onClick={() => setWorkflowForm(prev => ({ ...prev, triggerType: 'RESPONSE_RULE' }))}
                              sx={{
                                p: 1.8,
                                borderRadius: '12px',
                                border: workflowForm.triggerType === 'RESPONSE_RULE' ? '2px solid #84cc16' : '1px solid #cbd5e1',
                                bgcolor: workflowForm.triggerType === 'RESPONSE_RULE' ? 'rgba(132, 204, 22, 0.08)' : '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontSize: '1.6rem', mb: 0.5 }}>⚡</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                                AI Response Rule
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block', mt: 0.3 }}>
                                Connect to AI rule studio
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Box
                              onClick={() => setWorkflowForm(prev => ({ ...prev, triggerType: 'INTENT' }))}
                              sx={{
                                p: 1.8,
                                borderRadius: '12px',
                                border: workflowForm.triggerType === 'INTENT' ? '2px solid #84cc16' : '1px solid #cbd5e1',
                                bgcolor: workflowForm.triggerType === 'INTENT' ? 'rgba(132, 204, 22, 0.08)' : '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontSize: '1.6rem', mb: 0.5 }}>🧠</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                                AI Intent Detect
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block', mt: 0.3 }}>
                                Natural language match
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Keyword Trigger with Suggested Keyword Chips */}
                        {workflowForm.triggerType === 'KEYWORD' && (
                          <Box>
                            <TextField
                              label="Customer Trigger Words (comma-separated) *"
                              fullWidth
                              size="small"
                              value={workflowForm.triggerKeywords}
                              onChange={(e) => setWorkflowForm({ ...workflowForm, triggerKeywords: e.target.value })}
                              placeholder="e.g. book, appointment, doctor, schedule, consultation"
                              helperText="When incoming WhatsApp message contains any of these words, this flow launches instantly."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, mb: 1.5 }}
                            />
                            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 1 }}>
                                💡 Click to add common enterprise trigger words:
                              </Typography>
                              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                {['book', 'appointment', 'doctor', 'help', 'support', 'order', 'track', 'pricing', 'quote', 'menu', 'hi', 'start'].map((kw) => (
                                  <Chip
                                    key={kw}
                                    label={`+ ${kw}`}
                                    size="small"
                                    onClick={() => handleAddKeywordChip(kw)}
                                    clickable
                                    sx={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      bgcolor: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      '&:hover': { bgcolor: '#84cc16', color: '#0f172a', borderColor: '#84cc16' }
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          </Box>
                        )}

                        {workflowForm.triggerType === 'RESPONSE_RULE' && (
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Linked AI Response Rule *</InputLabel>
                            <Select
                              label="Select Linked AI Response Rule *"
                              value={workflowForm.selectedRuleId}
                              onChange={(e) => setWorkflowForm({ ...workflowForm, selectedRuleId: e.target.value })}
                              sx={{ borderRadius: '10px' }}
                            >
                              {rules.map((rule) => (
                                <MenuItem key={rule._id} value={rule._id}>
                                  ⚡ {rule.name} ({rule.triggerValue || 'Intent'})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {workflowForm.triggerType === 'INTENT' && (
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>AI Intent Category</InputLabel>
                                <Select
                                  label="AI Intent Category"
                                  value={workflowForm.triggerValue}
                                  onChange={(e) => setWorkflowForm({ ...workflowForm, triggerValue: e.target.value })}
                                  sx={{ borderRadius: '10px' }}
                                >
                                  <MenuItem value="order_inquiry">🛍️ Order & Fulfillment Inquiry</MenuItem>
                                  <MenuItem value="appointment_booking">📅 Smart Appointment Booking</MenuItem>
                                  <MenuItem value="pricing_inquiry">💰 Pricing & Enterprise Quotes</MenuItem>
                                  <MenuItem value="complaint">⚠️ Service Escalation & Complaints</MenuItem>
                                  <MenuItem value="support">💬 General Customer Support</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Classification Engine"
                                fullWidth
                                size="small"
                                disabled
                                value="Gemini AI Natural Language NLP"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>

                      {/* Step 1 Navigation Buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<ArrowBackIcon />}
                          onClick={() => setWizardStep(0)}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }}
                        >
                          Back to Blueprints
                        </Button>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => setWizardStep(2)}
                          sx={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: '8px',
                            px: 3,
                            '&:hover': { backgroundColor: '#84cc16', color: '#0f172a' }
                          }}
                        >
                          Next: Configure WhatsApp Reply ➔
                        </Button>
                      </Box>
                    </>
                  )}

                  {/* STEP 2: WHATSAPP REPLY & BUTTONS */}
                  {wizardStep === 2 && (
                    <>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ⚙️ 3. THEN DO THIS (Automated WhatsApp Actions)
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAddStep}
                            sx={{ textTransform: 'none', fontWeight: 800, color: '#16a34a', bgcolor: '#f0fdf4', borderRadius: '8px', '&:hover': { bgcolor: '#dcfce7' } }}
                          >
                            + Add Action Step
                          </Button>
                        </Box>

                        <Stack spacing={2.5}>
                          {workflowForm.steps.map((step, index) => (
                            <Box
                              key={step.id || index}
                              sx={{
                                p: 2.2,
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                bgcolor: '#f8fafc'
                              }}
                            >
                              <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', fontWeight: 900, bgcolor: '#0f172a', color: '#ffffff' }}>
                                  {index + 1}
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', flexGrow: 1, fontSize: '0.9rem' }}>
                                  {step.name}
                                </Typography>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton size="small" disabled={index === 0} onClick={() => handleMoveStep(index, -1)}>
                                    <ArrowUpwardIcon fontSize="inherit" />
                                  </IconButton>
                                  <IconButton size="small" disabled={index === workflowForm.steps.length - 1} onClick={() => handleMoveStep(index, 1)}>
                                    <ArrowDownwardIcon fontSize="inherit" />
                                  </IconButton>
                                  {workflowForm.steps.length > 1 && (
                                    <IconButton size="small" color="error" onClick={() => handleRemoveStep(index)}>
                                      <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                  )}
                                </Stack>
                              </Stack>

                              <Stack spacing={1.5}>
                                {/* Variable Insertion Chips Toolbar */}
                                <Box sx={{ p: 1.2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.8, fontSize: '0.7rem' }}>
                                    ✨ Click to insert dynamic variables at cursor:
                                  </Typography>
                                  <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                    {[
                                      { label: '{{customerName}}', tag: '{{customerName}}' },
                                      { label: '{{companyName}}', tag: '{{companyName}}' },
                                      { label: '{{todayDate}}', tag: '{{todayDate}}' },
                                      { label: '{{phone}}', tag: '{{phone}}' },
                                      { label: '{{appointmentTime}}', tag: '{{appointmentTime}}' },
                                      { label: '{{orderId}}', tag: '{{orderId}}' }
                                    ].map((v) => (
                                      <Chip
                                        key={v.tag}
                                        label={v.label}
                                        size="small"
                                        onClick={() => handleInsertVariable(index, v.tag)}
                                        clickable
                                        sx={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          bgcolor: '#f1f5f9',
                                          color: '#0369a1',
                                          border: '1px solid #bae6fd',
                                          '&:hover': { bgcolor: '#0284c7', color: '#ffffff' }
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>

                                <TextField
                                  label="WhatsApp Message Copy *"
                                  fullWidth
                                  multiline
                                  rows={4}
                                  size="small"
                                  value={step.config?.value || ''}
                                  onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                  placeholder="e.g. Hello {{customerName}}! 👋 Welcome to our Appointment Desk. Please select an option below:"
                                  helperText={`Character count: ${(step.config?.value || '').length} chars`}
                                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '10px' } }}
                                />

                                {/* WhatsApp Official Interactive Buttons (Quick Replies) */}
                                <Box sx={{ p: 1.8, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem', display: 'block' }}>
                                        🔘 Official WhatsApp Interactive Buttons (Quick Replies):
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                        WhatsApp Cloud API supports up to 3 interactive buttons (max 20 characters each)
                                      </Typography>
                                    </Box>
                                    {(step.buttons || []).length < 3 && (
                                      <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleAddButtonToStep(index)}
                                        sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', color: '#2563eb' }}
                                      >
                                        Add Button
                                      </Button>
                                    )}
                                  </Box>

                                  <Stack spacing={1.2}>
                                    {(step.buttons || []).map((btn, bIdx) => (
                                      <Stack key={btn.id || bIdx} direction="row" spacing={1} alignItems="center">
                                        <TextField
                                          size="small"
                                          fullWidth
                                          inputProps={{ maxLength: 20 }}
                                          label={`Button ${bIdx + 1} Title (${(btn.title || '').length}/20 chars)`}
                                          value={btn.title}
                                          onChange={(e) => handleButtonChange(index, bIdx, 'title', e.target.value)}
                                          placeholder="e.g. 📅 Pick Date & Slot"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                        />
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveButtonFromStep(index, bIdx)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Stack>
                                    ))}
                                    {(!step.buttons || step.buttons.length === 0) && (
                                      <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>
                                        No quick reply buttons added yet. Click "+ Add Button" above to provide 1-click selectable options for your clients.
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>

                      {/* Step 2 Navigation Buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<ArrowBackIcon />}
                          onClick={() => setWizardStep(1)}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }}
                        >
                          Back to Triggers
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
                            px: 3,
                            boxShadow: '0 2px 10px rgba(132, 204, 22, 0.3)',
                            '&:hover': { backgroundColor: '#65a30d', color: '#ffffff' }
                          }}
                        >
                          {editingId ? 'Update Workflow' : 'Deploy & Activate Flow 🚀'}
                        </Button>
                      </Box>
                    </>
                  )}
                </Stack>
              </Grid>

              {/* Right Column: Sticky Live WhatsApp Simulator */}
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ position: 'sticky', top: '10px' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <span>📱 Live WhatsApp Simulator</span>
                      </Typography>
                      <Chip
                        label="REAL-TIME"
                        size="small"
                        sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>

                    {/* Device Bezel */}
                    <Box
                      sx={{
                        borderRadius: '24px',
                        border: '8px solid #0f172a',
                        overflow: 'hidden',
                        bgcolor: '#efeae2',
                        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                        backgroundSize: 'cover',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                        height: '440px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* WhatsApp Header */}
                      <Box sx={{ bgcolor: '#075e54', p: 1.2, px: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#ffffff' }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem' }}>
                          WA
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '11px', lineHeight: 1.1 }}>
                              Enterprise Support Desk
                            </Typography>
                            <VerifiedIcon sx={{ fontSize: 13, color: '#4ade80' }} />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '9px', display: 'block', lineHeight: 1 }}>
                            Verified WhatsApp Business Account
                          </Typography>
                        </Box>
                      </Box>

                      {/* Messages Body */}
                      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end', overflowY: 'auto' }}>
                        {/* Incoming customer trigger bubble */}
                        <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                          <Box sx={{ bgcolor: '#ffffff', p: 1, borderRadius: '8px 8px 8px 0px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '9px' }}>
                              Customer Trigger:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '11.5px', fontWeight: 600 }}>
                              {workflowForm.triggerType === 'KEYWORD'
                                ? (workflowForm.triggerKeywords?.split(',')?.[0]?.trim() || 'hi')
                                : workflowForm.triggerType === 'RESPONSE_RULE'
                                ? 'AI Response Rule Triggered'
                                : 'Hello, I need assistance!'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '8px', textAlign: 'right', display: 'block', mt: 0.2 }}>
                              10:42 AM
                            </Typography>
                          </Box>
                        </Box>

                        {/* Outgoing automated response bubble */}
                        <Box sx={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                          <Box sx={{ bgcolor: '#E2F9CB', p: 1.2, borderRadius: '8px 8px 0px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <Typography variant="body2" sx={{ color: '#111b21', fontSize: '11.5px', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
                              {(workflowForm.steps[0]?.config?.value || 'Configure automated reply copy...')
                                .replace(/\{\{\s*customerName\s*\}\}/gi, 'Rahul')
                                .replace(/\{\{\s*companyName\s*\}\}/gi, 'Renic Enterprises')
                                .replace(/\{\{\s*todayDate\s*\}\}/gi, new Date().toLocaleDateString())}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3, mt: 0.3 }}>
                              <Typography variant="caption" sx={{ color: '#667781', fontSize: '8px' }}>
                                10:42 AM
                              </Typography>
                              <span style={{ color: '#34b7f1', fontSize: '9px', fontWeight: 800 }}>✓✓</span>
                            </Box>
                          </Box>
                        </Box>

                        {/* Render WhatsApp Official Interactive Buttons */}
                        {(workflowForm.steps[0]?.buttons || []).map((b, i) => (
                          <Box
                            key={b.id || i}
                            sx={{
                              alignSelf: 'flex-end',
                              width: '90%',
                              bgcolor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              p: 0.7,
                              textAlign: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800, fontSize: '11px' }}>
                              🔘 {b.title || `Option ${i + 1}`}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Switch to Visual Studio Promo */}
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mb: 0.3 }}>
                        Need Multi-Branch Flowcharts?
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '10.5px' }}>
                        Design drag-and-drop nodes, parallel splits, and visual connectors.
                      </Typography>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<AccountTreeIcon />}
                        onClick={() => {
                          setOpenDialog(false);
                          handleOpenNewStudioWorkflow();
                        }}
                        sx={{
                          borderColor: '#0f172a',
                          color: '#0f172a',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          '&:hover': { bgcolor: '#0f172a', color: '#ffffff' }
                        }}
                      >
                        Open Visual Flow Studio
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          )}

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
