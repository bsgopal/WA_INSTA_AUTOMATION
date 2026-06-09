// renic-automation-backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Message = require('../models/Message');

// ============ GET DASHBOARD OVERVIEW ============
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts
    const totalCustomers = await Customer.countDocuments({ userId });
    const activeCampaigns = await Campaign.countDocuments({ userId, status: 'RUNNING' });
    const totalCampaigns = await Campaign.countDocuments({ userId });

    // Get message stats
    const messageStats = await Message.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          totalDelivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          totalRead: { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } },
          totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } }
        }
      }
    ]);

    const stats = messageStats[0] || {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0
    };

    // Calculate rates
    const deliveryRate = stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent * 100).toFixed(2) : 0;
    const readRate = stats.totalDelivered > 0 ? (stats.totalRead / stats.totalDelivered * 100).toFixed(2) : 0;
    const responseRate = stats.totalSent > 0 ? (stats.totalRead / stats.totalSent * 100).toFixed(2) : 0;

    // Get last month stats for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthMessages = await Message.countDocuments({
      userId,
      createdAt: { $gte: lastMonth }
    });

    const thisMonthMessages = await Message.countDocuments({
      userId,
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    const messageGrowth = lastMonthMessages > 0
      ? ((thisMonthMessages - lastMonthMessages) / lastMonthMessages * 100).toFixed(1)
      : 0;

    res.json({
      overview: {
        totalCustomers,
        activeCampaigns,
        totalCampaigns,
        messagesSent: stats.totalSent,
        deliveryRate: parseFloat(deliveryRate),
        readRate: parseFloat(readRate),
        responseRate: parseFloat(responseRate),
        messageGrowth: parseFloat(messageGrowth)
      },
      messageStats: {
        sent: stats.totalSent,
        delivered: stats.totalDelivered,
        read: stats.totalRead,
        failed: stats.totalFailed
      }
    });
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// ============ GET ENGAGEMENT TIMELINE ============
router.get('/engagement/timeline', async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await Message.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Format data for frontend
    const formattedData = {};

    timeline.forEach(item => {
      const date = item._id.date;
      if (!formattedData[date]) {
        formattedData[date] = {
          date,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0
        };
      }

      const status = item._id.status.toLowerCase();
      if (formattedData[date][status] !== undefined) {
        formattedData[date][status] = item.count;
      }
    });

    res.json(Object.values(formattedData));
  } catch (error) {
    console.error('Timeline Error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement timeline' });
  }
});

// ============ GET CUSTOMER SEGMENTS ANALYTICS ============
router.get('/customers/segments', async (req, res) => {
  try {
    const userId = req.user.id;

    const segments = await Customer.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$rfmSegment',
          count: { $sum: 1 },
          avgSpent: { $avg: '$totalSpent' },
          avgPurchases: { $avg: '$totalPurchases' },
          avgLoyaltyPoints: { $avg: '$loyaltyPoints' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(segments);
  } catch (error) {
    console.error('Segments Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch segment analytics' });
  }
});

// ============ GET CAMPAIGN PERFORMANCE ============
router.get('/campaigns/performance', async (req, res) => {
  try {
    const userId = req.user.id;

    const campaigns = await Campaign.find({ userId })
      .select('name status totalSent totalDelivered totalRead deliveryRate readRate createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(campaigns);
  } catch (error) {
    console.error('Campaign Performance Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign performance' });
  }
});

// ============ GET CHANNEL PERFORMANCE ============
router.get('/channels/performance', async (req, res) => {
  try {
    const userId = req.user.id;

    const channelStats = await Message.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$channel',
          totalSent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } }
        }
      }
    ]);

    const formatted = channelStats.map(stat => ({
      channel: stat._id,
      totalSent: stat.totalSent,
      delivered: stat.delivered,
      read: stat.read,
      failed: stat.failed,
      deliveryRate: stat.totalSent > 0 ? (stat.delivered / stat.totalSent * 100).toFixed(2) : 0,
      readRate: stat.delivered > 0 ? (stat.read / stat.delivered * 100).toFixed(2) : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Channel Performance Error:', error);
    res.status(500).json({ error: 'Failed to fetch channel performance' });
  }
});

// ============ GET TOP PERFORMING TEMPLATES ============
router.get('/templates/performance', async (req, res) => {
  try {
    const userId = req.user.id;

    const templateStats = await Message.aggregate([
      { $match: { userId, templateId: { $exists: true } } },
      {
        $group: {
          _id: '$templateId',
          totalSent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      { $unwind: '$template' },
      {
        $project: {
          templateName: '$template.name',
          totalSent: 1,
          delivered: 1,
          read: 1,
          deliveryRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$delivered', '$totalSent'] }, 100] },
              0
            ]
          },
          readRate: {
            $cond: [
              { $gt: ['$delivered', 0] },
              { $multiply: [{ $divide: ['$read', '$delivered'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { readRate: -1 } },
      { $limit: 10 }
    ]);

    res.json(templateStats);
  } catch (error) {
    console.error('Template Performance Error:', error);
    res.status(500).json({ error: 'Failed to fetch template performance' });
  }
});

// ============ GET REAL-TIME STATS ============
router.get('/realtime', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stats from last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    const realtimeStats = await Message.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: lastHour }
        }
      },
      {
        $group: {
          _id: null,
          messagesSent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } }
        }
      }
    ]);

    const stats = realtimeStats[0] || {
      messagesSent: 0,
      delivered: 0,
      failed: 0
    };

    // Get active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      userId,
      status: 'RUNNING'
    });

    res.json({
      lastHour: stats,
      activeCampaigns,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Realtime Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch realtime stats' });
  }
});

// ============ EXPORT ANALYTICS ============
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type = 'csv' } = req.query;

    const query = { userId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const messages = await Message.find(query)
      .populate('customerId', 'firstName lastName phone')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 });

    if (type === 'csv') {
      const csv = [
        ['Date', 'Customer', 'Phone', 'Campaign', 'Channel', 'Status', 'Content'].join(','),
        ...messages.map(m => [
          m.createdAt?.toISOString().split('T')[0],
          m.customerId ? `${m.customerId.firstName} ${m.customerId.lastName}` : 'N/A',
          m.customerId?.phone || 'N/A',
          m.campaignId?.name || 'N/A',
          m.channel,
          m.status,
          `"${m.content?.substring(0, 50)}..."`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } else {
      res.json(messages);
    }
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;
