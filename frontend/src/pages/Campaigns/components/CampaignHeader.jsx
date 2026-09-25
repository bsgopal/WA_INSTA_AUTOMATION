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
  Chip,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CampaignIcon from '@mui/icons-material/Campaign';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import IconButton from '@mui/material/IconButton';

/**
 * CampaignHeader Component
 * Seller Hub-style page header: KPI performance ribbon, quick campaign presets,
 * real-time search, status filter pills, and view mode toggle.
 */
const CampaignHeader = React.memo(({
  stats = { total: 0, active: 0, completed: 0, draft: 0 },
  onSearch = () => {},
  onCreate = () => {},
  onFilterChange = () => {},
  searchValue = '',
  filterValue = '',
  viewMode = 'CARDS',
  onViewModeChange = () => {},
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
      sublabel: 'All Broadcasts',
      value: stats.total || 0,
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accent: '#84cc16',
      iconColor: '#84cc16'
    },
    {
      icon: PlayArrowIcon,
      label: 'Active Broadcasts',
      sublabel: 'Currently Live',
      value: stats.active || 0,
      gradient: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      accent: '#34d399',
      iconColor: '#a7f3d0'
    },
    {
      icon: SendIcon,
      label: 'Delivered Blasts',
      sublabel: 'Successfully Sent',
      value: stats.completed || 0,
      gradient: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
      accent: '#818cf8',
      iconColor: '#c7d2fe'
    },
    {
      icon: DescriptionIcon,
      label: 'Drafts & Queued',
      sublabel: 'Ready to Dispatch',
      value: stats.draft || 0,
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
      accent: '#fbbf24',
      iconColor: '#fef3c7'
    }
  ];

  const presets = [
    { label: '⚡ Mega Flash Sale', desc: 'Pre-fill flash sale broadcast' },
    { label: '🛍️ Abandoned Cart Blast', desc: 'Recover incomplete checkouts' },
    { label: '📦 New Catalog Drop', desc: 'Promote fresh product launches' },
    { label: '🎉 VIP Customer Special', desc: 'Reward top loyal buyers' }
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {/* Sleek Compact Header Bar */}
      <Card
        elevation={0}
        sx={{
          p: 1.75,
          mb: 1.5,
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(132, 204, 22, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4d7c0f'
            }}
          >
            <CampaignIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
                Marketing Campaigns
              </Typography>
              <Chip
                label="WhatsApp & Social"
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 20
                }}
              />
            </Box>
            {/* Inline Stat Pills */}
            <Stack direction="row" spacing={0.8} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${stats.total || 0}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
              />
              <Chip
                label={`Active: ${stats.active || 0}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}
              />
              <Chip
                label={`Delivered: ${stats.completed || 0}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' }}
              />
              <Chip
                label={`Drafts: ${stats.draft || 0}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }}
              />
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {presets.slice(0, 2).map((p) => (
            <Tooltip key={p.label} title={p.desc} arrow>
              <Chip
                label={p.label}
                onClick={onCreate}
                size="small"
                clickable
                sx={{
                  display: { xs: 'none', lg: 'inline-flex' },
                  bgcolor: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  height: 32,
                  border: '1px solid #e2e8f0',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                }}
              />
            </Tooltip>
          ))}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            size="small"
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              px: 2,
              height: '36px',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
              '&:hover': {
                bgcolor: '#65a30d',
                color: '#ffffff'
              }
            }}
          >
            Create Campaign
          </Button>
        </Stack>
      </Card>

      {/* Search & Status Filtering Bar */}
      <Card
        elevation={0}
        sx={{
          p: 1.25,
          borderRadius: '10px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <TextField
          placeholder="Search campaigns by name, topic, or message..."
          variant="outlined"
          size="small"
          fullWidth
          defaultValue={searchValue}
          onChange={handleSearchChange}
          disabled={loading}
          sx={{
            flex: 1,
            maxWidth: { md: 420 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: '#f8fafc',
              height: '36px',
              fontSize: '0.8125rem',
              '&:hover fieldset': { borderColor: '#84cc16' },
              '&.Mui-focused fieldset': { borderColor: '#84cc16' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <Chip
                label="Clear"
                size="small"
                onClick={() => onSearch('')}
                sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer', bgcolor: '#e2e8f0' }}
              />
            ) : null
          }}
        />

        {/* Status Filter Dropdown & Quick Filter Pills */}
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mr: 0.5 }}>
            {[
              { val: '', label: 'All' },
              { val: 'RUNNING', label: 'Active' },
              { val: 'SCHEDULED', label: 'Scheduled' },
              { val: 'COMPLETED', label: 'Completed' },
              { val: 'DRAFT', label: 'Drafts' }
            ].map((tab) => (
              <Chip
                key={tab.label}
                label={tab.label}
                clickable
                onClick={() => onFilterChange(tab.val)}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 28,
                  px: 0.5,
                  bgcolor: filterValue === tab.val ? '#0f172a' : '#f1f5f9',
                  color: filterValue === tab.val ? '#ffffff' : '#475569',
                  border: filterValue === tab.val ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  '&:hover': {
                    bgcolor: filterValue === tab.val ? '#1e293b' : '#e2e8f0'
                  }
                }}
              />
            ))}
          </Box>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel sx={{ fontSize: '0.8rem', top: -4 }}>Status</InputLabel>
            <Select
              value={filterValue}
              label="Status"
              onChange={(e) => onFilterChange(e.target.value)}
              sx={{
                borderRadius: '8px',
                bgcolor: '#f8fafc',
                height: '36px',
                fontSize: '0.8125rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
              }}
              startAdornment={
                <FilterListIcon sx={{ color: '#94a3b8', mr: 0.5, fontSize: 16 }} />
              }
            >
              <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>All Statuses</MenuItem>
              <MenuItem value="DRAFT" sx={{ fontSize: '0.8125rem' }}>Draft</MenuItem>
              <MenuItem value="SCHEDULED" sx={{ fontSize: '0.8125rem' }}>Scheduled</MenuItem>
              <MenuItem value="RUNNING" sx={{ fontSize: '0.8125rem' }}>Running</MenuItem>
              <MenuItem value="PAUSED" sx={{ fontSize: '0.8125rem' }}>Paused</MenuItem>
              <MenuItem value="COMPLETED" sx={{ fontSize: '0.8125rem' }}>Completed</MenuItem>
              <MenuItem value="FAILED" sx={{ fontSize: '0.8125rem' }}>Failed</MenuItem>
            </Select>
          </FormControl>

          {/* View Toggle (Cards Grid vs Table) */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 0.5 }}>
            <Tooltip title="Cards Grid View">
              <IconButton
                size="small"
                onClick={() => onViewModeChange('CARDS')}
                sx={{
                  bgcolor: viewMode === 'CARDS' ? '#0f172a' : '#f1f5f9',
                  color: viewMode === 'CARDS' ? '#84cc16' : '#64748b',
                  borderRadius: '8px',
                  width: 34,
                  height: 34,
                  border: viewMode === 'CARDS' ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  '&:hover': { bgcolor: viewMode === 'CARDS' ? '#1e293b' : '#e2e8f0' }
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Table / DataGrid View">
              <IconButton
                size="small"
                onClick={() => onViewModeChange('TABLE')}
                sx={{
                  bgcolor: viewMode === 'TABLE' ? '#0f172a' : '#f1f5f9',
                  color: viewMode === 'TABLE' ? '#84cc16' : '#64748b',
                  borderRadius: '8px',
                  width: 34,
                  height: 34,
                  border: viewMode === 'TABLE' ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  '&:hover': { bgcolor: viewMode === 'TABLE' ? '#1e293b' : '#e2e8f0' }
                }}
              >
                <TableRowsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
});

CampaignHeader.displayName = 'CampaignHeader';

export default CampaignHeader;
