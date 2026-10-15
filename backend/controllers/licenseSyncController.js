const crypto = require('crypto');
const axios = require('axios');
const License = require('../models/License');
const ShopConfig = require('../models/ShopConfig');

const SYNC_SECRET = process.env.SYNC_SECRET_KEY || 'Renic_BiDirectional_Sync_Key_2026_Secure';
const HQ_API_URL = process.env.RENIC_HQ_URL || 'http://127.0.0.1:5050';

// In-memory feature entitlement cache for ultra-fast middleware checks
let cachedEntitlements = {
  active: true,
  subdomain: '',
  planTier: 'enterprise',
  featurePermissions: {
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
  licenseEnd: null
};

/**
 * Generate HMAC-SHA256 signature
 */
function generateSignature(payload, secret = SYNC_SECRET) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Ingest license push from Renic_Soft HQ
 */
exports.receiveLicensePush = async (req, res) => {
  try {
    const signature = req.headers['x-renic-hq-signature'];
    const timestamp = req.headers['x-renic-timestamp'];

    // Verify HMAC signature
    if (signature) {
      const expected = generateSignature(req.body, SYNC_SECRET);
      if (signature !== expected) {
        return res.status(401).json({ success: false, message: 'Invalid HMAC signature from HQ' });
      }
    }

    const {
      clientName,
      subdomain,
      customerCode,
      planTier = 'pro',
      billingCycle = '3_MONTHS',
      licenseStart,
      licenseEnd,
      licenseStatus = 'active',
      emergencyLock = false,
      screenPermissions = {},
      featurePermissions = {},
      whatsappSenderMode = 'DOCKER',
      dockerThrottleSeconds = 6,
      limits = {}
    } = req.body;

    const mergedPermissions = { ...featurePermissions, ...screenPermissions };
    const isLocked = emergencyLock || ['locked', 'disabled', 'suspended', 'cancelled', 'inactive', 'revoked'].includes(licenseStatus);

    console.log(`[License Sync Ingest]: Received OTA update for '${clientName}' (Code: ${customerCode || subdomain}, Mode: ${whatsappSenderMode}, Status: ${licenseStatus})`);

    // Upsert local License record
    let license = await License.findOne({
      $or: [
        { customerCode: customerCode || '' },
        { subdomain: (subdomain || '').toLowerCase() },
        { companyName: clientName }
      ]
    });

    if (!license) {
      license = new License({
        key: `RENIC-OTA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        email: req.body.ownerEmail || 'admin@renic.store',
        firstName: clientName || 'Client',
        lastName: 'Admin',
        phone: req.body.contact || '9345578103',
        companyName: clientName || 'Renic Client',
        customerCode: customerCode || subdomain || '',
        password: 'ACTIVE_VIA_OTA',
        subdomain: (subdomain || '').toLowerCase(),
        planTier,
        billingCycle,
        licenseStart: licenseStart ? new Date(licenseStart) : new Date(),
        licenseEnd: licenseEnd ? new Date(licenseEnd) : new Date(Date.now() + 90 * 24 * 3600 * 1000),
        featurePermissions: mergedPermissions,
        limits,
        isUsed: true,
        lastSyncAt: new Date()
      });
    } else {
      if (subdomain) license.subdomain = subdomain.toLowerCase();
      if (customerCode) license.customerCode = customerCode;
      license.companyName = clientName;
      license.planTier = planTier;
      license.billingCycle = billingCycle;
      if (licenseStart) license.licenseStart = new Date(licenseStart);
      if (licenseEnd) license.licenseEnd = new Date(licenseEnd);
      license.featurePermissions = mergedPermissions;
      license.limits = { ...license.limits, ...limits };
      license.lastSyncAt = new Date();
    }

    await license.save();

    // Ingest and synchronize OAuth credentials if provided by HQ
    if (req.body.clientId && req.body.clientSecretHash) {
      try {
        const OAuthClient = require('../models/OAuthClient');
        await OAuthClient.findOneAndUpdate(
          { clientId: req.body.clientId },
          {
            clientId: req.body.clientId,
            clientSecretHash: req.body.clientSecretHash,
            name: `${clientName} API Connector`,
            isActive: true
          },
          { upsert: true, new: true }
        );
      } catch (oauthErr) {
        console.warn('OAuth sync warning:', oauthErr.message);
      }
    }

    // Update in-memory entitlement cache
    cachedEntitlements = {
      active: !isLocked,
      isLocked,
      subdomain: license.subdomain,
      customerCode: customerCode || subdomain,
      planTier: license.planTier,
      billingCycle: license.billingCycle,
      featurePermissions: mergedPermissions,
      screenPermissions: mergedPermissions,
      whatsappSenderMode: whatsappSenderMode.toUpperCase(),
      licenseEnd: license.licenseEnd
    };

    // Update ShopConfig with authoritative HQ values
    const shopUpdate = {
      shopName: clientName,
      whatsappSenderMode: whatsappSenderMode.toUpperCase(),
      metaApiEnabled: whatsappSenderMode.toUpperCase() === 'META',
      dockerThrottleSeconds: Number(dockerThrottleSeconds) || 6,
      screenPermissions: mergedPermissions,
      featurePermissions: mergedPermissions,
      customerCode: customerCode || subdomain
    };
    await ShopConfig.findOneAndUpdate({}, { $set: shopUpdate }, { upsert: true });

    // If SSE broadcaster is available on app, push live update to all browser tabs
    try {
      const app = require('../server');
      const broadcast = app.get ? app.get('broadcastTenantUpdate') : null;
      if (typeof broadcast === 'function') {
        broadcast({
          type: 'LICENSE_UPDATED',
          screenPermissions: mergedPermissions,
          whatsappSenderMode: whatsappSenderMode.toUpperCase(),
          active: !isLocked,
          isLocked
        });
      }
    } catch (sseErr) {
      // Ignore SSE error if not running
    }

    return res.json({
      success: true,
      status: 'SYNCED',
      message: 'License, features, and sender engine mode updated from Renic Soft HQ',
      clientName,
      subdomain: license.subdomain,
      whatsappSenderMode: whatsappSenderMode.toUpperCase(),
      licenseEnd: license.licenseEnd,
      features: mergedPermissions
    });
  } catch (err) {
    console.error('[License Sync Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get active license status & entitlements for frontend
 */
exports.getCurrentLicenseStatus = async (req, res) => {
  try {
    const [license, shop] = await Promise.all([
      License.findOne().sort({ createdAt: -1 }),
      ShopConfig.findOne({})
    ]);

    const activeSenderMode = (shop?.whatsappSenderMode || 'DOCKER').toUpperCase();

    if (!license) {
      return res.json({
        active: false,
        licenseRequired: true,
        message: 'No active license found. Please provision this instance in Renic Soft Master HQ.',
        whatsappSenderMode: activeSenderMode,
        featurePermissions: {},
        screenPermissions: {}
      });
    }

    const now = new Date();
    const end = new Date(license.licenseEnd);
    const diffMs = end - now;
    const daysLeft = Math.ceil(diffMs / (24 * 3600 * 1000));
    const isExpired = diffMs < 0;
    const isGracePeriod = isExpired && Math.abs(daysLeft) <= 3;
    const isLocked = Boolean(cachedEntitlements.isLocked);

    const perms = license.featurePermissions || shop?.screenPermissions || cachedEntitlements.featurePermissions || {};

    return res.json({
      active: (!isExpired || isGracePeriod) && !isLocked,
      isLocked,
      clientName: license.companyName || shop?.shopName,
      customerCode: license.customerCode || shop?.customerCode,
      subdomain: license.subdomain,
      planTier: license.planTier,
      billingCycle: license.billingCycle,
      licenseStart: license.licenseStart,
      licenseEnd: license.licenseEnd,
      daysLeft: isExpired ? 0 : daysLeft,
      isGracePeriod,
      isExpired: isExpired && !isGracePeriod,
      whatsappSenderMode: activeSenderMode,
      featurePermissions: perms,
      screenPermissions: perms,
      limits: license.limits
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Handle in-app renewal and callback to Renic_Soft HQ
 */
exports.renewSubscriptionInApp = async (req, res) => {
  try {
    const {
      durationCycle = '3_MONTHS',
      daysToAdd = 90,
      amountPaid = 6999,
      paymentMethod = 'UPI',
      transactionId = `TXN-${Date.now()}`
    } = req.body;

    const license = await License.findOne().sort({ createdAt: -1 });
    const subdomain = license ? license.subdomain : 'client';

    const payload = {
      subdomain,
      transactionId,
      amountPaid,
      paymentMethod,
      selectedDuration: durationCycle,
      daysToAdd: parseInt(daysToAdd || 90),
      customerGst: '',
      customerEmail: license ? license.email : '',
      customerPhone: license ? license.phone : ''
    };

    const signature = generateSignature(payload, SYNC_SECRET);

    console.log(`[In-App Renewal]: Transmitting payment webhook to Renic_Soft HQ (${HQ_API_URL}/api/sync/payment-callback)...`);

    let hqResponse;
    try {
      hqResponse = await axios.post(`${HQ_API_URL}/api/sync/payment-callback`, payload, {
        headers: {
          'x-renic-signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (apiErr) {
      console.warn('[In-App Renewal HQ Warning]: HQ unreachable, updating locally:', apiErr.message);
    }

    // Stack locally
    const baseDate = license && new Date(license.licenseEnd) > new Date()
      ? new Date(license.licenseEnd)
      : new Date();
    baseDate.setDate(baseDate.getDate() + parseInt(daysToAdd || 90));

    if (license) {
      license.licenseEnd = baseDate;
      license.billingCycle = durationCycle;
      await license.save();
    }

    cachedEntitlements.licenseEnd = baseDate;
    cachedEntitlements.active = true;

    return res.json({
      success: true,
      message: `Subscription successfully renewed for ${daysToAdd} days!`,
      newExpiry: baseDate.toISOString(),
      invoiceNumber: hqResponse?.data?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`
    });
  } catch (err) {
    console.error('In-app renewal error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEntitlements = () => cachedEntitlements;
