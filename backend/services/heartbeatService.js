const axios = require('axios');
const License = require('../models/License');
const Customer = require('../models/Customer');
const Message = require('../models/Message');

const HQ_API_URL = process.env.RENIC_HQ_URL || 'http://127.0.0.1:5050';

/**
 * Gather health metrics and send to Renic_Soft HQ
 */
async function sendHeartbeat() {
  try {
    const license = await License.findOne().sort({ createdAt: -1 });
    if (!license || !license.subdomain) {
      return; // Not yet linked to an HQ subdomain
    }

    // Tally monthly message count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let monthlyMessages = 0;
    let totalContacts = 0;

    try {
      monthlyMessages = await Message.countDocuments({ createdAt: { $gte: startOfMonth } });
      totalContacts = await Customer.countDocuments({});
    } catch (dbErr) {
      // Non-fatal
    }

    // Determine WhatsApp connection state
    let waStatus = 'connected';
    try {
      const whatsappService = require('./whatsappService');
      waStatus = (whatsappService.isReady && whatsappService.isReady()) ? 'connected' : 'disconnected';
    } catch (e) {
      waStatus = 'connected';
    }

    const payload = {
      subdomain: license.subdomain,
      whatsappStatus: waStatus,
      monthlyMessagesSent: monthlyMessages,
      totalContacts: totalContacts,
      appVersion: '2.5.0'
    };

    await axios.post(`${HQ_API_URL}/api/sync/heartbeat`, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    // Silently ignore HQ heartbeat failures to never affect client operations
  }
}

/**
 * Send network router phone-home heartbeat to Renic_Soft HQ (every 60s)
 */
async function sendTenantHeartbeat() {
  try {
    const customerCode = process.env.CUSTOMER_CODE || 'AU20';
    const port = parseInt(process.env.PORT, 10) || 5000;
    await axios.post(`${HQ_API_URL}/api/v1/tenant/heartbeat`, {
      customerCode,
      appVersion: '2.5.0',
      localPort: port
    }, { timeout: 4000 });
  } catch (err) {
    // Non-fatal, offline fallback
  }
}

function startHeartbeatService() {
  // Tenant phone-home ping immediately and every 60 seconds
  setTimeout(sendTenantHeartbeat, 2000);
  setInterval(sendTenantHeartbeat, 60 * 1000);

  // Send first sync ping 5 seconds after boot, then every 15 minutes
  setTimeout(sendHeartbeat, 5000);
  setInterval(sendHeartbeat, 15 * 60 * 1000);
}

module.exports = {
  sendHeartbeat,
  sendTenantHeartbeat,
  startHeartbeatService
};

