// renic-automation-backend/middlewares/verifyTenantOAuth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'RenicSoft_Secret_Key_2026_Enterprise';

/**
 * Validates OAuth 2.0 Bearer tokens issued by Renic_Soft HQ.
 * Enforces tenant security and checks signature integrity.
 */
function verifyTenantOAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header. Expected Bearer <oauth_token>'
    });
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // If request has an explicit customer code, verify it matches token
    if (req.customerCode && req.customerCode !== 'DEFAULT') {
      if (decoded.customerCode && decoded.customerCode.toUpperCase() !== req.customerCode.toUpperCase()) {
        return res.status(403).json({
          error: 'forbidden_tenant_mismatch',
          message: `OAuth token was issued for tenant '${decoded.customerCode}' but requested '${req.customerCode}'`
        });
      }
    }

    req.tenantOAuth = decoded;
    if (decoded.customerCode) {
      req.customerCode = decoded.customerCode.toUpperCase();
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'token_expired',
        message: 'OAuth token has expired. Please refresh your token.'
      });
    }
    return res.status(401).json({
      error: 'invalid_token',
      message: 'OAuth token signature verification failed.'
    });
  }
}

module.exports = verifyTenantOAuth;
