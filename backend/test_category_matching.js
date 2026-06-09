const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const mongoUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation';

// Require Models
const User = require('./models/User');
const Customer = require('./models/Customer');
const ShopConfig = require('./models/ShopConfig');
const QuickReply = require('./models/QuickReply');
const Template = require('./models/Template');
const CatalogItem = require('./models/CatalogItem');

const aiMessageAnalyzer = require('./services/aiMessageAnalyzer');

async function runTests() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  const testUserId = new mongoose.Types.ObjectId();
  const testPhone = '+919876543211';

  // Cleanup
  await Customer.deleteMany({ phone: testPhone });
  await ShopConfig.deleteMany({ userId: testUserId });
  await CatalogItem.deleteMany({ userId: testUserId });

  // Config
  const config = await ShopConfig.create({
    userId: testUserId,
    shopName: 'Kanalli Test Store',
    websiteUrl: 'https://kanalli.in/',
    catalogImageUrl: 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
    goldRate22K: 7200,
    goldRate24K: 7850,
    silverRate: 95,
    customStartPrice: 8500
  });

  // Customer
  let customer = await Customer.create({
    userId: testUserId,
    firstName: 'Bob',
    lastName: 'Jones',
    phone: testPhone,
    whatsappNumber: testPhone,
    language: 'en',
    customFields: {
      languageSelected: true,
      awaitingLanguageSelection: false
    }
  });
  
  // Seed a test bracelet for fallback db query
  await CatalogItem.create({
    userId: testUserId,
    name: 'Test Gold Bracelet',
    category: 'BRACELET',
    price: 15000,
    description: 'Beautiful test gold bracelet for men',
    imageUrl: 'https://kanalli.in/wp-content/uploads/2026/05/gold-bracelet.png'
  });

  const analysis = { intent: 'general_inquiry', sentiment: 'NEUTRAL' };

  console.log("\n--- TEST CASE 1: Query Pendant out-of-the-blue ('pendant available?') ---");
  let response = await aiMessageAnalyzer.generateResponse(analysis, customer, 'en', 'pendant available?');
  console.log("Response text length:", response.text?.length);
  console.log("State menuLevel:", customer.customFields.catalogState?.menuLevel);
  console.log("State gender:", customer.customFields.catalogState?.gender);
  console.log("State subcategory:", customer.customFields.catalogState?.subcategory);

  if (customer.customFields.catalogState?.menuLevel !== 'PRODUCTS') {
    throw new Error("Expected menuLevel to be 'PRODUCTS'");
  }
  if (customer.customFields.catalogState?.gender !== 'WOMEN') {
    throw new Error("Expected gender for pendant to be 'WOMEN'");
  }
  if (customer.customFields.catalogState?.subcategory !== 'PENDANT') {
    throw new Error("Expected subcategory to be 'PENDANT'");
  }

  // Clear state for next test
  customer.customFields.catalogState = null;
  await customer.save();

  console.log("\n--- TEST CASE 2: Query Bracelet out-of-the-blue ('show men bracelets') ---");
  response = await aiMessageAnalyzer.generateResponse(analysis, customer, 'en', 'show men bracelets');
  console.log("Response text length:", response.text?.length);
  console.log("State menuLevel:", customer.customFields.catalogState?.menuLevel);
  console.log("State gender:", customer.customFields.catalogState?.gender);
  console.log("State subcategory:", customer.customFields.catalogState?.subcategory);

  if (customer.customFields.catalogState?.menuLevel !== 'PRODUCTS') {
    throw new Error("Expected menuLevel to be 'PRODUCTS'");
  }
  if (customer.customFields.catalogState?.gender !== 'MEN') {
    throw new Error("Expected gender for bracelet to be 'MEN'");
  }
  if (customer.customFields.catalogState?.subcategory !== 'BRACELET') {
    throw new Error("Expected subcategory to be 'BRACELET'");
  }

  // Cleanup
  await Customer.deleteMany({ phone: testPhone });
  await ShopConfig.deleteMany({ userId: testUserId });
  await CatalogItem.deleteMany({ userId: testUserId });

  await mongoose.disconnect();
  console.log("\n🎉 Category matching and gender routing integration tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
