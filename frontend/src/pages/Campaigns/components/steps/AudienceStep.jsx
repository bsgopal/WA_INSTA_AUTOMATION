import React, { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
  TextField,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import apiClient from '../../../../api/client';

/**
 * AudienceStep Component
 * Step 3 of the campaign creation wizard
 * Features: Target Segment selection, interactive customer multi-selection grid, estimated reach calculation.
 */
const AudienceStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const [estimatedReach, setEstimatedReach] = useState(0);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const segments = [
    { value: 'ALL', label: 'All Customers' },
    { value: 'VIP', label: 'VIP Customers' },
    { value: 'LOYAL', label: 'Loyal Customers' },
    { value: 'NEW', label: 'New Customers' },
    { value: 'AT_RISK', label: 'At Risk' },
    { value: 'LOST', label: 'Lost Customers' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'zh', label: 'Chinese' }
  ];

  // Fetch all customers for target list
  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await apiClient.get('/customers?limit=1000');
        setAllCustomers(response.data.customers || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchAllCustomers();
  }, []);

  // Fetch general segment estimate count from API
  useEffect(() => {
    const estimateReach = async () => {
      try {
        setLoadingEstimate(true);
        const response = await apiClient.get('/customers/count', {
          params: {
            segment: data.targetSegment || 'ALL'
          }
        });
        setEstimatedReach(response.data.count || 0);
      } catch (error) {
        console.error('Error estimating reach:', error);
        setEstimatedReach(0);
      } finally {
        setLoadingEstimate(false);
      }
    };

    if (data.targetSegment) {
      estimateReach();
    }
  }, [data.targetSegment]);

  const handleLanguageChange = (lang) => {
    const selectedLanguages = data.selectedLanguages || [];
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang];
    onChange({ ...data, selectedLanguages: updated });
  };

  // Safe extraction of targeted customer IDs from customFilter
  const targetedCustomerIds = useMemo(() => {
    return (data.customFilter && typeof data.customFilter === 'object')
      ? (data.customFilter.targetedCustomerIds || [])
      : [];
  }, [data.customFilter]);

  // Handle single customer selection
  const handleSelectCustomer = (customerId) => {
    let nextIds = [...targetedCustomerIds];
    if (nextIds.includes(customerId)) {
      nextIds = nextIds.filter(id => id !== customerId);
    } else {
      nextIds.push(customerId);
    }
    onChange({
      ...data,
      customFilter: {
        ...(typeof data.customFilter === 'object' ? data.customFilter : {}),
        targetedCustomerIds: nextIds
      }
    });
  };

  // Filter customers for display table
  const filteredCustomers = useMemo(() => {
    let list = allCustomers;
    
    // Filter by segment
    if (data.targetSegment && data.targetSegment !== 'ALL') {
      list = list.filter(c => c.rfmSegment === data.targetSegment);
    }
    
    // Filter by search keyword
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      list = list.filter(c => 
        `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(q) ||
        (c.whatsappNumber && c.whatsappNumber.includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    
    return list;
  }, [allCustomers, data.targetSegment, customerSearch]);

  // Handle select/unselect all filtered customers
  const handleSelectAllToggle = (e) => {
    const checked = e.target.checked;
    let nextIds = [...targetedCustomerIds];
    
    if (checked) {
      // Add all filtered customer IDs that aren't already added
      const filteredIds = filteredCustomers.map(c => c._id);
      nextIds = [...new Set([...nextIds, ...filteredIds])];
    } else {
      // Remove all filtered customer IDs
      const filteredIds = filteredCustomers.map(c => c._id);
      nextIds = nextIds.filter(id => !filteredIds.includes(id));
    }

    onChange({
      ...data,
      customFilter: {
        ...(typeof data.customFilter === 'object' ? data.customFilter : {}),
        targetedCustomerIds: nextIds
      }
    });
  };

  const handleClearSelection = () => {
    onChange({
      ...data,
      customFilter: {
        ...(typeof data.customFilter === 'object' ? data.customFilter : {}),
        targetedCustomerIds: []
      }
    });
  };

  // Check if all filtered customers are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every(c => targetedCustomerIds.includes(c._id));
  }, [filteredCustomers, targetedCustomerIds]);

  // Check if some filtered customers are selected
  const isSomeFilteredSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    const selectedFilteredCount = filteredCustomers.filter(c => targetedCustomerIds.includes(c._id)).length;
    return selectedFilteredCount > 0 && selectedFilteredCount < filteredCustomers.length;
  }, [filteredCustomers, targetedCustomerIds]);

  const displayReachCount = targetedCustomerIds.length > 0 
    ? targetedCustomerIds.length 
    : estimatedReach;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Define who should receive this campaign by selecting segment or individual customers.
      </Typography>

      <FormControl fullWidth size="small" required>
        <InputLabel>Target Segment</InputLabel>
        <Select
          label="Target Segment"
          value={data.targetSegment || 'ALL'}
          onChange={(e) => onChange({ ...data, targetSegment: e.target.value })}
        >
          {segments.map((segment) => (
            <MenuItem key={segment.value} value={segment.value}>
              {segment.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Estimated Reach Alert */}
      <Paper sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InfoOutlinedIcon sx={{ color: '#3B82F6', fontSize: '18px' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF' }}>
            ESTIMATED REACH
          </Typography>
        </Box>
        {loadingEstimate ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Calculating...</Typography>
          </Box>
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#3B82F6' }}>
            {displayReachCount.toLocaleString()} customers
            {targetedCustomerIds.length > 0 && (
              <Typography component="span" variant="body2" sx={{ ml: 1, color: '#4B5563', fontWeight: 500 }}>
                (custom selection of {targetedCustomerIds.length})
              </Typography>
            )}
          </Typography>
        )}
      </Paper>

      {/* Customer Listing with Selection */}
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
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: '20px' }} />
          }}
        />

        {loadingCustomers ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
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
                        onClick={() => handleSelectCustomer(c._id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectCustomer(c._id)}
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

      {/* Languages */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          Languages (Multi-select)
          <Tooltip title="Customers will receive the message in their preferred language">
            <InfoOutlinedIcon sx={{ fontSize: '16px', color: '#6B7280', cursor: 'help' }} />
          </Tooltip>
        </Typography>
        <FormGroup row sx={{ gap: 1 }}>
          {languageOptions.map((lang) => (
            <FormControlLabel
              key={lang.value}
              control={
                <Checkbox
                  checked={(data.selectedLanguages || []).includes(lang.value)}
                  onChange={() => handleLanguageChange(lang.value)}
                  size="small"
                />
              }
              label={lang.label}
            />
          ))}
        </FormGroup>
      </Box>

      {(data.selectedLanguages || []).length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {data.selectedLanguages.map((lang) => {
            const langObj = languageOptions.find((l) => l.value === lang);
            return (
              <Chip
                key={lang}
                label={langObj?.label || lang}
                onDelete={() => handleLanguageChange(lang)}
                color="primary"
                variant="outlined"
                size="small"
              />
            );
          })}
        </Box>
      )}

      {/* Custom Filters */}
      <TextField
        label="Custom Filter (Optional)"
        fullWidth
        multiline
        rows={2}
        value={data.customFilter && typeof data.customFilter === 'string' ? data.customFilter : ''}
        onChange={(e) => onChange({ ...data, customFilter: e.target.value })}
        placeholder="e.g., spentMoreThan:$500, lastPurchaseWithin:30days"
        helperText="Add custom criteria to narrow down your audience"
        size="small"
      />
    </Stack>
  );
});

AudienceStep.displayName = 'AudienceStep';

export default AudienceStep;
