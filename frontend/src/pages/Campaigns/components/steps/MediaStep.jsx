import React, { useState } from 'react';
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../../../../api/client';

/**
 * MediaStep Component
 * Step 4 of the campaign creation wizard
 * Allows optional upload of media (image/video/PDF)
 */
const MediaStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const mediaTypes = [
    { value: 'none', label: 'No Media' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'document', label: 'Document (PDF)' }
  ];

  const getFileAccept = () => {
    if (data.mediaType === 'image') return 'image/*';
    if (data.mediaType === 'video') return 'video/*';
    if (data.mediaType === 'document') return '.pdf';
    return '';
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
        mediaType: response.data.mediaType
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

  const getMediaIcon = () => {
    if (data.mediaType === 'image') return <ImageIcon sx={{ fontSize: '40px', color: '#3B82F6' }} />;
    if (data.mediaType === 'video') return <VideoLibraryIcon sx={{ fontSize: '40px', color: '#3B82F6' }} />;
    if (data.mediaType === 'document') return <DescriptionIcon sx={{ fontSize: '40px', color: '#3B82F6' }} />;
    return <CloudUploadIcon sx={{ fontSize: '40px', color: '#6B7280' }} />;
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Optionally attach media (image, video, or PDF) to your campaign.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Media Type</InputLabel>
        <Select
          label="Media Type"
          value={data.mediaType || 'none'}
          onChange={(e) => onChange({ ...data, mediaType: e.target.value })}
          disabled={uploading}
        >
          {mediaTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {data.mediaType !== 'none' && (
        <>
          {/* Upload Area */}
          {!data.mediaUrl ? (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed #3B82F6',
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
                accept={getFileAccept()}
                disabled={uploading}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                {uploading ? (
                  <CircularProgress size={32} />
                ) : (
                  getMediaIcon()
                )}
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                Max file size: 15MB
              </Typography>
            </Paper>
          ) : (
            /* Preview Area */
            <>
              <Paper sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '8px', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => setPreviewOpen(true)}>
                    {data.mediaPreviewData && data.mediaType === 'image' && (
                      <Box
                        component="img"
                        src={data.mediaPreviewData}
                        sx={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                        alt="preview"
                      />
                    )}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {data.mediaFileName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {data.mediaType === 'image' ? 'Image' : data.mediaType === 'video' ? 'Video' : 'PDF Document'}
                      </Typography>
                    </Box>
                  </Box>

                  <Tooltip title="Remove media">
                    <IconButton
                      size="small"
                      onClick={handleRemoveMedia}
                      disabled={uploading}
                      sx={{ color: '#EF4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              {/* Replace button */}
              <Button
                component="label"
                variant="outlined"
                startIcon={uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                fullWidth
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Replace Media'}
                <input
                  type="file"
                  hidden
                  onChange={handleMediaUpload}
                  accept={getFileAccept()}
                  disabled={uploading}
                />
              </Button>
            </>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Media Preview
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {data.mediaType === 'image' && data.mediaPreviewData && (
            <Box
              component="img"
              src={data.mediaPreviewData}
              sx={{ width: '100%', borderRadius: '8px' }}
              alt="preview"
            />
          )}
          {data.mediaType === 'video' && (
            <Box
              component="video"
              controls
              src={data.mediaPreviewData}
              sx={{ width: '100%', borderRadius: '8px' }}
            />
          )}
          {data.mediaType === 'document' && (
            <Alert severity="info">
              PDF document uploaded: {data.mediaFileName}
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
});

MediaStep.displayName = 'MediaStep';

export default MediaStep;
