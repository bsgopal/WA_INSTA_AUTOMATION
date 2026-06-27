/**
 * LIST RESPONSE HANDLER SERVICE
 * 
 * Handles matching user messages against list items, extracting selected items,
 * and formatting responses with variable interpolation for WhatsApp/Instagram/SMS.
 */

const ListResponse = require('../models/ListResponse');
const VariableInterpolationService = require('./VariableInterpolationService');

class ListResponseHandler {
  /**
   * Find matching list and item based on message body
   * @param {string} messageBody - The user's message text
   * @param {string} userId - The user ID who owns the list
   * @returns {object|null} - { list, selectedItem } or null if no match
   */
  static async findMatchingList(messageBody, userId) {
    try {
      if (!messageBody || !userId) {
        console.error('ListResponseHandler.findMatchingList: messageBody and userId are required');
        return null;
      }

      // Parse messageBody as number for row selection
      const rowNumber = parseInt(messageBody.trim(), 10);

      if (isNaN(rowNumber) || rowNumber <= 0) {
        console.warn('Message is not a valid row number:', messageBody);
        return null;
      }

      // Query all lists for this user
      const lists = await ListResponse.find({
        userId,
        isActive: true
      });

      if (!lists || lists.length === 0) {
        return null;
      }

      // Search through each list's items for matching row number
      for (const list of lists) {
        if (!list.listItems || list.listItems.length === 0) {
          continue;
        }

        for (const item of list.listItems) {
          if (!item.rowNumber) {
            continue;
          }

          // Exact match on row number
          if (item.rowNumber === rowNumber) {
            return {
              list,
              selectedItem: item
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('ListResponseHandler.findMatchingList error:', error);
      return null;
    }
  }

  /**
   * Extract selected item details from a list
   * @param {object} list - The ListResponse document
   * @param {string} messageBody - The user's message text
   * @returns {object|null} - Selected item with all fields or null
   */
  static extractSelectedItem(list, messageBody) {
    try {
      if (!list || !messageBody) {
        console.error('ListResponseHandler.extractSelectedItem: list and messageBody are required');
        return null;
      }

      if (!list.listItems || list.listItems.length === 0) {
        return null;
      }

      const rowNumber = parseInt(messageBody.trim(), 10);

      if (isNaN(rowNumber) || rowNumber <= 0) {
        return null;
      }

      // Find the item that matches the row number
      const selectedItem = list.listItems.find(item => {
        if (!item.rowNumber) {
          return false;
        }
        return item.rowNumber === rowNumber;
      });

      if (!selectedItem) {
        return null;
      }

      // Return all fields of the selected item
      return {
        title: selectedItem.title || '',
        description: selectedItem.description || '',
        rowNumber: selectedItem.rowNumber || '',
        responseText: selectedItem.responseText || '',
        buttonType: selectedItem.buttonType || '',
        buttonValue: selectedItem.buttonValue || ''
      };
    } catch (error) {
      console.error('ListResponseHandler.extractSelectedItem error:', error);
      return null;
    }
  }

  /**
   * Interpolate variables in response text
   * @param {string} responseText - The response text with variables
   * @param {string} userId - The user ID
   * @param {object} customer - Customer object
   * @param {object} order - Order object
   * @returns {string} - Interpolated response text
   */
  static async interpolateResponseText(responseText, userId, customer, order) {
    try {
      if (!responseText) {
        return '';
      }

      const contextData = {
        customer: customer || {},
        order: order || {}
      };

      const interpolatedText = await VariableInterpolationService.interpolateVariables(
        responseText,
        userId,
        contextData
      );

      return interpolatedText;
    } catch (error) {
      console.error('ListResponseHandler.interpolateResponseText error:', error);
      // Return original text on error
      return responseText;
    }
  }

  /**
   * Format response message for sending
   * @param {object} selectedItem - The selected item object
   * @param {string} interpolatedText - The interpolated response text
   * @returns {object} - Formatted response object
   */
  static formatResponseMessage(selectedItem, interpolatedText) {
    try {
      if (!selectedItem) {
        console.error('ListResponseHandler.formatResponseMessage: selectedItem is required');
        return null;
      }

      return {
        message: interpolatedText || selectedItem.responseText || '',
        buttonType: selectedItem.buttonType || '',
        buttonValue: selectedItem.buttonValue || '',
        title: selectedItem.title || ''
      };
    } catch (error) {
      console.error('ListResponseHandler.formatResponseMessage error:', error);
      return null;
    }
  }

  /**
   * Complete handler for list selection - orchestrates all steps
   * @param {string} messageBody - The user's message text
   * @param {string} userId - The user ID
   * @param {object} customer - Customer object
   * @param {object} order - Order object
   * @param {string} phoneNumber - Customer's phone number
   * @param {string} channel - Channel (whatsapp, instagram, sms)
   * @returns {object} - Complete response object with all data needed to send
   */
  static async handleListSelection(messageBody, userId, customer, order, phoneNumber, channel) {
    try {
      // Validate required parameters
      if (!messageBody || !userId || !channel) {
        console.error('ListResponseHandler.handleListSelection: messageBody, userId, and channel are required');
        return {
          success: false,
          error: 'Missing required parameters'
        };
      }

      // Find matching list and item
      const matchResult = await this.findMatchingList(messageBody, userId);

      if (!matchResult) {
        return {
          success: false,
          error: 'No matching list or item found',
          matched: false
        };
      }

      const { list, selectedItem } = matchResult;

      // Extract selected item details
      const extractedItem = this.extractSelectedItem(list, messageBody);

      if (!extractedItem) {
        return {
          success: false,
          error: 'Failed to extract selected item',
          matched: false
        };
      }

      // If item has linked quick reply, use that content instead
      let responseTextToUse = extractedItem.responseText;
      if (selectedItem.linkedQuickReplyId) {
        // Get the quick reply content
        const QuickReply = require('../models/QuickReply');
        try {
          const linkedQR = await QuickReply.findById(selectedItem.linkedQuickReplyId);
          if (linkedQR && linkedQR.content) {
            responseTextToUse = linkedQR.content;
          }
        } catch (err) {
          console.warn('Failed to fetch linked quick reply:', err.message);
        }
      }

      // Interpolate variables in response text
      const interpolatedText = await this.interpolateResponseText(
        responseTextToUse,
        userId,
        customer,
        order
      );

      // Format response message
      const formattedMessage = this.formatResponseMessage(extractedItem, interpolatedText);

      if (!formattedMessage) {
        return {
          success: false,
          error: 'Failed to format response message'
        };
      }

      // Return complete response object ready to send
      return {
        success: true,
        matched: true,
        listId: list._id,
        listName: list.name,
        selectedItem: {
          title: extractedItem.title,
          rowNumber: extractedItem.rowNumber
        },
        linkedQuickReply: selectedItem.linkedQuickReplyId ? {
          id: selectedItem.linkedQuickReplyId._id || selectedItem.linkedQuickReplyId,
          name: selectedItem.linkedQuickReplyId.name
        } : null,
        response: {
          message: formattedMessage.message,
          buttonType: formattedMessage.buttonType,
          buttonValue: formattedMessage.buttonValue,
          title: formattedMessage.title
        },
        metadata: {
          phoneNumber,
          channel,
          userId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('ListResponseHandler.handleListSelection error:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }
}

module.exports = ListResponseHandler;
