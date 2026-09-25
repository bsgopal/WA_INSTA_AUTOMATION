const { getEntitlements } = require('../controllers/licenseSyncController');

/**
 * Middleware to check if a specific feature module is unlocked in the active subscription
 * @param {string} featureName - e.g. 'aiAgent', 'catalog', 'workflows', 'quickReplies'
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    try {
      const entitlements = getEntitlements();
      
      // If no restrictions are configured yet or active plan allows it, proceed smoothly
      if (!entitlements || !entitlements.featurePermissions) {
        return next();
      }

      const isAllowed = entitlements.featurePermissions[featureName];

      // If explicitly set to false, block access gracefully with informative message
      if (isAllowed === false) {
        return res.status(403).json({
          success: false,
          code: 'MODULE_NOT_ENTITLED',
          feature: featureName,
          message: `The '${featureName}' module is locked on your current plan tier. Please upgrade your subscription to unlock this feature.`
        });
      }

      next();
    } catch (err) {
      console.error('[FeatureGate Error]:', err);
      // Fail-open for safety so unexpected errors never bring down core services
      next();
    }
  };
};

module.exports = {
  requireFeature
};
