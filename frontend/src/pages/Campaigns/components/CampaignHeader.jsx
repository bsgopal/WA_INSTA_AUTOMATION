import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';

/**
 * CampaignHeader Component
 * Displays header with stats cards, search, filter, and create button
 * Features:
 * - Real-time statistics with icons
 * - Debounced search
 * - Status filtering
 * - Responsive design
 * 
 * Props:
 * - stats: object - Statistics (total, active, completed, draft)
 * - onSearch: function - Callback for search input
 * - onCreate: function - Callback for create button
 * - onFilterChange: function - Callback for filter change
 * - searchValue: string - Current search value
 * - loading: boolean - Whether data is loading
 */
const CampaignHeader = React.memo(({
  stats = { total: 0, active: 0, completed: 0, draft: 0 },
  onSearch = () => {},
  onCreate = () => {},
  onFilterChange = () => {},
  searchValue = '',
  filterValue = '',
  loading = false
}) => {
  // Debounced search handler
  const searchTimeoutRef = React.useRef(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid #E5E7EB',
        transition: 'all 150ms ease-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: color
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 0.5
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1F2937'
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '50%',
              backgroundColor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease-out'
            }}
          >
            <Icon sx={{ color: color, width: 24, height: 24 }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header Row */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1F2937',
              mb: 0.5
            }}
          >
            Campaigns
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              fontSize: '14px'
            }}
          >
            Create and manage your marketing campaigns
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          disabled={loading}
          sx={{
            px: 3,
            py: 1.5,
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: '#3B82F6',
            transition: 'all 150ms ease-out',
            '&:hover': {
              backgroundColor: '#2563EB',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
            },
            '&:active': {
              transform: 'scale(0.98)'
            },
            '&:disabled': {
              backgroundColor: '#D1D5DB',
              color: '#6B7280'
            }
          }}
        >
          New Campaign
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUpIcon}
            label="Total Campaigns"
            value={stats.total || 0}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PlayArrowIcon}
            label="Active"
            value={stats.active || 0}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={SendIcon}
            label="Completed"
            value={stats.completed || 0}
            color="#8B5CF6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PeopleIcon}
            label="Draft"
            value={stats.draft || 0}
            color="#F59E0B"
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          '& > *': {
            minWidth: { xs: '100%', sm: 'auto' }
          }
        }}
      >
        <TextField
          placeholder="Search campaigns..."
          variant="outlined"
          size="small"
          defaultValue={searchValue}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF', width: 20, height: 20 }} />
              </InputAdornment>
            )
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 150ms ease-out',
              '&:hover fieldset': {
                borderColor: '#D1D5DB'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3B82F6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterValue}
            label="Status"
            onChange={(e) => onFilterChange(e.target.value)}
            sx={{
              borderRadius: '8px',
              transition: 'all 150ms ease-out',
              '&.Mui-focused fieldset': {
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="RUNNING">Running</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
});

CampaignHeader.displayName = 'CampaignHeader';

export default CampaignHeader;
