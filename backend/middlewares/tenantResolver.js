// renic-automation-backend/middlewares/tenantResolver.js
const { runWithTenant } = require('./tenantContext');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'RenicSoft_Secret_Key_2026_Enterprise';

// Cache client ID -> customerCode mappings
const clientCodeCache = new Map();

/**
 * Resolves customerCode for a given clientId (e.g. ObjectId or code) via Master DB
 */
async function resolveCustomerCodeFromDb(clientId) {
  if (!clientId) return null;
  const key = String(clientId).trim().toLowerCase();
  if (clientCodeCache.has(key)) return clientCodeCache.get(key);

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const masterDb = mongoose.connection.useDb('renic_soft', { useCache: true });
      const client = await masterDb.collection('clients').findOne({
        $or: [
          { customerCode: key },
          { customerCode: new RegExp(`^${key}$`, 'i') },
          { shopSlug: key },
          { subdomain: key },
          { clientId: key },
          ...(mongoose.Types.ObjectId.isValid(key) ? [{ _id: new mongoose.Types.ObjectId(key) }] : [])
        ]
      });
      if (client && client.customerCode) {
        const code = client.customerCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        clientCodeCache.set(key, code);
        return code;
      }
    }
  } catch (err) {
    // ignore
  }
  return key.replace(/[^a-z0-9_-]/g, '');
}

/**
 * Middleware that extracts customerCode from:
 * 1. Path prefix: /:clientId/api/... (rewrites req.url to /api/...)
 * 2. Headers: x-client-id, x-customer-code, x-tenant-code, x-tenant-id
 * 3. Query: ?clientId=... or ?customerCode=... or ?tenant=...
 * 4. Body: req.body.clientId or req.body.customerCode
 * 5. Bearer JWT: decoded.customerCode or decoded.clientId
 * 6. Host / subdomain
 *
 * Binds execution to that customer's isolated database.
 */
async function tenantResolver(req, res, next) {
  let customerCode = '';

  // 1. Check path prefix: e.g. /apx-wa01/api/messages or /66f8a.../api/auth/login
  const pathMatch = req.url.match(/^\/([a-zA-Z0-9_-]+)(\/api(?:\/.*|\?.*|$))/);
  const reservedPathSegments = ['uploads', 'assets', 'static', 'node_modules', 'favicon.ico', 'health', 'public', 'api'];
  
  if (pathMatch && !reservedPathSegments.includes(pathMatch[1].toLowerCase())) {
    customerCode = pathMatch[1].toLowerCase();
    // Rewrite req.url so downstream routers mounted at /api match directly
    req.originalUrl = req.url;
    req.url = pathMatch[2];
  }

  // 2. Check custom headers
  if (!customerCode) {
    const headerCode = req.headers['x-client-id'] || req.headers['x-customer-code'] || req.headers['x-tenant-code'] || req.headers['x-tenant-id'] || req.headers['client-id'] || req.headers['tenant-id'];
    if (headerCode) {
      customerCode = String(headerCode).trim().toLowerCase();
    }
  }

  // 3. Check query parameters (?clientId=apx-wa01 or ?customerCode=apx-wa01)
  if (!customerCode && (req.query?.clientId || req.query?.client_id || req.query?.customerCode || req.query?.tenant || req.query?.tenantId)) {
    customerCode = String(req.query.clientId || req.query.client_id || req.query.customerCode || req.query.tenant || req.query.tenantId).trim().toLowerCase();
  }

  // 4. Check request body if parsed
  if (!customerCode && req.body && (req.body.clientId || req.body.customerCode || req.body.tenantId || req.body.client_id)) {
    customerCode = String(req.body.clientId || req.body.customerCode || req.body.tenantId || req.body.client_id).trim().toLowerCase();
  }

  // 5. Check Bearer JWT token
  if (!customerCode && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.customerCode || decoded.clientId || decoded.tenantId) {
          customerCode = String(decoded.customerCode || decoded.clientId || decoded.tenantId).toLowerCase();
        }
      } catch (e) {
        // token might be user auth or invalid
      }
    }
  }

  // 6. Check subdomain if no explicit identifier
  if (!customerCode && req.headers.host) {
    const rawHost = req.headers.host.split(':')[0].toLowerCase();
    const isCloudHost = rawHost.endsWith('.vercel.app') || 
                        rawHost.endsWith('.railway.app') || 
                        rawHost.endsWith('.onrender.com') || 
                        rawHost.endsWith('.render.com') || 
                        rawHost.endsWith('.netlify.app') || 
                        rawHost.endsWith('.pages.dev') ||
                        rawHost.endsWith('.ngrok.io') ||
                        rawHost.endsWith('.ngrok-free.app') ||
                        rawHost.endsWith('.ngrok-free.dev') ||
                        rawHost.includes('localhost') || 
                        rawHost.includes('127.0.0.1');

    if (!isCloudHost) {
      const parts = rawHost.split('.');
      const knownAppSlugs = ['wa', 'pos', 'challan', 'crm', 'app', 'www', 'api', 'admin', 'hq', 'mail', 'ftp'];
      let sub = '';
      if (parts.length >= 3 && knownAppSlugs.includes(parts[0])) {
        sub = parts[1];
      } else if (parts.length >= 2 && !knownAppSlugs.includes(parts[0])) {
        sub = parts[0];
      }
      const reserved = ['localhost', 'lvh', 'renictech', 'com', 'me', 'io', 'dev', '127', '0', 'vercel', 'railway', 'app'];
      if (sub && !reserved.includes(sub) && !knownAppSlugs.includes(sub)) {
        customerCode = sub.toLowerCase();
      }
    }
  }

  // If customerCode looks like an ObjectId or custom ID, resolve from Master DB
  if (customerCode) {
    const resolved = await resolveCustomerCodeFromDb(customerCode);
    if (resolved) customerCode = resolved;
  }

  // 7. Fallback default: prioritize apx-wa01 over unverified default
  if (!customerCode || customerCode === 'default' || customerCode === 'wa-insta-automation') {
    customerCode = (process.env.DEFAULT_CUSTOMER_CODE || process.env.CUSTOMER_CODE || 'apx-wa01').toLowerCase();
  }

  const cleanCode = customerCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  req.customerCode = cleanCode;
  req.clientId = cleanCode;
  try {
    res.setHeader('X-Tenant-Code', cleanCode);
    res.setHeader('X-Client-Id', cleanCode);
  } catch (e) {
    // headers already sent
  }

  // Execute request within the tenant context
  runWithTenant(cleanCode, () => next());
}

module.exports = tenantResolver;
