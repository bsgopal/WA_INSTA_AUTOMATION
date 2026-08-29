const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://localhost:27017/renic-automation', { serverSelectionTimeoutMS: 5000 });
  const Campaign = require('./models/Campaign');
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5).populate('messageTemplate').lean();
  campaigns.forEach(c => {
    console.log('===', c.name, '| status:', c.status);
    console.log('  channels:', JSON.stringify(c.channels));
    console.log('  messageType:', c.messageType, '| templateId:', c.messageTemplate?._id, '| hasTemplateContent:', !!c.messageTemplate?.content);
    console.log('  messageContent:', (c.messageContent || '').substring(0, 60));
    console.log('  mediaType:', c.mediaType, '| hasPreview:', !!c.mediaPreviewData, '| mediaUrl:', (c.mediaUrl||'').substring(0,60));
    console.log('  totalSent:', c.totalSent, '| totalFailed:', c.totalFailed, '| targetAudience:', JSON.stringify(c.targetAudience).substring(0,120));
  });
  await mongoose.disconnect();
})().catch(e => console.error(e));
