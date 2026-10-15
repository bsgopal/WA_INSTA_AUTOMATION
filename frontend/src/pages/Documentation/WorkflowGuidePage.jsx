import React from 'react';
import { Box, Container, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchemaIcon from '@mui/icons-material/Schema';
import WorkflowDocumentationGuide from '../../components/Documentation/WorkflowDocumentationGuide';

export default function WorkflowGuidePage() {
  return (
    <Box
      sx={{
        bgcolor: '#F8FAFC',
        height: '100vh',
        maxHeight: '100vh',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Top Sticky Navbar */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: '#FFFFFF',
          px: { xs: 2, md: 4 },
          py: 1.5,
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ bgcolor: '#0284C7', p: 0.6, borderRadius: '6px', display: 'flex' }}>
            <SchemaIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Enterprise Workflow Knowledge Base & User Guide
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.close();
            }
          }}
          sx={{
            borderColor: '#475569',
            color: '#FFFFFF !important',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { borderColor: '#94A3B8', bgcolor: 'rgba(255,255,255,0.05)' }
          }}
        >
          Return / Back
        </Button>
      </Box>

      <Box sx={{ flex: 1, py: 3, pb: 8 }}>
        <Container maxWidth="lg">
          <WorkflowDocumentationGuide inModal={false} />
        </Container>
      </Box>
    </Box>
  );
}

