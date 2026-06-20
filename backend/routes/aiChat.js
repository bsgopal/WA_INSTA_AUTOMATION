// renic-automation-backend/routes/aiChat.js
const express = require('express');
const router = express.Router();
const aiChatHandler = require('../services/aiChatHandler');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ShopConfig = require('../models/ShopConfig');
const CatalogItem = require('../models/CatalogItem');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer storage for catalog images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'catalog');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'catalog-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * GET /api/ai-chat/hot-leads
 * Get all hot leads for the owner
 */
router.get('/hot-leads', async (req, res) => {
  try {
    const userId = req.user._id;
    const leads = await aiChatHandler.getHotLeads(userId, 20);

    res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    console.error('Hot Leads Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai-chat/conversation/:customerId
 * Get conversation summary for a specific customer
 */
router.get('/conversation/:customerId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { customerId } = req.params;

    const summary = await aiChatHandler.getConversationSummary(customerId, userId);

    if (!summary) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Conversation Summary Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai-chat/messages/:customerId
 * Get all messages for a customer
 */
router.get('/messages/:customerId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { customerId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({
      customerId,
      userId
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({
      customerId,
      userId
    });

    res.json({
      success: true,
      total,
      count: messages.length,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Messages Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/send-message
 * Send a manual message to a customer (owner taking over)
 */
router.post('/send-message', async (req, res) => {
  try {
    const userId = req.user._id;
    const { customerId, message } = req.body;

    if (!customerId || !message) {
      return res.status(400).json({ success: false, error: 'Missing customerId or message' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Send message via appropriate service based on customer preference/platform
    let result;
    const isInstagram = customer.preferredChannel === 'instagram' || (!customer.whatsappNumber && customer.instagramHandle);
    
    if (isInstagram) {
      const InstagramService = require('../services/InstagramService');
      result = await InstagramService.sendDirectMessage(customer.instagramHandle, message);
    } else {
      const WhatsAppService = require('../services/WhatsAppService');
      result = await WhatsAppService.sendMessage(customer.whatsappNumber, message);
    }

    if (!result.success) {
      if (result.failureReason === 422 && !isInstagram) {
        return res.status(400).json({
          success: false,
          error: 'WhatsApp is disconnected. Please go to Settings > Integrations and scan the QR code to link your phone.'
        });
      }
      return res.status(500).json({ success: false, error: result.error });
    }

    // Save message to database
    const savedMessage = await Message.create({
      userId,
      customerId,
      content: message,
      channel: isInstagram ? 'instagram' : 'whatsapp',
      messageType: 'MANUAL',
      language: customer.language,
      status: 'SENT',
      externalMessageId: result.externalMessageId,
      aiGenerated: false,
      tags: ['outbound', 'manual']
    });

    // Update or create conversation
    let conversation = await Conversation.findOne({
      customerId,
      userId,
      status: 'ACTIVE'
    });

    if (conversation) {
      conversation.messageCount += 1;
      conversation.lastMessage = {
        content: message,
        sender: 'TEAM',
        timestamp: new Date(),
        platform: isInstagram ? 'instagram' : 'whatsapp'
      };
      conversation.lastActivityAt = new Date();
      conversation.assignedTo = userId;
      conversation.assignedAt = new Date();
      await conversation.save();
    } else {
      conversation = new Conversation({
        userId,
        customerId,
        primaryPlatform: isInstagram ? 'INSTAGRAM' : 'WHATSAPP',
        title: `Chat with ${customer.firstName} ${customer.lastName}`,
        status: 'ACTIVE',
        messageCount: 1,
        lastMessage: {
          content: message,
          sender: 'TEAM',
          timestamp: new Date(),
          platform: isInstagram ? 'instagram' : 'whatsapp'
        },
        platforms: [{
          type: isInstagram ? 'INSTAGRAM' : 'WHATSAPP',
          platformId: isInstagram ? customer.instagramHandle : customer.whatsappNumber
        }],
        assignedTo: userId,
        assignedAt: new Date()
      });
      await conversation.save();
    }

    // Also save to ConversationMessage for Unified Inbox sync
    const ConversationMessage = require('../models/ConversationMessage');
    await ConversationMessage.create({
      conversationId: conversation._id,
      userId,
      customerId,
      content: message,
      platform: isInstagram ? 'INSTAGRAM' : 'WHATSAPP',
      sender: {
        type: 'TEAM',
        userId,
        name: req.user.name || 'Agent'
      },
      status: 'SENT',
      platformMessageId: result.externalMessageId
    });

    res.json({
      success: true,
      messageId: savedMessage._id,
      externalMessageId: result.externalMessageId,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Send Message Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai-chat/dashboard-stats
 * Get dashboard statistics
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Total conversations
    const totalConversations = await Conversation.countDocuments({
      userId,
      status: 'ACTIVE'
    });

    // Hot leads (score >= 6.5)
    const hotLeads = await aiChatHandler.getHotLeads(userId, 100);

    // Total messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagestoday = await Message.countDocuments({
      userId,
      createdAt: { $gte: today }
    });

    // Total customers
    const totalCustomers = await Customer.countDocuments({ userId });

    // Pipeline value (sum of all customer totalSpent)
    const customers = await Customer.find({ userId }).select('totalSpent');
    const pipelineValue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    res.json({
      success: true,
      stats: {
        totalConversations,
        hotLeadsCount: hotLeads.length,
        messagestoday,
        totalCustomers,
        pipelineValue,
        averageOrderValue: totalCustomers > 0 ? pipelineValue / totalCustomers : 0
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/test-message
 * Test the AI chat system with a sample message
 */
router.post('/test-message', async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, error: 'Missing phoneNumber or message' });
    }

    const result = await aiChatHandler.handleCustomerMessage(
      phoneNumber,
      message,
      'whatsapp',
      userId
    );

    res.json({
      success: result.success,
      analysis: result.analysis,
      leadScore: result.leadScore,
      aiResponse: result.aiResponse,
      escalated: result.escalated
    });
  } catch (error) {
    console.error('Test Message Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const aiMessageAnalyzer = require('../services/aiMessageAnalyzer');
const axios = require('axios');

/**
 * Helper to scrape a logo or banner image from the homepage of the website URL
 */
async function scrapeLogoOrBanner(url) {
  if (!url) return '';
  try {
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    console.log(`[Scraper] Autodetecting logo from homepage: ${normalizedUrl}`);
    const response = await axios.get(normalizedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = response.data;
    
    // Look for logo in img tags
    const imgRegex = /<img[^>]*src="([^"]+)"/g;
    let match;
    const images = [];
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0];
      const src = match[1];
      if (imgTag.toLowerCase().includes('logo') || src.toLowerCase().includes('logo')) {
        if (src.startsWith('//')) {
          return 'https:' + src;
        } else if (src.startsWith('/')) {
          try {
            const urlObj = new URL(normalizedUrl);
            return urlObj.origin + src;
          } catch (e) {
            return normalizedUrl.endsWith('/') ? normalizedUrl + src.slice(1) : normalizedUrl + src;
          }
        }
        return src;
      }
      images.push(src);
    }
    
    // Fallback to first image if no logo is found
    if (images.length > 0) {
      const firstSrc = images[0];
      if (firstSrc.startsWith('//')) {
        return 'https:' + firstSrc;
      } else if (firstSrc.startsWith('/')) {
        try {
          const urlObj = new URL(normalizedUrl);
          return urlObj.origin + firstSrc;
        } catch (e) {
          return normalizedUrl.endsWith('/') ? normalizedUrl + firstSrc.slice(1) : normalizedUrl + firstSrc;
        }
      }
      return firstSrc;
    }
    
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=60';
  } catch (err) {
    console.warn(`[Scraper] Logo autodetect failed for ${url}:`, err.message);
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=60';
  }
}

/**
 * GET /api/ai-chat/shop-config
 * Fetch shop config (seeds defaults if not exists)
 */
router.get('/shop-config', async (req, res) => {
  try {
    const userId = req.user._id;
    let config = await ShopConfig.findOne({ userId });
    
    if (!config) {
      // Seed default config for Renic, scraping default logo
      const defaultWebsite = 'https://kanalli.in/';
      const scrapedLogo = await scrapeLogoOrBanner(defaultWebsite);
      
      config = await ShopConfig.create({
        userId,
        shopName: 'Renic Jewellers',
        websiteUrl: defaultWebsite,
        catalogImageUrl: scrapedLogo || '',
        customStartPrice: 8500,
        goldRate22K: 7200,
        goldRate24K: 7850,
        silverRate: 95,
        platinumRate: 3200,
        faqs: [
          { question: "What is your gold purity guarantee?", answer: "All our jewelry is BIS Hallmark 916 certified, ensuring 22K gold purity." },
          { question: "Do you offer customization?", answer: "Yes, we custom craft bespoke bridal necklaces, rings, and bangles based on your design preferences." }
        ]
      });
    }
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Fetch ShopConfig Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/ai-chat/shop-config
 * Update shop config
 */
router.put('/shop-config', async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
    // If websiteUrl is updated but catalogImageUrl is empty/missing, autodetect logo
    if (updateData.websiteUrl && (!updateData.catalogImageUrl || updateData.catalogImageUrl.trim() === '')) {
      const scrapedLogo = await scrapeLogoOrBanner(updateData.websiteUrl);
      if (scrapedLogo) {
        updateData.catalogImageUrl = scrapedLogo;
      }
    }
    
    const config = await ShopConfig.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Update ShopConfig Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


/**
 * GET /api/ai-chat/catalog
 * Fetch all catalog items
 */
router.get('/catalog', async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await CatalogItem.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error('Fetch Catalog Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/catalog
 * Add catalog item with Multer file upload
 */
router.post('/catalog', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, category, price, description, keywords } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Product image is required' });
    }
    
    const imageUrl = `/uploads/catalog/${req.file.filename}`;
    
    const item = await CatalogItem.create({
      userId,
      name,
      category,
      price: parseFloat(price),
      description,
      keywords,
      imageUrl
    });
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Create Catalog Item Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/ai-chat/catalog/:id
 * Delete a catalog item
 */
router.delete('/catalog/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const item = await CatalogItem.findOneAndDelete({ _id: id, userId });
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Attempt physical file deletion
    try {
      const filePath = path.join(__dirname, '..', item.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Physical file deletion warning:', err.message);
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete Catalog Item Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/test-ai-response
 * Executes Gemini sandbox reply simulation with shop context and catalog detection
 */
router.post('/test-ai-response', async (req, res) => {
  try {
    const userId = req.user._id;
    const { message, widgetData = null } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }
    
    // 1. Load config
    let config = await ShopConfig.findOne({ userId });
    if (!config) {
      config = {
        shopName: 'Renic Jewellers',
        goldRate22K: 7200,
        goldRate24K: 7850,
        silverRate: 95,
        platinumRate: 3200,
        faqs: []
      };
    }
    
    // 2. Load matching catalog items using query keywords
    const keywords = message.toLowerCase().split(/\s+/);
    const catalogMatches = await CatalogItem.find({
      userId,
      $or: [
        { name: { $regex: message, $options: 'i' } },
        { keywords: { $in: keywords.map(kw => new RegExp(kw, 'i')) } }
      ]
    }).limit(3);
    
    // 3. Analyze message via Gemini
    const mockCustomer = {
      firstName: 'Customer',
      lastName: '',
      language: 'en',
      rfmSegment: 'NEW'
    };
    
    const triggerMessage = widgetData?.interactiveReply?.triggerText
      || widgetData?.interactiveReply?.actionValue
      || widgetData?.interactiveReply?.id
      || message;

    const analysis = await aiMessageAnalyzer.analyzeMessage(
      triggerMessage,
      [], // no history
      mockCustomer
    );
    
    // 4. Generate response (pass full message for category detection)
    const aiResponse = await aiMessageAnalyzer.generateResponse(
      analysis,
      mockCustomer,
      analysis.language || 'en',
      triggerMessage
    );
    
    // Check if name capture is triggered in the sandbox
    let nameUpdated = false;
    let newName = null;
    const nameMatch = message.match(/(?:my name is|i am|this is|call me)\s+([a-zA-Z]+)/i);
    if (nameMatch && nameMatch[1]) {
      newName = nameMatch[1];
      nameUpdated = true;
    }
    
    res.json({
      success: true,
      analysis,
      aiResponse: aiResponse.text,
      mediaUrl: aiResponse.mediaUrl || null,
      buttons: aiResponse.buttons || [],
      list: aiResponse.list || null,
      widgetData: widgetData || null,
      isCatalogPrompt: aiResponse.isCatalogPrompt || false,
      catalogMatches: aiResponse.scrapedProducts && aiResponse.scrapedProducts.length > 0
        ? aiResponse.scrapedProducts.map((p, idx) => ({
            id: `scraped_${idx}`,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            description: `Link: ${p.productUrl}`
          }))
        : catalogMatches.map(item => ({
            id: item._id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            description: item.description
          })),
      nameUpdated,
      newName
    });
  } catch (error) {
    console.error('Test AI Response Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const WhatsAppService = require('../services/WhatsAppService');

/**
 * GET /api/ai-chat/whatsapp/status
 * Get the current WAHA WhatsApp session status and phone details
 */
router.get('/whatsapp/status', async (req, res) => {
  try {
    const status = await WhatsAppService.getSessionStatus();
    res.json(status);
  } catch (error) {
    console.error('Fetch WhatsApp Status Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai-chat/whatsapp/qr
 * Get the WhatsApp QR code to scan
 */
router.get('/whatsapp/qr', async (req, res) => {
  try {
    const qrResult = await WhatsAppService.getQRCode();
    res.json(qrResult);
  } catch (error) {
    console.error('Fetch WhatsApp QR Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/whatsapp/logout
 * Log out of the current WhatsApp session
 */
router.post('/whatsapp/logout', async (req, res) => {
  try {
    const result = await WhatsAppService.logout();
    res.json(result);
  } catch (error) {
    console.error('WhatsApp Logout Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai-chat/whatsapp/request-code
 * Request a pairing code for a phone number
 */
router.post('/whatsapp/request-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const result = await WhatsAppService.requestPairingCode(phoneNumber);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp Request Code Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai-chat/instagram/status
 * Get the connected Instagram business profile details
 */
router.get('/instagram/status', async (req, res) => {
  try {
    const InstagramService = require('../services/InstagramService');
    const status = await InstagramService.getSelfProfile();
    res.json(status);
  } catch (error) {
    console.error('Fetch Instagram Status Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
