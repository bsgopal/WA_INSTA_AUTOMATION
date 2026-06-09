import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#f8f9fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      disabled: '#999999',
    },
    divider: '#e8eef7',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2.5rem' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2rem' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.75rem' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.5rem' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1rem' },
    subtitle1: { fontWeight: 500, fontSize: '1rem' },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontWeight: 400, fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.57 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.25px',
      fontSize: '0.9375rem',
    },
    caption: { fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.66 },
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
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e8eef7',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid #e8eef7',
        },
        elevation0: {
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        },
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid #e8eef7',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e8eef7',
          backgroundColor: '#ffffff',
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '0 24px 24px 0',
          margin: '4px 8px 4px 0',
          padding: '8px 16px',
          color: '#666666',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 600,
            '& .MuiListItemIcon-root': {
              color: '#1976d2',
            },
            '&:hover': {
              backgroundColor: '#bbdefb',
            }
          },
          '&:hover': {
            backgroundColor: '#f5f7fa',
          }
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#666666',
          minWidth: '40px',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e8eef7',
            },
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e8eef7',
          padding: '16px',
        },
        head: {
          backgroundColor: '#f5f7fa',
          fontWeight: 600,
          color: '#1a1a1a',
        },
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #e8eef7',
        },
      }
    },
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
