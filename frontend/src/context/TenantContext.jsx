import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [screenPermissions, setScreenPermissions] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_screen_permissions');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const [oauthEnforced, setOauthEnforced] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_oauth_enforced');
      return cached ? JSON.parse(cached) : false;
    } catch (e) {
      return false;
    }
  });

  const [oauthStatus, setOauthStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_oauth_status');
      return cached ? JSON.parse(cached) : { configured: false, verified: false, clientId: '' };
    } catch (e) {
      return { configured: false, verified: false, clientId: '' };
    }
  });

  const [customerCode, setCustomerCode] = useState('WA01');
  const [loading, setLoading] = useState(false);

  const fetchScreens = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tenant/screens');
      if (res.data?.success) {
        if (res.data.screenPermissions) {
          setScreenPermissions(res.data.screenPermissions);
          localStorage.setItem('wa_screen_permissions', JSON.stringify(res.data.screenPermissions));
        }
        if (res.data.oauthEnforced !== undefined) {
          setOauthEnforced(Boolean(res.data.oauthEnforced));
          localStorage.setItem('wa_oauth_enforced', JSON.stringify(res.data.oauthEnforced));
        }
        if (res.data.oauthStatus) {
          setOauthStatus(res.data.oauthStatus);
          localStorage.setItem('wa_oauth_status', JSON.stringify(res.data.oauthStatus));
        }
        if (res.data.customerCode) setCustomerCode(res.data.customerCode);
      }
    } catch (err) {
      console.warn('[TenantContext] Error fetching tenant screens:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreens();

    const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
    const sseUrl = `http://${host}:5000/api/tenant/stream`;
    let eventSource = null;

    try {
      eventSource = new EventSource(sseUrl);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.screenPermissions) {
            setScreenPermissions(data.screenPermissions);
            localStorage.setItem('wa_screen_permissions', JSON.stringify(data.screenPermissions));
          }
          if (data && data.oauthEnforced !== undefined) {
            setOauthEnforced(Boolean(data.oauthEnforced));
            localStorage.setItem('wa_oauth_enforced', JSON.stringify(data.oauthEnforced));
          }
          if (data && data.oauthStatus) {
            setOauthStatus(data.oauthStatus);
            localStorage.setItem('wa_oauth_status', JSON.stringify(data.oauthStatus));
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn('[TenantContext] SSE setup error:', e);
    }

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchScreens();
      }
    };
    window.addEventListener('focus', fetchScreens);
    window.addEventListener('storage', fetchScreens);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', fetchScreens);
      window.removeEventListener('storage', fetchScreens);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchScreens]);

  const isOauthLocked = Boolean(oauthEnforced && (!oauthStatus?.verified || !oauthStatus?.configured));

  return (
    <TenantContext.Provider value={{
      screenPermissions,
      customerCode,
      oauthEnforced,
      oauthStatus,
      isOauthLocked,
      setOauthStatus,
      refreshScreens: fetchScreens,
      loading
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext) || {
  screenPermissions: {},
  customerCode: 'WA01',
  oauthEnforced: false,
  oauthStatus: { configured: false, verified: false, clientId: '' },
  isOauthLocked: false,
  setOauthStatus: () => {},
  refreshScreens: () => {},
  loading: false
};
