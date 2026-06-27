import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Visual card representing a condition in the workflow
 */
const ConditionCard = ({
  condition,
  isSelected = false,
  isDefault = false,
  onClick,
  onEdit,
  onDelete,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? '2px solid #2196F3' : '1px solid #e0e0e0',
        backgroundColor: isSelected ? '#E3F2FD' : '#FFFACD',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#2196F3',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backgroundColor: '#FFF8DC',
        },
        position: 'relative',
      }}
    >
      <CardContent sx={{ pb: 1.5 }}>
        {/* Header with status */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#FFC107',
                }}
              />
              Condition
            </Typography>
          </Box>
          {isDefault && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '1rem' }} />}
              label="Default"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {/* Condition details */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
          IF selected item = <strong>{condition.itemTitle || condition.value}</strong>
        </Typography>

        {condition.responseCardId && (
          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
            → Links to: Card #{condition.responseCardId}
          </Typography>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(condition);
            }}
            sx={{ color: 'primary.main' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(condition.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ConditionCard;
