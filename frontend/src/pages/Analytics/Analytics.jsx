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
    <Card elevation={0}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" color={`${color}.main`}>
              {value}
            </Typography>
            {change !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                {change >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={500}
                >
                  {Math.abs(change)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Stack>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}.50`, p: 1.5, borderRadius: '50%' }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your campaign performance and customer engagement
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Customers"
                value={overview.totalCustomers?.toLocaleString() || 0}
                icon={<SendIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Messages Sent"
                value={overview.messagesSent?.toLocaleString() || 0}
                change={overview.messageGrowth}
                icon={<SendIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Delivery Rate"
                value={`${overview.deliveryRate?.toFixed(1) || 0}%`}
                icon={<DoneAllIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Response Rate"
                value={`${overview.responseRate?.toFixed(1) || 0}%`}
                icon={<VisibilityIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Engagement Timeline */}
          <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Engagement Timeline
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TimelineChart data={timeline} />
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {/* Customer Segments */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Segments
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  {segments.map((segment) => (
                    <Box key={segment._id}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {segment._id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {segment.count} customers
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(segment.count / overview.totalCustomers) * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Channel Performance */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Channel Performance
                </Typography>
                <Divider sx={{ my: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Channel</TableCell>
                        <TableCell align="right">Sent</TableCell>
                        <TableCell align="right">Delivered</TableCell>
                        <TableCell align="right">Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {channels.map((channel) => (
                        <TableRow key={channel.channel}>
                          <TableCell>
                            <Chip label={channel.channel} size="small" />
                          </TableCell>
                          <TableCell align="right">{channel.totalSent}</TableCell>
                          <TableCell align="right">{channel.delivered}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={channel.deliveryRate > 90 ? 'success.main' : 'text.primary'}
                              fontWeight={500}
                            >
                              {channel.deliveryRate}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Campaign Performance */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Campaign Performance
                </Typography>
                <Divider sx={{ my: 2 }} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Campaign</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Sent</TableCell>
                        <TableCell align="right">Delivered</TableCell>
                        <TableCell align="right">Read</TableCell>
                        <TableCell align="right">Delivery Rate</TableCell>
                        <TableCell align="right">Read Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {campaign.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={campaign.status} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="right">{campaign.totalSent || 0}</TableCell>
                          <TableCell align="right">{campaign.totalDelivered || 0}</TableCell>
                          <TableCell align="right">{campaign.totalRead || 0}</TableCell>
                          <TableCell align="right">
                            {campaign.deliveryRate?.toFixed(1) || 0}%
                          </TableCell>
                          <TableCell align="right">
                            {campaign.readRate?.toFixed(1) || 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
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

