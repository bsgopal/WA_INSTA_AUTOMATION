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
      planTier = 'pro',
      billingCycle = '3_MONTHS',
      licenseStart,
      licenseEnd,
      licenseStatus = 'active',
      featurePermissions = {},
      limits = {}
    } = req.body;

    console.log(`[License Sync Ingest]: Received OTA update for '${clientName}' (Subdomain: ${subdomain})`);

    // Upsert local License record
    let license = await License.findOne({
      $or: [
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
        password: 'ACTIVE_VIA_OTA',
        subdomain: (subdomain || '').toLowerCase(),
        planTier,
        billingCycle,
        licenseStart: licenseStart ? new Date(licenseStart) : new Date(),
        licenseEnd: licenseEnd ? new Date(licenseEnd) : new Date(Date.now() + 90 * 24 * 3600 * 1000),
        featurePermissions,
        limits,
        isUsed: true,
        lastSyncAt: new Date()
      });
    } else {
      if (subdomain) license.subdomain = subdomain.toLowerCase();
      license.planTier = planTier;
      license.billingCycle = billingCycle;
      if (licenseStart) license.licenseStart = new Date(licenseStart);
      if (licenseEnd) license.licenseEnd = new Date(licenseEnd);
      license.featurePermissions = { ...license.featurePermissions, ...featurePermissions };
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
      active: licenseStatus === 'active',
      subdomain: license.subdomain,
      planTier: license.planTier,
      billingCycle: license.billingCycle,
      featurePermissions: license.featurePermissions,
      licenseEnd: license.licenseEnd
    };

    // Update ShopConfig name if applicable
    await ShopConfig.findOneAndUpdate({}, { shopName: clientName }, { upsert: false });

    return res.json({
      success: true,
      status: 'SYNCED',
      message: 'License and feature entitlements updated locally',
      clientName,
      subdomain: license.subdomain,
      licenseEnd: license.licenseEnd,
      features: license.featurePermissions
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
    const license = await License.findOne().sort({ createdAt: -1 });
    if (!license) {
      return res.json({
        active: true,
        planTier: 'enterprise',
        billingCycle: '1_YEAR',
        daysLeft: 365,
        isGracePeriod: false,
        isExpired: false,
        featurePermissions: cachedEntitlements.featurePermissions
      });
    }

    const now = new Date();
    const end = new Date(license.licenseEnd);
    const diffMs = end - now;
    const daysLeft = Math.ceil(diffMs / (24 * 3600 * 1000));
    const isExpired = diffMs < 0;
    // 3-day grace period
    const isGracePeriod = isExpired && Math.abs(daysLeft) <= 3;

    return res.json({
      active: !isExpired || isGracePeriod,
      clientName: license.companyName,
      subdomain: license.subdomain,
      planTier: license.planTier,
      billingCycle: license.billingCycle,
      licenseStart: license.licenseStart,
      licenseEnd: license.licenseEnd,
      daysLeft: isExpired ? 0 : daysLeft,
      isGracePeriod,
      isExpired: isExpired && !isGracePeriod,
      featurePermissions: license.featurePermissions || cachedEntitlements.featurePermissions,
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
