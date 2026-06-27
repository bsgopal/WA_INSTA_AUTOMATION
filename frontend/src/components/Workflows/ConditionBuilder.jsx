import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaunchIcon from '@mui/icons-material/Launch';
import ConditionCard from './ConditionCard';
import { getResponseRules, getResponseRuleListItems } from '../../api/workflowApi';

/**
 * Left Panel: Condition Builder
 * Allows user to:
 * - Select LIST Response Rule
 * - Add conditions for each item
 * - View and manage conditions
 */
const ConditionBuilder = ({
  workflow,
  onConditionsChange,
  selectedConditionId,
  onSelectCondition,
  onSelectResponse,
  initialRuleId,
}) => {
  const [responseRules, setResponseRules] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState(initialRuleId || workflow.trigger?.responseRuleId || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConditionItemId, setNewConditionItemId] = useState('');

  // Fetch response rules on mount
  useEffect(() => {
    fetchResponseRules();
  }, []);

  // Auto-select rule if initialRuleId provided
  useEffect(() => {
    if (initialRuleId && !workflow.trigger?.responseRuleId) {
      setSelectedRule(initialRuleId);
    }
  }, [initialRuleId]);

  // Sync selectedRule when workflow trigger loads asynchronously
  useEffect(() => {
    if (workflow.trigger?.responseRuleId && selectedRule !== workflow.trigger.responseRuleId) {
      setSelectedRule(workflow.trigger.responseRuleId);
    }
  }, [workflow.trigger?.responseRuleId, selectedRule]);

  // Fetch LIST items when rule changes
  useEffect(() => {
    if (selectedRule) {
      fetchListItems(selectedRule);
    }
  }, [selectedRule]);

  const fetchResponseRules = async () => {
    try {
      setLoading(true);
      const rules = await getResponseRules();
      // Filter for rules containing interactive trigger blocks (LIST, BUTTONS, CARD with buttons)
      const interactiveRules = rules.filter((rule) => 
        rule.messageBlocks?.some((block) => 
          block.type === 'LIST' || 
          block.type === 'BUTTONS' || 
          (block.type === 'CARD' && block.config?.buttons?.length > 0)
        )
      );
      setResponseRules(interactiveRules);
    } catch (error) {
      console.error('Failed to fetch response rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListItems = async (ruleId) => {
    try {
      setLoading(true);
      const items = await getResponseRuleListItems(ruleId);
      setListItems(items.sections?.[0]?.rows || []);
    } catch (error) {
      console.error('Failed to fetch LIST items:', error);
      setListItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleChange = (e) => {
    const ruleId = e.target.value;
    setSelectedRule(ruleId);

    // Update workflow trigger
    const selected = responseRules.find((r) => r._id === ruleId);
    onConditionsChange({
      ...workflow,
      trigger: {
        ...workflow.trigger,
        responseRuleId: ruleId,
        responseRuleName: selected?.name || '',
      },
    });
  };

  const handleAddCondition = () => {
    if (!newConditionItemId) return;

    const selectedItem = listItems.find((item) => item.id === newConditionItemId);
    if (!selectedItem) return;

    const condId = `cond_${Date.now()}`;
    const cardId = `card_${Date.now()}`;

    const newCondition = {
      id: condId,
      field: 'selectedItemId',
      operator: 'equals',
      value: selectedItem.id,
      responseCardId: cardId,
      itemTitle: selectedItem.title,
    };

    const newCard = {
      id: cardId,
      title: `Response for ${selectedItem.title}`,
      type: 'SEND_MESSAGE',
      config: { message: '' },
    };

    const updatedWorkflow = {
      ...workflow,
      conditions: [...(workflow.conditions || []), newCondition],
      responseCards: [...(workflow.responseCards || []), newCard]
    };

    onConditionsChange(updatedWorkflow);
    onSelectCondition(condId);
    if (onSelectResponse) {
      onSelectResponse(cardId);
    }
    setNewConditionItemId('');
    setShowAddForm(false);
  };

  const handleDeleteCondition = (conditionId) => {
    const updatedWorkflow = {
      ...workflow,
      conditions: workflow.conditions?.filter((c) => c.id !== conditionId) || [],
    };
    onConditionsChange(updatedWorkflow);
  };

  const handleAddDefault = () => {
    const defaultCard = {
      id: 'default',
      title: 'Default Response',
      type: 'SEND_MESSAGE',
      config: { message: '' },
    };

    const updatedWorkflow = {
      ...workflow,
      defaultCard,
    };
    onConditionsChange(updatedWorkflow);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Rule Selection */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ pb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            1. Select LIST Response Rule
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Response Rule</InputLabel>
              <Select
                value={selectedRule}
                label="Response Rule"
                onChange={handleRuleChange}
                disabled={loading || (!!workflow._id && !!workflow.trigger?.responseRuleId)}
              >
                <MenuItem value="">-- Select a rule --</MenuItem>
                {responseRules.map((rule) => (
                  <MenuItem key={rule._id} value={rule._id}>
                    {rule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!(workflow._id && workflow.trigger?.responseRuleId) && (
              <Tooltip title="Refresh Rules">
                <IconButton size="small" onClick={fetchResponseRules} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          {!(workflow._id && workflow.trigger?.responseRuleId) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1, mb: 0.5 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<LaunchIcon style={{ fontSize: 14 }} />}
                onClick={() => window.open('/response-rules', '_blank')}
                sx={{ fontSize: '0.72rem', p: 0, textTransform: 'none', color: '#1976d2', minWidth: 0, '&:hover': { background: 'none', textDecoration: 'underline' } }}
              >
                Create New List Rule
              </Button>
            </Box>
          )}
          {workflow._id && workflow.trigger?.responseRuleId && (
            <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
              🔒 Trigger Response Rule is locked for editing to preserve flowchart connections.
            </Typography>
          )}
          {!selectedRule && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Select a LIST Response Rule to start building conditions
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Conditions List */}
      {selectedRule && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1.5}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  2. Add Conditions
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {workflow.conditions?.length || 0} conditions
                </Typography>
              </Stack>

              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {/* Existing conditions */}
                {workflow.conditions?.map((condition) => (
                  <ConditionCard
                    key={condition.id}
                    condition={condition}
                    isSelected={selectedConditionId === condition.id}
                    onClick={() => onSelectCondition(condition.id)}
                    onEdit={() => onSelectCondition(condition.id)}
                    onDelete={handleDeleteCondition}
                  />
                ))}

                {/* Add new condition form */}
                {showAddForm && listItems.length > 0 && (
                  <Card sx={{ border: '2px dashed #2196F3', backgroundColor: '#F5F5F5' }}>
                    <CardContent sx={{ pb: 1.5 }}>
                      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Select LIST Item</InputLabel>
                        <Select
                          value={newConditionItemId}
                          label="Select LIST Item"
                          onChange={(e) => setNewConditionItemId(e.target.value)}
                        >
                          <MenuItem value="">-- Choose item --</MenuItem>
                          {listItems.map((item) => {
                            // Check if condition already exists for this item
                            const exists = workflow.conditions?.some(
                              (c) => c.value === item.id
                            );
                            return (
                              <MenuItem
                                key={item.id}
                                value={item.id}
                                disabled={exists}
                              >
                                {item.title}
                                {exists ? ' (already added)' : ''}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleAddCondition}
                          disabled={!newConditionItemId}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Add button */}
                {!showAddForm && listItems.length > 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddForm(true)}
                    sx={{ borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    Add Condition
                  </Button>
                )}
              </Stack>

              {listItems.length === 0 && selectedRule && (
                <Alert severity="warning">No items available in this LIST rule</Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Default Response Option */}
      {selectedRule && !workflow.defaultCard && (
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', backgroundColor: '#F5F5F5' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Catch-All Response
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              Add a default response for when no conditions match
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleAddDefault}
            >
              Add Default Response
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ConditionBuilder;
