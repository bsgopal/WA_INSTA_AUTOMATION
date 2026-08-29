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

    const batchSize = campaign.batchSize || 100;
    const throttleDelay = campaign.throttleDelay || 1000;
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

    console.log(`[CampaignService] Starting execution of campaign ${campaign.name} (${campaign._id}) for ${customers.length} target customers.`);

    // Resolve the Meta template once for the whole batch and fetch its real
    // body-parameter count so the send payload always matches the template.
    const hasMedia = !!(mediaUrl || mediaPreviewData);
    let resolvedTemplateName = campaign.metaTemplateName || campaign.messageTemplate?.name;
    if (!resolvedTemplateName || !/^[a-z0-9_-]+$/.test(resolvedTemplateName)) {
      resolvedTemplateName = hasMedia ? 'sales_promotion' : 'message';
    }
    const templateLang = campaign.metaTemplateLanguage || campaign.messageTemplate?.language || campaign.language || 'en_US';
    let bodyParamCount = await MetaService.getTemplateBodyParamCount(
      campaign.userId,
      resolvedTemplateName,
      templateLang
    );
    if (bodyParamCount === null || bodyParamCount === undefined) {
      bodyParamCount = hasMedia ? 0 : 1;
    }
    console.log(`[CampaignService] Template resolution: ${resolvedTemplateName} (${templateLang}) expects ${bodyParamCount} body param(s)`);

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
            const personalizedContent = await VariableInterpolationService.interpolateVariables(
              content,
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
              userId: campaign.userId,
              // Bulk campaign sends must always use the Meta Cloud API configuration
              forceMeta: true
            };

            if (!isDirectMediaSend) {
              // Use the resolved template and the real parameter count for every customer
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

          // Throttle to prevent rate limit
          await new Promise(resolve => setTimeout(resolve, throttleDelay));
        } catch (error) {
          console.error(`[CampaignService] Error sending message to customer ${customer._id}:`, error);
          campaign.totalFailed++;
        }
      }

      await campaign.save();
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
