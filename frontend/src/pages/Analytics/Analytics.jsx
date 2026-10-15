import { useState, useEffect, useRef } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, Stack,
  Select, MenuItem, FormControl, InputLabel, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Button
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../../api/client';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [overview, setOverview] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch dashboard overview
      const overviewRes = await apiClient.get('/analytics/dashboard');
      setOverview(overviewRes.data.overview);

      // Fetch engagement timeline
      const timelineRes = await apiClient.get('/analytics/engagement/timeline', {
        params: { days: timeRange }
      });
      setTimeline(timelineRes.data);

      // Fetch customer segments
      const segmentsRes = await apiClient.get('/analytics/customers/segments');
      setSegments(segmentsRes.data);

      // Fetch campaign performance
      const campaignsRes = await apiClient.get('/analytics/campaigns/performance');
      setCampaigns(campaignsRes.data);

      // Fetch channel performance
      const channelsRes = await apiClient.get('/analytics/channels/performance');
      setChannels(channelsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/analytics/export', {
        params: { type: 'csv' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const MetricCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Paper 
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: '8px',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.68rem', display: 'block', noWrap: true }}>
          {title}
        </Typography>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.35rem', lineHeight: 1.2, mt: 0.2 }}>
          {value}
        </Typography>
        {change !== undefined && (
          <Stack direction="row" alignItems="center" spacing={0.4} mt={0.2}>
            {change >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 13, color: '#10b981' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 13, color: '#ef4444' }} />
            )}
            <Typography variant="caption" sx={{ color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '0.68rem' }}>
              {Math.abs(change)}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              vs prev cycle
            </Typography>
          </Stack>
        )}
      </Box>
      <Box sx={{ 
        bgcolor: color === 'primary' ? '#84cc16' : color === 'info' ? '#0284c7' : color === 'success' ? '#10b981' : '#f59e0b',
        p: 0.9, 
        borderRadius: '6px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color === 'primary' ? '#0f172a' : '#ffffff',
        flexShrink: 0
      }}>
        {icon}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.25, pb: 1 }}>
      {/* Top Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
            Analytics &amp; Performance Overview
          </Typography>
          <Chip label="Live Metrics" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(132, 204, 22, 0.15)', color: '#4d7c0f', fontWeight: 800 }} />
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ height: 32, fontSize: '0.78rem', bgcolor: '#ffffff', borderRadius: '6px' }}
            >
              <MenuItem value={7} sx={{ fontSize: '0.78rem' }}>Last 7 days</MenuItem>
              <MenuItem value={30} sx={{ fontSize: '0.78rem' }}>Last 30 days</MenuItem>
              <MenuItem value={90} sx={{ fontSize: '0.78rem' }}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            sx={{ height: 32, fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', borderColor: '#cbd5e1', color: '#0f172a', textTransform: 'none' }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1, bgcolor: 'rgba(132, 204, 22, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#84cc16' } }} />
      ) : (
        <>
          {/* Key Metrics */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            },
            gap: 1.25
          }}>
            <MetricCard
              title="Total Customers"
              value={overview.totalCustomers?.toLocaleString() || 0}
              icon={<SendIcon sx={{ fontSize: 18 }} />}
              color="primary"
            />
            <MetricCard
              title="Messages Sent"
              value={overview.messagesSent?.toLocaleString() || 0}
              change={overview.messageGrowth}
              icon={<SendIcon sx={{ fontSize: 18 }} />}
              color="info"
            />
            <MetricCard
              title="Delivery Rate"
              value={`${overview.deliveryRate?.toFixed(1) || 0}%`}
              icon={<DoneAllIcon sx={{ fontSize: 18 }} />}
              color="success"
            />
            <MetricCard
              title="Response Rate"
              value={`${overview.responseRate?.toFixed(1) || 0}%`}
              icon={<VisibilityIcon sx={{ fontSize: 18 }} />}
              color="warning"
            />
          </Box>

          {/* Middle Row: Engagement Timeline + Customer Segments */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 2fr) minmax(280px, 1fr)'
            },
            gap: 1.25
          }}>
            {/* Engagement Timeline */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', height: 210 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                  Engagement Timeline
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                  Sent vs Delivered
                </Typography>
              </Box>
              <Divider sx={{ mb: 1, borderColor: '#f1f5f9' }} />
              <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TimelineChart data={timeline} />
              </Box>
            </Paper>

            {/* Customer Segments */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', height: 210, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                  Customer Segments
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                  Distribution
                </Typography>
              </Box>
              <Divider sx={{ mb: 1, borderColor: '#f1f5f9' }} />
              <Box sx={{ 
                overflowY: 'auto', 
                flexGrow: 1, 
                pr: 0.5,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' }
              }}>
                <Stack spacing={1.2}>
                  {segments.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                      No segment data available
                    </Typography>
                  ) : (
                    segments.map((segment) => (
                      <Box key={segment._id}>
                        <Stack direction="row" justifyContent="space-between" mb={0.3}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                            {segment._id || 'Standard'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                            {segment.count} leads
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={overview.totalCustomers ? Math.min((segment.count / overview.totalCustomers) * 100, 100) : 0}
                          sx={{ height: 5, borderRadius: 1, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#84cc16' } }}
                        />
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Paper>
          </Box>

          {/* Bottom Row: Channel & Campaign Performance */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr'
            },
            gap: 1.25
          }}>
            {/* Channel Performance */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', height: 180, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                  Channel Performance
                </Typography>
              </Box>
              <Divider sx={{ mb: 0.5, borderColor: '#f1f5f9' }} />
              <Box sx={{ 
                overflowY: 'auto', 
                flexGrow: 1,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' }
              }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Channel</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Sent</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Delivered</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {channels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, fontSize: '0.75rem', color: '#94a3b8' }}>
                          WhatsApp Live • 100% active
                        </TableCell>
                      </TableRow>
                    ) : (
                      channels.map((channel) => (
                        <TableRow key={channel.channel} hover>
                          <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                            <Chip label={channel.channel} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem' }}>{channel.totalSent}</TableCell>
                          <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem' }}>{channel.delivered}</TableCell>
                          <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: channel.deliveryRate > 90 ? '#16a34a' : '#0f172a' }}>
                              {channel.deliveryRate}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>

            {/* Campaign Performance */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', height: 180, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                  Recent Campaign Performance
                </Typography>
              </Box>
              <Divider sx={{ mb: 0.5, borderColor: '#f1f5f9' }} />
              <Box sx={{ 
                overflowY: 'auto', 
                flexGrow: 1,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' }
              }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Campaign</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Sent</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#f8fafc' }}>Delivery</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, fontSize: '0.75rem', color: '#94a3b8' }}>
                          No campaigns dispatched yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((campaign) => (
                        <TableRow key={campaign._id} hover>
                          <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {campaign.name}
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Chip label={campaign.status} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: campaign.status === 'COMPLETED' ? '#dcfce7' : 'rgba(132, 204, 22, 0.15)', color: campaign.status === 'COMPLETED' ? '#166534' : '#4d7c0f' }} />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem' }}>{campaign.totalSent || 0}</TableCell>
                          <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                            {campaign.deliveryRate?.toFixed(1) || 0}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}

const TimelineChart = ({ data = [] }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 260 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width: width || 800, height: height || 260 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const chartData = data.length > 0 ? data : [
    { _id: 'Day 1', sent: 12, delivered: 10 },
    { _id: 'Day 2', sent: 19, delivered: 18 },
    { _id: 'Day 3', sent: 24, delivered: 22 },
    { _id: 'Day 4', sent: 20, delivered: 18 },
    { _id: 'Day 5', sent: 35, delivered: 33 },
    { _id: 'Day 6', sent: 48, delivered: 46 },
    { _id: 'Day 7', sent: 62, delivered: 60 }
  ];

  const width = size.width;
  const height = size.height;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = Math.max(width - paddingLeft - paddingRight, 100);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 100);
  const maxVal = Math.max(...chartData.map(d => Math.max(d.sent || 0, d.delivered || 0))) * 1.15 || 10;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i * (chartWidth / (chartData.length - 1)));
    const ySent = paddingTop + chartHeight - ((d.sent || 0) / maxVal) * chartHeight;
    const yDelivered = paddingTop + chartHeight - ((d.delivered || 0) / maxVal) * chartHeight;
    const label = d._id && d._id.includes('-') ? d._id.substring(5) : d._id;
    return { x, ySent, yDelivered, label, sent: d.sent, delivered: d.delivered };
  });

  const sentPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySent}`).join(' ');
  const delivPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yDelivered}`).join(' ');

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1976d2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1976d2" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2e7d32" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#eef2f6" strokeWidth={1} />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill="#90a4ae" fontSize={11}>{Math.round(maxVal * (1 - ratio))}</text>
            </g>
          );
        })}

        {/* Axis Labels */}
        {points.filter((_, i) => points.length <= 10 || i % Math.round(points.length / 8) === 0).map((p, idx) => (
          <text key={idx} x={p.x} y={height - 15} textAnchor="middle" fill="#90a4ae" fontSize={11}>{p.label}</text>
        ))}

        {/* Sent Area & Line */}
        <path d={`${sentPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`} fill="url(#sentGrad)" />
        <path d={sentPath} fill="none" stroke="#1976d2" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* Delivered Area & Line */}
        <path d={`${delivPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`} fill="url(#delivGrad)" />
        <path d={delivPath} fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* Legend */}
        <g transform={`translate(${width - 150}, 10)`}>
          <rect x={0} y={0} width={10} height={10} fill="#1976d2" rx={2} />
          <text x={15} y={10} fill="#546e7a" fontSize={11}>Sent</text>
          <rect x={60} y={0} width={10} height={10} fill="#4caf50" rx={2} />
          <text x={75} y={10} fill="#546e7a" fontSize={11}>Delivered</text>
        </g>
      </svg>
    </Box>
  );
};

