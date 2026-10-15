// Are stale Meta credentials sitting in an instance that runs on WAHA?
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_LOCAL_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/renic-automation';

const presence = (v) => (!v ? '(empty)' : `SET (${String(v).length} chars)`);

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const docs = await mongoose.connection.collection('shopconfigs').find({}).toArray();

    for (const d of docs) {
      const mode = (d.whatsappSenderMode || (d.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();
      console.log('shop:', d.shopName || d._id);
      console.log('  whatsappSenderMode :', mode);
      console.log('  metaApiEnabled     :', d.metaApiEnabled);
      console.log('  metaAppId          :', presence(d.metaAppId));
      console.log('  metaAppSecret      :', presence(d.metaAppSecret));
      console.log('  metaPhoneNumberId  :', presence(d.metaPhoneNumberId));
      console.log('  metaAccessToken    :', presence(d.metaAccessToken));
      console.log('  metaBusinessAccId  :', presence(d.metaBusinessAccountId));

      const anyMetaCred = !!(d.metaAppId || d.metaAppSecret || d.metaPhoneNumberId || d.metaAccessToken);
      console.log('');
      console.log('  --> selected engine :', mode);
      console.log('  --> metaApiEnabled   :', d.metaApiEnabled);
      console.log('  --> any Meta creds?  :', anyMetaCred);
      if (mode === 'DOCKER' && d.metaApiEnabled && !anyMetaCred) {
        console.log('  --> INCONSISTENT: claims Meta enabled but has no credentials.');
        console.log('      Backend paths reading metaApiEnabled directly will try');
        console.log('      graph.facebook.com and fail.');
      }
      if (mode === 'DOCKER' && d.metaApiEnabled && anyMetaCred) {
        console.log('  --> STALE: Meta credentials present but engine is Docker.');
        console.log('      metaApiEnabled should be false to match the engine.');
      }
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exitCode = 1;
  }
})();
