// renic-automation-backend/utils/licenseStatus.js
const WARNING_DAYS = Number(process.env.LICENSE_WARNING_DAYS || 15);

/**
 * Build a normalized license status object from a License document (or null).
 */
function getLicenseStatus(license) {
  if (!license || !license.licenseEnd) {
    return {
      status: 'not_found',
      statusLabel: 'No License',
      expiresAt: null,
      daysRemaining: null,
      warningDays: WARNING_DAYS,
      planTier: null,
      companyName: null
    };
  }

  const end = new Date(license.licenseEnd);
  const now = new Date();
  const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  let status = 'active';
  if (now > end) {
    status = 'expired';
  } else if (daysRemaining <= WARNING_DAYS) {
    status = 'expiring';
  }

  return {
    status,
    statusLabel: status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expiring Soon' : 'Active',
    expiresAt: end.toISOString(),
    daysRemaining: Math.max(daysRemaining, 0),
    warningDays: WARNING_DAYS,
    planTier: license.planTier || 'basic',
    companyName: license.companyName || null
  };
}

module.exports = {
  getLicenseStatus,
  WARNING_DAYS
};
