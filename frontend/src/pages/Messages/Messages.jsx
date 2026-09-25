import { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, TextField, InputAdornment,
  Stack, MenuItem, Select, FormControl, InputLabel, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplyIcon from '@mui/icons-material/Reply';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import apiClient from '../../api/client';
import AIProviderStatus from '../../components/AIProviderStatus';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [aiReplies, setAiReplies] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter, channelFilter, searchTerm]);

  const fetchMessages = async () => {
    try {
      const params = {
        page,
        limit: 20,
        ...(statusFilter && { status: statusFilter }),
        ...(channelFilter && { channel: channelFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await apiClient.get('/messages', { params });
      setMessages(response.data.messages);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleAIReply = async (message) => {
    try {
      setSelectedMessage(message);
      setOpenAIDialog(true);

      const response = await apiClient.post('/ai/smart-replies', {
        messageText: message.content,
        customerContext: {
          segment: message.customerId?.rfmSegment,
          language: message.customerId?.language
        }
      });

      setAiReplies(response.data.replies);
    } catch (error) {
      console.error('AI Reply failed:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SENT: 'info',
      DELIVERED: 'success',
      READ: 'primary',
      FAILED: 'error',
      PENDING: 'warning',
      QUEUED: 'warning'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : 'N/A';
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <AIProviderStatus compact />
        <IconButton onClick={fetchMessages}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search messages..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="QUEUED">Queued</MenuItem>
              <MenuItem value="SENT">Sent</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="READ">Read</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Channel</InputLabel>
            <Select
              value={channelFilter}
              label="Channel"
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="instagram">Instagram</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Messages Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#0f172a' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>CUSTOMER</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>CONTENT</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>CHANNEL</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>STATUS</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>CAMPAIGN</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>SENT AT</TableCell>
              <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No messages found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#0f172a', color: '#84cc16', fontWeight: 700, fontSize: '0.8rem' }}>
                        {message.customer?.firstName?.[0] || 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#0f172a">
                          {message.customer ? `${message.customer.firstName || ''} ${message.customer.lastName || ''}`.trim() || 'Unknown' : 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.customer?.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" noWrap color="#334155">
                      {message.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.channel.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: message.channel === 'whatsapp' ? '#f0fdf4' : '#faf5ff',
                        color: message.channel === 'whatsapp' ? '#16a34a' : '#9333ea',
                        border: `1px solid ${message.channel === 'whatsapp' ? '#bbf7d0' : '#e9d5ff'}`
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.status}
                      size="small"
                      color={getStatusColor(message.status)}
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {message.campaign ? (
                      <Typography variant="body2" color="#0f172a" fontWeight={500}>{message.campaign.name}</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                      {new Date(message.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleAIReply(message)}
                        title="AI Reply Suggestions"
                        sx={{ color: '#0f172a', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#84cc16', color: '#0f172a' } }}
                      >
                        <AutoAwesomeIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* AI Reply Dialog */}
      <Dialog
        open={openAIDialog}
        onClose={() => setOpenAIDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#0f172a',
            color: '#ffffff',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#84cc16',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AutoAwesomeIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                AI Reply Suggestions
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Context-aware smart customer responses
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={() => setOpenAIDialog(false)}
            sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, minWidth: 'auto', p: 0.5, '&:hover': { color: '#ffffff' } }}
          >
            ✕
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <AIProviderStatus compact sx={{ mb: 2 }} />

          {selectedMessage && (
            <Box mb={2.5}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                Original Customer Message:
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Typography variant="body2" sx={{ color: '#0f172a' }}>{selectedMessage.content}</Typography>
              </Paper>
            </Box>
          )}

          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1 }}>
            Recommended Smart Responses:
          </Typography>
          <Stack spacing={1.5}>
            {aiReplies.map((reply, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#84cc16', bgcolor: 'rgba(132,204,22,0.03)' }
                }}
                onClick={() => {
                  navigator.clipboard.writeText(reply.text);
                  alert('Copied response to clipboard!');
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={reply.type.toUpperCase()}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: '#0f172a',
                      color: '#84cc16'
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                    Click to copy 📋
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.4 }}>{reply.text}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setOpenAIDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              px: 3,
              '&:hover': { backgroundColor: '#1e293b' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
