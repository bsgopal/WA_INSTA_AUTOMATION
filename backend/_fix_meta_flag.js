// Reconcile metaApiEnabled with the actually-selected engine.
//
// Safe to re-run: it only ever clears a stale `true` when the selected engine
// is DOCKER, and never touches credentials. Switching the engine to META in
// the Settings UI sets the flag back to true.
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_LOCAL_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/renic-automation';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const col = mongoose.connection.collection('shopconfigs');
    const docs = await col.find({}).toArray();

    let changed = 0;
    for (const d of docs) {
      const mode = (d.whatsappSenderMode || 'DOCKER').toUpperCase();
      const shouldBe = mode === 'META';
      const currently = !!d.metaApiEnabled;

      console.log(`shop=${d.shopName || d._id} engine=${mode} metaApiEnabled=${currently} -> ${shouldBe}`);

      if (currently !== shouldBe) {
        await col.updateOne({ _id: d._id }, { $set: { metaApiEnabled: shouldBe } });
        changed++;
        console.log('   fixed');
      }
    }

    console.log(`\n${changed} record(s) reconciled.`);
    await mongoose.disconnect();
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exitCode = 1;
  }
})();
