import React, { useState } from 'react';
import {
  Stack,
  TextField,
  Typography,
  Grid,
  Box,
  Paper,
  CircularProgress,
  IconButton,
  Button
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../../../../api/client';

/**
 * Combined Message Content & Media Step
 * Allows selecting dynamic Text vs Image campaigns and uploading media inline
 */
const MessageStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const [uploading, setUploading] = useState(false);

  const activeType = data.messageType || 'TEXT';

  const handleSelectTextMode = () => {
    onChange({
      ...data,
      messageType: 'TEXT',
      mediaType: 'none',
      mediaUrl: '',
      mediaPreviewData: '',
      mediaMimeType: '',
      mediaFileName: ''
    });
  };

  const handleSelectImageMode = () => {
    onChange({
      ...data,
      messageType: 'MEDIA',
      mediaType: 'image'
    });
  };

  const handleMediaUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/campaigns/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onChange({
        ...data,
        mediaUrl: response.data.mediaUrl,
        mediaPreviewData: response.data.mediaPreviewData,
        mediaMimeType: response.data.mediaMimeType,
        mediaFileName: response.data.mediaFileName,
        mediaType: 'image',
        messageType: 'MEDIA'
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    onChange({
      ...data,
      mediaUrl: '',
      mediaPreviewData: '',
      mediaMimeType: '',
      mediaFileName: ''
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1F2937' }}>
          Message Content & Media
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose between sending a dynamic text message or a high-impact image promotion.
        </Typography>
      </Box>

      {/* Visual Selection Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Paper
            onClick={handleSelectTextMode}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              border: activeType === 'TEXT' ? '2px solid #2563EB' : '1px solid #E5E7EB',
              borderRadius: '12px',
              bgcolor: activeType === 'TEXT' ? '#EFF6FF' : '#FFFFFF',
              boxShadow: activeType === 'TEXT' ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                borderColor: activeType === 'TEXT' ? '#2563EB' : '#9CA3AF'
              }
            }}
          >
            <Box sx={{
              p: 1,
              borderRadius: '8px',
              bgcolor: activeType === 'TEXT' ? '#3B82F6' : '#F3F4F6',
              color: activeType === 'TEXT' ? '#FFFFFF' : '#4B5563',
              display: 'flex'
            }}>
              <ChatIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: activeType === 'TEXT' ? '#1E40AF' : '#1F2937' }}>
                Text Only Campaign
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sends a dynamic text-based promotion.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper
            onClick={handleSelectImageMode}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              border: activeType === 'MEDIA' ? '2px solid #2563EB' : '1px solid #E5E7EB',
              borderRadius: '12px',
              bgcolor: activeType === 'MEDIA' ? '#EFF6FF' : '#FFFFFF',
              boxShadow: activeType === 'MEDIA' ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                borderColor: activeType === 'MEDIA' ? '#2563EB' : '#9CA3AF'
              }
            }}
          >
            <Box sx={{
              p: 1,
              borderRadius: '8px',
              bgcolor: activeType === 'MEDIA' ? '#3B82F6' : '#F3F4F6',
              color: activeType === 'MEDIA' ? '#FFFFFF' : '#4B5563',
              display: 'flex'
            }}>
              <ImageIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: activeType === 'MEDIA' ? '#1E40AF' : '#1F2937' }}>
                Image Campaign
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sends an image banner promotion.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Inputs Conditional Panel */}
      {activeType === 'TEXT' ? (
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
            Write your Message
          </Typography>
          <TextField
            label="Message Content"
            fullWidth
            required
            multiline
            rows={5}
            value={data.messageContent || ''}
            onChange={(e) => onChange({ ...data, messageContent: e.target.value })}
            error={!!errors.messageContent}
            helperText={errors.messageContent || 'Write your message. Use {{customer.firstName}} to print customer names.'}
            placeholder="Type your WhatsApp promo message..."
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', alignSelf: 'center', mr: 1, fontWeight: 600 }}>
              Insert Field:
            </Typography>
            {['customer.firstName', 'customer.lastName', 'customer.phone'].map((v) => (
              <Button
                key={v}
                size="small"
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  borderRadius: '16px',
                  fontSize: '11px',
                  py: 0.2,
                  px: 1.5,
                  color: '#4F46E5',
                  borderColor: '#E0E7FF',
                  bgcolor: '#EEF2F6',
                  '&:hover': { bgcolor: '#E0E7FF', borderColor: '#4F46E5' }
                }}
                onClick={() => {
                  const currentContent = data.messageContent || '';
                  onChange({
                    ...data,
                    messageContent: `${currentContent} {{${v}}}`
                  });
                }}
              >
                + {v.split('.')[1]}
              </Button>
            ))}
          </Box>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
            Upload Campaign Image
          </Typography>

          {!data.mediaUrl ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed #2563EB',
                borderRadius: '12px',
                bgcolor: '#EFF6FF',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': uploading ? {} : {
                  borderColor: '#1E40AF',
                  bgcolor: '#DBEAFE'
                }
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                onChange={handleMediaUpload}
                accept="image/*"
                disabled={uploading}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                {uploading ? (
                  <CircularProgress size={32} />
                ) : (
                  <CloudUploadIcon sx={{ fontSize: '48px', color: '#2563EB' }} />
                )}
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#1E40AF' }}>
                {uploading ? 'Uploading banner...' : 'Click to upload your image banner'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                Supports PNG, JPG, JPEG. Max file size: 15MB.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '12px', bgcolor: '#F9FAFB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component="img"
                  src={data.mediaPreviewData || data.mediaUrl}
                  sx={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  alt="preview"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937' }}>
                    {data.mediaFileName || 'Uploaded Banner'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, display: 'block' }}>
                    ✓ Image upload successful
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleRemoveMedia}
                  disabled={uploading}
                  sx={{ color: '#EF4444', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FCA5A5' } }}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          )}
        </Stack>
      )}

      {/* Button Links - Optional */}
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
          Call to Action Link (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Button Label (Optional)"
              fullWidth
              value={data.buttonLabel || ''}
              onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
              placeholder="e.g., Shop Now"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Button URL"
              fullWidth
              disabled={!data.buttonLabel}
              value={data.buttonUrl || ''}
              onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
              placeholder="https://yourwebsite.com/sale"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
});

MessageStep.displayName = 'MessageStep';

export default MessageStep;
