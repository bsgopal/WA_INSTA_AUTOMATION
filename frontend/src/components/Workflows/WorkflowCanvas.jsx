import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import ConditionCard from './ConditionCard';
import ResponseCard from './ResponseCard';

/**
 * Center Canvas: Visual workflow display
 * Shows conditions and responses connected visually
 */
const WorkflowCanvas = ({
  workflow,
  selectedConditionId,
  selectedResponseId,
  onSelectCondition,
  onSelectResponse,
  onDeleteCondition,
  onDeleteResponse,
}) => {
  const hasConditions = workflow.conditions && workflow.conditions.length > 0;
  const hasResponses = workflow.responseCards && workflow.responseCards.length > 0;

  if (!workflow.trigger?.responseRuleId) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: 'center',
          backgroundColor: '#F9FAFB',
          border: '2px dashed #e0e0e0',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: '#999', fontWeight: 600 }}>
          Select a LIST Response Rule to Begin
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
          Configure your trigger in the left panel
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F9FAFB',
        borderRadius: 2,
        p: 3,
        overflow: 'auto',
      }}
    >
      {/* Header: Rule Info */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Box sx={{ fontSize: '1.5rem' }}>🔄</Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {workflow.trigger?.responseRuleName || 'LIST Response Rule'}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#666' }}>
            When customer selects an item from this LIST, the workflow will route to the appropriate response
          </Typography>
        </CardContent>
      </Card>

      {/* Two-column layout: Conditions | Responses */}
      <Box sx={{ display: 'flex', gap: 3, flex: 1 }}>
        {/* Left: Conditions */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 2, color: '#333' }}
          >
            CONDITIONS
            <Chip
              label={workflow.conditions?.length || 0}
              size="small"
              sx={{ ml: 1, fontWeight: 700 }}
            />
          </Typography>

          <Stack spacing={1.5} sx={{ flex: 1 }}>
            {hasConditions ? (
              workflow.conditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  isSelected={selectedConditionId === condition.id}
                  onClick={() => onSelectCondition(condition.id)}
                  onEdit={() => onSelectCondition(condition.id)}
                  onDelete={onDeleteCondition}
                />
              ))
            ) : (
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  border: '1px dashed #ddd',
                }}
              >
                <Typography variant="body2" sx={{ color: '#999' }}>
                  No conditions added yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Add conditions from the left panel
                </Typography>
              </Paper>
            )}
          </Stack>
        </Box>

        {/* Divider Arrow */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            gap: 1,
          }}
        >
          <Box sx={{ color: '#0084FF', fontSize: '1.5rem' }}>→</Box>
        </Box>

        {/* Right: Responses */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 2, color: '#333' }}
          >
            RESPONSES
            <Chip
              label={workflow.responseCards?.length || 0}
              size="small"
              sx={{ ml: 1, fontWeight: 700 }}
            />
          </Typography>

          <Stack spacing={1.5} sx={{ flex: 1 }}>
            {hasResponses ? (
              <>
                {workflow.responseCards.map((card) => (
                  <ResponseCard
                    key={card.id}
                    card={card}
                    isSelected={selectedResponseId === card.id}
                    onClick={() => onSelectResponse(card.id)}
                    onEdit={() => onSelectResponse(card.id)}
                    onDelete={onDeleteResponse}
                  />
                ))}

                {/* Default response */}
                {workflow.defaultCard && (
                  <ResponseCard
                    card={workflow.defaultCard}
                    isDefault
                    isSelected={selectedResponseId === 'default'}
                    onClick={() => onSelectResponse('default')}
                    onEdit={() => onSelectResponse('default')}
                    onDelete={() => {}} // Default can't be deleted
                  />
                )}
              </>
            ) : (
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  border: '1px dashed #ddd',
                }}
              >
                <Typography variant="body2" sx={{ color: '#999' }}>
                  No responses added yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Configure responses in the right panel
                </Typography>
              </Paper>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkflowCanvas;
