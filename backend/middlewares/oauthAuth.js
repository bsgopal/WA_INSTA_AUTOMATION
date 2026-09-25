const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'Renic_Enterprise_Secure_JWT_Key_2026';

/**
 * Middleware to authenticate requests using OAuth 2.0 Bearer access tokens
 */
const authenticateOAuth = (requiredScope = null) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or malformed Bearer access token'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // If a specific scope is required, verify client was granted that scope
      if (requiredScope && Array.isArray(decoded.scopes)) {
        const hasScope = decoded.scopes.includes(requiredScope) || decoded.scopes.includes('*');
        if (!hasScope) {
          return res.status(403).json({
            error: 'insufficient_scope',
            error_description: `Token lacks required scope: ${requiredScope}`,
            scope: requiredScope
          });
        }
      }

      req.oauth = decoded;
      req.clientId = decoded.sub;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'OAuth 2.0 access token has expired'
        });
      }
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Invalid OAuth 2.0 access token'
      });
    }
  };
};

module.exports = {
  authenticateOAuth
};
