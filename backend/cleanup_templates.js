const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_insta_automation';

async function run() {
  try {
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(' - ' + c.name));

    // Force load/create schema using the exact model name Mongoose uses
    const Template = mongoose.model('Template', new mongoose.Schema({}, { strict: false }));

    const allTemplates = await Template.find({});
    console.log(`Found ${allTemplates.length} total templates:`);
    allTemplates.forEach(t => {
      console.log(`- [${t._id}] Name: "${t.name}"`);
    });

    const deleteResult = await Template.deleteMany({ name: { $ne: 'VA Offer' } });
    console.log(`Deleted ${deleteResult.deletedCount} templates.`);

    const remainingTemplates = await Template.find({});
    console.log(`Remaining templates count: ${remainingTemplates.length}`);
    remainingTemplates.forEach(t => {
      console.log(`- [${t._id}] Name: "${t.name}"`);
    });

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
