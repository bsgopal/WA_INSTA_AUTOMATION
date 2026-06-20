// renic-automation-backend/services/InstagramService.js
const axios = require('axios');
const Message = require('../models/Message');

// Configuration
const config = {
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  pageId: process.env.INSTAGRAM_PAGE_ID,
  apiVersion: 'v18.0',
  appSecret: process.env.INSTAGRAM_APP_SECRET
};

const baseUrl = `https://graph.facebook.com/${config.apiVersion}`;

// Initialize check
if (!config.accessToken || !config.pageId) {
  console.warn('⚠️ Instagram credentials not configured. Instagram service will be limited.');
}

// Helper: Delay for throttling
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const buildWidgetFallbackText = (message, options = {}) => {
  let fallbackText = message || '';

  if (options.list && Array.isArray(options.list.sections) && options.list.sections.length > 0) {
    fallbackText += `${fallbackText ? '\n\n' : ''}${options.list.title || 'Options'}\n`;
    (options.list.sections || []).forEach(section => {
      if (section.title) {
        fallbackText += `\n${section.title}\n`;
      }
      (section.rows || []).forEach(row => {
        fallbackText += `- ${row.title}${row.description ? `: ${row.description}` : ''}\n`;
      });
    });
  }

  if (options.buttons && options.buttons.length > 0) {
    fallbackText += `${fallbackText ? '\n\n' : ''}Options:\n`;
    options.buttons.forEach((button, index) => {
      fallbackText += `${index + 1}. ${button.label}${button.value ? ` (${button.value})` : ''}\n`;
    });
  }

  return fallbackText.trim();
};

/**
 * Send Instagram Direct Message
 */
const sendDirectMessage = async (recipientId, message, options = {}) => {
  try {
    const url = `${baseUrl}/${config.pageId}/messages`;
    const finalMessage = buildWidgetFallbackText(message, options);

    const payload = {
      recipient: { id: recipientId },
      message: {
        text: finalMessage
      },
      access_token: config.accessToken
    };

    // Add media if provided
    if (options.mediaUrl) {
      payload.message = {
        attachment: {
          type: options.mediaType || 'image',
          payload: {
            url: options.mediaUrl
          }
        }
      };
      if (finalMessage) {
        payload.message.caption = finalMessage;
      }
    }

    const response = await axios.post(url, payload);

    return {
      success: true,
      externalMessageId: response.data.message_id,
      recipientId: response.data.recipient_id,
      sentAt: new Date(),
      channel: 'instagram'
    };
  } catch (error) {
    console.error('Instagram Send Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      channel: 'instagram',
      failureReason: error.response?.data?.error?.code || 'INSTAGRAM_ERROR'
    };
  }
};

/**
 * Send bulk Instagram messages
 */
const sendBulkMessages = async (recipients, messageTemplate, options = {}) => {
  const results = [];
  const { throttleDelay = 2000 } = options; // Instagram has stricter rate limits

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      const result = await sendDirectMessage(
        recipient.instagramHandle,
        messageTemplate,
        options
      );

      results.push({
        customerId: recipient._id,
        instagramHandle: recipient.instagramHandle,
        ...result
      });

      if (i < recipients.length - 1) {
        await delay(throttleDelay);
      }
    } catch (error) {
      results.push({
        customerId: recipient._id,
        instagramHandle: recipient.instagramHandle,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Handle incoming Instagram webhook
 */
const handleIncomingMessage = async (data) => {
  try {
    const { sender, recipient, timestamp, message } = data;

    const messageDoc = new Message({
      content: message.text,
      channel: 'instagram',
      status: 'RECEIVED',
      hasResponse: true,
      responseText: message.text,
      respondedAt: new Date(timestamp),
      externalMessageId: message.mid,
      tags: ['incoming', 'customer']
    });

    await messageDoc.save();

    return {
      success: true,
      messageId: messageDoc._id,
      senderId: sender.id
    };
  } catch (error) {
    console.error('Instagram Webhook Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get Instagram user profile
 */
const getUserProfile = async (userId) => {
  try {
    const url = `${baseUrl}/${userId}`;

    const response = await axios.get(url, {
      params: {
        fields: 'id,username,name,profile_pic',
        access_token: config.accessToken
      }
    });

    return {
      success: true,
      profile: response.data
    };
  } catch (error) {
    console.error('Get Profile Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send Instagram Story Reply
 */
const sendStoryReply = async (storyId, recipientId, message) => {
  try {
    const url = `${baseUrl}/${config.pageId}/messages`;

    const payload = {
      recipient: { id: recipientId },
      message: {
        text: message,
        attachment: {
          type: 'story_mention',
          payload: {
            story_id: storyId
          }
        }
      },
      access_token: config.accessToken
    };

    const response = await axios.post(url, payload);

    return {
      success: true,
      messageId: response.data.message_id
    };
  } catch (error) {
    console.error('Story Reply Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get Instagram Insights
 */
const getInsights = async (metricType = 'impressions') => {
  try {
    const url = `${baseUrl}/${config.pageId}/insights`;

    const response = await axios.get(url, {
      params: {
        metric: metricType,
        period: 'day',
        access_token: config.accessToken
      }
    });

    return {
      success: true,
      insights: response.data.data
    };
  } catch (error) {
    console.error('Insights Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send Instagram template message (for business accounts)
 */
const sendTemplateMessage = async (recipientId, templateName, parameters) => {
  try {
    const url = `${baseUrl}/${config.pageId}/messages`;

    const payload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: templateName,
            ...parameters
          }
        }
      },
      access_token: config.accessToken
    };

    const response = await axios.post(url, payload);

    return {
      success: true,
      messageId: response.data.message_id
    };
  } catch (error) {
    console.error('Template Message Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark message as seen
 */
const markAsSeen = async (senderId) => {
  try {
    const url = `${baseUrl}/${config.pageId}/messages`;

    const payload = {
      recipient: { id: senderId },
      sender_action: 'mark_seen',
      access_token: config.accessToken
    };

    await axios.post(url, payload);

    return { success: true };
  } catch (error) {
    console.error('Mark Seen Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send typing indicator
 */
const sendTypingIndicator = async (recipientId, action = 'typing_on') => {
  try {
    const url = `${baseUrl}/${config.pageId}/messages`;

    const payload = {
      recipient: { id: recipientId },
      sender_action: action, // typing_on or typing_off
      access_token: config.accessToken
    };

    await axios.post(url, payload);

    return { success: true };
  } catch (error) {
    console.error('Typing Indicator Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (signature, body) => {
  try {
    const crypto = require('crypto');

    const expectedSignature = crypto
      .createHmac('sha256', config.appSecret)
      .update(body)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Signature Verification Error:', error.message);
    return false;
  }
};

/**
 * Get conversation history
 */
const getConversation = async (conversationId) => {
  try {
    const url = `${baseUrl}/${conversationId}/messages`;

    const response = await axios.get(url, {
      params: {
        fields: 'id,created_time,from,to,message',
        access_token: config.accessToken
      }
    });

    return {
      success: true,
      messages: response.data.data
    };
  } catch (error) {
    console.error('Get Conversation Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Auto-reply to Instagram messages
 */
const autoReply = async (senderId, triggerKeyword, replyMessage) => {
  try {
    // Send typing indicator
    await sendTypingIndicator(senderId, 'typing_on');

    // Simulate human-like delay
    await delay(1500);

    // Send reply
    const result = await sendDirectMessage(senderId, replyMessage);

    // Turn off typing indicator
    await sendTypingIndicator(senderId, 'typing_off');

    return result;
  } catch (error) {
    console.error('Auto Reply Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get the profile details of the connected Instagram Business Account
 */
const getSelfProfile = async () => {
  try {
    if (!config.pageId || !config.accessToken) {
      return { success: false, error: 'Instagram Page ID or Access Token not configured.' };
    }
    const url = `${baseUrl}/${config.pageId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'instagram_business_account{id,username,name,profile_picture_url}',
        access_token: config.accessToken
      }
    });
    
    const instaAccount = response.data?.instagram_business_account;
    if (!instaAccount) {
      return {
        success: false,
        error: 'No Instagram Business Account linked to this Facebook Page.'
      };
    }

    return {
      success: true,
      profile: {
        id: instaAccount.id,
        username: instaAccount.username,
        name: instaAccount.name,
        profilePic: instaAccount.profile_picture_url
      }
    };
  } catch (error) {
    console.error('Get Self Profile Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

module.exports = {
  sendDirectMessage,
  sendBulkMessages,
  handleIncomingMessage,
  getUserProfile,
  getSelfProfile,
  sendStoryReply,
  getInsights,
  sendTemplateMessage,
  markAsSeen,
  sendTypingIndicator,
  verifyWebhookSignature,
  getConversation,
  autoReply
};
