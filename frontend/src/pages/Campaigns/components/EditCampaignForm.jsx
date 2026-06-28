import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Grid,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import apiClient from '../../../api/client';

/**
 * MobilePreview Component
 * Renders a simulated WhatsApp screen for message content verification
 */
const MobilePreview = ({ data }) => {
  let content = data.messageContent || '';

  // Simple formatting helper: *bold* -> <strong>, _italic_ -> <em>
  const formatMessageText = (text) => {
    if (!text) return 'Type a message to preview...';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Italics: _text_
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Monospace: `text`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '300px',
      height: '520px',
      bgcolor: '#efeae2',
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      backgroundSize: 'cover',
      border: '10px solid #1e293b',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      margin: '0 auto'
    }}>
      {/* Notch */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100px',
        height: '14px',
        bgcolor: '#1e293b',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        zIndex: 5
      }} />

      {/* WhatsApp Header */}
      <Box sx={{
        bgcolor: '#075E54',
        color: '#FFFFFF',
        pt: 2,
        pb: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 2
      }}>
        <Box sx={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          bgcolor: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '11px',
          color: '#ffffff'
        }}>
          WA
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '11.5px', lineHeight: 1.1 }}>
            WhatsApp Business
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '9px', display: 'block', lineHeight: 1 }}>
            online
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box sx={{
        flex: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflowY: 'auto'
      }}>
        {/* Message bubble */}
        <Box sx={{
          alignSelf: 'flex-start',
          maxWidth: '90%',
          bgcolor: '#E2F9CB',
          color: '#1f2937',
          borderRadius: '8px',
          borderTopLeftRadius: 0,
          p: 1.2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative',
          mb: 1
        }}>
          {/* Media preview */}
          {data.mediaUrl && (
            <Box sx={{ mb: 1, borderRadius: '4px', overflow: 'hidden', border: '1px solid #C0DFB0', bgcolor: '#F3F4F6' }}>
              {data.mediaType === 'image' ? (
                <Box
                  component="img"
                  src={data.mediaUrl}
                  alt="Media upload"
                  sx={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }}
                />
              ) : data.mediaType === 'video' ? (
                <Box sx={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000000', color: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontSize: '10px' }}>▶ Video Preview</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '16px' }}>📄</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '10px', wordBreak: 'break-all' }}>
                    {data.mediaFileName || 'Document.pdf'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Text Content */}
          <Typography variant="body2" sx={{ fontSize: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', pb: 0.5, lineHeight: 1.35 }}>
            {formatMessageText(content)}
          </Typography>

          {/* Timestamp & receipt */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0.2,
            mt: -0.2
          }}>
            <Typography variant="caption" sx={{ fontSize: '8px', color: '#6b7280' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#34B7F1', fontWeight: 700, fontSize: '10px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        {data.buttonLabel && (
          <Box sx={{
            alignSelf: 'flex-start',
            width: '90%',
            bgcolor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E4E4E4',
            textAlign: 'center',
            py: 0.6,
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            mb: 1
          }}>
            <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '11px', fontWeight: 600 }}>
              🔗 {data.buttonLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * EditCampaignForm Component
 * Modular edit form with collapsible sections and Google/Microsoft-level design
 */
const EditCampaignForm = React.memo(({
  campaign,
  open = false,
  onClose = () => {},
  onSave = () => {},
  loading = false
}) => {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const buildFormData = (campaignData) => {
    const data = campaignData || {};
    return {
      name: data.name || '',
      topic: data.topic || '',
      description: data.description || '',
      type: data.type || 'PROMOTIONAL',
      channels: data.channels || [],
      messageTemplate: data.messageTemplate?._id || data.messageTemplate || '',
      messageType: data.messageType || 'TEXT',
      messageContent: data.messageContent || '',
      buttonLabel: data.buttonLabel || '',
      buttonUrl: data.buttonUrl || '',
      targetSegment: data.targetAudience?.segments?.[0] || 'ALL',
      mediaType: data.mediaType || 'none',
      mediaUrl: data.mediaUrl || '',
      mediaPreviewData: data.mediaPreviewData || '',
      mediaMimeType: data.mediaMimeType || '',
      mediaFileName: data.mediaFileName || '',
      scheduledAt: data.scheduledAt || '',
      customFilter: data.targetAudience?.customFilter || { targetedCustomerIds: [] }
    };
  };

  const [formData, setFormData] = useState(buildFormData(campaign));
  const [expandedSection, setExpandedSection] = useState('basic-info');

  // Fetch templates and customers when dialog is opened
  useEffect(() => {
    if (open) {
      const fetchTemplates = async () => {
        try {
          setTemplatesLoading(true);
          const response = await apiClient.get('/templates');
          setTemplates(response.data || []);
        } catch (error) {
          console.error('Error fetching templates:', error);
          setTemplates([]);
        } finally {
          setTemplatesLoading(false);
        }
      };
      const fetchAllCustomers = async () => {
        try {
          setLoadingCustomers(true);
          const response = await apiClient.get('/customers?limit=1000');
          setAllCustomers(response.data.customers || []);
        } catch (err) {
          console.error('Error fetching customers:', err);
          setAllCustomers([]);
        } finally {
          setLoadingCustomers(false);
        }
      };
      fetchTemplates();
      fetchAllCustomers();
      setFormData(buildFormData(campaign));
      setCustomerSearch('');
    }
  }, [campaign, open]);

  // Safe extraction of targeted customer IDs from customFilter
  const targetedCustomerIds = useMemo(() => {
    return (formData.customFilter && typeof formData.customFilter === 'object')
      ? (formData.customFilter.targetedCustomerIds || [])
      : [];
  }, [formData.customFilter]);

  // Handle single customer selection
  const handleSelectCustomer = (customerId) => {
    let nextIds = [...targetedCustomerIds];
    if (nextIds.includes(customerId)) {
      nextIds = nextIds.filter(id => id !== customerId);
    } else {
      nextIds.push(customerId);
    }
    setFormData({
      ...formData,
      customFilter: {
        ...(typeof formData.customFilter === 'object' ? formData.customFilter : {}),
        targetedCustomerIds: nextIds
      }
    });
  };

  // Filter customers for display table
  const filteredCustomers = useMemo(() => {
    let list = allCustomers;
    if (formData.targetSegment && formData.targetSegment !== 'ALL') {
      list = list.filter(c => c.rfmSegment === formData.targetSegment);
    }
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      list = list.filter(c => 
        `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(q) ||
        (c.whatsappNumber && c.whatsappNumber.includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    return list;
  }, [allCustomers, formData.targetSegment, customerSearch]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every(c => targetedCustomerIds.includes(c._id));
  }, [filteredCustomers, targetedCustomerIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    const selectedFilteredCount = filteredCustomers.filter(c => targetedCustomerIds.includes(c._id)).length;
    return selectedFilteredCount > 0 && selectedFilteredCount < filteredCustomers.length;
  }, [filteredCustomers, targetedCustomerIds]);

  const handleSelectAllToggle = (e) => {
    const checked = e.target.checked;
    let nextIds = [...targetedCustomerIds];
    if (checked) {
      const filteredIds = filteredCustomers.map(c => c._id);
      nextIds = [...new Set([...nextIds, ...filteredIds])];
    } else {
      const filteredIds = filteredCustomers.map(c => c._id);
      nextIds = nextIds.filter(id => !filteredIds.includes(id));
    }
    setFormData({
      ...formData,
      customFilter: {
        ...(typeof formData.customFilter === 'object' ? formData.customFilter : {}),
        targetedCustomerIds: nextIds
      }
    });
  };

  const handleClearSelection = () => {
    setFormData({
      ...formData,
      customFilter: {
        ...(typeof formData.customFilter === 'object' ? formData.customFilter : {}),
        targetedCustomerIds: []
      }
    });
  };

  if (!campaign) return null;

  const handleSectionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : '');
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleClose = () => {
    onClose();
  };

  const isRunning = campaign.status === 'RUNNING';

  const messageTypes = [
    { value: 'TEXT', label: 'Text Only' },
    { value: 'MEDIA', label: 'Media Message' },
    { value: 'TEMPLATE', label: 'Template' },
    { value: 'QUICK_REPLY', label: 'Quick Reply' }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)'
        }
      }}
    >
      <DialogTitle sx={{
        fontWeight: 700,
        fontSize: '20px',
        p: 2.5,
        borderBottom: '1px solid #E5E7EB',
        bgcolor: '#F9FAFB'
      }}>
        Edit Campaign
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={4} alignItems="flex-start">
          {/* Edit Fields Column */}
          <Grid item xs={12} md={7.5}>
            <Stack spacing={1.5}>
              {/* Basic Info Section */}
              <Accordion
                expanded={expandedSection === 'basic-info'}
                onChange={handleSectionChange('basic-info')}
                sx={{
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Basic Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Campaign Name"
                      fullWidth
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isRunning || loading}
                      size="small"
                    />
                    <TextField
                      label="Campaign Topic"
                      fullWidth
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      disabled={isRunning || loading}
                      size="small"
                    />
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={isRunning || loading}
                      size="small"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Message Details & Template Section */}
              <Accordion
                expanded={expandedSection === 'message'}
                onChange={handleSectionChange('message')}
                sx={{
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Message Content & Template
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <Stack spacing={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Message Type</InputLabel>
                      <Select
                        label="Message Type"
                        value={formData.messageType}
                        onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                        disabled={isRunning || loading}
                      >
                        {messageTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {formData.messageType === 'TEMPLATE' && (
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={templates}
                        getOptionLabel={(option) => option.name || ''}
                        value={templates.find((t) => t._id === formData.messageTemplate) || null}
                        onChange={(event, newValue) => {
                          setFormData({
                            ...formData,
                            messageTemplate: newValue ? newValue._id : '',
                            messageContent: newValue ? newValue.content : formData.messageContent
                          });
                        }}
                        disabled={isRunning || loading || templatesLoading}
                        loading={templatesLoading}
                        renderInput={(params) => {
                          const hasSlotProps = !!params.slotProps?.input;
                          return (
                            <TextField
                              {...params}
                              label="Select Template"
                              variant="outlined"
                              slotProps={hasSlotProps ? {
                                ...params.slotProps,
                                input: {
                                  ...params.slotProps.input,
                                  endAdornment: (
                                    <React.Fragment>
                                      {templatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.slotProps.input.endAdornment}
                                    </React.Fragment>
                                  )
                                }
                              } : undefined}
                              InputProps={!hasSlotProps ? {
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {templatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps?.endAdornment}
                                  </React.Fragment>
                                )
                              } : undefined}
                            />
                          );
                        }}
                      />
                    )}

                    {/* Dynamic Template preview card inside edit accordion */}
                    {(() => {
                      const selectedTemplate = templates.find((t) => t._id === formData.messageTemplate);
                      if (!selectedTemplate || formData.messageType !== 'TEMPLATE') return null;

                      const getVariables = (text) => {
                        if (!text) return [];
                        const matches = text.match(/{{([^}]+)}}/g);
                        if (!matches) return [];
                        return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
                      };
                      const vars = selectedTemplate.variables?.map(v => typeof v === 'string' ? v : v.name) || getVariables(selectedTemplate.content);

                      return (
                        <Paper sx={{ p: 2, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                          <Box sx={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', display: 'block', letterSpacing: '0.05em' }}>
                              TEMPLATE DETAILS
                            </Typography>
                            {selectedTemplate.category && (
                              <Chip label={selectedTemplate.category} size="small" variant="outlined" sx={{ fontSize: '10px', height: '18px' }} />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1F2937', mb: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                            {selectedTemplate.content}
                          </Typography>
                          {vars.length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#4B5563', display: 'block', mb: 0.5 }}>
                                Variables:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {vars.map((param, idx) => (
                                  <Chip key={idx} label={`{{${param}}}`} size="small" sx={{ fontSize: '11px', height: '22px' }} />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      );
                    })()}

                    <TextField
                      label="Message Content"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.messageContent}
                      onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                      disabled={isRunning || loading}
                      size="small"
                      helperText="Supports dynamic variables with {{variable_name}} format"
                    />

                    <TextField
                      label="Button Label (Optional)"
                      fullWidth
                      value={formData.buttonLabel}
                      onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
                      disabled={isRunning || loading}
                      size="small"
                      placeholder="e.g., View Offer"
                    />

                    {formData.buttonLabel && (
                      <TextField
                        label="Button URL"
                        fullWidth
                        value={formData.buttonUrl}
                        onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                        disabled={isRunning || loading}
                        size="small"
                        placeholder="https://example.com"
                      />
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Audience Section */}
              <Accordion
                expanded={expandedSection === 'audience'}
                onChange={handleSectionChange('audience')}
                sx={{
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Target Audience
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target Segment</InputLabel>
                      <Select
                        label="Target Segment"
                        value={formData.targetSegment || 'ALL'}
                        onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                        disabled={isRunning || loading}
                      >
                        {[{ value: 'ALL', label: 'All Customers' },
                          { value: 'VIP', label: 'VIP Customers' },
                          { value: 'LOYAL', label: 'Loyal Customers' },
                          { value: 'NEW', label: 'New Customers' },
                          { value: 'AT_RISK', label: 'At Risk' },
                          { value: 'LOST', label: 'Lost Customers' }].map((segment) => (
                          <MenuItem key={segment.value} value={segment.value}>
                            {segment.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Customer Selection Table */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937' }}>
                          Audience Select ({filteredCustomers.length} filtered)
                        </Typography>
                        {targetedCustomerIds.length > 0 && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<ClearIcon />}
                            onClick={handleClearSelection}
                            disabled={isRunning || loading}
                            sx={{ textTransform: 'none', color: '#EF4444', fontWeight: 600 }}
                          >
                            Clear Selection ({targetedCustomerIds.length})
                          </Button>
                        )}
                      </Stack>

                      <TextField
                        size="small"
                        fullWidth
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customers inside list..."
                        disabled={isRunning || loading}
                        sx={{ mb: 1.5 }}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: '20px' }} />
                        }}
                      />

                      {loadingCustomers ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, borderRadius: '8px' }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox" sx={{ bgcolor: '#F9FAFB' }}>
                                  <Checkbox
                                    indeterminate={isSomeFilteredSelected}
                                    checked={isAllFilteredSelected}
                                    onChange={handleSelectAllToggle}
                                    disabled={isRunning || loading}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600, fontSize: '12px' }}>Name</TableCell>
                                <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600, fontSize: '12px' }}>Phone / Destination</TableCell>
                                <TableCell sx={{ bgcolor: '#F9FAFB', fontWeight: 600, fontSize: '12px' }}>Segment</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredCustomers.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <Typography variant="caption" color="textSecondary">
                                      No customers match segment/search filter.
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredCustomers.map((c) => {
                                  const isSelected = targetedCustomerIds.includes(c._id);
                                  return (
                                    <TableRow
                                      key={c._id}
                                      hover
                                      selected={isSelected}
                                      onClick={() => {
                                        if (isRunning || loading) return;
                                        handleSelectCustomer(c._id);
                                      }}
                                      sx={{ cursor: 'pointer' }}
                                    >
                                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={() => handleSelectCustomer(c._id)}
                                          disabled={isRunning || loading}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '12px', fontWeight: 550 }}>
                                        {c.firstName} {c.lastName || ''}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '12px', color: '#4B5563' }}>
                                        {c.whatsappNumber || c.phone || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {c.rfmSegment ? (
                                          <Chip
                                            label={c.rfmSegment}
                                            size="small"
                                            sx={{
                                              fontSize: '9px',
                                              height: '18px',
                                              bgcolor: c.rfmSegment === 'VIP' ? '#FEF3C7' : '#F3F4F6',
                                              color: c.rfmSegment === 'VIP' ? '#D97706' : '#374151',
                                              fontWeight: 700
                                            }}
                                          />
                                        ) : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Media Section */}
              <Accordion
                expanded={expandedSection === 'media'}
                onChange={handleSectionChange('media')}
                sx={{
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Media Attachments
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Media Type</InputLabel>
                      <Select
                        label="Media Type"
                        value={formData.mediaType}
                        onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                        disabled={isRunning || loading}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="image">Image</MenuItem>
                        <MenuItem value="video">Video</MenuItem>
                        <MenuItem value="document">Document</MenuItem>
                      </Select>
                    </FormControl>
                    {formData.mediaType !== 'none' && (
                      <TextField
                        label="Media URL"
                        fullWidth
                        value={formData.mediaUrl}
                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                        disabled={isRunning || loading}
                        size="small"
                        placeholder="https://example.com/media"
                      />
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Schedule Section */}
              <Accordion
                expanded={expandedSection === 'schedule'}
                onChange={handleSectionChange('schedule')}
                sx={{
                  '&.Mui-expanded': {
                    margin: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Schedule
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <TextField
                    label="Scheduled At"
                    type="datetime-local"
                    fullWidth
                    value={formData.scheduledAt ? formData.scheduledAt.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    disabled={isRunning || loading}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Grid>

          {/* Simulated Mobile Device Preview */}
          <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'sticky', top: '10px' }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1.5, fontWeight: 700, color: '#4B5563' }}>
                Live Message Preview
              </Typography>
              <MobilePreview data={formData} />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{
        p: 2.5,
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1.5,
        bgcolor: '#F9FAFB'
      }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || isRunning}
          startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '8px' }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

EditCampaignForm.displayName = 'EditCampaignForm';

export default EditCampaignForm;
