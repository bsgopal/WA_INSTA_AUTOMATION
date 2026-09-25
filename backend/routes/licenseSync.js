const express = require('express');
const router = express.Router();
const {
  receiveLicensePush,
  getCurrentLicenseStatus,
  renewSubscriptionInApp
} = require('../controllers/licenseSyncController');

// @route   POST /api/v1/license/sync
// @desc    Receive OTA license push from Renic_Soft HQ
// @access  Public (HMAC Signed)
router.post('/sync', receiveLicensePush);

// @route   GET /api/v1/license/current
// @desc    Get active license status, days left, and allowed features
// @access  Public
router.get('/current', getCurrentLicenseStatus);

// @route   POST /api/v1/license/renew-in-app
// @desc    In-app renewal with bi-directional callback to Renic_Soft HQ
// @access  Public
router.post('/renew-in-app', renewSubscriptionInApp);

module.exports = router;
