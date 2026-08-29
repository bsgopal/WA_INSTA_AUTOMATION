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
import SapDmProcessDesigner from '../../components/SAPDM/SapDmProcessDesigner';
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
    <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', p: 1, bgcolor: '#0F172A' }}>
      <SapDmProcessDesigner
        isWorkflow={true}
        initialData={{
          name: workflow.name || 'Conditional Workflow',
          status: workflow.status || 'ACTIVE',
          nodes: workflow.conditions && workflow.conditions.length > 0 ? [
            {
              id: 'node_trigger',
              type: 'LIST_SELECT',
              category: 'triggers',
              label: workflow.trigger?.responseRuleName || 'List Selection Trigger',
              config: { ruleId: workflow.trigger?.responseRuleId },
              position: { x: 80, y: 120 }
            },
            ...workflow.conditions.map((cond, i) => ({
              id: cond.id || `cond_${i}`,
              type: 'MATCH_CONDITION',
              category: 'logic',
              label: `Condition: ${cond.label || cond.value || 'Match'}`,
              config: { ...cond },
              position: { x: 400 + i * 320, y: 120 }
            }))
          ] : undefined
        }}
        onSave={async (dmData) => {
          setWorkflow(prev => ({
            ...prev,
            name: dmData.name,
            status: dmData.status
          }));
          await handleSave();
        }}
        onClose={() => navigate('/workflows')}
      />

      {/* Test Modal */}
      <WorkflowTestModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        workflowId={id}
        workflow={workflow}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConditionalWorkflowBuilder;
