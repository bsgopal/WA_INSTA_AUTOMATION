/**
 * Integration helpers for Campaign components
 * Centralizes callback handlers and state management
 */

import apiClient from '../../api/client';

/**
 * Campaign action handlers
 */
export const createCampaignHandlers = (setSnackbar, fetchCampaigns, setLoading) => ({
  // Create new campaign from wizard
  onCreateCampaign: async (formData) => {
    try {
      setLoading(true);
      const payload = {
        name: formData.name || formData.topic,
        topic: formData.topic,
        description: formData.description,
        type: formData.type || 'ONE_TIME',
        channels: formData.channels || ['whatsapp'],
        messageContent: formData.messageContent,
        messageType: formData.messageType || 'TEXT',
        messageTemplate: formData.messageTemplate,
        buttonLabel: formData.buttonLabel,
        buttonUrl: formData.buttonUrl,
        targetAudience: {
          segments: (formData.targetSegment && formData.targetSegment !== 'ALL')
            ? [formData.targetSegment]
            : [],
          languages: formData.selectedLanguages || [],
          customFilter: formData.customFilter || null
        },
        mediaType: formData.mediaType || 'none',
        mediaUrl: formData.mediaUrl,
        mediaPreviewData: formData.mediaPreviewData,
        mediaMimeType: formData.mediaMimeType,
        mediaFileName: formData.mediaFileName,
        metaTemplateName: formData.metaTemplateName,
        metaTemplateLanguage: formData.metaTemplateLanguage,
        scheduledAt: formData.scheduledAt || undefined
      };

      const response = await apiClient.post('/campaigns', payload);
      
      setSnackbar({
        open: true,
        message: 'Campaign created successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to create campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Update existing campaign
  onUpdateCampaign: async (campaignId, formData) => {
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        topic: formData.topic,
        description: formData.description,
        type: formData.type || 'ONE_TIME',
        channels: formData.channels || ['whatsapp'],
        messageContent: formData.messageContent,
        messageType: formData.messageType || 'TEXT',
        messageTemplate: formData.messageTemplate,
        buttonLabel: formData.buttonLabel,
        buttonUrl: formData.buttonUrl,
        targetAudience: {
          segments: (formData.targetSegment && formData.targetSegment !== 'ALL')
            ? [formData.targetSegment]
            : [],
          languages: formData.selectedLanguages || [],
          customFilter: formData.customFilter || null
        },
        mediaType: formData.mediaType || 'none',
        mediaUrl: formData.mediaUrl,
        mediaPreviewData: formData.mediaPreviewData,
        mediaMimeType: formData.mediaMimeType,
        mediaFileName: formData.mediaFileName,
        metaTemplateName: formData.metaTemplateName,
        metaTemplateLanguage: formData.metaTemplateLanguage,
        scheduledAt: formData.scheduledAt || undefined
      };

      const response = await apiClient.put(`/campaigns/${campaignId}`, payload);
      
      setSnackbar({
        open: true,
        message: 'Campaign updated successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to update campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Launch campaign
  onLaunchCampaign: async (campaignId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/campaigns/${campaignId}/launch`);
      
      setSnackbar({
        open: true,
        message: 'Campaign launched successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to launch campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to launch campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Pause campaign
  onPauseCampaign: async (campaignId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/campaigns/${campaignId}/pause`);
      
      setSnackbar({
        open: true,
        message: 'Campaign paused successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to pause campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Resume campaign
  onResumeCampaign: async (campaignId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/campaigns/${campaignId}/resume`);
      
      setSnackbar({
        open: true,
        message: 'Campaign resumed successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to resume campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Complete campaign
  onCompleteCampaign: async (campaignId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/campaigns/${campaignId}/complete`);
      
      setSnackbar({
        open: true,
        message: 'Campaign marked as completed!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to complete campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to complete campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Delete campaign
  onDeleteCampaign: async (campaignId) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/campaigns/${campaignId}`);
      
      setSnackbar({
        open: true,
        message: 'Campaign deleted successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Schedule campaign for later
  onScheduleCampaign: async (campaignId, scheduledAt) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/campaigns/${campaignId}/schedule`, {
        scheduledAt
      });

      setSnackbar({
        open: true,
        message: 'Campaign scheduled successfully!',
        severity: 'success'
      });

      fetchCampaigns();
      return response.data;
    } catch (error) {
      console.error('Failed to schedule campaign:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to schedule campaign',
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }
});

/**
 * Utility functions
 */
export const estimateReach = async (segment) => {
  try {
    const response = await apiClient.get('/customers/count', {
      params: { segment: segment || 'ALL' }
    });
    return response.data.count || 0;
  } catch (error) {
    console.error('Failed to estimate reach:', error);
    return 0;
  }
};

export const formatCampaignData = (campaign) => ({
  ...campaign,
  name: campaign.name || campaign.topic,
  messageContent: campaign.messageContent || '',
  selectedLanguages: campaign.targetAudience?.languages || [],
  targetSegment: campaign.targetAudience?.segments?.[0] || 'ALL',
  customFilter: campaign.targetAudience?.customFilter || ''
});
