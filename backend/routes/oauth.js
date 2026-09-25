const express = require('express');
const router = express.Router();
const {
  issueToken,
  getCredentials,
  getClientProfile
} = require('../controllers/oauthController');
const { authenticateOAuth } = require('../middlewares/oauthAuth');

// @route   POST /api/v1/oauth/token
// @desc    RFC 6749 OAuth 2.0 Token Endpoint (grant_type=client_credentials)
// @access  Public (client_id & client_secret verified)
router.post('/token', issueToken);

// @route   GET /api/v1/oauth/credentials
// @desc    Retrieve active Client ID and integration profile
// @access  Public / Admin
router.get('/credentials', getCredentials);

// @route   GET /api/v1/oauth/profile (or /api/v1/client/profile)
// @desc    Verified Client Details endpoint (strictly guarded by Bearer Token)
// @access  Protected by OAuth 2.0 Bearer Token
router.get('/profile', authenticateOAuth(), getClientProfile);

module.exports = router;
