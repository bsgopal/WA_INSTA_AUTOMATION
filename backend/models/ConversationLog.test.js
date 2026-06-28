// ConversationLog.test.js
const mongoose = require('mongoose');
const ConversationLog = require('./ConversationLog');

describe('ConversationLog Schema - interactionContext.type', () => {
  describe('interactionContext.type enum validation', () => {
    test('accepts valid enum value: LIST_SELECTION', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'LIST_SELECTION',
          selectedItemId: 'row_1',
          selectedItemTitle: 'Rings'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('LIST_SELECTION');
    });

    test('accepts valid enum value: BUTTON_PRESS', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'BUTTON_PRESS',
          selectedButtonId: 'btn_1',
          selectedButtonLabel: 'Yes'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('BUTTON_PRESS');
    });

    test('accepts valid enum value: QUICK_REPLY', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'QUICK_REPLY',
          quickReplyId: 'qr_1'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('QUICK_REPLY');
    });

    test('accepts valid enum value: TEXT_INPUT', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'TEXT_INPUT'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('TEXT_INPUT');
    });

    test('defaults to TEXT_INPUT when not specified', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {}
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('TEXT_INPUT');
    });

    test('stores all interactionContext fields correctly', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'LIST_SELECTION',
          selectedItemId: 'row_1',
          selectedItemTitle: 'Rings',
          selectedItemDescription: '22k Men Rings',
          listSectionTitle: 'Collections',
          listTitle: 'Products',
          variablesContext: { custom: 'value' }
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('LIST_SELECTION');
      expect(schema.interactionContext.selectedItemId).toBe('row_1');
      expect(schema.interactionContext.selectedItemTitle).toBe('Rings');
      expect(schema.interactionContext.selectedItemDescription).toBe('22k Men Rings');
      expect(schema.interactionContext.listSectionTitle).toBe('Collections');
      expect(schema.interactionContext.listTitle).toBe('Products');
      expect(schema.interactionContext.variablesContext.custom).toBe('value');
    });

    test('stores responseRuleId with interactionContext', () => {
      const ruleId = new mongoose.Types.ObjectId();
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        responseRuleId: ruleId,
        interactionContext: {
          type: 'LIST_SELECTION',
          selectedItemId: 'row_1',
          selectedItemTitle: 'Rings'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.responseRuleId).toEqual(ruleId);
      expect(schema.interactionContext.type).toBe('LIST_SELECTION');
    });

    test('interactionContext is optional', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp'
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext).toBeDefined();
    });

    test('backward compatibility - existing documents without interactionContext work', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        details: {
          intent: 'inquiry',
          sentiment: 'positive'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.type).toBe('MESSAGE_RECEIVED');
      expect(schema.details.intent).toBe('inquiry');
    });
  });

  describe('interactionContext field combinations', () => {
    test('LIST_SELECTION with all related fields', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        responseRuleId: new mongoose.Types.ObjectId(),
        interactionContext: {
          type: 'LIST_SELECTION',
          selectedItemId: 'row_1',
          selectedItemTitle: 'Rings',
          selectedItemDescription: '22k Men Rings',
          listSectionTitle: 'Collections',
          listTitle: 'Products'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('LIST_SELECTION');
      expect(schema.interactionContext.selectedItemId).toBe('row_1');
    });

    test('BUTTON_PRESS with button fields', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'BUTTON_PRESS',
          selectedButtonId: 'btn_1',
          selectedButtonLabel: 'Yes'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('BUTTON_PRESS');
      expect(schema.interactionContext.selectedButtonId).toBe('btn_1');
    });

    test('QUICK_REPLY with quick reply fields', () => {
      const logData = {
        userId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        type: 'MESSAGE_RECEIVED',
        channel: 'whatsapp',
        interactionContext: {
          type: 'QUICK_REPLY',
          quickReplyId: 'qr_1'
        }
      };
      
      const schema = new ConversationLog(logData);
      expect(schema.interactionContext.type).toBe('QUICK_REPLY');
      expect(schema.interactionContext.quickReplyId).toBe('qr_1');
    });
  });
});
