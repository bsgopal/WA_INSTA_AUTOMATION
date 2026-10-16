import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { resolveCustomerCode } from '../services/clientGateway';

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
      return cached !== null ? JSON.parse(cached) : true;
    } catch (e) {
      return true;
    }
  });

  const [oauthStatus, setOauthStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_oauth_status');
      return cached ? JSON.parse(cached) : { configured: false, verified: false, clientId: '', clientSecret: '' };
    } catch (e) {
      return { configured: false, verified: false, clientId: '', clientSecret: '' };
    }
  });

  const [customerCode, setCustomerCode] = useState(() => resolveCustomerCode() || '');
  const [clientName, setClientName] = useState(() => localStorage.getItem('wa_client_name') || '');
  const [whatsappSenderMode, setWhatsappSenderMode] = useState(() => localStorage.getItem('wa_sender_mode') || 'DOCKER');
  const [dockerThrottleSeconds, setDockerThrottleSeconds] = useState(() => {
    const cached = localStorage.getItem('wa_docker_throttle');
    return cached ? Number(cached) : 6;
  });
  const [businessType, setBusinessType] = useState(() => localStorage.getItem('wa_business_type') || 'salon');
  const [solutionMode, setSolutionMode] = useState(() => localStorage.getItem('wa_solution_mode') || 'standalone');
  const [solutionModes, setSolutionModes] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_solution_modes');
      return cached ? JSON.parse(cached) : ['standalone'];
    } catch (e) {
      return ['standalone'];
    }
  });
  const [customTerminology, setCustomTerminology] = useState(() => {
    try {
      const cached = localStorage.getItem('wa_custom_terminology');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const [licenseActive, setLicenseActive] = useState(() => localStorage.getItem('wa_license_active') !== 'false');
  const [licenseRequired, setLicenseRequired] = useState(() => localStorage.getItem('wa_license_required') === 'true');
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('wa_is_locked') === 'true');
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
        if (res.data.customerCode) {
          setCustomerCode(res.data.customerCode);
        }
        if (res.data.clientName) {
          setClientName(res.data.clientName);
          localStorage.setItem('wa_client_name', res.data.clientName);
        }
        if (res.data.whatsappSenderMode) {
          setWhatsappSenderMode(res.data.whatsappSenderMode);
          localStorage.setItem('wa_sender_mode', res.data.whatsappSenderMode);
        }
        if (res.data.dockerThrottleSeconds !== undefined) {
          setDockerThrottleSeconds(Number(res.data.dockerThrottleSeconds));
          localStorage.setItem('wa_docker_throttle', String(res.data.dockerThrottleSeconds));
        }
        if (res.data.businessType) {
          setBusinessType(res.data.businessType);
          localStorage.setItem('wa_business_type', res.data.businessType);
        }
        if (res.data.solutionMode) {
          setSolutionMode(res.data.solutionMode);
          localStorage.setItem('wa_solution_mode', res.data.solutionMode);
        }
        if (res.data.solutionModes) {
          setSolutionModes(res.data.solutionModes);
          localStorage.setItem('wa_solution_modes', JSON.stringify(res.data.solutionModes));
        }
        if (res.data.customTerminology) {
          setCustomTerminology(res.data.customTerminology);
          localStorage.setItem('wa_custom_terminology', JSON.stringify(res.data.customTerminology));
        }
        if (res.data.active !== undefined) {
          setLicenseActive(Boolean(res.data.active));
          localStorage.setItem('wa_license_active', String(res.data.active));
        }
        if (res.data.licenseRequired !== undefined) {
          setLicenseRequired(Boolean(res.data.licenseRequired));
          localStorage.setItem('wa_license_required', String(res.data.licenseRequired));
        }
        if (res.data.isLocked !== undefined) {
          setIsLocked(Boolean(res.data.isLocked));
          localStorage.setItem('wa_is_locked', String(res.data.isLocked));
        }
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
          if (data && data.clientName) {
            setClientName(data.clientName);
            localStorage.setItem('wa_client_name', data.clientName);
          }
          if (data && data.customerCode) {
            setCustomerCode(data.customerCode);
          }
          if (data && data.whatsappSenderMode) {
            setWhatsappSenderMode(data.whatsappSenderMode);
            localStorage.setItem('wa_sender_mode', data.whatsappSenderMode);
          }
          if (data && data.dockerThrottleSeconds !== undefined) {
            setDockerThrottleSeconds(Number(data.dockerThrottleSeconds));
            localStorage.setItem('wa_docker_throttle', String(data.dockerThrottleSeconds));
          }
          if (data && data.businessType) {
            setBusinessType(data.businessType);
            localStorage.setItem('wa_business_type', data.businessType);
          }
          if (data && data.solutionMode) {
            setSolutionMode(data.solutionMode);
            localStorage.setItem('wa_solution_mode', data.solutionMode);
          }
          if (data && data.solutionModes) {
            setSolutionModes(data.solutionModes);
            localStorage.setItem('wa_solution_modes', JSON.stringify(data.solutionModes));
          }
          if (data && data.customTerminology) {
            setCustomTerminology(data.customTerminology);
            localStorage.setItem('wa_custom_terminology', JSON.stringify(data.customTerminology));
          }
          if (data && data.active !== undefined) {
            setLicenseActive(Boolean(data.active));
            localStorage.setItem('wa_license_active', String(data.active));
          }
          if (data && data.licenseRequired !== undefined) {
            setLicenseRequired(Boolean(data.licenseRequired));
            localStorage.setItem('wa_license_required', String(data.licenseRequired));
          }
          if (data && data.isLocked !== undefined) {
            setIsLocked(Boolean(data.isLocked));
            localStorage.setItem('wa_is_locked', String(data.isLocked));
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
  const isLicenseLocked = Boolean(!licenseActive || licenseRequired || isLocked);

  return (
    <TenantContext.Provider value={{
      screenPermissions,
      customerCode,
      clientName,
      whatsappSenderMode,
      dockerThrottleSeconds,
      businessType,
      solutionMode,
      solutionModes,
      customTerminology,
      licenseActive,
      licenseRequired,
      isLocked,
      isLicenseLocked,
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
  customerCode: '',
  clientName: '',
  whatsappSenderMode: 'DOCKER',
  dockerThrottleSeconds: 6,
  businessType: 'salon',
  solutionMode: 'standalone',
  solutionModes: ['standalone'],
  customTerminology: {},
  licenseActive: false,
  licenseRequired: true,
  isLocked: false,
  isLicenseLocked: true,
  oauthEnforced: false,
  oauthStatus: { configured: false, verified: false, clientId: '' },
  isOauthLocked: false,
  setOauthStatus: () => {},
  refreshScreens: () => {},
  loading: false
};
