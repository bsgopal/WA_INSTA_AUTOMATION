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
  MenuItem,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CampaignIcon from '@mui/icons-material/Campaign';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';

/**
 * CampaignHeader Component
 * Premium page header: title, stat cards, search and status filter.
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

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const statCards = [
    {
      icon: CampaignIcon,
      label: 'Total Campaigns',
      value: stats.total || 0,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      softBg: 'rgba(99, 102, 241, 0.10)'
    },
    {
      icon: PlayArrowIcon,
      label: 'Active',
      value: stats.active || 0,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      softBg: 'rgba(16, 185, 129, 0.10)'
    },
    {
      icon: SendIcon,
      label: 'Completed',
      value: stats.completed || 0,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      softBg: 'rgba(139, 92, 246, 0.10)'
    },
    {
      icon: DescriptionIcon,
      label: 'Drafts',
      value: stats.draft || 0,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      softBg: 'rgba(245, 158, 11, 0.10)'
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Page Title + Create Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              color: '#0f172a',
              letterSpacing: '-0.02em',
              mb: 0.5
            }}
          >
            Campaigns
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            Create, launch and track your WhatsApp marketing campaigns in one place.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          disabled={loading}
          size="large"
          sx={{
            px: 3,
            height: '44px',
            borderRadius: '10px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.45)',
            '&:hover': {
              boxShadow: '0 12px 24px -6px rgba(99, 102, 241, 0.55)',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0) scale(0.98)'
            }
          }}
        >
          New Campaign
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {statCards.map(({ icon: Icon, label, value, gradient, softBg }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 16px 32px -12px rgba(15, 23, 42, 0.14)'
                }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -24,
                  right: -24,
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: softBg
                }}
              />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 6px 14px -4px rgba(15, 23, 42, 0.25)'
                    }}
                  >
                    <Icon sx={{ color: '#ffffff', fontSize: 22 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        color: '#0f172a',
                        lineHeight: 1.2
                      }}
                    >
                      {value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search + Filter */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
      >
        <TextField
          placeholder="Search campaigns by name, topic..."
          variant="outlined"
          size="medium"
          fullWidth
          defaultValue={searchValue}
          onChange={handleSearchChange}
          disabled={loading}
          sx={{
            flex: 1,
            maxWidth: { sm: 440 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#ffffff',
              height: '46px',
              fontSize: '0.9rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <Chip
                label="Clear"
                size="small"
                onClick={() => onSearch('')}
                sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer' }}
              />
            ) : null
          }}
        />

        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterValue}
            label="Status"
            onChange={(e) => onFilterChange(e.target.value)}
            sx={{
              borderRadius: '10px',
              bgcolor: '#ffffff',
              height: '46px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
            }}
            startAdornment={
              <FilterListIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
            }
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
