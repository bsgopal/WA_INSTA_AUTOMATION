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
    config.headers['X-Customer-Code'] = customerCode;
    config.headers['X-Tenant-Code'] = customerCode;

    const token = localStorage.getItem('oauth_token') || localStorage.getItem('token');
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
      // Handle unauthorized access (e.g., clear token and redirect to login)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // HashRouter-compatible navigation (works in packaged Electron file:// mode too)
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
