const express = require('express');
const router = express.Router();
const ShopConfig = require('../models/ShopConfig');

// Get current AI Settings
router.get('/ai-settings', async (req, res) => {
  try {
    // Assuming you have an auth middleware that populates req.user
    const userId = req.user?.id || process.env.DEFAULT_USER_ID; 
    let config = await ShopConfig.findOne({ userId });
    
    if (!config) {
      config = new ShopConfig({ userId });
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
    const userId = req.user?.id || process.env.DEFAULT_USER_ID;
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

module.exports = router;