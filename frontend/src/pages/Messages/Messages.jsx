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
      PENDING: 'warning'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : 'N/A';
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage all message communications
            </Typography>
          </Box>
          <AIProviderStatus compact />
        </Box>
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
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Sent At</TableCell>
              <TableCell align="center">Actions</TableCell>
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
                <TableRow key={message._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {message.customerId?.firstName?.[0] || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {message.customerId?.firstName} {message.customerId?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.customerId?.phone}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300
                      }}
                    >
                      {message.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={message.channel} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.status}
                      size="small"
                      color={getStatusColor(message.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {message.campaignId?.name || 'Direct'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(message.sentAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleAIReply(message)}
                      >
                        <AutoAwesomeIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <ReplyIcon fontSize="small" />
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
      <Dialog open={openAIDialog} onClose={() => setOpenAIDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}><AutoAwesomeIcon color="primary" /><Typography variant="h6">AI Reply Suggestions</Typography></Stack><AIProviderStatus compact sx={{ mb: 2 }} />
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Original Message:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">{selectedMessage.content}</Typography>
              </Paper>
            </Box>
          )}

          <Typography variant="subtitle2" gutterBottom>
            Suggested Replies:
          </Typography>
          <Stack spacing={2}>
            {aiReplies.map((reply, index) => (
              <Paper key={index} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography variant="caption" color="primary" fontWeight={500} gutterBottom>
                  {reply.type.toUpperCase()}
                </Typography>
                <Typography variant="body2">{reply.text}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAIDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
