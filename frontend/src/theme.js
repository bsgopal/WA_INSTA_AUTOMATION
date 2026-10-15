import { createTheme } from '@mui/material/styles';

export const renicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#84cc16', // Renic Tech Lime Green
      light: '#a3e635',
      dark: '#65a30d',
      contrastText: '#0f172a', // Deep Slate text for high contrast on lime
      50: '#f7fee7',
      100: '#ecfccb',
      200: '#d9f99d',
      300: '#bef264',
      400: '#a3e635',
      500: '#84cc16',
      600: '#65a30d',
      700: '#4d7c0f',
      800: '#3f6212',
      900: '#365314',
    },
    secondary: {
      main: '#0f172a', // Renic Tech Deep Charcoal / Obsidian Slate
      light: '#1e293b',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
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
      fontSize: '2.25rem',
      fontWeight: 800,
      lineHeight: 1.2,
      color: '#0f172a',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 800,
      lineHeight: 1.25,
      color: '#0f172a',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#0f172a',
      letterSpacing: '-0.015em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 700,
      lineHeight: 1.4,
      color: '#0f172a',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#0f172a',
    },
    h6: {
      fontSize: '1rem',
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
      fontWeight: 700,
      fontSize: '0.875rem',
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
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          padding: '8px 18px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          color: '#ffffff !important',
          '& .MuiButton-startIcon': { color: '#ffffff !important' },
          '& .MuiButton-endIcon': { color: '#ffffff !important' },
          '& svg': { color: '#ffffff !important' },
        },
        containedPrimary: {
          backgroundColor: '#10b981',
          color: '#ffffff !important',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
          '&:hover': {
            backgroundColor: '#059669',
            color: '#ffffff !important',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
          },
          '& .MuiButton-startIcon': { color: '#ffffff !important' },
          '& .MuiButton-endIcon': { color: '#ffffff !important' },
          '& svg': { color: '#ffffff !important' },
        },
        containedSecondary: {
          backgroundColor: '#0f172a',
          color: '#ffffff !important',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
          '&:hover': {
            backgroundColor: '#1e293b',
            color: '#ffffff !important',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.35)',
          },
          '& .MuiButton-startIcon': { color: '#ffffff !important' },
          '& .MuiButton-endIcon': { color: '#ffffff !important' },
          '& svg': { color: '#ffffff !important' },
        },
        outlinedPrimary: {
          borderColor: '#10b981',
          color: '#059669',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderColor: '#059669',
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
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
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
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#84cc16',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#84cc16',
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
          fontWeight: 700,
          fontSize: '0.75rem',
        },
        colorPrimary: {
          backgroundColor: '#84cc16',
          color: '#0f172a',
        },
        colorSecondary: {
          backgroundColor: '#0f172a',
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '1px 0 10px 0 rgba(0,0,0,0.03)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 14px',
          color: '#475569',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(132, 204, 22, 0.14)',
            color: '#3f6212',
            fontWeight: 700,
            '& .MuiListItemIcon-root': {
              color: '#65a30d',
            },
            '&:hover': {
              backgroundColor: 'rgba(132, 204, 22, 0.22)',
            },
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            '& .MuiListItemIcon-root': {
              color: '#65a30d',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#64748b',
          minWidth: 36,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#f1f5f9',
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 700,
          color: '#0f172a',
          fontSize: '0.8125rem',
          borderBottom: '2px solid #e2e8f0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.2)',
        },
      },
    },
  },
});

export default renicTheme;
