import React from 'react';
import { createTheme } from '@mui/material/styles';
import Zoom from '@mui/material/Zoom';

const ZoomTransition = React.forwardRef(function Transition(props, ref) {
  return <Zoom ref={ref} {...props} />;
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Indigo 500
      light: '#818cf8', // Indigo 400
      dark: '#4f46e5', // Indigo 600
      50: '#e0e7ff',
      100: '#c7d2fe',
      200: '#a5b4fc',
      300: '#818cf8',
      400: '#6366f1',
      500: '#4f46e5',
      600: '#4338ca',
      700: '#3730a3',
      800: '#1e1b4b',
    },
    secondary: {
      main: '#06b6d4', // Teal 500
      light: '#22d3ee',
      dark: '#0891b2',
    },
    success: {
      main: '#10b981', // Emerald 500
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // Amber 500
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Red 500
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6', // Blue 500
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
      disabled: '#94a3b8', // Slate 400
    },
    divider: '#f1f5f9', // Slate 100
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#0f172a',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#0f172a',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.4,
      color: '#0f172a',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.4,
      color: '#0f172a',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#0f172a',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
      color: '#0f172a',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#475569',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.57,
      color: '#475569',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      color: '#0f172a',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      color: '#475569',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      color: '#94a3b8',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 6,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.8125rem',
          height: '28px',
        },
        sizeMedium: {
          padding: '6px 16px',
          fontSize: '0.875rem',
          height: '36px',
        },
        sizeLarge: {
          padding: '8px 22px',
          fontSize: '0.9375rem',
          height: '42px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.16)',
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: '#cbd5e1',
          '&:hover': {
            borderWidth: 1,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0', // Slate 200
          background: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        },
        elevation0: {
          background: '#ffffff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#6366f1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#f1f5f9',
          padding: '10px 16px',
        },
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          color: '#0f172a',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        TransitionComponent: ZoomTransition,
      },
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export default theme;
