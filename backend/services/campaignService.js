// renic-automation-backend/services/campaignService.js
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Message = require('../models/Message');
const WhatsAppService = require('./WhatsAppService');
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

    const batchSize = campaign.batchSize || 100;
    const throttleDelay = campaign.throttleDelay || 1000;

    console.log(`[CampaignService] Starting execution of campaign ${campaign.name} (${campaign._id}) for ${customers.length} target customers.`);

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
            const personalizedContent = await VariableInterpolationService.interpolateVariables(
              campaign.messageTemplate.content || 'Hello!',
              campaign.userId,
              { customer }
            );
            const result = await WhatsAppService.sendMessage(
              customer.whatsappNumber,
              personalizedContent,
              {}
            );

            // Create message record
            const message = new Message({
              userId: campaign.userId,
              campaignId: campaign._id,
              customerId: customer._id,
              content: personalizedContent,
              channel: 'whatsapp',
              status: result.success ? 'SENT' : 'FAILED',
              sentAt: result.success ? new Date() : null,
              failureReason: result.error,
              externalMessageId: result.externalMessageId
            });

            await message.save();

            // Update campaign stats
            if (result.success) {
              campaign.totalSent++;
            } else {
              campaign.totalFailed++;
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
      console.log(`[CampaignService] Campaign ${finalCampaign.name} execution completed.`);
    }
  } catch (error) {
    console.error('[CampaignService] Execute Campaign Error:', error);
    await Campaign.findByIdAndUpdate(campaign._id, { status: 'FAILED' });
  }
}

module.exports = {
  executeCampaign
};
