import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TimerIcon from '@mui/icons-material/Timer';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SchemaIcon from '@mui/icons-material/Schema';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpIcon from '@mui/icons-material/Help';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';

export default function WorkflowDocumentationGuide({ inModal = false, onOpenNewTab }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const nodeTypes = [
    {
      name: 'Start Trigger',
      icon: '▷',
      color: '#D97706',
      badge: 'Process Initiation',
      summary: 'The entry point for your automated process when a customer sends a message on WhatsApp.',
      details: [
        'Keywords: Specify trigger keywords such as "hi", "hello", "menu", "book appointment", "catalog".',
        'Match Modes: CONTAINS (matches if keyword is anywhere in message) or EXACT (message must match word-for-word).',
        'Customer Scope: Can respond to all contacts or specific tagged customer groups.'
      ]
    },
    {
      name: 'Message & Buttons Card',
      icon: '💬',
      color: '#0284C7',
      badge: 'Interactive Messaging',
      summary: 'Sends rich text responses along with interactive WhatsApp Quick Reply buttons or CTA list items.',
      details: [
        'Formatting: Supports standard WhatsApp text formatting like *bold*, _italic_, and line breaks.',
        'Interactive Buttons: Attach up to 3 interactive reply buttons (e.g., "1. Book Slot", "2. View Services", "3. Talk to Agent").',
        'Branching Handles: Each button generates its own dedicated right-side output connector port for targeted routing.'
      ]
    },
    {
      name: 'Condition Split (Decision Gateway)',
      icon: '✕',
      color: '#10B981',
      badge: 'Smart Branching',
      summary: 'Evaluates customer responses, keyword choices, or tags to dynamically route the conversation.',
      details: [
        'Multi-Way Branching: Create distinct paths for different customer selections.',
        'Fallback / Default Path: Safely handles unexpected replies by redirecting to a fallback help message or human agent.'
      ]
    },
    {
      name: 'Wait / Delay Timer',
      icon: '⏱️',
      color: '#059669',
      badge: 'Flow Timing',
      summary: 'Introduces a realistic pause between messages to emulate human typing and prevent message flooding.',
      details: [
        'Configurable Delays: Set waiting periods from 2 seconds up to several minutes.',
        'Sequential Storytelling: Deliver multi-step onboarding or instructions progressively.'
      ]
    },
    {
      name: 'AI Smart Assistant',
      icon: '🤖',
      color: '#6366F1',
      badge: 'Intelligent Handling',
      summary: 'Invokes AI language intelligence to answer ad-hoc questions using your business catalog and FAQ knowledge base.',
      details: [
        'Context-Aware: Combines conversation history with your business master data to craft tailored responses.',
        'Automated FAQ Answering: Resolves queries about pricing, policies, location, and timing without human intervention.'
      ]
    },
    {
      name: 'Ask & Collect Data',
      icon: '📝',
      color: '#0D9488',
      badge: 'Lead Capture',
      summary: 'Prompts the customer for specific information (such as email, preferred date, or product preference) and stores it.',
      details: [
        'Variable Binding: Automatically saves the customer reply into dynamic variables for subsequent nodes or CRM sync.',
        'Input Validation: Ensures received data matches required formats before continuing.'
      ]
    },
    {
      name: 'Product Catalog Showcase',
      icon: '🛍️',
      color: '#EA580C',
      badge: 'E-Commerce',
      summary: 'Presents your digital product catalog, item previews, or direct store link over WhatsApp.',
      details: [
        'Direct Link Embed: Sends formatted catalog cards with direct links to your online store.',
        'Category Filtering: Links directly to specific collections (e.g. Rings, Necklaces, Medical Services).'
      ]
    },
    {
      name: 'End Flow',
      icon: '◎',
      color: '#DC2626',
      badge: 'Termination',
      summary: 'Concludes the automated flow or transfers active conversation ownership to a human agent.',
      details: [
        'Graceful Exit: Marks session completed so standard auto-replies can trigger for future separate inquiries.',
        'Live Agent Handoff: Can alert staff that customer has reached the end of an inquiry tree.'
      ]
    }
  ];

  const dynamicVariables = [
    { tag: '{{customerName}}', desc: 'Customer full name or WhatsApp profile name', example: 'Alex Smith' },
    { tag: '{{phone}}', desc: 'Customer WhatsApp phone number in international format', example: '+1 555-0199' },
    { tag: '{{businessName}}', desc: 'Your configured business / company name', example: 'Enterprise Automations' },
    { tag: '{{serviceName}}', desc: 'Selected appointment or service title', example: 'Executive Consultation' },
    { tag: '{{appointmentDate}}', desc: 'Confirmed booking date', example: 'Tomorrow, Oct 15' },
    { tag: '{{appointmentTime}}', desc: 'Confirmed slot start time', example: '10:30 AM' },
    { tag: '{{staffName}}', desc: 'Assigned specialist or doctor name', example: 'Dr. Sarah Jenkins' }
  ];

  const filteredNodes = nodeTypes.filter(n =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.badge.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ bgcolor: inModal ? '#FFFFFF' : 'transparent', p: inModal ? 1 : 0, width: '100%' }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ bgcolor: '#0284C7', p: 0.8, borderRadius: '8px', display: 'flex' }}>
              <SchemaIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3, color: '#FFFFFF' }}>
              Visual Workflow Designer — User Manual & Reference Guide
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 780, lineHeight: 1.5, fontSize: '0.82rem' }}>
            Learn how to design, customize, test, and deploy automated 24/7 conversational journeys, decision trees, appointment booking flows, and interactive menus on WhatsApp with zero code.
          </Typography>
        </Box>

        {inModal && onOpenNewTab && (
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={onOpenNewTab}
            sx={{
              bgcolor: '#0284C7',
              color: '#FFFFFF !important',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#0369A1' }
            }}
          >
            Open in New Tab
          </Button>
        )}
      </Paper>

      {/* Tabs Navigation */}
      <Paper elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2.5, bgcolor: '#FFFFFF' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.84rem',
              py: 1.5,
              minHeight: 44
            }
          }}
        >
          <Tab icon={<LightbulbIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Quick Start & Flow Concepts" />
          <Tab icon={<DeviceHubIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Visual Nodes Reference" />
          <Tab icon={<TouchAppIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Canvas Navigation & Tools" />
          <Tab icon={<CodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="4. Smart Variables & Dynamic Tags" />
          <Tab icon={<StorefrontIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="5. Master Data & Appointment Integration" />
          <Tab icon={<CheckCircleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="6. Testing & Deployment Best Practices" />
        </Tabs>
      </Paper>

      {/* TAB 0: Quick Start & Flow Concepts */}
      {activeTab === 0 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              What is a Visual Process Workflow?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 2.5 }}>
              A <strong>Process Workflow</strong> is an automated visual flow diagram that orchestrates conversations between your WhatsApp business number and your customers. Whenever a customer types a message or taps an interactive button, the workflow engine automatically evaluates the conversation state, routes through matching decision nodes, sends customized replies, or books real-time calendar appointments.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: '#E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>1</Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>The Trigger</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Every flow begins with a <strong>Start Trigger</strong>. You define trigger words (e.g. <em>"hi"</em>, <em>"book"</em>, <em>"pricing"</em>). When a customer sends any matching keyword, this flow activates instantly.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: '#E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>2</Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Conversational Steps</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Attach <strong>Message & Button Cards</strong>, <strong>AI Responders</strong>, or <strong>Data Capture Forms</strong>. The customer is guided step-by-step with interactive button options to select from.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: '#E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>3</Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Outcome / Integration</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      The workflow completes the user's intent: booking an appointment into your master calendar, forwarding product catalogs, or transferring to a live human agent.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Why Did a Pre-Populated Template Appear When Opening the Designer?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 2 }}>
              To help users visualize how a fully interactive flow looks with branched buttons, connectors, and product cards, the designer provides pre-configured sample workflows.
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <FlashOnIcon sx={{ color: '#0284C7', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                    Quick Tip: You Can Start with a Clean Canvas Anytime
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1E3A8A', fontSize: '0.82rem', mt: 0.5 }}>
                    Use the <strong>"Start Blank Canvas"</strong> or <strong>"Minimal Starter"</strong> option in the top toolbar to clear all sample nodes and start creating your own customized flow from scratch with just 1 click.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Stack>
      )}

      {/* TAB 1: Visual Nodes Reference */}
      {activeTab === 1 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search nodes by name, function, or keywords (e.g. 'buttons', 'trigger', 'split', 'AI')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Paper>

          <Grid container spacing={2}>
            {filteredNodes.map((node, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: node.color, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          bgcolor: `${node.color}15`,
                          color: node.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          border: `1px solid ${node.color}40`
                        }}
                      >
                        {node.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {node.name}
                        </Typography>
                        <Chip
                          label={node.badge}
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.3, bgcolor: '#F1F5F9', color: '#475569' }}
                        />
                      </Box>
                    </Stack>
                  </Stack>

                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem', mb: 1.5, lineHeight: 1.5 }}>
                    {node.summary}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.8 }}>
                    KEY CAPABILITIES & SETTINGS:
                  </Typography>
                  <Stack spacing={0.6}>
                    {node.details.map((detail, dIdx) => (
                      <Stack direction="row" spacing={1} alignItems="flex-start" key={dIdx}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: node.color, mt: 0.9, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          {detail}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      {/* TAB 2: Canvas Navigation & Tools */}
      {activeTab === 2 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
              Mastering the 2D Visual Canvas
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284C7', mb: 0.8 }}>
                    1. Dragging & Dropping Nodes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Select any block from the left <strong>Component Palette</strong> (Controls or Messaging) and drag it directly onto the 2D canvas area. Once placed, you can drag the card header anywhere on the canvas to organize your layout.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284C7', mb: 0.8 }}>
                    2. Connecting Ports with Interactive Arrows
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Hover over any node's right-side connection handle (circular port or specific button handle). Click and drag the arrow line to the left-side input handle of your target node to create a persistent connection.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#B45309', mb: 0.8 }}>
                    ⚡ 3. Smart Arrow Insertion (Drop on Arrow)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#92400E', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    If you drop a new node directly onto any existing connecting arrow line, the workflow engine automatically splits the arrow and inserts your new card seamlessly between the two existing nodes!
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284C7', mb: 0.8 }}>
                    4. Shortcuts & Viewport Navigation
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    • <strong>Undo / Redo:</strong> Press <code>Ctrl + Z</code> and <code>Ctrl + Y</code><br />
                    • <strong>Pan Canvas:</strong> Click and drag on empty canvas background<br />
                    • <strong>Zoom:</strong> Use mouse wheel or top toolbar <code>+</code> / <code>-</code> zoom buttons<br />
                    • <strong>Center Focus:</strong> Click the Center View target icon in the toolbar
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      )}

      {/* TAB 3: Smart Variables & Dynamic Tags */}
      {activeTab === 3 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Personalizing Messages with Dynamic Tags
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, mb: 2.5 }}>
              You can insert real-time customer data and booking details into any text card by typing <code>{'{{tag}}'}</code> placeholders. The system replaces these tags automatically before delivering the message on WhatsApp.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>Dynamic Variable Tag</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>Description & Source</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>Rendered Output Example</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dynamicVariables.map((row, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284C7' }}>
                        {row.tag}
                      </TableCell>
                      <TableCell sx={{ color: '#334155', fontSize: '0.84rem' }}>
                        {row.desc}
                      </TableCell>
                      <TableCell sx={{ color: '#16A34A', fontWeight: 600, fontSize: '0.84rem' }}>
                        {row.example}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534', mb: 0.5 }}>
                Example Message Template:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#14532D', fontSize: '0.82rem' }}>
                "Hello {'{{customerName}}'}! Your appointment for *{'{{serviceName}}'}* with *{'{{staffName}}'}* is confirmed for *{'{{appointmentDate}}'}* at *{'{{appointmentTime}}'}*. Reply '1' to reschedule."
              </Typography>
            </Box>
          </Paper>
        </Stack>
      )}

      {/* TAB 4: Master Data & Appointment Integration */}
      {activeTab === 4 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Connecting Master Data to Your WhatsApp Flows
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, mb: 2.5 }}>
              Your Process Flow connects directly to the core configuration modules in your platform:
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                    📅 Appointment Services & Durations
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    When a workflow card triggers an appointment flow, it pulls active services, their configured durations (e.g. 30m, 1h), prices, and buffers directly from the <strong>Appointment Services</strong> master table.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                    👨‍⚕️ Staff & Specialist Availability
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    The bot automatically checks assigned specialists and their weekly schedules to avoid double bookings and display available appointment times in real time.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                    🕒 Operating Hours & Booking Rules
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    Follows your 5-step rules wizard (Minimum Advance Notice, Buffer Times, Auto-Confirmation, and Max Advance Booking Window).
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                    🤖 Response Rules & Fallback
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    If a customer types something outside the active flow, platform <strong>Response Rules</strong> take over to provide intelligent FAQ answers or connect the user to support.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      )}

      {/* TAB 5: Testing & Deployment Best Practices */}
      {activeTab === 5 && (
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
              Testing with the Live WhatsApp Simulator
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284C7', mb: 0.5 }}>
                  Step 1: Click "Run / Test" in the Top Toolbar
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                  This opens the interactive smartphone simulator on the right-side panel without affecting your live WhatsApp customers.
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284C7', mb: 0.5 }}>
                  Step 2: Type Trigger Keywords or Tap Buttons
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                  Type keywords (e.g. <code>hi</code>) to trigger the initial greeting card. Click any button to see the simulator follow the exact branch paths you wired on the canvas in real time.
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #16A34A', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16A34A', mb: 0.5 }}>
                  Step 3: Click "Deploy Workflow"
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                  Once your flow tests cleanly in the simulator, click <strong>Deploy Workflow</strong> to make it active 24/7 on your WhatsApp Business number.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
