// renic-automation-backend/services/schedulerService.js
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const campaignService = require('./campaignService');

class SchedulerService {
  constructor() {
    this.initialized = false;
    this.intervalId = null;
  }

  init() {
    if (this.initialized) return;
    
    console.log('🕒 Initializing background jobs and scheduled tasks...');
    
    // Check for scheduled campaigns every 60 seconds
    this.intervalId = setInterval(() => this.checkScheduledCampaigns(), 60000);
    
    // Run an initial check shortly after startup
    setTimeout(() => this.checkScheduledCampaigns(), 5000);
    
    this.initialized = true;
  }

  async checkScheduledCampaigns() {
    try {
      const now = new Date();
      // Find campaigns that are scheduled and scheduledAt has passed
      const pendingCampaigns = await Campaign.find({
        status: 'SCHEDULED',
        scheduledAt: { $lte: now }
      });

      if (pendingCampaigns.length > 0) {
        console.log(`[SchedulerService] Found ${pendingCampaigns.length} scheduled campaigns due for execution.`);
      }

      for (const campaign of pendingCampaigns) {
        try {
          console.log(`[SchedulerService] Launching scheduled campaign: ${campaign.name} (${campaign._id})`);
          
          // Get target customers
          const query = { userId: campaign.userId };

          if (campaign.targetAudience?.segments?.length > 0) {
            query.rfmSegment = { $in: campaign.targetAudience.segments };
          }
          if (campaign.targetAudience?.languages?.length > 0) {
            query.language = { $in: campaign.targetAudience.languages };
          }
          if (campaign.targetAudience?.loyaltyTiers?.length > 0) {
            query.loyaltyTier = { $in: campaign.targetAudience.loyaltyTiers };
          }

          // Only send to opted-in customers
          if (campaign.channels.includes('whatsapp')) {
            query['optedIn.whatsapp'] = true;
          }

          const customers = await Customer.find(query);

          // Update status to RUNNING
          campaign.status = 'RUNNING';
          campaign.startedAt = new Date();
          campaign.totalTargets = customers.length;
          await campaign.save();

          // Execute campaign asynchronously
          campaignService.executeCampaign(campaign, customers);
        } catch (err) {
          console.error(`[SchedulerService] Error launching campaign ${campaign._id}:`, err.message);
          campaign.status = 'FAILED';
          await campaign.save();
        }
      }
    } catch (err) {
      console.error('[SchedulerService] Error checking scheduled campaigns:', err.message);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.initialized = false;
    console.log('🕒 Background scheduler stopped');
  }
}

module.exports = new SchedulerService();
