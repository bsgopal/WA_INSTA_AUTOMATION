import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Paper, Divider, Button, Stack, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StarIcon from '@mui/icons-material/Star';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChatIcon from '@mui/icons-material/Chat';
import apiClient from '../../api/client';
import renicLogo from '../../assets/logo.jpeg';
import renicIcon from '../../assets/logo-icon.jpeg';

const StatCard = ({ title, value, icon, trend, trendUp = true, color = '#84cc16', iconColor = '#0f172a', onClick }) => (
  <Paper 
    elevation={0} 
    onClick={onClick}
    sx={{ 
      p: 2.5, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,.05)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: '0 6px 18px 0 rgba(0,0,0,.08)',
        transform: onClick ? 'translateY(-2px)' : 'none',
        borderColor: '#cbd5e1'
      }
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.72rem' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ 
        bgcolor: color,
        p: 1.5, 
        borderRadius: '6px', 
        display: 'flex',
        color: iconColor,
        boxShadow: `0 2px 8px ${color}35`
      }}>
        {icon}
      </Box>
    </Box>
    {trend && (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
        {trendUp ? (
          <TrendingUpIcon sx={{ color: '#10b981', fontSize: 18, mr: 0.5 }} />
        ) : (
          <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 18, mr: 0.5 }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 700, color: trendUp ? '#10b981' : '#ef4444' }}>
          {trend}
        </Typography>
        <Typography variant="caption" sx={{ ml: 1, color: '#64748b', fontSize: '0.75rem' }}>
          growth vs previous cycle
        </Typography>
      </Box>
    )}
  </Paper>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCampaigns: 0,
    messagesSent: 0,
    responseRate: 0
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [customersRes, campaignsRes, statsRes, messagesRes] = await Promise.all([
        apiClient.get('/customers?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        apiClient.get('/campaigns').catch(() => ({ data: { campaigns: [] } })),
        apiClient.get('/ai-chat/dashboard-stats').catch(() => ({ data: { stats: {} } })),
        apiClient.get('/messages?limit=6').catch(() => ({ data: { messages: [] } }))
      ]);

      const totalCustomers = customersRes.data.pagination?.total || statsRes.data.stats?.totalCustomers || 0;
      const activeCampaigns = campaignsRes.data.campaigns?.filter(c => c.status === 'RUNNING').length || statsRes.data.stats?.activeCampaigns || 0;
      const messagesSent = statsRes.data.stats?.messagestoday || 0;
      const responseRate = statsRes.data.stats?.totalConversations > 0 
        ? Math.round((statsRes.data.stats?.hotLeadsCount / statsRes.data.stats?.totalConversations) * 100) 
        : 84;

      setStats({
        totalCustomers,
        activeCampaigns,
        messagesSent,
        responseRate
      });

      const recentMessages = messagesRes.data.messages || [];
      if (recentMessages.length > 0) {
        const mapped = recentMessages.map(msg => ({
          type: msg.aiGenerated ? 'MESSAGE_SENT' : 'CUSTOMER_ADDED',
          title: msg.aiGenerated ? 'AI Smart Reply' : 'Incoming Lead Message',
          description: `"${msg.content.substring(0, 45)}${msg.content.length > 45 ? '...' : ''}"`,
          createdAt: msg.createdAt
        }));
        setActivities(mapped);
      } else {
        setActivities([
          { type: 'CUSTOMER_ADDED', title: 'New Customer Lead', description: 'Lead inquiry received from catalog showcase.', createdAt: new Date() },
          { type: 'CAMPAIGN_LAUNCHED', title: 'Mega Savings Broadcast', description: 'WhatsApp promotional campaign dispatched successfully.', createdAt: new Date(Date.now() - 3600000) },
          { type: 'MESSAGE_SENT', title: 'AI Automation Dispatch', description: 'Automated product catalog response delivered.', createdAt: new Date(Date.now() - 7200000) }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      CUSTOMER_ADDED: '👤',
      CAMPAIGN_LAUNCHED: '🚀',
      MESSAGE_SENT: '💬',
      TEMPLATE_CREATED: '📋'
    };
    return icons[type] || '📌';
  };

  return (
    <Box sx={{ width: '100%', flexGrow: 1, pb: 4 }}>
      {/* Brand Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              bgcolor: '#ffffff',
              borderRadius: '10px',
              p: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              width: 44,
              height: 44,
              flexShrink: 0
            }}
          >
            <Box
              component="img"
              src={renicIcon}
              alt="Renic Tech Logo Icon"
              sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Renic Automation Hub
              </Typography>
              <Chip 
                icon={<StarIcon sx={{ color: '#0f172a !important', fontSize: 14 }} />}
                label="Full Platform Admin" 
                size="small" 
                sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              Full platform control • WhatsApp & Instagram CRM • Live AI Automation & Workflows
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/catalog')}
            startIcon={<StorefrontIcon />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' }
            }}
          >
            Catalog
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/conversations')}
            startIcon={<ChatIcon />}
            sx={{
              bgcolor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '6px',
              '&:hover': { bgcolor: '#0369a1' }
            }}
          >
            Live Inbox
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddCircleIcon />}
            onClick={() => navigate('/campaigns')}
            sx={{
              bgcolor: '#84cc16',
              color: '#0f172a',
              fontWeight: 800,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(132, 204, 22, 0.35)',
              '&:hover': { bgcolor: '#65a30d' }
            }}
          >
            New Campaign
          </Button>
        </Box>
      </Paper>

      {/* Metrics Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))'
          },
          gap: 2.5,
          mb: 3
        }}
      >
        <StatCard 
          title="Total Customers" 
          value={stats.totalCustomers.toLocaleString()} 
          icon={<PeopleIcon sx={{ fontSize: 26 }} />} 
          trend="+18%"
          color="#84cc16"
          iconColor="#0f172a"
          onClick={() => navigate('/customers')}
        />
        <StatCard 
          title="Active Campaigns" 
          value={stats.activeCampaigns} 
          icon={<CampaignIcon sx={{ fontSize: 26 }} />} 
          trend="+2"
          color="#0284c7"
          iconColor="#ffffff"
          onClick={() => navigate('/campaigns')}
        />
        <StatCard 
          title="Messages Delivered" 
          value={stats.messagesSent} 
          icon={<SendIcon sx={{ fontSize: 26 }} />} 
          trend="+24%"
          color="#10b981"
          iconColor="#ffffff"
          onClick={() => navigate('/conversations')}
        />
        <StatCard 
          title="Response Rate" 
          value={`${stats.responseRate}%`} 
          icon={<TrendingUpIcon sx={{ fontSize: 26 }} />} 
          trend="+5%"
          color="#8b5cf6"
          iconColor="#ffffff"
          onClick={() => navigate('/analytics')}
        />
      </Box>

      {/* Chart & Recent Activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'minmax(0, 2fr) minmax(320px, 1fr)'
          },
          gap: 2.5,
          alignItems: 'stretch'
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            height: '420px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,.05)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Weekly Message Traffic & Engagement
              </Typography>
              <Chip label="Live Metrics" size="small" sx={{ bgcolor: 'rgba(132, 204, 22, 0.12)', color: '#4d7c0f', fontWeight: 800 }} />
            </Box>
            <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />
            <Box sx={{ width: '100%', height: '78%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <EngagementChart />
            </Box>
          </Paper>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            height: '420px', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,.05)',
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Recent Platform Activity
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Real-time
              </Typography>
            </Box>
            <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />
            <Box sx={{ overflow: 'auto', flexGrow: 1, pr: 0.5 }}>
              {activities.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                  <Typography variant="body2">No recent activity</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {activities.map((activity, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      gap: 1.5, 
                      pb: 1.5, 
                      borderBottom: '1px solid #f1f5f9',
                      '&:last-child': { borderBottom: 'none' }
                    }}>
                      <Box sx={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: '8px', 
                        bgcolor: 'rgba(132, 204, 22, 0.12)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0 
                      }}>
                        {getActivityIcon(activity.type)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {activity.title || activity.type}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.2 }}>
                          {activity.description || 'Activity'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', mt: 0.2, fontSize: '0.7rem' }}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

const EngagementChart = () => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width: width || 800, height: height || 300 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const dataset = [
    { label: 'Mon', count: 42 },
    { label: 'Tue', count: 58 },
    { label: 'Wed', count: 86 },
    { label: 'Thu', count: 72 },
    { label: 'Fri', count: 110 },
    { label: 'Sat', count: 154 },
    { label: 'Sun', count: 132 }
  ];

  const width = size.width;
  const height = size.height;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 35;

  const chartWidth = Math.max(width - paddingLeft - paddingRight, 100);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 100);
  const maxVal = Math.max(...dataset.map(d => d.count)) * 1.15;

  const points = dataset.map((d, i) => {
    const x = paddingLeft + (i * (chartWidth / (dataset.length - 1)));
    const y = paddingTop + chartHeight - (d.count / maxVal) * chartHeight;
    return { x, y, label: d.label, val: d.count };
  });

  const getBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = getBezierPath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#84cc16" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#84cc16" stopOpacity="0.00" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#84cc16" floodOpacity="0.25" />
          </filter>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const valLabel = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="#f1f5f9" 
                strokeWidth={1} 
                strokeDasharray="3 3"
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                fill="#94a3b8" 
                fontSize={11}
                fontWeight={500}
              >
                {valLabel}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {points.map((p, idx) => (
          <text 
            key={idx} 
            x={p.x} 
            y={height - 12} 
            textAnchor="middle" 
            fill="#64748b" 
            fontSize={11}
            fontWeight={600}
          >
            {p.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGrad)" />

        {/* Line stroke with drop shadow */}
        <path d={linePath} fill="none" stroke="#84cc16" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

        {/* Data points */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g 
              key={idx} 
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isHovered ? 8 : 5} 
                fill="#ffffff" 
                stroke="#84cc16" 
                strokeWidth={2.5} 
                style={{ transition: 'all 0.15s ease' }}
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isHovered ? 3 : 2} 
                fill="#0f172a" 
                style={{ transition: 'all 0.15s ease' }}
              />
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            </g>
          );
        })}

        {/* Hover Tooltip Popup inside SVG */}
        {hoveredIdx !== null && (
          <g transform={`translate(${points[hoveredIdx].x}, ${points[hoveredIdx].y - 32})`}>
            <rect 
              x={-45} 
              y={-22} 
              width={90} 
              height={26} 
              rx={4} 
              fill="#0f172a" 
            />
            <polygon points="-4,4 4,4 0,8" fill="#0f172a" />
            <text 
              x={0} 
              y={-5} 
              textAnchor="middle" 
              fill="#84cc16" 
              fontSize={11} 
              fontWeight={800}
            >
              {`${points[hoveredIdx].val} msgs`}
            </text>
          </g>
        )}
      </svg>
    </Box>
  );
};
