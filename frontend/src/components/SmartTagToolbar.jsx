// WA_INSTA_AUTOMATION/frontend/src/components/SmartTagToolbar.jsx
import React, { useState } from 'react';
import { Box, Chip, Stack, Typography, Tooltip, Collapse } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Clean, non-technical tag definitions
export const SMART_TAGS = [
  { id: 'customer_name', label: '👤 Customer Name', token: '[Customer Name]', sample: 'Priya Sharma' },
  { id: 'customer_phone', label: '📱 Mobile Number', token: '[Mobile Number]', sample: '+91 98765 43210' },
  { id: 'store_name', label: '🏢 Store Name', token: '[Store Name]', sample: 'Renic Silks & Textiles' },
  { id: 'bill_amount', label: '💰 Bill Amount', token: '[Bill Amount]', sample: '₹4,250' },
  { id: 'order_id', label: '📦 Order ID', token: '[Order ID]', sample: '#TX-8042' },
  { id: 'today_date', label: '📅 Today\'s Date', token: '[Today\'s Date]', sample: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
  { id: 'store_address', label: '📍 Store Address', token: '[Store Address]', sample: 'Commercial Complex, Main Road' }
];

/**
 * Replace all smart tags in a text string with sample customer data for live preview
 * @param {string} text
 * @returns {string}
 */
export function previewTextWithSampleData(text) {
  if (!text) return '';
  let resolved = String(text);
  SMART_TAGS.forEach((tag) => {
    resolved = resolved.split(tag.token).join(tag.sample);
    // Also support legacy curly brace tokens if any exist
    if (tag.id === 'customer_name') {
      resolved = resolved.replace(/\{name\}|\{\{name\}\}/gi, tag.sample);
    }
    if (tag.id === 'customer_phone') {
      resolved = resolved.replace(/\{phone\}|\{\{phone\}\}/gi, tag.sample);
    }
  });
  return resolved;
}

/**
 * SmartTagToolbar Component
 * Renders 1-click friendly tag chips to insert dynamic details at the EXACT cursor position
 */
export default function SmartTagToolbar({
  targetInputRef,
  onInsertTag,
  currentText = '',
  showPreview = true,
  label = 'Click to insert customer details:'
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleTagClick = (tag, e) => {
    if (e) e.preventDefault();
    const token = tag.token;

    // Resolve the underlying textarea or input element
    let inputEl = null;
    if (targetInputRef && targetInputRef.current) {
      inputEl = targetInputRef.current;
      if (inputEl.querySelector) {
        const inner = inputEl.querySelector('textarea, input');
        if (inner) inputEl = inner;
      }
    }

    const text = typeof currentText === 'string' ? currentText : (inputEl?.value || '');

    // Get current cursor selection (defaults to end if unselected)
    let start = text.length;
    let end = text.length;

    if (inputEl && typeof inputEl.selectionStart === 'number') {
      start = inputEl.selectionStart;
      end = inputEl.selectionEnd ?? start;
    }

    // Insert variable token right at cursor position
    const before = text.slice(0, start);
    const after = text.slice(end);
    const newText = before + token + after;
    const newCursor = start + token.length;

    // Update DOM element and restore cursor focus
    if (inputEl) {
      inputEl.value = newText;
      inputEl.focus();
      try {
        inputEl.setSelectionRange(newCursor, newCursor);
      } catch (err) {
        // Ignore selection error on non-selectable inputs
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (typeof onInsertTag === 'function') {
      onInsertTag(token, newText, newCursor);
    }
  };

  const samplePreview = previewTextWithSampleData(currentText);

  return (
    <Box sx={{ mb: 1.25, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <AutoAwesomeIcon sx={{ fontSize: 15, color: '#10b981' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
            {label}
          </Typography>
        </Stack>

        {showPreview && currentText && (
          <Chip
            icon={<VisibilityIcon sx={{ fontSize: '13px !important' }} />}
            label={previewOpen ? 'Hide Sample Preview' : '👁️ Live Customer Preview'}
            size="small"
            onClick={() => setPreviewOpen(!previewOpen)}
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              bgcolor: previewOpen ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
              color: previewOpen ? '#10b981' : '#94a3b8',
              border: `1px solid ${previewOpen ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'}`
            }}
          />
        )}
      </Box>

      {/* Chips list */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {SMART_TAGS.map((tag) => (
          <Tooltip key={tag.id} title={`Click to insert ${tag.label} into message`}>
            <Chip
              label={tag.label}
              size="small"
              onMouseDown={(e) => {
                // Prevent textarea from blurring and losing cursor selection
                e.preventDefault();
              }}
              onClick={(e) => handleTagClick(tag, e)}
              sx={{
                height: 25,
                fontSize: '0.72rem',
                fontWeight: 650,
                cursor: 'pointer',
                bgcolor: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: '#e2e8f0',
                  borderColor: '#94a3b8',
                  transform: 'translateY(-1px)'
                }
              }}
            />
          </Tooltip>
        ))}
      </Box>

      {/* Live Preview Card */}
      {showPreview && (
        <Collapse in={previewOpen && Boolean(currentText)}>
          <Box
            sx={{
              mt: 1.25,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: '#0f172a',
              border: '1px solid rgba(16,185,129,0.3)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>
                WHATSAPP LIVE PREVIEW (CUSTOMER VIEW)
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.25,
                borderRadius: '8px',
                bgcolor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1.45
              }}
            >
              {samplePreview}
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
