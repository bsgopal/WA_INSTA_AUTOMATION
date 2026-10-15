/**
 * _diagnose_status.js — why do sent campaign messages stay QUEUED?
 *
 * Reports, for recent outbound Message docs:
 *   - status distribution
 *   - whether externalMessageId was recorded (the webhook matches on it)
 *   - the sender mode actually configured
 * and tries the same lookup a receipt would perform, to prove whether a
 * delivery receipt could ever match.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/renic_automation';

(async () => {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] ${MONGO_URI}\n`);

  const Message = require('./models/Message');
  const ShopConfig = require('./models/ShopConfig');

  const shop = await ShopConfig.findOne({});
  console.log('[sender mode]');
  console.log('  whatsappSenderMode =', shop?.whatsappSenderMode || '(unset)');
  console.log('  metaApiEnabled      =', shop?.metaApiEnabled);
  console.log('  metaDisplayPhone    =', shop?.metaDisplayPhoneNumber || '-');
  console.log('');

  const total = await Message.countDocuments();
  const byStatus = await Message.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]);
  console.log(`[message status distribution] total=${total}`);
  byStatus.forEach(s => console.log(`  ${String(s._id).padEnd(12)} ${s.n}`));
  console.log('');

  const recent = await Message.find({}).sort({ createdAt: -1 }).limit(400);
  const queued = recent.filter(m => String(m.status).toUpperCase() === 'QUEUED');
  const queuedWithId = queued.filter(m => !!m.externalMessageId);
  const queuedCampaign = queued.filter(m => !!m.campaignId);

  console.log(`[last ${recent.length} messages]`);
  console.log(`  QUEUED               : ${queued.length}`);
  console.log(`  QUEUED with extId    : ${queuedWithId.length}   <-- receipts CAN match these`);
  console.log(`  QUEUED from campaign : ${queuedCampaign.length}`);
  console.log('');

  if (queued.length) {
    console.log('  sample QUEUED records:');
    queued.slice(0, 5).forEach(m => {
      console.log(`    status=${m.status} campaign=${!!m.campaignId} sentAt=${m.sentAt ? m.sentAt.toISOString() : 'null'} extId=${m.externalMessageId ? JSON.stringify(String(m.externalMessageId).slice(0, 48)) : '(MISSING)'}`);
    });
  }
  console.log('');

  // Simulate what handleStatusUpdate would do for a receipt.
  if (queuedWithId.length) {
    const probe = queuedWithId[0];
    const asWouldBeMatched = await Message.findOne({ externalMessageId: probe.externalMessageId }).lean();
    console.log('[receipt dry-run] lookup by externalMessageId alone (as the webhook does)');
    console.log('  probe extId =', JSON.stringify(String(probe.externalMessageId).slice(0, 64)));
    console.log('  matched doc =', asWouldBeMatched ? `status=${asWouldBeMatched.status}` : 'NO MATCH (receipt would be silently dropped)');
  }

  // How many total docs share an externalMessageId (ambiguity check).
  const dupes = await Message.aggregate([
    { $match: { externalMessageId: { $exists: true, $ne: null } } },
    { $group: { _id: '$externalMessageId', n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $limit: 5 }
  ]);
  console.log('\n[duplicate externalMessageId values]', dupes.length ? JSON.stringify(dupes) : 'none');

  const noExtIdSent = await Message.countDocuments({ externalMessageId: { $in: [null, ''] }, status: { $in: ['QUEUED', 'SENT', 'PENDING'] } });
  console.log(`[QUEUED/SENT/PENDING with NO externalMessageId] ${noExtIdSent}  <-- unmatchable by any receipt`);

  await mongoose.disconnect();
})().catch(err => { console.error('DIAG FAILED:', err.message); process.exit(1); });
