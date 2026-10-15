// What does WhatsApp Settings actually load? Prints the sender-mode truth.
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_LOCAL_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/renic-automation';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('connected :', mongoose.connection.name);

    const col = mongoose.connection.collection('shopconfigs');
    const docs = await col.find({}).toArray();
    console.log('shopconfigs:', docs.length);
    if (!docs.length) console.log('  (none - Settings falls back to defaults)');

    for (const d of docs) {
      console.log('\n--- shop', d.shopName || d._id, '---');
      console.log('  whatsappSenderMode :', JSON.stringify(d.whatsappSenderMode));
      console.log('  metaApiEnabled     :', JSON.stringify(d.metaApiEnabled));
      console.log('  metaDisplayPhone   :', JSON.stringify(d.metaDisplayPhoneNumber || null));
      console.log('  waha base url      :', JSON.stringify(d.wahaBaseUrl || d.wahaApiUrl || null));
      console.log('  updatedAt          :', d.updatedAt || d.updatedAt === 0 ? new Date(d.updatedAt || d.updatedAt).toISOString() : null);
    }

    // Which branch would Settings render?
    console.log('\n=== branch Settings.jsx would render ===');
    for (const d of docs) {
      const mode = (d.whatsappSenderMode || (d.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();
      console.log(`  ${d.shopName || d._id}: senderMode=${mode}`);
      console.log(`      line 987  DOCKER block (${mode === 'DOCKER' ? 'VISIBLE' : 'hidden'})`);
      console.log(`      line 1304 META  block (${mode === 'META' ? 'VISIBLE  <-- Meta Cloud API card shows' : 'hidden'})`);
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exitCode = 1;
  }
})();
