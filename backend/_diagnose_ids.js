/**
 * _diagnose_ids.js — compare externalMessageId formats between messages that
 * received delivery/read receipts (READ) and the campaign messages stuck at
 * QUEUED, to prove whether receipts can ever match the stuck ones.
 */
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/renic-automation');
  const Message = require('./models/Message');

  const kindOf = (id) => {
    if (!id) return 'MISSING';
    if (id.includes('@lid')) return 'LID';
    if (id.includes('@s.whatsapp.net')) return 'WHATSAPP';
    if (id.includes('@c.us')) return 'DIRECT';
    return 'OTHER';
  };

  const dump = async (label, query) => {
    const rows = await Message.find(query).sort({ createdAt: -1 }).limit(6).lean();
    const total = await Message.countDocuments(query);
    console.log(`\n[${label}] count=${total}`);
    rows.forEach((m) => {
      const id = String(m.externalMessageId || '(none)');
      console.log(
        `  ${String(m.status).padEnd(10)} ${kindOf(m.externalMessageId).padEnd(9)} ext=${id.slice(0, 54)}  at=${(m.sentAt || m.createdAt).toISOString().slice(0, 19)}`
      );
    });
  };

  await dump('QUEUED (stuck)', { status: 'QUEUED' });
  await dump('READ (working)', { status: 'READ' });
  await dump('DELIVERED / SENT', { status: { $in: ['DELIVERED', 'SENT'] } });

  const lid = await Message.countDocuments({ externalMessageId: /@lid/ });
  const wa = await Message.countDocuments({ externalMessageId: /@s\.whatsapp\.net/ });
  const both = await Message.countDocuments({ externalMessageId: /@lid/, status: 'READ' });
  console.log(`\n[id format totals] @lid=${lid}  @s.whatsapp.net=${wa}`);
  console.log(`[@lid messages that DID reach READ] ${both}  <-- if >0, LID ids match fine`);

  // Were the stuck ones sent while the WAHA session/webhook was healthy?
  const stuck = await Message.find({ status: 'QUEUED' }).sort({ createdAt: -1 }).lean();
  if (stuck.length) {
    console.log(`\n[stuck window] ${stuck[stuck.length - 1].createdAt.toISOString()} .. ${stuck[0].createdAt.toISOString()}`);
    const nearby = await Message.countDocuments({
      createdAt: { $gte: stuck[stuck.length - 1].createdAt, $lte: stuck[0].createdAt },
      status: { $in: ['READ', 'DELIVERED'] }
    });
    console.log(`[READ/DELIVERED created in that same window] ${nearby}  <-- if 0, receipts were dead then`);
  }

  await mongoose.disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
