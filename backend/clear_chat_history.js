// Clear all chat history and contacts
const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/Conversation');
const ConversationMessage = require('./models/ConversationMessage');
const ConversationLog = require('./models/ConversationLog');
const Message = require('./models/Message');
const Customer = require('./models/Customer');

const connectDB = require('./config/db');

const clearChatHistory = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('🗑️  Starting to clear chat history and contacts...\n');

    // Clear Conversations
    const conversationCount = await Conversation.countDocuments();
    await Conversation.deleteMany({});
    console.log(`✅ Cleared ${conversationCount} conversations`);

    // Clear Conversation Messages
    const messageCount = await ConversationMessage.countDocuments();
    await ConversationMessage.deleteMany({});
    console.log(`✅ Cleared ${messageCount} conversation messages`);

    // Clear Conversation Logs
    const logCount = await ConversationLog.countDocuments();
    await ConversationLog.deleteMany({});
    console.log(`✅ Cleared ${logCount} conversation logs`);

    // Clear Messages
    const individualMessageCount = await Message.countDocuments();
    await Message.deleteMany({});
    console.log(`✅ Cleared ${individualMessageCount} individual messages`);

    // Clear Customers (Contacts)
    const customerCount = await Customer.countDocuments();
    await Customer.deleteMany({});
    console.log(`✅ Cleared ${customerCount} customers/contacts`);

    console.log('\n✨ All chat history and contacts have been cleared successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing chat history:', error.message);
    process.exit(1);
  }
};

// Run the script
clearChatHistory();
