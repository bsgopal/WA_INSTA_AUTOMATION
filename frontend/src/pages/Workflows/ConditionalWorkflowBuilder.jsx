import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';

import ConditionBuilder from '../../components/Workflows/ConditionBuilder';
import WorkflowCanvas from '../../components/Workflows/WorkflowCanvas';
import QuickMessageConfig from '../../components/Workflows/QuickMessageConfig';
import WorkflowTestModal from '../../components/Workflows/WorkflowTestModal';
import {
  createConditionalWorkflow,
  updateWorkflow,
  getWorkflow,
} from '../../api/workflowApi';

/**
 * Main Workflow Builder Page
 * 3-panel layout:
 * - Left: Condition Builder
 * - Center: Visual Canvas
 * - Right: Message Configuration
 */
const ConditionalWorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get ruleId from URL parameter if navigating from ResponseRules
  const ruleIdParam = searchParams.get('ruleId');

  // State
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'RESPONSE_RULE_SELECTION',
      responseRuleId: ruleIdParam || '',
      responseRuleName: '',
    },
    conditions: [],
    responseCards: [],
    defaultCard: null,
  });

  const [selectedConditionId, setSelectedConditionId] = useState(null);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load workflow if editing
  useEffect(() => {
    if (id) {
      loadWorkflow();
    }
  }, [id]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await getWorkflow(id);
      setWorkflow(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load workflow',
        severity: 'error',
      });
      console.error('Failed to load workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!workflow.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Workflow name is required',
        severity: 'warning',
      });
      return;
    }

    if (!workflow.trigger?.responseRuleId) {
      setSnackbar({
        open: true,
        message: 'Select a LIST Response Rule',
        severity: 'warning',
      });
      return;
    }

    if (workflow.conditions.length === 0 && !workflow.defaultCard) {
      setSnackbar({
        open: true,
        message: 'Add at least one condition or a default response',
        severity: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...workflow,
        status: workflow.status || 'DRAFT',
      };

      if (id) {
        await updateWorkflow(id, payload);
        setSnackbar({
          open: true,
          message: 'Workflow saved successfully',
          severity: 'success',
        });
      } else {
        const created = await createConditionalWorkflow(payload);
        setSnackbar({
          open: true,
          message: 'Workflow created successfully',
          severity: 'success',
        });
        // Redirect to edit page
        navigate(`/workflows/${created._id}`);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save workflow',
        severity: 'error',
      });
      console.error('Failed to save workflow:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      setSaving(true);
      const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const payload = {
        ...workflow,
        status: newStatus,
      };
      
      if (id) {
        await updateWorkflow(id, payload);
        setWorkflow({ ...workflow, status: newStatus });
        setSnackbar({
          open: true,
          message: `Workflow ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully!`,
          severity: 'success',
        });
      } else {
        // New workflow must be saved first
        const created = await createConditionalWorkflow(payload);
        setSnackbar({
          open: true,
          message: 'Workflow created and activated successfully!',
          severity: 'success',
        });
        navigate(`/workflows/${created._id}`);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update workflow status',
        severity: 'error',
      });
      console.error('Failed to update workflow status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddResponseCard = () => {
    if (!selectedConditionId) {
      setSnackbar({
        open: true,
        message: 'Select a condition first',
        severity: 'warning',
      });
      return;
    }

    const newCard = {
      id: `card_${Date.now()}`,
      title: 'New Response',
      type: 'SEND_MESSAGE',
      config: { message: '' },
    };

    const updated = {
      ...workflow,
      responseCards: [...(workflow.responseCards || []), newCard],
    };

    // Link condition to response
    const updatedConditions = workflow.conditions.map((c) =>
      c.id === selectedConditionId ? { ...c, responseCardId: newCard.id } : c
    );

    setWorkflow({ ...updated, conditions: updatedConditions });
    setSelectedResponseId(newCard.id);
  };

  const handleSaveResponseCard = (cardId, cardData) => {
    let updatedWorkflow = workflow;

    if (cardId === 'default') {
      updatedWorkflow = {
        ...workflow,
        defaultCard: {
          ...workflow.defaultCard,
          ...cardData,
        },
      };
    } else {
      updatedWorkflow = {
        ...workflow,
        responseCards: workflow.responseCards?.map((c) =>
          c.id === cardId ? { ...c, ...cardData } : c
        ),
      };
    }

    setWorkflow(updatedWorkflow);
    setSnackbar({
      open: true,
      message: 'Card configuration saved',
      severity: 'success',
    });
  };

  const handleDeleteCondition = (conditionId) => {
    setWorkflow({
      ...workflow,
      conditions: workflow.conditions?.filter((c) => c.id !== conditionId),
    });
    setSelectedConditionId(null);
  };

  const handleDeleteResponse = (cardId) => {
    setWorkflow({
      ...workflow,
      responseCards: workflow.responseCards?.filter((c) => c.id !== cardId),
    });
    setSelectedResponseId(null);
  };

  const handleOpenJson = () => {
    setJsonValue(JSON.stringify(workflow, null, 2));
    setShowJsonDialog(true);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setWorkflow(parsed);
      setShowJsonDialog(false);
      setSnackbar({
        open: true,
        message: 'JSON imported successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Invalid JSON format',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/workflows')}
            variant="outlined"
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {id ? 'Edit Workflow' : 'Create Conditional Workflow'}
            </Typography>
            <TextField
              size="small"
              placeholder="Workflow name..."
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              variant="standard"
              sx={{ width: 300, mt: 0.5 }}
            />
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title={!id ? "Save your workflow first to enable testing" : ""}>
            <span>
              <Button
                startIcon={<PlayArrowIcon />}
                onClick={() => setTestModalOpen(true)}
                variant="outlined"
                disabled={!id || !workflow.trigger?.responseRuleId}
              >
                Test
              </Button>
            </span>
          </Tooltip>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            disableElevation
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
          {id && (
            <Button
              startIcon={<PublishIcon />}
              onClick={handleActivate}
              variant="contained"
              color={workflow.status === 'ACTIVE' ? 'warning' : 'success'}
              disabled={saving}
              disableElevation
            >
              {workflow.status === 'ACTIVE' ? 'Pause' : 'Activate'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Main Content: 3-Panel Layout */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel: Conditions (320px) */}
        <Box sx={{ width: 320, overflow: 'auto', borderRight: '1px solid #e0e0e0', p: 2, backgroundColor: '#fff' }}>
          <ConditionBuilder
            workflow={workflow}
            onConditionsChange={setWorkflow}
            selectedConditionId={selectedConditionId}
            onSelectCondition={setSelectedConditionId}
            onSelectResponse={setSelectedResponseId}
            initialRuleId={ruleIdParam}
          />
        </Box>

        {/* Center Panel: Canvas (flex) */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <WorkflowCanvas
            workflow={workflow}
            selectedConditionId={selectedConditionId}
            selectedResponseId={selectedResponseId}
            onSelectCondition={setSelectedConditionId}
            onSelectResponse={setSelectedResponseId}
            onDeleteCondition={handleDeleteCondition}
            onDeleteResponse={handleDeleteResponse}
          />

          {/* Add Response Card Button */}
          {selectedConditionId && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={handleAddResponseCard}
              >
                Add Response for Selected Condition
              </Button>
            </Box>
          )}
        </Box>

        {/* Right Panel: Message Config (380px) */}
        <Box sx={{ width: 380, overflow: 'auto', borderLeft: '1px solid #e0e0e0', p: 2, backgroundColor: '#fff' }}>
          <QuickMessageConfig
            workflow={workflow}
            selectedId={selectedResponseId}
            onSave={handleSaveResponseCard}
          />
        </Box>
      </Box>

      {/* Test Modal */}
      <WorkflowTestModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        workflowId={id}
        workflow={workflow}
      />

      {/* JSON Editor Dialog */}
      <Dialog open={showJsonDialog} onClose={() => setShowJsonDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Workflow JSON</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            placeholder="Paste or edit JSON here..."
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJsonDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveJson} disableElevation>
            Import JSON
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConditionalWorkflowBuilder;
