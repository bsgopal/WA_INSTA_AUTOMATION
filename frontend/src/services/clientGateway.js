// renic-automation-frontend/src/services/clientGateway.js
// Enterprise Destination & API Gateway SDK
import axios from 'axios';
import { API_BASE, API_ORIGIN } from '../api/base';

class TenantAPIGateway {
  constructor() {
    this.tokenCache = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.hqTelemetryUrl = import.meta.env.VITE_RENIC_HQ_URL || 'http://localhost:5050';
  }

  /**
   * Resolves the active customer code from storage, subdomain, or query params.
   */
  resolveCustomerCode() {
    if (typeof window !== 'undefined' && window.location) {
      // 1. Query param in window.location.search OR window.location.hash
      const urlParams = new URLSearchParams(window.location.search);
      let qCode = urlParams.get('tenant') || urlParams.get('customerCode') || urlParams.get('clientId');

      if (!qCode && window.location.hash && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        qCode = hashParams.get('tenant') || hashParams.get('customerCode') || hashParams.get('clientId');
      }

      if (qCode) {
        const clean = qCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (clean && clean !== 'default') {
          if (localStorage.getItem('customerCode') !== clean) {
            localStorage.setItem('customerCode', clean);
          }
          return clean;
        }
      }

      // 2. Stored session fallback (prioritize stored session over host parsing)
      const stored = localStorage.getItem('customerCode');
      const invalidCodes = ['wa', 'default', 'undefined', 'null', 'vercel', 'wa-insta-automation'];
      if (stored && !invalidCodes.includes(stored) && !stored.includes('vercel') && !stored.includes('automation')) {
        return stored.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      }

      // 3. Subdomain extraction (ONLY for custom tenant domains, NEVER for *.vercel.app, *.railway.app, etc.)
      const host = window.location.hostname.toLowerCase();
      const isCloudPlatform = host.endsWith('.vercel.app') || 
                              host.endsWith('.railway.app') || 
                              host.endsWith('.onrender.com') || 
                              host.endsWith('.netlify.app') || 
                              host.endsWith('.pages.dev') ||
                              host.includes('localhost') || 
                              host.includes('127.0.0.1');

      if (!isCloudPlatform) {
        const parts = host.split('.');
        const knownAppSlugs = ['wa', 'pos', 'challan', 'crm', 'app', 'www', 'api', 'admin', 'hq', 'mail', 'ftp'];
        let sub = '';
        if (parts.length >= 3 && knownAppSlugs.includes(parts[0])) {
          sub = parts[1];
        } else if (parts.length >= 2 && !knownAppSlugs.includes(parts[0])) {
          sub = parts[0];
        }

        const reserved = ['localhost', 'lvh', 'renictech', 'com', 'me', 'io', 'dev', '127', '0'];
        if (sub && !reserved.includes(sub) && !knownAppSlugs.includes(sub)) {
          const clean = sub.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (localStorage.getItem('customerCode') !== clean) {
            localStorage.setItem('customerCode', clean);
          }
          return clean;
        }
      }
    }

    // 4. Default fallback
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('customerCode')) || '';
    if (stored && !stored.includes('automation') && !stored.includes('vercel') && stored !== 'default') {
      return stored.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }

    return 'apx-wa01';
  }

  /**
   * Enterprise Destination Resolver: this.getRestAPIUrl(endpointPath)
   * Resolves the full URL for a service endpoint based on active tenant hosting.
   */
  getRestAPIUrl(endpointPath) {
    const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    
    // If endpoint already starts with /api, join with origin; otherwise join with API_BASE
    if (cleanPath.startsWith('/api/')) {
      return `${API_ORIGIN}${cleanPath}`;
    }
    return `${API_BASE}${cleanPath}`;
  }

  /**
   * Retrieves or refreshes OAuth 2.0 Bearer Token internally
   */
  async getValidOAuthToken() {
    const now = Date.now();
    // Check in-memory token
    if (this.tokenCache && this.tokenExpiry && now < this.tokenExpiry - 60000) {
      return this.tokenCache;
    }

    // Check localStorage auth token
    const storedToken = localStorage.getItem('oauth_token') || localStorage.getItem('token');
    if (storedToken) {
      return storedToken;
    }

    return null;
  }

  /**
   * Dispatches screen navigation or staff action audit telemetry to Renic_Soft HQ
   */
  async logScreenActivity({
    screenName,
    screenPath = '',
    actionType = 'VIEW',
    actionDescription = '',
    durationSeconds = 0,
    metadata = {}
  }) {
    try {
      const customerCode = this.resolveCustomerCode();
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        customerCode,
        clientId: localStorage.getItem('clientId') || '',
        softwareProduct: 'WA_INSTA_AUTOMATION',
        screenName,
        screenPath: screenPath || (typeof window !== 'undefined' ? window.location.hash : ''),
        actionType,
        actionDescription: actionDescription || `${actionType} on screen '${screenName}'`,
        userName: user.name || user.email || 'Staff User',
        userRole: user.role || 'staff',
        durationSeconds: Math.round(durationSeconds),
        metadata
      };

      // Asynchronous beacon/telemetry call without blocking UI
      axios.post(`${this.hqTelemetryUrl}/api/v1/activity/log`, payload, {
        timeout: 4000,
        headers: {
          'x-customer-code': customerCode
        }
      }).catch(() => {
        // Silent catch: Telemetry failures should never impact user experience
      });
    } catch {
      // silent
    }
  }

  /**
   * Encapsulated Secure Fetch Method
   */
  async executeRequest(endpointPath, options = {}) {
    const url = this.getRestAPIUrl(endpointPath);
    const token = await this.getValidOAuthToken();
    const customerCode = this.resolveCustomerCode();

    const headers = {
      'Content-Type': 'application/json',
      'X-Customer-Code': customerCode,
      'X-Tenant-Code': customerCode,
      'X-Timestamp': Date.now(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    return axios({
      url,
      ...options,
      headers
    });
  }
}

export const tenantGateway = new TenantAPIGateway();
export const resolveCustomerCode = () => tenantGateway.resolveCustomerCode();
export default tenantGateway;
