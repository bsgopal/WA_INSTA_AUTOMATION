import axios from 'axios';
import { API_BASE } from './base';
import tenantGateway from '../services/clientGateway';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// SAP DM Style Destination Resolver attached directly to apiClient
apiClient.getRestAPIUrl = (endpointPath) => tenantGateway.getRestAPIUrl(endpointPath);

// Interceptor to add auth token and tenant routing headers
apiClient.interceptors.request.use(
  (config) => {
    const customerCode = tenantGateway.resolveCustomerCode();
    const clientId = localStorage.getItem('wa_oauth_client_id') || localStorage.getItem('clientId') || customerCode;
    const clientSecret = localStorage.getItem('wa_oauth_client_secret') || localStorage.getItem('clientSecret') || '';

    config.headers['X-Customer-Code'] = customerCode;
    config.headers['X-Tenant-Code'] = customerCode;
    config.headers['X-Client-Id'] = clientId;
    if (clientSecret) {
      config.headers['X-Client-Secret'] = clientSecret;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('oauth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = String(error.config?.url || '');
      // Do not log out on secondary background/health checks
      const isBackgroundCheck = 
        url.includes('/wallet') || 
        url.includes('/license') || 
        url.includes('/whatsapp/status') || 
        url.includes('/whatsapp/waha-status');

      if (!isBackgroundCheck) {
        // Genuine authentication expiration on a main protected route
        localStorage.removeItem('token');
        localStorage.removeItem('oauth_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
