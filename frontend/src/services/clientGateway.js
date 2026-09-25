// renic-automation-frontend/src/services/clientGateway.js
// Enterprise SAP DM Style Destination & API Gateway SDK
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
    // 1. LocalStorage
    const stored = localStorage.getItem('customerCode');
    if (stored) return stored.toUpperCase();

    // 2. Query param ?tenant=AU20 or ?customerCode=AU20
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const qCode = urlParams.get('tenant') || urlParams.get('customerCode');
      if (qCode) {
        localStorage.setItem('customerCode', qCode.toUpperCase());
        return qCode.toUpperCase();
      }

      // 3. Subdomain extraction (e.g. au20.yourdomain.com, au20.lvh.me)
      const host = window.location.hostname.toLowerCase();
      const parts = host.split('.');
      if (parts.length >= 2) {
        const sub = parts[0];
        const reserved = ['www', 'localhost', 'app', 'admin', 'hq', 'api'];
        if (!reserved.includes(sub)) {
          localStorage.setItem('customerCode', sub.toUpperCase());
          return sub.toUpperCase();
        }
      }
    }

    return 'AU20'; // Default demo tenant
  }

  /**
   * SAP DM Style Destination Resolver: this.getRestAPIUrl(endpointPath)
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
   * SAP DM Style Encapsulated Secure Fetch Method
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
export default tenantGateway;
