// renic-automation-backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const WhatsAppService = require('../services/WhatsAppService');
const MetaService = require('../services/MetaService');
const GeminiService = require('../services/GeminiService');
const campaignService = require('../services/campaignService');
const VariableInterpolationService = require('../services/VariableInterpolationService');
const { body, validationResult, query } = require('express-validator');

function appendWhatsAppOptInQuery(query) {
  if (!query.$and) {
    query.$and = [];
  }
  query.$and.push({
    $or: [
      { 'optedIn.whatsapp': true },
      { optedIn: { $exists: false } },
      { optedIn: null }
    ]
  });
}

const campaignUploadsDir = path.join(__dirname, '..', 'uploads', 'campaigns');
if (!fs.existsSync(campaignUploadsDir)) {
  fs.mkdirSync(campaignUploadsDir, { recursive: true });
}

const campaignMediaStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, campaignUploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path.basename(file.originalname || 'campaign-media', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const campaignMediaUpload = multer({
  storage: campaignMediaStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf'
    ];
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo || allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Unsupported file type. Please upload an image, video, or PDF file.'));
  }
});

// ============ GET ACTIVE DISPATCH ENGINE (META vs DOCKER) ============
router.get('/dispatch-engine', async (req, res) => {
  try {
    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId: req.userId || req.user?._id || process.env.DEFAULT_USER_ID }) || await ShopConfig.findOne({});
    res.json({
      success: true,
      whatsappSenderMode: (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase(),
      dockerThrottleSeconds: shop?.dockerThrottleSeconds || 6
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ UPLOAD CAMPAIGN MEDIA ============
router.post('/media/upload', campaignMediaUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const mediaType = req.file.mimetype === 'application/pdf'
      ? 'document'
      : req.file.mimetype.startsWith('video/')
        ? 'video'
        : 'image';

    const uploadedBuffer = fs.readFileSync(req.file.path);
    const base64Data = uploadedBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativeUrl = `/uploads/campaigns/${req.file.filename}`;

    res.json({
      success: true,
      mediaType,
      mediaUrl: `${baseUrl}${relativeUrl}`,
      mediaPreviewData: dataUrl,
      mediaMimeType: req.file.mimetype,
      mediaFileName: req.file.originalname,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Campaign Media Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload campaign media' });
  }
});

// ============ GET ALL CAMPAIGNS ============
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const campaigns = await Campaign.find(query)
      .populate('messageTemplate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Campaigns Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// ============ GET CAMPAIGN BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('messageTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get Campaign Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// ============ GET CAMPAIGN TARGET CUSTOMERS ============
router.get('/:id/targets', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const query = { userId: req.user.id };

    if (campaign.targetAudience?.segments?.length > 0) {
      query.rfmSegment = { $in: campaign.targetAudience.segments };
    }

    if (campaign.channels && campaign.channels.length > 0) {
      const channelQueries = campaign.channels.map(channel => ({
        [`optedIn.${channel}`]: true
      }));
      if (channelQueries.length > 0) {
        query.$or = channelQueries;
      }
    }

    if (campaign.channels.includes('whatsapp')) {
      appendWhatsAppOptInQuery(query);
    }

    const customers = await Customer.find(query).select('firstName lastName phone email rfmSegment whatsappNumber');
    res.json(customers);
  } catch (error) {
    console.error('Get Campaign Targets Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign targets' });
  }
});

// ============ CREATE CAMPAIGN ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['ONE_TIME', 'RECURRING', 'AUTOMATED', 'TRIGGERED']),
  body('channels').isArray(),
  body('messageType').notEmpty(),
  body('messageTemplate').optional({ checkFalsy: true }).isMongoId(),
  body('metaTemplateName').optional({ checkFalsy: true }).trim().isString(),
  body('metaTemplateLanguage').optional({ checkFalsy: true }).trim().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Require either a template or direct content, unless it is a media campaign
    if (!req.body.messageTemplate && !req.body.messageContent && req.body.messageType !== 'MEDIA') {
      return res.status(400).json({ error: 'Either a message template or message content is required' });
    }

    // Strip empty template reference so Mongoose doesn't CastError on ""
    const campaignBody = { ...req.body };
    if (!campaignBody.messageTemplate) {
      delete campaignBody.messageTemplate;
    }
    if (!campaignBody.messageContent) {
      delete campaignBody.messageContent;
    }

    // Calculate estimated reach
    let estimatedReach = 0;
    if (req.body.targetAudience) {
      const query = { userId: req.user.id };

      if (req.body.targetAudience.customFilter?.targetedCustomerIds?.length > 0) {
        query._id = { $in: req.body.targetAudience.customFilter.targetedCustomerIds };
      } else {
        if (req.body.targetAudience.segments?.length > 0) {
          query.rfmSegment = { $in: req.body.targetAudience.segments };
        }
        if (req.body.targetAudience.languages?.length > 0) {
          query.language = { $in: req.body.targetAudience.languages };
        }
        if (req.body.targetAudience.loyaltyTiers?.length > 0) {
          query.loyaltyTier = { $in: req.body.targetAudience.loyaltyTiers };
        }
      }

      estimatedReach = await Customer.countDocuments(query);
    }

    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId: req.user.id }) || await ShopConfig.findOne({});
    const effectiveSenderMode = (req.body.senderMode || shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();

    const campaign = new Campaign({
      ...campaignBody,
      senderMode: effectiveSenderMode,
      userId: req.user.id,
      estimatedReach,
      status: 'DRAFT'
    });

    await campaign.save();

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// ============ UPDATE CAMPAIGN ============
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow editing running campaigns
    if (campaign.status === 'RUNNING') {
      return res.status(400).json({ error: 'Cannot edit a running campaign' });
    }

    const updateData = { ...req.body };
    if (updateData.messageTemplate === '') {
      updateData.messageTemplate = null;
    }
    if (updateData.messageContent === '') {
      updateData.messageContent = '';
    }

    Object.assign(campaign, updateData);
    campaign.updatedAt = Date.now();

    await campaign.save();

    res.json(campaign);
  } catch (error) {
    console.error('Update Campaign Error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ============ DELETE CAMPAIGN ============
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow deleting running campaigns
    if (campaign.status === 'RUNNING') {
      return res.status(400).json({ error: 'Cannot delete a running campaign. Pause it first.' });
    }

    await campaign.deleteOne();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete Campaign Error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ============ SCHEDULE CAMPAIGN ============
router.post('/:id/schedule', async (req, res) => {
  try {
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt date is required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'DRAFT' },
      { 
        status: 'SCHEDULED',
        scheduledAt: scheduledDate,
        scheduleType: 'SCHEDULED'
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or not in DRAFT status' });
    }

    console.log(`📅 Campaign scheduled: ${campaign.name} for ${scheduledDate}`);
    res.json(campaign);
  } catch (error) {
    console.error('Schedule Campaign Error:', error);
    res.status(500).json({ error: 'Failed to schedule campaign' });
  }
});

// ============ LAUNCH CAMPAIGN ============
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('messageTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Campaign cannot be launched' });
    }

    // Get target customers
    const query = { userId: req.user.id };

    if (campaign.targetAudience?.customFilter?.targetedCustomerIds?.length > 0) {
      query._id = { $in: campaign.targetAudience.customFilter.targetedCustomerIds };
    } else {
      if (campaign.targetAudience?.segments?.length > 0) {
        query.rfmSegment = { $in: campaign.targetAudience.segments };
      }
      if (campaign.targetAudience?.languages?.length > 0) {
        query.language = { $in: campaign.targetAudience.languages };
      }
      if (campaign.targetAudience?.loyaltyTiers?.length > 0) {
        query.loyaltyTier = { $in: campaign.targetAudience.loyaltyTiers };
      }
    }

    // Only send to opted-in customers
    if (campaign.channels.includes('whatsapp')) {
      appendWhatsAppOptInQuery(query);
    }

    const customers = await Customer.find(query);

    campaign.status = 'RUNNING';
    campaign.startedAt = new Date();
    campaign.totalTargets = customers.length;
    await campaign.save();

    // Launch campaign asynchronously
    setImmediate(() => campaignService.executeCampaign(campaign, customers));

    res.json({
      message: 'Campaign launched successfully',
      targetCount: customers.length,
      campaign
    });
  } catch (error) {
    console.error('Launch Campaign Error:', error);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

// ============ MANUAL SEND TO SELECTED CUSTOMERS ============
router.post('/:id/manual-send', async (req, res) => {
  try {
    const { customerIds, sendToAll = false, segmentFilter = null, searchTerm = null } = req.body;

    console.log(`📨 Manual Send Request:`, {
      campaignId: req.params.id,
      userId: req.user?.id,
      hasUser: !!req.user,
      customerIds,
      sendToAll,
      segmentFilter,
      searchTerm
    });

    if (!req.user || !req.user.id) {
      console.error('❌ Manual Send: No authenticated user');
      return res.status(401).json({ error: 'Unauthorized - no user session' });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('messageTemplate');

    if (!campaign) {
      console.error(`❌ Campaign not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const query = { userId: req.user.id };

    if (searchTerm) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { whatsappNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (segmentFilter) {
      query.rfmSegment = segmentFilter;
    }

    if (!sendToAll && customerIds && customerIds.length > 0) {
      query._id = { $in: customerIds };
    }

    appendWhatsAppOptInQuery(query);

    const customers = await Customer.find(query);

    console.log(`📋 Found customers:`, {
      queryUsed: JSON.stringify(query),
      customersFound: customers.length,
      customerIds: customers.map(c => c._id)
    });

    if (customers.length === 0) {
      console.error('❌ No customers found matching criteria:', query);
      return res.status(400).json({ 
        error: 'No customers found matching the selected criteria',
        queryUsed: query,
        sentToAll: sendToAll,
        customerIdsRequested: customerIds?.length || 0
      });
    }

    const content = campaign.messageTemplate?.content || campaign.messageContent || '';
    if (!content && campaign.messageType !== 'MEDIA') {
      console.error('❌ Campaign message template is empty');
      return res.status(400).json({ 
        error: 'Campaign message template is empty',
        hasMessageTemplate: !!campaign.messageTemplate,
        templateContent: content
      });
    }

    const mediaUrl = campaign.messageTemplate?.mediaUrl || campaign.mediaUrl || null;
    const mediaPreviewData = campaign.messageTemplate?.mediaPreviewData || campaign.mediaPreviewData || null;
    const mediaType = (campaign.messageTemplate?.mediaType
      || (campaign.mediaType && campaign.mediaType !== 'none' ? campaign.mediaType : null))
      || null;
    const mediaMimeType = campaign.messageTemplate?.mediaMimeType || campaign.mediaMimeType || null;
    const mediaFileName = campaign.messageTemplate?.mediaFileName || campaign.mediaFileName || 'campaign-media';
    const buttons = campaign.buttonUrl ? [{
      label: campaign.buttonLabel || 'Open Link',
      value: campaign.buttonUrl,
      type: 'URL',
      actionType: 'URL'
    }] : null;

    let successCount = 0;
    let failCount = 0;
    let processedCount = 0;

    // Resolve dispatch mode (Meta Cloud API vs Docker WAHA)
    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId: req.user.id }) || await ShopConfig.findOne({});
    const senderMode = (campaign.senderMode || shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();
    const isDockerMode = senderMode === 'DOCKER';

    // Resolve the Meta template once for the whole batch and fetch its real
    // body-parameter count so the send payload always matches the template.
    const hasMedia = !!(mediaUrl || mediaPreviewData);
    const isDirectMediaSend = campaign.messageType === 'MEDIA' && hasMedia && !campaign.metaTemplateName;
    let resolvedTemplateName;
    let templateLang;
    let bodyParamCount;

    if (!isDockerMode && !isDirectMediaSend) {
      resolvedTemplateName = campaign.metaTemplateName || campaign.messageTemplate?.name;
      if (!resolvedTemplateName || !/^[a-z0-9_-]+$/.test(resolvedTemplateName)) {
        resolvedTemplateName = hasMedia ? 'sales_promotion' : 'message';
      }
      templateLang = campaign.metaTemplateLanguage || campaign.messageTemplate?.language || campaign.language || 'en_US';
      bodyParamCount = await MetaService.getTemplateBodyParamCount(
        req.user.id,
        resolvedTemplateName,
        templateLang
      );
      if (bodyParamCount === null || bodyParamCount === undefined) {
        bodyParamCount = hasMedia ? 0 : 1;
      }
      console.log(`📨 Manual Send template resolution: ${resolvedTemplateName} (${templateLang}) expects ${bodyParamCount} body param(s)`);
    } else {
      templateLang = campaign.metaTemplateLanguage || campaign.messageTemplate?.language || campaign.language || 'en_US';
      if (isDockerMode) {
        console.log(`🐳 Manual Send: Docker WAHA engine active for campaign ${campaign.name}`);
      }
    }

    // Persist the target count so the UI counters reflect this manual send
    campaign.totalTargets = (campaign.totalTargets || 0) + customers.length;

    console.log(`📨 Campaign Manual Send Started for ${customers.length} customers`, {
      campaignId: campaign._id,
      campaignName: campaign.name,
      hasMediaUrl: !!mediaUrl,
      hasMediaPreviewData: !!mediaPreviewData,
      mediaType,
      mediaFileName,
      mediaUrl: mediaUrl ? mediaUrl.substring(0, 100) : 'none',
      mediaPreviewDataLength: mediaPreviewData ? mediaPreviewData.length : 0,
      mediaPreviewDataStart: mediaPreviewData ? mediaPreviewData.substring(0, 50) : 'none',
      campaignFields: {
        'campaign.mediaUrl': campaign.mediaUrl ? campaign.mediaUrl.substring(0, 100) : 'undefined',
        'campaign.mediaPreviewData': campaign.mediaPreviewData ? 'present' : 'undefined',
        'campaign.mediaType': campaign.mediaType,
        'campaign.mediaMimeType': campaign.mediaMimeType,
        'campaign.mediaFileName': campaign.mediaFileName
      }
    });

    const recipientResults = [];

    for (const customer of customers) {
      const destinationNumber = customer.whatsappNumber || customer.phone;
      const customerFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || destinationNumber || 'Unknown Customer';

      if (!destinationNumber) {
        failCount++;
        recipientResults.push({
          customerId: customer._id,
          customerName: customerFullName,
          phoneNumber: 'Missing Phone',
          status: 'FAILED',
          error: 'No phone or WhatsApp number available',
          sentAt: null
        });
        continue;
      }

      try {
        processedCount++;
        let customerContent = content;
        const custLang = customer.language || 'en';
        if (campaign.messageTemplate?.translations?.[custLang]) {
          customerContent = campaign.messageTemplate.translations[custLang];
        } else if (campaign.translations?.[custLang]) {
          customerContent = campaign.translations[custLang];
        }

        const finalContent = await VariableInterpolationService.interpolateVariables(
          customerContent,
          req.user.id,
          { customer }
        );

        const channel = 'whatsapp';
        
        // Prepare media payload
        const mediaPayload = {};
        if (mediaUrl || mediaPreviewData) {
          mediaPayload.mediaType = mediaType;
          mediaPayload.mediaMimeType = mediaMimeType;
          mediaPayload.mediaFileName = mediaFileName;
          if (mediaUrl) mediaPayload.mediaUrl = mediaUrl;
          if (mediaPreviewData) mediaPayload.mediaData = mediaPreviewData;
          
          console.log(`📨 Campaign Manual Send: Preparing media for customer ${customer._id}`, {
            hasMediaUrl: !!mediaUrl,
            hasMediaData: !!mediaPreviewData,
            mediaType,
            mediaMimeType,
            mediaFileName
          });
        } else {
          console.log(`📨 Campaign Manual Send: Sending text only for customer ${customer._id}`);
        }
        
        const isDirectMediaSend = campaign.messageType === 'MEDIA' && hasMedia;
        const sendOptions = {
          ...mediaPayload,
          ...(buttons ? { buttons } : {}),
          userId: req.user.id,
          forceMeta: !isDockerMode,
          forceWaha: isDockerMode
        };

        if (!isDockerMode && !isDirectMediaSend) {
          // Use the resolved template and the real parameter count for every customer (Meta only)
          sendOptions.templateName = resolvedTemplateName;
          sendOptions.templateLanguage = templateLang;
          sendOptions.templateParams = MetaService.buildTemplateParams(bodyParamCount, finalContent);
        }

        const result = await WhatsAppService.sendMessage(destinationNumber, finalContent, sendOptions);

        if (isDockerMode) {
          const throttleSecs = shop?.dockerThrottleSeconds || 6;
          await new Promise(r => setTimeout(r, throttleSecs * 1000));
        }

        console.log(`📬 Campaign Manual Send Result for ${destinationNumber}:`, result);

        const ShopConfig = require('../models/ShopConfig');
        const currentShop = await ShopConfig.findOne({ userId: req.user.id }) || shop;
        const displayNum = currentShop?.metaDisplayPhoneNumber || currentShop?.contactPhone || '';

        const placeholderContent = finalContent || (hasMedia ? `[${mediaType || 'Media'}]` : '');
        const placeholderOriginalContent = content || (hasMedia ? `[${mediaType || 'Media'}]` : '');

        if (result && result.success) {
          successCount++;
          customer.lastMessageSentDate = new Date();
          customer.messagesSentCount = (customer.messagesSentCount || 0) + 1;
          await customer.save();

          recipientResults.push({
            customerId: customer._id,
            customerName: customerFullName,
            phoneNumber: destinationNumber,
            status: 'SENT',
            error: null,
            sentAt: new Date(),
            externalMessageId: result.externalMessageId
          });

          // Log campaign sent message to Unified Inbox Conversation
          try {
            const aiChatHandler = require('../services/aiChatHandler');
            await aiChatHandler.logOutboundMessage(
              req.user.id,
              customer._id,
              placeholderContent,
              channel,
              result.externalMessageId,
              mediaUrl,
              {
                businessPhoneNumber: displayNum
              }
            );
          } catch (logErr) {
            console.error('[Campaign Manual Log] Failed to log conversation:', logErr.message);
          }
        } else {
          failCount++;
          const errReason = result?.error || result?.failureReason || 'Dispatch failed';
          recipientResults.push({
            customerId: customer._id,
            customerName: customerFullName,
            phoneNumber: destinationNumber,
            status: 'FAILED',
            error: errReason,
            sentAt: null
          });
          console.warn(`Campaign manual send failed for customer ${customer._id}:`, errReason);
        }

        const message = new Message({
          userId: req.user.id,
          customerId: customer._id,
          campaignId: campaign._id,
          templateId: campaign.templateId || campaign.messageTemplate?._id || (typeof campaign.messageTemplate === 'string' || typeof campaign.messageTemplate === 'object' ? campaign.messageTemplate : null),
          content: placeholderContent,
          originalContent: placeholderOriginalContent,
          channel,
          status: result?.status || (result?.success ? 'SENT' : 'FAILED'),
          sentAt: result?.success ? new Date() : null,
          failureReason: result?.failureReason || result?.error,
          externalMessageId: result?.externalMessageId,
          businessPhoneNumber: displayNum,
          messageType: 'MANUAL',
          mediaUrl,
          mediaType,
          mediaMimeType,
          clickUrl: campaign.buttonUrl || null,
          widgetData: buttons ? { buttons } : null
        });

        await message.save();
      } catch (innerError) {
        console.error(`Error sending manual message to customer ${customer._id}:`, innerError);
        failCount++;
        recipientResults.push({
          customerId: customer._id,
          customerName: customerFullName,
          phoneNumber: destinationNumber,
          status: 'FAILED',
          error: innerError.message || 'Error occurred during dispatch',
          sentAt: null
        });
      }
    }

    // Update campaign counters so the UI metrics (Sent/Failed) increase correctly
    campaign.totalSent = (campaign.totalSent || 0) + successCount;
    campaign.totalFailed = (campaign.totalFailed || 0) + failCount;
    campaign.deliveryRate = campaign.totalSent > 0
      ? (campaign.totalDelivered / campaign.totalSent * 100)
      : 0;
    campaign.updatedAt = Date.now();
    await campaign.save();

    console.log(`✅ Campaign stats updated after manual send. Targets: ${campaign.totalTargets}, Sent: ${campaign.totalSent}, Failed: ${campaign.totalFailed}`);

    res.json({
      success: successCount > 0,
      message: successCount > 0
        ? `Manual send completed. Sent: ${successCount}, Failed: ${failCount}`
        : `Manual send failed for all selected customers. Failed: ${failCount}`,
      successCount,
      failCount,
      totalCount: customers.length,
      partialSuccess: successCount > 0 && failCount > 0,
      recipients: recipientResults
    });
  } catch (error) {
    console.error('❌ Manual Send Error:', error);
    console.error('📋 Error Stack:', error.stack);
    console.error('📋 Error Details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({ 
      error: 'Failed to execute manual send',
      details: error.message,
      errorCode: error.code
    });
  }
});

// ============ PAUSE CAMPAIGN ============
router.post('/:id/pause', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'RUNNING' },
      { status: 'PAUSED', pausedAt: new Date() },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or not running' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Pause Campaign Error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// ============ RESUME CAMPAIGN ============
router.post('/:id/resume', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'PAUSED' },
      { status: 'RUNNING', pausedAt: null },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or not paused' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Resume Campaign Error:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
});

// ============ COMPLETE CAMPAIGN ============
router.post('/:id/complete', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: { $in: ['RUNNING', 'PAUSED', 'SCHEDULED'] } },
      { 
        status: 'COMPLETED',
        completedAt: new Date()
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or already completed' });
    }

    console.log(`✅ Campaign marked as complete: ${campaign.name} (${campaign._id})`);
    res.json(campaign);
  } catch (error) {
    console.error('Complete Campaign Error:', error);
    res.status(500).json({ error: 'Failed to complete campaign' });
  }
});

// ============ GET CAMPAIGN ANALYTICS ============
router.get('/:id/analytics', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get message statistics
    const messages = await Message.find({ campaignId: campaign._id });

    const analytics = {
      overview: {
        totalTargets: campaign.totalTargets,
        totalSent: campaign.totalSent,
        totalDelivered: campaign.totalDelivered,
        totalRead: campaign.totalRead,
        totalFailed: campaign.totalFailed,
        deliveryRate: campaign.totalSent > 0 ? (campaign.totalDelivered / campaign.totalSent * 100).toFixed(2) : 0,
        readRate: campaign.totalDelivered > 0 ? (campaign.totalRead / campaign.totalDelivered * 100).toFixed(2) : 0
      },
      timeline: messages.reduce((acc, msg) => {
        const date = msg.sentAt?.toISOString().split('T')[0];
        if (date) {
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {}),
      statusBreakdown: {
        sent: messages.filter(m => m.status === 'SENT').length,
        delivered: messages.filter(m => m.status === 'DELIVERED').length,
        read: messages.filter(m => m.status === 'READ').length,
        failed: messages.filter(m => m.status === 'FAILED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Campaign Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Campaign execution moved to campaignService.js

module.exports = router;
