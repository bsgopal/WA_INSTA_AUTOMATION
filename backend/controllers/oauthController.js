const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const OAuthClient = require('../models/OAuthClient');

const JWT_SECRET = process.env.JWT_SECRET || 'Renic_Enterprise_Secure_JWT_Key_2026';

/**
 * Hash raw secret using SHA-256
 */
function hashSecret(rawSecret) {
  return crypto.createHash('sha256').update(rawSecret).digest('hex');
}

/**
 * RFC 6749 Token Endpoint
 * POST /api/v1/oauth/token
 */
exports.issueToken = async (req, res) => {
  try {
    let clientId = req.body.client_id;
    let clientSecret = req.body.client_secret;
    const grantType = req.body.grant_type;

    // Support HTTP Basic Auth header: Authorization: Basic base64(client_id:client_secret)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      const creds = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8').split(':');
      clientId = creds[0];
      clientSecret = creds[1];
    }

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'client_id and client_secret are required'
      });
    }

    if (grantType !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: "grant_type must be 'client_credentials'"
      });
    }

    const client = await OAuthClient.findOne({ clientId: clientId.trim(), isActive: true });
    if (!client) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed (unknown client_id)'
      });
    }

    // Verify secret hash using timing-safe comparison
    const incomingHash = hashSecret(clientSecret.trim());
    const expectedHash = client.clientSecretHash;
    const isValid = crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(expectedHash));

    if (!isValid) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed (invalid client_secret)'
      });
    }

    // Update last used timestamp
    client.lastUsedAt = new Date();
    await client.save();

    // Issue signed JWT access token valid for 1 hour (3600 seconds)
    const tokenPayload = {
      sub: client.clientId,
      name: client.name,
      scopes: client.scopes,
      type: 'oauth2_bearer_token'
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: client.scopes.join(' ')
    });
  } catch (err) {
    console.error('[OAuth Token Error]:', err);
    return res.status(500).json({ error: 'server_error', error_description: err.message });
  }
};

/**
 * Get active Client ID and integration profile (Never returns raw secret)
 * GET /api/v1/oauth/credentials
 */
exports.getCredentials = async (req, res) => {
  try {
    let client = await OAuthClient.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!client) {
      return res.json({
        success: true,
        provisioned: false,
        clientId: null,
        clientSecret: null,
        name: 'Centrally Managed by Renic Soft',
        scopes: ['messages:send', 'messages:read', 'catalog:read', 'templates:read', 'customers:read', 'customers:write'],
        message: 'OAuth credentials are centrally provisioned by Platform Owner in Renic Soft.'
      });
    }

    return res.json({
      success: true,
      provisioned: true,
      clientId: client.clientId,
      clientSecret: null, // Hidden - only available in Renic_Soft Master HQ
      name: client.name,
      scopes: client.scopes,
      lastUsedAt: client.lastUsedAt
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Regenerate Client Secret (Old secret invalidated immediately)
 * POST /api/v1/oauth/regenerate
 */
exports.regenerateSecret = async (req, res) => {
  try {
    let client = await OAuthClient.findOne({ isActive: true }).sort({ createdAt: -1 });

    const newRawSecret = `rsec_live_${crypto.randomBytes(24).toString('hex')}`;
    const newHash = hashSecret(newRawSecret);

    if (!client) {
      const generatedId = `renic_client_${crypto.randomBytes(8).toString('hex')}`;
      client = await OAuthClient.create({
        clientId: generatedId,
        clientSecretHash: newHash,
        name: 'Primary ERP / API Connector'
      });
    } else {
      client.clientSecretHash = newHash;
      await client.save();
    }

    console.log(`[OAuth 2.0]: Regenerated secret for client ${client.clientId}`);

    return res.json({
      success: true,
      message: 'New Client Secret generated. Save this secret now—it will never be displayed again.',
      clientId: client.clientId,
      clientSecret: newRawSecret,
      scopes: client.scopes
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Client Profile via OAuth Bearer token (Postman / ERP verification)
 * GET /api/v1/oauth/profile (and /api/v1/client/profile)
 */
exports.getClientProfile = async (req, res) => {
  try {
    const License = require('../models/License');
    const license = await License.findOne().sort({ createdAt: -1 });

    const now = new Date();
    const end = license ? new Date(license.licenseEnd) : new Date();
    const daysLeft = Math.ceil((end - now) / (24 * 3600 * 1000));

    return res.json({
      success: true,
      authenticatedClientId: req.clientId,
      authenticatedScopes: req.oauth?.scopes || [],
      client: {
        name: license?.companyName || 'Renic Client',
        subdomain: license?.subdomain || 'app',
        webUrl: `https://${license?.subdomain || 'app'}.renic.store`,
        planTier: license?.planTier || 'enterprise',
        billingCycle: license?.billingCycle || '1_YEAR',
        licenseStart: license?.licenseStart,
        licenseEnd: license?.licenseEnd,
        daysRemaining: Math.max(0, daysLeft),
        isExpired: daysLeft < 0,
        features: license?.featurePermissions || {
          quickReplies: true,
          workflows: true,
          catalog: true,
          templates: true,
          responseRules: true,
          bulkBroadcast: true,
          aiAgent: true,
          metaCloudApi: true,
          exportReports: true
        },
        limits: license?.limits || {
          maxContacts: 10000,
          maxMonthlyMessages: 50000,
          maxConcurrentSessions: 2
        }
      },
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
