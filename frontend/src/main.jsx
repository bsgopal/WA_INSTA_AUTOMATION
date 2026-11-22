import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import renicTheme from './theme.js';
import './index.css';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import ErrorBoundary from './components/ErrorBoundary.jsx';
import { TenantProvider } from './context/TenantContext.jsx';
import { BackgroundMessagingProvider } from './context/BackgroundMessagingContext.jsx';

// Enterprise Console Shield & Source Code Exposure Protection
if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
  try {
    const noop = () => {};
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;
    window.console.dir = noop;
    window.console.trace = noop;
    window.console.warn(
      '%c[RENIC SECURITY NOTICE] Proprietary Software • All Rights Reserved.\nUnauthorized inspection, reverse-engineering, or tampering is strictly prohibited under international copyright law.',
      'color: #4f46e5; font-size: 13px; font-weight: bold;'
    );
  } catch (e) {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={renicTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <TenantProvider>
            <BackgroundMessagingProvider>
              <App />
            </BackgroundMessagingProvider>
          </TenantProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
);
