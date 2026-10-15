/**
 * _diagnose_split.js — what actually separates the 13 QUEUED campaign messages
 * from the 57 that reached READ, given both are @lid ids in the same window?
 */
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/renic-automation');
  const Message = require('./models/Message');

  console.log('[status x campaignId]');
  const rows = await Message.aggregate([
    {
      $group: {
        _id: { status: '$status', isCampaign: { $ne: [{ $ifNull: ['$campaignId', null] }, null] } },
        n: { $sum: 1 }
      }
    },
    { $sort: { '_id.status': 1 } }
  ]);
  rows.forEach((r) => console.log(`  ${String(r._id.status).padEnd(10)} campaign=${String(r._id.isCampaign).padEnd(5)} n=${r.n}`));

  console.log('\n[status x messageType]');
  (await Message.aggregate([{ $group: { _id: { s: '$status', t: '$messageType' }, n: { $sum: 1 } } }]))
    .forEach((r) => console.log(`  ${String(r._id.s).padEnd(10)} ${String(r._id.t).padEnd(10)} n=${r.n}`));

  const stuck = await Message.find({ status: 'QUEUED' }).lean();
  const good = await Message.find({ status: 'READ', campaignId: { $ne: null } }).lean();

  const summarize = (label, arr) => {
    console.log(`\n[${label}] n=${arr.length}`);
    if (!arr.length) return;
    const pick = (o) => JSON.stringify(o);
    const keys = ['channel', 'messageType', 'businessPhoneNumber', 'userId', 'clickUrl', 'senderMode'];
    keys.forEach((k) => {
      const vals = [...new Set(arr.map((m) => pick(m[k])))];
      console.log(`  ${k.padEnd(20)} ${vals.slice(0, 4).join(', ').slice(0, 110)}`);
    });
    const withCampaign = arr.filter((m) => m.campaignId).length;
    console.log(`  ${'campaignId'.padEnd(20)} ${withCampaign}/${arr.length}`);
    const withExt = arr.filter((m) => m.externalMessageId).length;
    console.log(`  ${'externalMessageId'.padEnd(20)} ${withExt}/${arr.length}`);
    console.log(`  sample createdAt      ${arr[0].createdAt?.toISOString()}`);
    console.log(`  sample sentAt         ${arr[0].sentAt ? arr[0].sentAt.toISOString() : 'null'}`);
  };

  summarize('QUEUED (stuck)', stuck);
  summarize('READ but FROM CAMPAIGN', good);

  // Was anything created AFTER the last stuck one that did complete?
  const lastStuck = stuck.map((m) => m.createdAt).sort().pop();
  console.log(`\n[last stuck createdAt] ${lastStuck.toISOString()}`);
  const after = await Message.find({ createdAt: { $gt: lastStuck } })
    .sort({ createdAt: 1 })
    .limit(10)
    .lean();
  console.log(`[messages created after it] ${after.length}`);
  after.forEach((m) => console.log(`  ${String(m.status).padEnd(10)} campaign=${m.campaignId ? 'Y' : 'N'} at=${m.createdAt.toISOString().slice(0, 19)}`));

  await mongoose.disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
