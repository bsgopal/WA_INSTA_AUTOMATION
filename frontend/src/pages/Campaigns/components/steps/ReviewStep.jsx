import React from 'react';
import {
  Stack,
  Typography,
  Paper,
  Box,
  Grid,
  Chip,
  Divider,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

/**
 * ReviewStep Component
 * Step 6 of the campaign creation wizard
 * Final review before campaign launch
 */
const ReviewStep = React.memo(({
  data = {},
  estimatedReach = 0
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const campaignTypeLabel = {
    'ONE_TIME': 'One-Time Campaign',
    'RECURRING': 'Recurring Campaign',
    'AUTOMATED': 'Automated Campaign',
    'TRIGGERED': 'Triggered Campaign'
  };

  const messageTypeLabel = {
    'TEXT': 'Text Message',
    'MEDIA': 'Media Message',
    'TEMPLATE': 'WhatsApp Template',
    'QUICK_REPLY': 'Quick Reply Message'
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ mb: 1 }}>
        Please review your campaign details before launching. You can go back to edit any section.
      </Alert>

      {/* Campaign Overview Card */}
      <Paper sx={{ p: 2.5, bgcolor: '#F3F4F6', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <CheckCircleIcon sx={{ color: '#10B981', fontSize: '28px', mt: 0.5, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
              {data.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
              {data.topic}
            </Typography>
            {data.description && (
              <Typography variant="caption" sx={{ color: '#4B5563', display: 'block', mb: 1 }}>
                {data.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Campaign Details Grid */}
      <Grid container spacing={2}>
        {/* Campaign Type */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 1, display: 'block' }}>
                CAMPAIGN TYPE
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                {campaignTypeLabel[data.type] || data.type}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Type */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', mb: 1, display: 'block' }}>
                MESSAGE TYPE
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                {messageTypeLabel[data.messageType] || data.messageType || 'Text'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Target Audience */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleAltIcon sx={{ color: '#6B7280', fontSize: '16px' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280' }}>
                  TARGET SEGMENT
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                {data.targetSegment || 'All Customers'}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleAltIcon sx={{ color: '#3B82F6', fontSize: '18px' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                  {estimatedReach.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  customers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon sx={{ color: '#6B7280', fontSize: '16px' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280' }}>
                  SCHEDULED FOR
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                {data.scheduledAt ? formatDate(data.scheduledAt) : 'Send Immediately'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      {/* Message Preview */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
          Message Preview
        </Typography>
        <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: '#1F2937', mb: 1, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {data.messageContent || 'No message content'}
          </Typography>
          {data.buttonLabel && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{
                display: 'inline-block',
                px: 3,
                py: 1,
                bgcolor: '#3B82F6',
                color: '#FFFFFF',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {data.buttonLabel}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Languages */}
      {(data.selectedLanguages || []).length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
            Languages
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {data.selectedLanguages.map((lang) => (
              <Chip
                key={lang}
                label={lang.toUpperCase()}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Media */}
      {data.mediaUrl && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
            Media Attachment
          </Typography>
          <Paper sx={{ p: 2, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AttachFileIcon sx={{ color: '#6B7280' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                  {data.mediaFileName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {data.mediaType === 'image' ? 'Image' : data.mediaType === 'video' ? 'Video' : 'PDF Document'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Final Confirmation */}
      <Alert severity="success" sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          ✓ Campaign is ready to launch!
        </Typography>
        <Typography variant="caption" sx={{ color: 'inherit', display: 'block' }}>
          Click "Launch Campaign" to send to {estimatedReach.toLocaleString()} customers.
        </Typography>
      </Alert>
    </Stack>
  );
});

ReviewStep.displayName = 'ReviewStep';

export default ReviewStep;
