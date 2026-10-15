const express = require('express');
const router = express.Router();
const ShopConfig = require('../models/ShopConfig');
const MetaService = require('../services/MetaService');
const { getModel } = require('../middlewares/tenantContext');

function getTargetShopConfig() {
  try {
    return getModel('ShopConfig');
  } catch (e) {
    return ShopConfig;
  }
}

// Get current AI Settings
router.get('/ai-settings', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID; 
    let config = await TargetShopConfig.findOne({ userId });
    if (!config) {
      config = await TargetShopConfig.findOne({});
    }
    if (!config) {
      config = new TargetShopConfig({ userId });
      await config.save();
    }

    res.json({
      success: true,
      settings: {
        useAnthropic: config.useAnthropic,
        anthropicApiKey: config.anthropicApiKey,
        anthropicModel: config.anthropicModel,
        geminiApiKey: config.geminiApiKey,
        geminiModel: config.geminiModel
      }
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Update AI Settings
router.post('/ai-settings', async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    const { useAnthropic, anthropicApiKey, anthropicModel, geminiApiKey, geminiModel } = req.body;

    await ShopConfig.findOneAndUpdate(
      { userId: userId },
      { 
        $set: { useAnthropic, anthropicApiKey, anthropicModel, geminiApiKey, geminiModel }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'AI settings updated successfully' });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Get Meta API Config
router.get('/meta-config', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    let config = await TargetShopConfig.findOne({ userId });
    if (!config) {
      config = await TargetShopConfig.findOne({});
    }
    if (!config) {
      config = new TargetShopConfig({ userId });
      await config.save();
    }

    res.json({
      success: true,
      metaConfig: {
        metaApiEnabled: config.metaApiEnabled || false,
        metaAppId: config.metaAppId || '',
        metaAppSecret: config.metaAppSecret || '',
        metaPhoneNumberId: config.metaPhoneNumberId || '',
        metaAccessToken: config.metaAccessToken || '',
        metaWebhookVerifyToken: config.metaWebhookVerifyToken || '',
        metaBusinessAccountId: config.metaBusinessAccountId || '',
        metaForwardReplies: config.metaForwardReplies || false,
        metaHandoffMessage: config.metaHandoffMessage || ''
      }
    });
  } catch (error) {
    console.error('Error fetching Meta config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Meta config' });
  }
});

// Update Meta API Config (Credentials only - engine mode is decided by Renic Soft Master HQ)
router.post('/meta-config', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    const {
      metaAppId,
      metaAppSecret,
      metaPhoneNumberId,
      metaAccessToken,
      metaWebhookVerifyToken,
      metaBusinessAccountId
    } = req.body;

    // Strict Rule: metaApiEnabled and whatsappSenderMode are governed ONLY by Renic Soft Master HQ.
    // Client cannot override or decide engine state from client side.
    await TargetShopConfig.findOneAndUpdate(
      { userId: userId },
      { 
        $set: {
          metaAppId,
          metaAppSecret,
          metaPhoneNumberId,
          metaAccessToken,
          metaWebhookVerifyToken,
          metaBusinessAccountId,
          metaForwardReplies: req.body.metaForwardReplies || false,
          metaHandoffMessage: req.body.metaHandoffMessage || ''
        }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Meta API credentials saved successfully' });
  } catch (error) {
    console.error('Error saving Meta config:', error);
    res.status(500).json({ success: false, error: 'Failed to save Meta config' });
  }
});

// Test Meta API Connection
router.post('/meta-test', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    const config = await MetaService.getMetaConfig(userId);

    if (!config || !config.enabled) {
      return res.json({ success: false, error: 'Meta API is not enabled' });
    }

    const axios = require('axios');
    const response = await axios.get(
      `https://graph.facebook.com/${process.env.META_API_VERSION || 'v18.0'}/${config.phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`
        },
        timeout: 10000
      }
    );

    const displayPhoneNumber = response.data?.display_phone_number || '';
    const verifiedName = response.data?.verified_name || '';

    await TargetShopConfig.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          metaDisplayPhoneNumber: displayPhoneNumber,
          metaVerifiedName: verifiedName
        } 
      }
    );

    res.json({
      success: true,
      message: 'Meta API connection successful',
      data: response.data
    });
  } catch (error) {
    console.error('Meta API test error:', error.message);
    const errorMsg = error.response?.data?.error?.message || error.message;
    res.json({ success: false, error: errorMsg });
  }
});

// Get System Service Status (Ngrok, WAHA)
router.get('/system-status', async (req, res) => {
  try {
    const status = {
      ngrok: { running: false },
      waha: { running: false }
    };
    
    const axios = require('axios');
    
    // Check Ngrok
    if (global.ngrokStatus && global.ngrokStatus.running) {
      status.ngrok.running = true;
    } else {
      try {
        const ngrokRes = await axios.get('http://127.0.0.1:4040/api/tunnels', { timeout: 2000 });
        if (ngrokRes.data && ngrokRes.data.tunnels && ngrokRes.data.tunnels.length > 0) {
          status.ngrok.running = true;
        }
      } catch (e) {
        // Ngrok not running or API not accessible
      }
    }
    
    // Check WAHA
    try {
      const wahaRes = await axios.get(process.env.WAHA_API_URL || 'http://localhost:3000', { timeout: 2000 });
      if (wahaRes.status === 200) {
        status.waha.running = true;
      }
    } catch (e) {
      // WAHA might still be running but root endpoint returns 404, check /api/sessions
      try {
        const sessionRes = await axios.get(`${process.env.WAHA_API_URL || 'http://localhost:3000'}/api/sessions`, { timeout: 2000 });
        if (sessionRes.status === 200) {
          status.waha.running = true;
        }
      } catch (e2) {
        // WAHA not running
      }
    }
    
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch system status' });
  }
});


// Get WhatsApp Sender & Engine Settings
router.get('/whatsapp-engine', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    let config = await TargetShopConfig.findOne({ userId });
    if (!config) {
      config = await TargetShopConfig.findOne({});
    }
    if (!config) {
      config = await ShopConfig.findOne({});
    }
    res.json({
      success: true,
      whatsappSenderMode: config?.whatsappSenderMode || (config?.metaApiEnabled ? 'META' : 'DOCKER'),
      dockerThrottleSeconds: config?.dockerThrottleSeconds || 6,
      metaApiEnabled: config?.metaApiEnabled || false
    });
  } catch (error) {
    console.error('Error fetching WhatsApp engine config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch WhatsApp engine config' });
  }
});

// Update WhatsApp Sender & Engine Operational Settings (Throttle only - engine mode is decided by Renic Soft Master HQ)
router.post('/whatsapp-engine', async (req, res) => {
  try {
    const TargetShopConfig = getTargetShopConfig();
    const userId = req.userId || req.user?._id || process.env.DEFAULT_USER_ID;
    const { dockerThrottleSeconds } = req.body;
    const update = {};
    if (dockerThrottleSeconds !== undefined) {
      update.dockerThrottleSeconds = Number(dockerThrottleSeconds) || 6;
    }

    // Strict Rule: whatsappSenderMode and metaApiEnabled are NOT modifiable by client.
    // They are governed 100% by Renic Soft Master HQ.
    const updated = await TargetShopConfig.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'WhatsApp Engine operational settings saved successfully',
      whatsappSenderMode: updated.whatsappSenderMode,
      dockerThrottleSeconds: updated.dockerThrottleSeconds
    });
  } catch (error) {
    console.error('Error saving WhatsApp engine config:', error);
    res.status(500).json({ success: false, error: 'Failed to save WhatsApp engine config' });
  }
});

module.exports = router;
