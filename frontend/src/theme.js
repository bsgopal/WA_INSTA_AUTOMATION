import { createTheme } from '@mui/material/styles';

/**
 * RENIC CLOUD - Enterprise Design System (Obsidian & Sapphire)
 * Professional B2B SaaS theme inspired by Stripe, Linear & Supabase
 */
export const renicTheme = createTheme({
  palette: {
    mode: 'light',
    // Primary: Deep Obsidian Slate (Clean, Executive, Authoritative)
    primary: {
      main: '#0f172a', // Slate 900
      light: '#1e293b', // Slate 800
      dark: '#020617', // Slate 950
      contrastText: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Secondary / Accent: Electric Sapphire / Indigo (Active states, brand accents)
    secondary: {
      main: '#4f46e5', // Indigo 600
      light: '#6366f1', // Indigo 500
      dark: '#4338ca', // Indigo 700
      contrastText: '#ffffff',
    },
    // Success / WhatsApp: Refined Emerald (Live connections, verified checks)
    success: {
      main: '#059669', // Emerald 600
      light: '#10b981', // Emerald 500
      dark: '#047857',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706', // Amber 600
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Red 600
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#2563eb', // Blue 600
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Modern Slate Canvas
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Deep Slate 900
      secondary: '#64748b', // Slate 500
      disabled: '#94a3b8',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1.25,
      color: '#0f172a',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.625rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#0f172a',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.375rem',
      fontWeight: 700,
      lineHeight: 1.35,
      color: '#0f172a',
      letterSpacing: '-0.015em',
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 700,
      lineHeight: 1.4,
      color: '#0f172a',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.45,
      color: '#0f172a',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#0f172a',
    },
    subtitle1: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      color: '#0f172a',
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      color: '#64748b',
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#334155',
    },
    body2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.55,
      color: '#64748b',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8125rem',
      letterSpacing: '0.1px',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      color: '#94a3b8',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a', // Renic Obsidian Slate Header
          color: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '7px 16px',
          fontSize: '0.8125rem',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          color: '#ffffff !important',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0f172a',
          color: '#ffffff !important',
          '&:hover': {
            backgroundColor: '#1e293b',
          },
        },
        containedSecondary: {
          backgroundColor: '#4f46e5',
          color: '#ffffff !important',
          '&:hover': {
            backgroundColor: '#4338ca',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#334155',
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
          },
        },
        outlinedPrimary: {
          borderColor: '#e2e8f0',
          color: '#0f172a',
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f1f5f9',
            borderColor: '#94a3b8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        },
        elevation0: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            fontSize: '0.8125rem',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4f46e5',
              borderWidth: 1.5,
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
          fontSize: '0.75rem',
        },
        colorPrimary: {
          backgroundColor: '#0f172a',
          color: '#ffffff',
        },
        colorSecondary: {
          backgroundColor: '#eef2ff',
          color: '#4338ca',
          border: '1px solid #c7d2fe',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '7px 12px',
          color: '#475569',
          fontSize: '0.8125rem',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            fontWeight: 700,
            '& .MuiListItemIcon-root': {
              color: '#4f46e5',
            },
            '&:hover': {
              backgroundColor: '#e2e8f0',
            },
          },
          '&:hover': {
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            '& .MuiListItemIcon-root': {
              color: '#4f46e5',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#64748b',
          minWidth: 34,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#f1f5f9',
          padding: '11px 16px',
          fontSize: '0.8125rem',
        },
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 700,
          color: '#475569',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
        },
      },
    },
  },
});

export default renicTheme;
