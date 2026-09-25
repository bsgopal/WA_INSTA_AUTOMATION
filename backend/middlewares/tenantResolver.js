// renic-automation-backend/middlewares/tenantResolver.js
const { runWithTenant } = require('./tenantContext');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'RenicSoft_Secret_Key_2026_Enterprise';

/**
 * Middleware that extracts customerCode from subdomain, headers, query, or JWT,
 * and binds execution to that customer's isolated database.
 */
function tenantResolver(req, res, next) {
  let customerCode = '';

  // 1. Check custom headers
  const headerCode = req.headers['x-customer-code'] || req.headers['x-tenant-code'] || req.headers['x-client-id'];
  if (headerCode) {
    customerCode = String(headerCode).trim();
  }

  // 2. Check subdomain if no header (e.g. au20.yourdomain.com, au20.lvh.me)
  if (!customerCode && req.headers.host) {
    const rawHost = req.headers.host.split(':')[0].toLowerCase();
    const parts = rawHost.split('.');
    if (parts.length >= 2) {
      const sub = parts[0];
      const reserved = ['www', 'api', 'admin', 'hq', 'localhost', 'app', 'mail', 'ftp'];
      if (!reserved.includes(sub)) {
        customerCode = sub;
      }
    }
  }

  // 3. Check query parameters (?tenant=AU20 or ?customerCode=AU20)
  if (!customerCode && (req.query.tenant || req.query.customerCode)) {
    customerCode = String(req.query.tenant || req.query.customerCode).trim();
  }

  // 4. Check Bearer JWT token if present
  if (!customerCode && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.customerCode) {
          customerCode = decoded.customerCode;
        }
      } catch (e) {
        // token might be user auth or invalid, ignore here
      }
    }
  }

  // 5. Fallback default
  if (!customerCode) {
    customerCode = process.env.DEFAULT_CUSTOMER_CODE || 'DEFAULT';
  }

  const cleanCode = customerCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  req.customerCode = cleanCode;
  res.setHeader('X-Tenant-Code', cleanCode);

  // Execute request within the tenant context
  runWithTenant(cleanCode, next);
}

module.exports = tenantResolver;
