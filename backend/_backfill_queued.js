/**
 * _backfill_queued.js — advance historical QUEUED campaign rows to SENT.
 *
 * Background: campaign sends used to seed `status: 'QUEUED'` even on success
 * (the provider returned success:true + status:'QUEUED', and callers wrote
 * result.status verbatim). Any row whose delivery receipt never arrived was
 * therefore stranded at QUEUED forever, and the UI rendered it as a failure.
 *
 * A row is only advanced when dispatch is provable: it has both an
 * externalMessageId (WhatsApp returned an ID) and a sentAt timestamp. Rows
 * missing either are left untouched — those were never actually sent.
 *
 * Reports before/after so the run is auditable. Idempotent: re-running finds
 * no QUEUED rows with an externalMessageId.
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/renic-automation';

(async () => {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] ${MONGO_URI}\n`);

  const Message = require('./models/Message');

  const before = await Message.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]);
  console.log('[status before]');
  before.forEach((s) => console.log(`  ${String(s._id).padEnd(12)} ${s.n}`));

  // Only provable dispatches: WhatsApp returned an ID and we recorded a send time.
  const eligible = await Message.countDocuments({
    status: 'QUEUED',
    externalMessageId: { $nin: [null, ''] },
    sentAt: { $ne: null }
  });
  const skippedNoId = await Message.countDocuments({
    status: 'QUEUED',
    $or: [{ externalMessageId: { $in: [null, ''] } }, { sentAt: null }]
  });

  console.log(`\n[eligible] ${eligible}  (QUEUED + externalMessageId + sentAt)`);
  console.log(`[skipped  ] ${skippedNoId}  (QUEUED but dispatch NOT provable - left as-is)`);

  if (eligible > 0) {
    const res = await Message.updateMany(
      {
        status: 'QUEUED',
        externalMessageId: { $nin: [null, ''] },
        sentAt: { $ne: null }
      },
      {
        $set: { status: 'SENT', updatedAt: new Date() },
        $unset: { failureReason: '' }
      }
    );
    console.log(`\n[updated] ${res.modifiedCount} document(s) QUEUED -> SENT`);
  } else {
    console.log('\n[updated] 0 — nothing to do');
  }

  const after = await Message.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]);
  console.log('\n[status after]');
  after.forEach((s) => console.log(`  ${String(s._id).padEnd(12)} ${s.n}`));

  // Verify no campaign row is still stranded.
  const stillQueued = await Message.countDocuments({ status: 'QUEUED' });
  console.log(`\n[QUEUED remaining] ${stillQueued}`);

  await mongoose.disconnect();
})().catch((e) => {
  console.error('BACKFILL FAILED:', e.message);
  process.exit(1);
});
