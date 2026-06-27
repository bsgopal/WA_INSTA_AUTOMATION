import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import TemplateIcon from '@mui/icons-material/TextSnippet';
import WorkflowIcon from '@mui/icons-material/AccountTree';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

/**
 * Visual card representing a response/action in the workflow
 */
const ResponseCard = ({
  card,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  isDefault = false,
}) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'SEND_MESSAGE':
        return <SendIcon fontSize="small" />;
      case 'SEND_TEMPLATE':
        return <TemplateIcon fontSize="small" />;
      case 'TRIGGER_WORKFLOW':
        return <WorkflowIcon fontSize="small" />;
      case 'HUMAN_HANDOVER':
        return <SupportAgentIcon fontSize="small" />;
      default:
        return <SendIcon fontSize="small" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      SEND_MESSAGE: 'Quick Message',
      SEND_TEMPLATE: 'Template',
      TRIGGER_WORKFLOW: 'Workflow',
      HUMAN_HANDOVER: 'Handover',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'SEND_MESSAGE':
        return 'success';
      case 'SEND_TEMPLATE':
        return 'info';
      case 'TRIGGER_WORKFLOW':
        return 'warning';
      case 'HUMAN_HANDOVER':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? '2px solid #2196F3' : '1px solid #e0e0e0',
        backgroundColor: isSelected ? '#E3F2FD' : '#E3F2FD',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#2196F3',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ pb: 1.5 }}>
        {/* Header */}
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
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#2196F3',
                }}
              />
              {card.title || 'Untitled Response'}
            </Typography>
            <Chip
              icon={getTypeIcon(card.type)}
              label={getTypeLabel(card.type)}
              size="small"
              color={getTypeColor(card.type)}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Box>
          {isDefault && (
            <Box sx={{ ml: 1 }}>
              <Chip
                label="Default"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            </Box>
          )}
        </Stack>

        {/* Preview message */}
        {card.config?.message && (
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              color: '#666',
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}
          >
            "{card.config.message}"
          </Typography>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(card);
            }}
            sx={{ color: 'primary.main' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(card.id);
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

export default ResponseCard;
