import React, { useState } from 'react';
import { IconButton, Button, Tooltip, Box, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

/**
 * Robust clipboard copy function with fallback for non-HTTPS / Electron environments
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, falling back to textarea execCommand', err);
  }

  // Fallback using textarea element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return !!successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
}

/**
 * Reusable CopyButton component with animated feedback
 * @param {string} text - The text/URL to copy
 * @param {string} label - Optional text label to display next to icon (if variant="button")
 * @param {string} tooltip - Custom tooltip text (default: 'Copy to clipboard')
 * @param {'icon' | 'button' | 'chip'} variant - Display style
 * @param {'small' | 'medium'} size - Button size
 * @param {Function} onCopied - Optional callback when copied
 */
export default function CopyButton({
  text,
  label = '',
  tooltip = 'Copy to clipboard',
  variant = 'icon',
  size = 'small',
  onCopied,
  sx = {}
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e?.stopPropagation?.();
    if (!text) return;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (onCopied) onCopied(text);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  if (variant === 'button') {
    return (
      <Tooltip title={copied ? 'Copied to clipboard!' : tooltip} arrow>
        <Button
          size={size}
          variant="outlined"
          onClick={handleCopy}
          startIcon={
            copied ? (
              <CheckIcon sx={{ fontSize: size === 'small' ? 14 : 16, color: '#16A34A' }} />
            ) : (
              <ContentCopyIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
            )
          }
          sx={{
            textTransform: 'none',
            fontSize: size === 'small' ? '0.75rem' : '0.82rem',
            fontWeight: 600,
            borderRadius: '6px',
            borderColor: copied ? '#86EFAC' : '#E2E8F0',
            bgcolor: copied ? '#F0FDF4' : 'transparent',
            color: copied ? '#15803D' : '#475569',
            '&:hover': {
              bgcolor: copied ? '#DCFCE7' : '#F8FAFC',
              borderColor: copied ? '#4ADE80' : '#CBD5E1'
            },
            ...sx
          }}
        >
          {copied ? 'Copied!' : label || 'Copy'}
        </Button>
      </Tooltip>
    );
  }

  if (variant === 'chip') {
    return (
      <Tooltip title={copied ? 'Copied!' : tooltip} arrow>
        <Box
          onClick={handleCopy}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1,
            py: 0.4,
            borderRadius: '6px',
            bgcolor: copied ? '#DCFCE7' : '#F1F5F9',
            border: '1px solid',
            borderColor: copied ? '#86EFAC' : '#E2E8F0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            userSelect: 'none',
            '&:hover': {
              bgcolor: copied ? '#BBF7D0' : '#E2E8F0'
            },
            ...sx
          }}
        >
          {copied ? (
            <CheckIcon sx={{ fontSize: 13, color: '#16A34A' }} />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 13, color: '#64748B' }} />
          )}
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: copied ? '#15803D' : '#334155' }}>
            {copied ? 'Copied!' : label || text}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  // Default: Icon only
  return (
    <Tooltip title={copied ? 'Copied to clipboard!' : tooltip} arrow>
      <IconButton
        size={size}
        onClick={handleCopy}
        sx={{
          p: 0.6,
          color: copied ? '#16A34A' : '#64748B',
          bgcolor: copied ? '#F0FDF4' : 'transparent',
          borderRadius: '6px',
          border: copied ? '1px solid #BBF7D0' : 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: copied ? '#DCFCE7' : '#F1F5F9',
            color: copied ? '#15803D' : '#1E293B'
          },
          ...sx
        }}
      >
        {copied ? (
          <CheckIcon sx={{ fontSize: size === 'small' ? 15 : 18 }} />
        ) : (
          <ContentCopyIcon sx={{ fontSize: size === 'small' ? 15 : 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
