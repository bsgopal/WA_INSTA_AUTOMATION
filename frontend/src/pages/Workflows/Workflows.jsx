import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Button, Grid, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, Switch, FormControlLabel, Divider, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip, Alert, Avatar
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

import apiClient from '../../api/client';
import CustomSnackbar from '../../components/Snackbar';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, workflowId: null, workflowName: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#2196F3',
    icon: 'folder'
  });

  // Visual Workflow Form State
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    category: '',
    triggerField: 'intent',
    triggerOperator: 'equals',
    triggerValue: 'customization',
    steps: [
      {
        id: 'step_1',
        type: 'SEND_MESSAGE',
        name: 'Send Automated Reply',
        config: { value: 'Namaste! We would love to customize this piece for you. Would you like to consult our designer?' }
      }
    ]
  });

  useEffect(() => {
    fetchWorkflows();
    fetchCategories();
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

  // Toggle activation status
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

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingId(null);
    setWorkflowForm({
      name: '',
      description: '',
      category: categories[0]?._id || '',
      triggerField: 'intent',
      triggerOperator: 'equals',
      triggerValue: 'customization',
      steps: [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send Automated Reply',
          config: { value: 'Namaste! We would love to customize this piece for you. Would you like to consult our designer?' }
        }
      ]
    });
    setOpenDialog(true);
  };

  // Open Edit Dialog & populate visual builder steps
  const handleOpenEdit = (workflow) => {
    setEditingId(workflow._id);
    const cond = workflow.trigger?.conditions?.[0] || {};
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description || '',
      category: workflow.category || '',
      triggerField: cond.field || 'intent',
      triggerOperator: cond.operator || 'equals',
      triggerValue: cond.value || '',
      steps: workflow.steps && workflow.steps.length > 0 ? workflow.steps : [
        {
          id: 'step_1',
          type: 'SEND_MESSAGE',
          name: 'Send Automated Reply',
          config: { value: '' }
        }
      ]
    });
    setOpenDialog(true);
  };

  // Delete Workflow
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

  // Save Workflow (Create or Update)
  const handleSaveWorkflow = async () => {
    if (!workflowForm.name.trim()) {
      setSnackbar({ open: true, message: 'Workflow name is required', severity: 'warning' });
      return;
    }

    const payload = {
      name: workflowForm.name,
      description: workflowForm.description,
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
          value: step.config.value
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

  // Create Category
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
      setCategoryForm({ name: '', description: '', color: '#2196F3', icon: 'folder' });
      setOpenCategoryDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create category', severity: 'error' });
      console.error('Failed to create category:', error);
    }
  };

  // Add Step to visual chain
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

  // Edit Step in state
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

  // Remove Step from visual chain
  const handleRemoveStep = (index) => {
    if (workflowForm.steps.length === 1) {
      setSnackbar({ open: true, message: 'A workflow must have at least one execution step.', severity: 'warning' });
      return;
    }
    const updated = workflowForm.steps.filter((_, i) => i !== index);
    setWorkflowForm(prev => ({ ...prev, steps: updated }));
  };

  // Visual drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...workflowForm.steps];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    setWorkflowForm(prev => ({ ...prev, steps: reordered }));
    setDraggedIndex(null);
  };

  const getTriggerIcon = (triggerType) => {
    const icons = {
      EVENT: '⚡',
      SCHEDULED: '⏰',
      MANUAL: '👆',
      WEBHOOK: '🔗'
    };
    return icons[triggerType] || '🔄';
  };

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? 'success' : 'default';
  };

  const filteredWorkflows = selectedCategory
    ? workflows.filter(w => w.category === selectedCategory)
    : workflows;

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }} gutterBottom>
            Automation Workflows
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Design triggered marketing, tags, and escalation steps visually
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => setOpenCategoryDialog(true)}
          >
            New Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disableElevation
          >
            Create Workflow
          </Button>
        </Stack>
      </Box>

      {/* Category Filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Filter by Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">All Workflows</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''} configured
          </Typography>
        </Stack>
      </Paper>

      {/* Workflows Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredWorkflows.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            No workflows yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Build your first rule to automatically respond or route leads.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disableElevation
          >
            Create Workflow
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredWorkflows.map((workflow) => {
            const category = categories.find(c => c._id === workflow.category);
            return (
              <Grid item xs={12} md={6} lg={4} key={workflow._id}>
                <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e8eef7' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
                          {workflow.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {workflow.description || 'No description provided.'}
                        </Typography>
                      </Box>
                      <Chip
                        label={workflow.status}
                        size="small"
                        color={getStatusColor(workflow.status)}
                      />
                    </Stack>

                    {category && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          icon={<FolderIcon fontSize="small" />}
                          label={category.name}
                          size="small"
                          sx={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                            border: `1px solid ${category.color}40`,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Trigger Event:
                        </Typography>
                        <Chip
                          icon={<Typography sx={{ fontSize: '0.9rem' }}>{getTriggerIcon(workflow.trigger?.type)}</Typography>}
                          label={workflow.trigger?.type || 'EVENT'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Execution Path:
                        </Typography>
                        <Chip label={`${workflow.steps?.length || 0} visual steps`} size="small" />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" color="text.secondary">
                          {workflow.stats?.successfulExecutions || 0} runs executed
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ px: 2, py: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={workflow.status === 'ACTIVE'}
                          onChange={() => handleToggleStatus(workflow)}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{workflow.status === 'ACTIVE' ? 'Active' : 'Paused'}</Typography>}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(workflow)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(workflow._id, workflow.name)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Visual Workflow Canvas Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth fullScreen>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafbfe', borderBottom: '1px solid #e8eef7', p: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {editingId ? 'Edit Automation Workflow' : 'Visual Workflow Builder Canvas'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag cards to re-order steps. Click nodes to edit logic.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveWorkflow}
              disableElevation
            >
              Save Workflow Rule
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: '#f4f6fa' }}>
          <Grid container spacing={4} sx={{ height: '100%' }}>
            {/* Left/Center Pane: The Visual Node Canvas */}
            <Grid item xs={12} md={7} lg={8} sx={{ height: '100%', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                
                {/* Trigger Condition block */}
                <Card sx={{ width: '90%', mb: 1, border: '2px solid #1976d2', background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)', boxShadow: '0 4px 14px rgba(25,118,210,0.1)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                      <Typography sx={{ fontSize: '1.4rem' }}>⚡</Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        TRIGGER NODE: Message Received
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      This workflow activates automatically when a new WhatsApp/Instagram message matches the conditions below:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>When</InputLabel>
                          <Select
                            value={workflowForm.triggerField}
                            label="When"
                            onChange={(e) => setWorkflowForm({ ...workflowForm, triggerField: e.target.value })}
                          >
                            <MenuItem value="intent">Customer Intent</MenuItem>
                            <MenuItem value="sentiment">Message Sentiment</MenuItem>
                            <MenuItem value="budget">Estimated Budget</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Condition</InputLabel>
                          <Select
                            value={workflowForm.triggerOperator}
                            label="Condition"
                            onChange={(e) => setWorkflowForm({ ...workflowForm, triggerOperator: e.target.value })}
                          >
                            <MenuItem value="equals">Equals</MenuItem>
                            <MenuItem value="greater_than">Is Greater Than</MenuItem>
                            <MenuItem value="contains">Contains</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Value"
                          fullWidth
                          size="small"
                          value={workflowForm.triggerValue}
                          onChange={(e) => setWorkflowForm({ ...workflowForm, triggerValue: e.target.value })}
                          placeholder="e.g. customization"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Arrow Connector SVG */}
                <Box sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#90caf9" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                </Box>

                {/* Dynamic Step Nodes (Drag and Drop List) */}
                {workflowForm.steps.map((step, index) => (
                  <Box key={step.id || index} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Card
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      sx={{
                        width: '90%',
                        border: '1px solid #e8eef7',
                        cursor: 'grab',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'success.main', boxShadow: '0 6px 20px rgba(76,175,80,0.1)' }
                      }}
                    >
                      <CardContent sx={{ p: 3, position: 'relative' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <DragIndicatorIcon color="action" sx={{ cursor: 'grab' }} />
                          <Avatar sx={{ bgcolor: step.type === 'SEND_MESSAGE' ? 'success.main' : step.type === 'TAG' ? 'warning.main' : 'error.main', width: 36, height: 36 }}>
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {step.name}
                              </Typography>
                              <Chip label={step.type} size="small" color={step.type === 'SEND_MESSAGE' ? 'success' : step.type === 'TAG' ? 'warning' : 'error'} sx={{ fontSize: '0.65rem' }} />
                            </Stack>
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                              <Grid item xs={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Step Action</InputLabel>
                                  <Select
                                    value={step.type}
                                    label="Step Action"
                                    onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                                  >
                                    <MenuItem value="SEND_MESSAGE">Send Automated Reply</MenuItem>
                                    <MenuItem value="TAG">Tag Customer Profile</MenuItem>
                                    <MenuItem value="AI_ACTION">AI Escalation Action</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={8}>
                                <TextField
                                  label={step.type === 'SEND_MESSAGE' ? 'Reply Message Content' : step.type === 'TAG' ? 'Tag Label to apply' : 'Escalation Instruction'}
                                  fullWidth
                                  size="small"
                                  value={step.config.value}
                                  onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                  placeholder={step.type === 'SEND_MESSAGE' ? 'e.g. Namaste! Glad to have you...' : step.type === 'TAG' ? 'e.g. VIP' : 'e.g. Escalate and notify manager'}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                          <IconButton color="error" onClick={() => handleRemoveStep(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Arrow connector after this step (unless it is the last step) */}
                    {index < workflowForm.steps.length - 1 && (
                      <Box sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#90caf9" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                      </Box>
                    )}
                  </Box>
                ))}

                {/* Add Step Button Node */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%' }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddStep}
                    sx={{ borderStyle: 'dashed', borderWidth: 2, py: 1.5, px: 4, width: '100%', borderRadius: 3 }}
                  >
                    Insert New Execution Step Node
                  </Button>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" color="text.secondary">
                      Workflow execution moves sequentially from top to bottom
                    </Typography>
                  </Box>
                </Box>

              </Box>
            </Grid>

            {/* Right Pane: Settings & Context Panel */}
            <Grid item xs={12} md={5} lg={4}>
              <Card elevation={0} sx={{ height: '100%', p: 3, border: '1px solid #e8eef7' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Workflow Context settings
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Global metadata and category labels for indexing
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Workflow Name *"
                    fullWidth
                    value={workflowForm.name}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                    placeholder="e.g. Custom Bridal Escalation"
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={workflowForm.description}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                    placeholder="e.g. Automatically tag customers requesting bridal sets and escalate..."
                  />

                  <FormControl fullWidth>
                    <InputLabel>Category Folder</InputLabel>
                    <Select
                      value={workflowForm.category}
                      label="Category Folder"
                      onChange={(e) => setWorkflowForm({ ...workflowForm, category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider />

                  <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                    <strong>Tip:</strong> You can drag the indicators (<DragIndicatorIcon fontSize="inherit" />) on the execution steps left cards to reorder the automation execution flow.
                  </Alert>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Category Folder</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Category Name *"
              fullWidth
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g., Welcome Series, Promotional, Support"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Describe this category..."
            />
            <FormControl fullWidth>
              <InputLabel>Folder Visual Tag Color</InputLabel>
              <Select
                value={categoryForm.color}
                label="Folder Visual Tag Color"
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              >
                <MenuItem value="#2196F3">Blue</MenuItem>
                <MenuItem value="#4CAF50">Green</MenuItem>
                <MenuItem value="#FF9800">Orange</MenuItem>
                <MenuItem value="#F44336">Red</MenuItem>
                <MenuItem value="#9C27B0">Purple</MenuItem>
                <MenuItem value="#00BCD4">Cyan</MenuItem>
                <MenuItem value="#FFC107">Amber</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleCreateCategory}>
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Workflow?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the workflow "{deleteConfirm.workflowName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
          <Button variant="contained" color="error" disableElevation onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
