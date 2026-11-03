const express = require('express');
const router = express.Router();
const axios = require('axios');
const License = require('../models/License');
const WalletTransaction = require('../models/WalletTransaction');

const RENIC_HQ_URL = process.env.RENIC_HQ_URL || 'http://127.0.0.1:5050';

const formatIstTimestamp = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Helper to get or sync active client license
 */
async function getClientLicense(customerCode) {
  const cleanCode = (customerCode || '').toLowerCase().trim();
  let license = await License.findOne({
    $or: [
      { customerCode: cleanCode },
      { subdomain: cleanCode }
    ]
  });

  // Try sync with Renic Soft HQ if available
  try {
    const hqRes = await axios.get(`${RENIC_HQ_URL}/api/wallet/client/${cleanCode}`, { timeout: 2000 });
    if (hqRes.data && hqRes.data.success && hqRes.data.wallet) {
      const hqW = hqRes.data.wallet;
      if (!license) {
        license = new License({
          key: `RENIC-AUTO-${Date.now()}`,
          email: `${cleanCode}@renic.store`,
          firstName: hqRes.data.client?.name || cleanCode,
          lastName: 'Client',
          phone: hqRes.data.client?.mobile || '9345578103',
          companyName: hqRes.data.client?.name || cleanCode,
          customerCode: cleanCode,
          walletBalance: Number(hqW.balance || 0),
          messageRate: Number(hqW.messageRate || 0.90),
          availableCredits: Number(hqW.availableCredits || 0),
          allowWithoutBalance: !!hqW.allowWithoutBalance,
          lowBalanceThreshold: Number(hqW.lowBalanceThreshold || 200)
        });
      } else {
        license.walletBalance = Number(hqW.balance || 0);
        license.messageRate = Number(hqW.messageRate || 0.90);
        license.availableCredits = Number(hqW.availableCredits || 0);
        license.allowWithoutBalance = !!hqW.allowWithoutBalance;
        license.lowBalanceThreshold = Number(hqW.lowBalanceThreshold || 200);
      }
      await license.save();
    }
  } catch (e) {
    // HQ offline or unreachable, use local DB
  }

  if (!license) {
    license = new License({
      key: `RENIC-DEF-${Date.now()}`,
      email: `${cleanCode || 'admin'}@renic.store`,
      firstName: cleanCode || 'Client',
      lastName: 'User',
      phone: '9345578103',
      companyName: cleanCode || 'Renic Client',
      customerCode: cleanCode || 'apx-wa01',
      walletBalance: 2000,
      messageRate: 0.90,
      availableCredits: 2222,
      allowWithoutBalance: false
    });
    await license.save();
  }

  return license;
}

/**
 * @route  GET /api/wallet/status
 * @desc   Get live wallet balance, message rate, remaining credits & bypass status
 */
router.get('/status', async (req, res) => {
  try {
    const customerCode = req.customerCode || req.clientId || req.query.clientId || 'apx-wa01';
    const license = await getClientLicense(customerCode);

    const balance = Number(license.walletBalance || 0);
    const rate = Number(license.messageRate || 0.90);
    const availableCredits = rate > 0 ? Math.floor(balance / rate) : 0;

    // Aggregate statistics
    const stats = await WalletTransaction.aggregate([
      { $match: { customerCode: license.customerCode || customerCode } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          totalMessages: { $sum: '$messagesCount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalRecharged = 0;
    let totalSpent = 0;
    let totalMessagesSent = 0;

    stats.forEach((s) => {
      if (s._id === 'RECHARGE') {
        totalRecharged = s.totalAmount;
      } else if (s._id === 'MESSAGE_CONSUMPTION') {
        totalSpent = s.totalAmount;
        totalMessagesSent = s.totalMessages;
      }
    });

    res.json({
      success: true,
      customerCode: license.customerCode || customerCode,
      clientName: license.companyName || license.firstName,
      walletBalance: Math.round(balance * 100) / 100,
      messageRate: rate,
      availableCredits,
      allowWithoutBalance: !!license.allowWithoutBalance,
      lowBalanceThreshold: Number(license.lowBalanceThreshold || 200),
      totalRecharged: Math.round(totalRecharged * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalMessagesSent,
      lastSyncAt: license.lastSyncAt
    });
  } catch (err) {
    console.error('Wallet status error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet status', error: err.message });
  }
});

/**
 * @route  POST /api/wallet/recharge
 * @desc   Top-up client wallet (by ₹ amount or target message count)
 */
router.post('/recharge', async (req, res) => {
  try {
    const customerCode = req.customerCode || req.clientId || req.body.clientId || 'apx-wa01';
    const license = await getClientLicense(customerCode);

    let { amount, targetMessages, paymentMethod = 'UPI / NetBanking', referenceNote = '' } = req.body;
    const rate = Number(license.messageRate || 0.90);

    if (targetMessages && (!amount || Number(amount) <= 0)) {
      amount = Math.round(Number(targetMessages) * rate * 100) / 100;
    }

    const rechargeAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid recharge amount greater than 0 is required' });
    }

    const oldBalance = Number(license.walletBalance || 0);
    const newBalance = Math.round((oldBalance + rechargeAmount) * 100) / 100;
    const creditedMessages = rate > 0 ? Math.floor(rechargeAmount / rate) : 0;
    const newCredits = rate > 0 ? Math.floor(newBalance / rate) : 0;

    license.walletBalance = newBalance;
    license.availableCredits = newCredits;
    await license.save();

    const timestampIst = formatIstTimestamp();
    const txnId = `TXN-WLT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const actor = {
      userId: req.user?._id ? String(req.user._id) : (req.body.userId || 'client_admin'),
      name: req.user?.name || req.body.userName || license.companyName || 'Client User',
      mobile: req.user?.mobile || license.phone || '',
      role: req.user?.role || 'CLIENT_ADMIN'
    };

    const transaction = new WalletTransaction({
      transactionId: txnId,
      customerCode: license.customerCode || customerCode,
      type: 'RECHARGE',
      amount: rechargeAmount,
      messagesCount: creditedMessages,
      messageRate: rate,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      description: `In-App Wallet Top-up: Rs ${rechargeAmount.toFixed(2)} credited (+${creditedMessages} msgs @ Rs ${rate}/msg). ${referenceNote}`.trim(),
      performedBy: actor,
      status: 'SUCCESS',
      timestampIst
    });
    await transaction.save();

    // Sync to Renic Soft HQ if reachable
    try {
      await axios.post(`${RENIC_HQ_URL}/api/wallet/recharge`, {
        customerCode: license.customerCode || customerCode,
        amount: rechargeAmount,
        paymentMode: paymentMethod,
        referenceNote: `In-App Top-up (${txnId})`,
        performedBy: actor
      }, { timeout: 3000 });
      console.log(`[Wallet Sync] Synced recharge Rs ${rechargeAmount} to Renic HQ for ${customerCode}`);
    } catch (e) {
      console.warn('[Wallet Sync] Renic Soft HQ recharge sync skipped/failed:', e.message);
    }

    res.json({
      success: true,
      message: `Successfully added Rs ${rechargeAmount.toFixed(2)} to wallet (${creditedMessages} messages credited)`,
      wallet: {
        walletBalance: newBalance,
        availableCredits: newCredits,
        messageRate: rate
      },
      transaction
    });
  } catch (err) {
    console.error('Wallet recharge error:', err);
    res.status(500).json({ success: false, message: 'Recharge failed', error: err.message });
  }
});

/**
 * @route  GET /api/wallet/transactions
 * @desc   Get filterable ledger transactions with exact IST timestamps
 */
router.get('/transactions', async (req, res) => {
  try {
    const customerCode = req.customerCode || req.clientId || req.query.clientId || 'apx-wa01';
    const { type, page = 1, limit = 50 } = req.query;

    const query = {
      customerCode: (customerCode || '').toLowerCase().trim()
    };
    if (type && type !== 'ALL') {
      query.type = type;
    }

    const total = await WalletTransaction.countDocuments(query);
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      transactions
    });
  } catch (err) {
    console.error('Wallet transactions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: err.message });
  }
});

module.exports = router;
