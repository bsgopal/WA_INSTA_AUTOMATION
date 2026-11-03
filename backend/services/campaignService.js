// renic-automation-backend/services/campaignService.js
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const WhatsAppService = require('./WhatsAppService');
const MetaService = require('./MetaService');
const VariableInterpolationService = require('./VariableInterpolationService');

/**
 * Execute a campaign by sending templates to the target customers list
 */
async function executeCampaign(campaign, customers) {
  try {
    // Make sure template is populated
    if (!campaign.messageTemplate || !campaign.messageTemplate.content) {
      campaign = await Campaign.findById(campaign._id).populate('messageTemplate');
    }

    const content = campaign.messageTemplate?.content || campaign.messageContent || 'Hello!';

    // Make sure the target count is reflected so UI progress is accurate
    if (!campaign.totalTargets || campaign.totalTargets < customers.length) {
      campaign.totalTargets = customers.length;
    }

    // Check tenant WhatsApp Dispatch Engine (META vs DOCKER)
    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId: campaign.userId }) || await ShopConfig.findOne({});
    const senderMode = (campaign.senderMode || shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();
    const isDockerMode = senderMode === 'DOCKER';

    // Anti-ban delay: In Docker mode, enforce client's configured delay or default 6 seconds (6000ms)
    const activeThrottleDelay = isDockerMode
      ? ((shop?.dockerThrottleSeconds || 6) * 1000)
      : (campaign.throttleDelay || 1000);

    const batchSize = campaign.batchSize || (isDockerMode ? 20 : 100);
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

    console.log(`[CampaignService] Starting execution of campaign ${campaign.name} (${campaign._id}) for ${customers.length} target customers. [Engine: ${senderMode}, Throttle: ${activeThrottleDelay}ms]`);

    // Resolve the Meta template only when using Meta Cloud API.
    // Docker WAHA sends custom interpolated content directly with media.
    const hasMedia = !!(mediaUrl || mediaPreviewData);
    let resolvedTemplateName = null;
    let templateLang = 'en_US';
    let bodyParamCount = 0;

    if (!isDockerMode) {
      resolvedTemplateName = campaign.metaTemplateName || campaign.messageTemplate?.name;
      if (!resolvedTemplateName || !/^[a-z0-9_-]+$/.test(resolvedTemplateName)) {
        resolvedTemplateName = hasMedia ? 'sales_promotion' : 'message';
      }
      templateLang = campaign.metaTemplateLanguage || campaign.messageTemplate?.language || campaign.language || 'en_US';
      bodyParamCount = await MetaService.getTemplateBodyParamCount(
        campaign.userId,
        resolvedTemplateName,
        templateLang
      );
      if (bodyParamCount === null || bodyParamCount === undefined) {
        bodyParamCount = hasMedia ? 0 : 1;
      }
      console.log(`[CampaignService] Meta Template resolution: ${resolvedTemplateName} (${templateLang}) expects ${bodyParamCount} body param(s)`);
    } else {
      console.log(`[CampaignService] 🐳 Docker WAHA mode active for campaign ${campaign.name}. Using ${activeThrottleDelay / 1000}s anti-ban delay per message.`);
    }

    // Enterprise WhatsApp Prepaid Wallet & Balance Gate Check
    const License = require('../models/License');
    const license = await License.findOne().sort({ createdAt: -1 });
    const isBypassActive = !!(license?.allowWithoutBalance);

    if (license && !isBypassActive) {
      const balance = Number(license.walletBalance || 0);
      const rate = Number(license.messageRate || 0.90);
      const availableCredits = rate > 0 ? Math.floor(balance / rate) : 0;
      const requiredCredits = customers.length;

      if (availableCredits < requiredCredits) {
        console.warn(`[CampaignService] 🛑 Pre-flight wallet gate BLOCKED campaign '${campaign.name}'. Required: ${requiredCredits} msgs, Available: ${availableCredits} msgs (Balance: Rs ${balance} @ Rs ${rate}/msg)`);
        campaign.status = 'FAILED';
        campaign.errorMessage = `Insufficient message credits. Campaign targets ${requiredCredits} contacts, but your wallet only has ${availableCredits} messages remaining (Balance: Rs ${balance.toFixed(2)} @ Rs ${rate.toFixed(2)}/msg). Please recharge your wallet in Renic Soft.`;
        await campaign.save();
        return;
      }
    }

    // Docker anti-ban pattern: 6s between messages, but a longer 30s pause after every 5th message
    let dockerMessageCount = 0;
    let campaignMessagesSentCount = 0;

    for (let i = 0; i < customers.length; i += batchSize) {
      // Check if campaign is still running/active
      const currentCampaign = await Campaign.findById(campaign._id);
      if (!currentCampaign || currentCampaign.status !== 'RUNNING') {
        console.log(`[CampaignService] Campaign execution halted. Status is: ${currentCampaign ? currentCampaign.status : 'DELETED'}`);
        break;
      }

      const batch = customers.slice(i, i + batchSize);

      for (const customer of batch) {
        try {
          // Send message based on channel
          if (campaign.channels.includes('whatsapp')) {
            const destinationNumber = customer.whatsappNumber || customer.phone;
            if (!destinationNumber) {
              campaign.totalFailed++;
              continue;
            }
            // Resolve language for customer (e.g. Tamil 'ta', Hindi 'hi', Telugu 'te', etc.)
            let customerRawContent = content;
            const custLang = (customer.language || 'en').toLowerCase().trim();
            const langCodeMap = {
              'tamil': 'ta', 'hindi': 'hi', 'telugu': 'te', 'kannada': 'kn',
              'malayalam': 'ml', 'marathi': 'mr', 'gujarati': 'gu', 'bengali': 'bn',
              'punjabi': 'pa', 'odia': 'or', 'urdu': 'ur', 'english': 'en'
            };
            const resolvedLang = langCodeMap[custLang] || custLang;

            if (campaign.messageTemplate?.translations?.[resolvedLang]) {
              customerRawContent = campaign.messageTemplate.translations[resolvedLang];
            } else if (campaign.translations?.[resolvedLang]) {
              customerRawContent = campaign.translations[resolvedLang];
            } else if (resolvedLang !== 'en' && resolvedLang !== (campaign.language || 'en').toLowerCase()) {
              // Dynamic AI translation fallback into customer's preferred language
              try {
                const aiMessageAnalyzer = require('./aiMessageAnalyzer');
                const aiConfig = {
                  provider: shop?.useAnthropic && shop?.anthropicApiKey ? 'anthropic' : 'gemini',
                  apiKey: (shop?.useAnthropic && shop?.anthropicApiKey) ? shop.anthropicApiKey : (shop?.geminiApiKey || process.env.GEMINI_API_KEY),
                  model: (shop?.useAnthropic && shop?.anthropicApiKey) ? (shop?.anthropicModel || 'claude-3-haiku-20240307') : (shop?.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash')
                };
                if (aiConfig.apiKey) {
                  const translated = await aiMessageAnalyzer.translateText(customerRawContent, resolvedLang, aiConfig);
                  if (translated && translated.trim()) {
                    customerRawContent = translated;
                  }
                }
              } catch (tErr) {
                console.warn(`[CampaignService] Auto-translation to ${resolvedLang} skipped:`, tErr.message);
              }
            }

            const personalizedContent = await VariableInterpolationService.interpolateVariables(
              customerRawContent,
              campaign.userId,
              { customer }
            );
            
            // Prepare media payload
            const mediaPayload = {};
            if (mediaUrl || mediaPreviewData) {
              mediaPayload.mediaType = mediaType;
              mediaPayload.mediaMimeType = mediaMimeType;
              mediaPayload.mediaFileName = mediaFileName;
              if (mediaUrl) mediaPayload.mediaUrl = mediaUrl;
              if (mediaPreviewData) mediaPayload.mediaData = mediaPreviewData;
              console.log(`[CampaignService] Preparing media for customer ${customer._id}`, {
                hasMediaUrl: !!mediaUrl,
                hasMediaData: !!mediaPreviewData
              });
            }
            
            const isDirectMediaSend = campaign.messageType === 'MEDIA' && hasMedia && !campaign.metaTemplateName;
            const sendOptions = {
              ...mediaPayload,
              ...(buttons ? { buttons } : {}),
              buttonUrl: campaign.buttonUrl,
              buttonLabel: campaign.buttonLabel,
              userId: campaign.userId,
              forceMeta: !isDockerMode,
              forceWaha: isDockerMode
            };

            if (!isDockerMode && !isDirectMediaSend) {
              // Use the resolved template and the real parameter count for every customer (Meta only)
              sendOptions.templateName = resolvedTemplateName;
              sendOptions.templateLanguage = templateLang;
              sendOptions.templateParams = MetaService.buildTemplateParams(bodyParamCount, personalizedContent);
            }

            const result = await WhatsAppService.sendMessage(
              destinationNumber,
              personalizedContent,
              sendOptions
            );

            // Update campaign stats based on the ACTUAL send result
            if (result.success) {
              campaign.totalSent++;
              campaignMessagesSentCount++;
            } else {
              campaign.totalFailed++;
            }

            // Get business phone number from ShopConfig
            const ShopConfig = require('../models/ShopConfig');
            const shop = await ShopConfig.findOne({ userId: campaign.userId });
            const displayNum = shop?.metaDisplayPhoneNumber || shop?.contactPhone || '';

            const placeholderContent = personalizedContent || (hasMedia ? `[${mediaType || 'Media'}]` : '');
            const placeholderOriginalContent = content || (hasMedia ? `[${mediaType || 'Media'}]` : '');

            if (result.success) {
              // Log campaign sent message to Unified Inbox Conversation
              try {
                const aiChatHandler = require('./aiChatHandler');
                await aiChatHandler.logOutboundMessage(
                  campaign.userId,
                  customer._id,
                  placeholderContent,
                  'whatsapp',
                  result.externalMessageId,
                  mediaUrl,
                  {
                    businessPhoneNumber: displayNum
                  }
                );
              } catch (logErr) {
                console.error('[Campaign Service Log] Failed to log conversation:', logErr.message);
              }
            }

            // Create message record
            const message = new Message({
              userId: campaign.userId,
              campaignId: campaign._id,
              customerId: customer._id,
              templateId: campaign.messageTemplate?._id,
              content: placeholderContent,
              originalContent: placeholderOriginalContent,
              channel: 'whatsapp',
              messageType: 'MANUAL',
              status: result?.status || (result?.success ? 'SENT' : 'FAILED'),
              sentAt: result?.success ? new Date() : null,
              failureReason: result?.failureReason || result?.error,
              externalMessageId: result?.externalMessageId,
              businessPhoneNumber: displayNum,
              clickUrl: campaign.buttonUrl || null,
              widgetData: buttons ? { buttons } : null
              // NOTE: NOT storing mediaPreviewData to avoid large document sizes
            });

            try {
              await message.save();
            } catch (saveError) {
              // Message record failure should NOT flip the send counter -
              // the WhatsApp send itself already succeeded/failed above.
              console.error(`[CampaignService] Failed to save message record for customer ${customer._id}:`, saveError.message);
            }
          }

          // Throttle to prevent rate limit (6s in Docker mode, 1s in Meta mode)
          // Docker anti-ban pattern: 6s between messages, then a 30s pause after every 5th message
          if (isDockerMode) {
            dockerMessageCount++;
            const isLongPause = dockerMessageCount % 5 === 0;
            const delayMs = isLongPause ? 30000 : activeThrottleDelay;
            console.log(`[CampaignService] Docker anti-ban delay: ${delayMs / 1000}s ${isLongPause ? '(long pause after 5 messages)' : `(message #${dockerMessageCount})`}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            await new Promise(resolve => setTimeout(resolve, activeThrottleDelay));
          }
        } catch (error) {
          console.error(`[CampaignService] Error sending message to customer ${customer._id}:`, error);
          campaign.totalFailed++;
        }
      }

      await campaign.save();
    }

    // Sync consumed message credits to Renic Soft HQ
    if (campaignMessagesSentCount > 0) {
      try {
        const axios = require('axios');
        const hqUrl = process.env.RENIC_HQ_URL || 'http://127.0.0.1:5050';
        const clientIdentifier = license?.customerCode || license?.subdomain || 'default';
        await axios.post(`${hqUrl}/api/wallet/${clientIdentifier}/consume`, {
          messagesCount: campaignMessagesSentCount,
          campaignId: campaign._id,
          campaignName: campaign.name,
          referenceId: `CAMP-${campaign._id}`,
          description: `Dispatched ${campaignMessagesSentCount} messages for campaign: ${campaign.name}`
        }, { timeout: 4000 });
        console.log(`[CampaignService] 💳 Successfully reported ${campaignMessagesSentCount} consumed messages to Renic Soft HQ.`);
      } catch (hqErr) {
        console.warn('[CampaignService] Note: Failed to report message consumption to Renic Soft HQ:', hqErr.message);
      }
    }

    // Mark campaign as completed
    const finalCampaign = await Campaign.findById(campaign._id);
    if (finalCampaign && finalCampaign.status === 'RUNNING') {
      finalCampaign.status = 'COMPLETED';
      finalCampaign.completedAt = new Date();
      finalCampaign.deliveryRate = finalCampaign.totalSent > 0 ? (finalCampaign.totalDelivered / finalCampaign.totalSent * 100) : 0;
      await finalCampaign.save();
      console.log(`✅ [CampaignService] Campaign ${finalCampaign.name} execution completed. Sent: ${finalCampaign.totalSent}, Failed: ${finalCampaign.totalFailed}`);
    }
  } catch (error) {
    console.error('[CampaignService] Execute Campaign Error:', error);
    await Campaign.findByIdAndUpdate(campaign._id, { status: 'FAILED' });
  }
}

module.exports = {
  executeCampaign
};
