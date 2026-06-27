import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { testWorkflow, getResponseRuleListItems } from '../../api/workflowApi';

/**
 * Test Modal: Allows users to test workflow with different LIST selections
 */
const WorkflowTestModal = ({ open, onClose, workflowId, workflow }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  // Load list items when modal opens
  useEffect(() => {
    if (open && workflow?.trigger?.responseRuleId) {
      loadListItems();
    }
  }, [open, workflow]);

  const loadListItems = async () => {
    try {
      setLoading(true);
      const items = await getResponseRuleListItems(workflow.trigger.responseRuleId);
      setListItems(items.sections?.[0]?.rows || []);
    } catch (err) {
      console.error('Failed to load list items:', err);
      setError('Failed to load list items');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!selectedItemId) {
      setError('Please select an item to test');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTestResult(null);

      const selectedItem = listItems.find((item) => item.id === selectedItemId);

      const result = await testWorkflow(workflowId, {
        selectedItemId: selectedItem.id,
        selectedItemTitle: selectedItem.title,
      });

      setTestResult(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Test failed');
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedItemId('');
    setTestResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
        Test Workflow
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Test Configuration */}
          {!testResult && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Select a LIST Item to Test
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                Choose which list item the customer would select, and the workflow will simulate execution
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={selectedItemId}
                  label="Select Item"
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  disabled={loading || testResult}
                >
                  <MenuItem value="">-- Choose an item --</MenuItem>
                  {listItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.title} {item.description && `- ${item.description}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Test Results */}
          {testResult && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {testResult.success ? (
                  <>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      Test Passed
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorIcon sx={{ color: 'error.main', fontSize: '1.5rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                      Test Failed
                    </Typography>
                  </>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Selected Item */}
              {testResult.selectedItem && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Selected Item:
                  </Typography>
                  <Chip
                    label={testResult.selectedItem.title}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              )}

              {/* Execution Trace */}
              {testResult.executionTrace && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Execution Trace:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                    {testResult.executionTrace.map((step, idx) => (
                      <Box key={idx} sx={{ mb: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Step {idx + 1}: {step.stepName || step.type}
                        </Typography>
                        {step.status && (
                          <Chip
                            size="small"
                            label={step.status}
                            color={step.status === 'success' ? 'success' : 'error'}
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    ))}
                  </Paper>
                </Box>
              )}

              {/* Message to Be Sent */}
              {testResult.messageToBeSent && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Message That Would Be Sent:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testResult.messageToBeSent}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Branch Info */}
              {testResult.branchTaken && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Branch Executed:
                  </Typography>
                  <Chip
                    label={testResult.branchTaken}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Button onClick={handleClose}>Close</Button>
        {!testResult && (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleTest}
            disabled={loading || !selectedItemId}
            disableElevation
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : 'Run Test'}
          </Button>
        )}
        {testResult && (
          <Button
            variant="contained"
            onClick={() => setTestResult(null)}
            disableElevation
          >
            Run Another Test
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowTestModal;
