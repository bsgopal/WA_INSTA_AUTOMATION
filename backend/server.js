// renic-automation-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============ CRASH-PROOFING ============
// Never let the packaged server die from an unexpected exception.
// Log everything and keep serving.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
});

// Make sure the uploads directory tree exists (multer writes here)
const uploadsRoot = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(path.join(uploadsRoot, 'templates'), { recursive: true });
  fs.mkdirSync(path.join(uploadsRoot, 'campaigns'), { recursive: true });
  fs.mkdirSync(path.join(uploadsRoot, 'catalog'), { recursive: true });
  fs.mkdirSync(path.join(uploadsRoot, 'invoices'), { recursive: true });
} catch (e) {
  console.warn('⚠️ Could not pre-create uploads directories:', e.message);
}

const app = express();

// ============ MIDDLEWARE ============
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));

// ============ MULTI-TENANT RESOLVER ============
const tenantResolver = require('./middlewares/tenantResolver');
app.use(tenantResolver);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ ROUTES ============
const { requireFeature } = require('./middlewares/featureGate');

app.use('/api/v1/license', require('./routes/licenseSync'));
app.use('/api/v1/oauth', require('./routes/oauth'));
app.use('/api/v1/client', require('./routes/oauth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./middlewares/auth-middleware'), require('./routes/customers'));
app.use('/api/messages', require('./middlewares/auth-middleware'), require('./routes/messages'));
app.use('/api/campaigns', require('./middlewares/auth-middleware'), requireFeature('bulkBroadcast'), require('./routes/campaigns'));
app.use('/api/templates', require('./middlewares/auth-middleware'), requireFeature('templates'), require('./routes/templates'));
app.use('/api/analytics', require('./middlewares/auth-middleware'), require('./routes/analytics'));
app.use('/api/ai', require('./middlewares/auth-middleware'), requireFeature('aiAgent'), require('./routes/ai'));
app.use('/api/workflows', require('./middlewares/auth-middleware'), requireFeature('workflows'), require('./routes/workflows'));
app.use('/api/categories', require('./middlewares/auth-middleware'), require('./routes/categories'));
app.use('/api/catalog', require('./middlewares/auth-middleware'), requireFeature('catalog'), require('./routes/catalog'));
app.use('/api/conversations', require('./middlewares/auth-middleware'), require('./routes/conversations'));
app.use('/api/shop-config', require('./middlewares/auth-middleware'), require('./routes/shopConfigRoutes'));
app.use('/api/quick-replies', require('./middlewares/auth-middleware'), requireFeature('quickReplies'), require('./routes/quickReplies'));
app.use('/api/ai-chat', require('./middlewares/auth-middleware'), require('./routes/aiChat'));
app.use('/api/response-rules', require('./middlewares/auth-middleware'), requireFeature('responseRules'), require('./routes/responseRules'));
app.use('/api/knowledge-documents', require('./middlewares/auth-middleware'), require('./routes/knowledgeDocuments'));
app.use('/api/lists', require('./middlewares/auth-middleware'), require('./routes/lists'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/notifications', require('./routes/notifications'));

// ============ TENANT SSE & OAUTH 2.0 GATING ============
const sseClients = new Set();
let cachedScreenPermissions = null;
let cachedOauthEnforced = false;

const broadcastTenantUpdate = (data) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
};
app.set('broadcastTenantUpdate', broadcastTenantUpdate);

const getOauthStatus = async () => {
  try {
    const ShopConfig = require('./models/ShopConfig');
    const config = await ShopConfig.findOne({});
    const hasClientId = Boolean(config?.oauthConfig?.clientId?.trim());
    const hasClientSecret = Boolean(config?.oauthConfig?.clientSecret?.trim());
    const configured = hasClientId && hasClientSecret;
    const verified = Boolean(config?.oauthConfig?.verified && configured);
    return {
      configured,
      verified,
      clientId: config?.oauthConfig?.clientId || '',
      lastVerifiedAt: config?.oauthConfig?.lastVerifiedAt || null
    };
  } catch (e) {
    return { configured: false, verified: false, clientId: '', lastVerifiedAt: null };
  }
};

app.get('/api/tenant/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (res.flushHeaders) res.flushHeaders();

  const ShopConfig = require('./models/ShopConfig');
  const config = await ShopConfig.findOne({});
  const oauthStatus = await getOauthStatus();

  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    screenPermissions: config?.screenPermissions || cachedScreenPermissions || {},
    oauthEnforced: config?.oauthEnforced !== undefined ? config.oauthEnforced : cachedOauthEnforced,
    oauthStatus
  })}\n\n`);

  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/tenant/screens', async (req, res) => {
  try {
    const ShopConfig = require('./models/ShopConfig');
    const config = await ShopConfig.findOne({});
    const oauthStatus = await getOauthStatus();
    res.json({
      success: true,
      screenPermissions: config?.screenPermissions || cachedScreenPermissions || {},
      oauthEnforced: config?.oauthEnforced !== undefined ? config.oauthEnforced : cachedOauthEnforced,
      oauthStatus,
      customerCode: 'WA01'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/verify-oauth', async (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ success: false, error: 'Client ID and Client Secret are required' });
  }

  const cleanClientId = clientId.trim();
  const cleanClientSecret = clientSecret.trim();
  const hqUrl = process.env.RENIC_HQ_URL || 'http://127.0.0.1:5050';

  try {
    const axios = require('axios');
    const tokenRes = await axios.post(`${hqUrl}/api/v1/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: cleanClientId,
      client_secret: cleanClientSecret
    }, { timeout: 4000 });

    if (tokenRes.data?.access_token) {
      const ShopConfig = require('./models/ShopConfig');
      let config = await ShopConfig.findOne({});
      if (!config) {
        config = new ShopConfig({ userId: new mongoose.Types.ObjectId() });
      }
      config.oauthConfig = {
        clientId: cleanClientId,
        clientSecret: cleanClientSecret,
        verified: true,
        lastVerifiedAt: new Date()
      };
      await config.save();

      broadcastTenantUpdate({
        type: 'PERMISSIONS_UPDATED',
        oauthStatus: {
          configured: true,
          verified: true,
          clientId: cleanClientId,
          lastVerifiedAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'OAuth 2.0 Credentials successfully verified with Renic Soft Master!',
        verified: true,
        expiresIn: tokenRes.data.expires_in
      });
    }

    res.status(400).json({ success: false, error: 'Failed to verify token with Renic Soft Master' });
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    res.status(400).json({ success: false, error: `Verification failed: ${msg}` });
  }
});

app.post('/api/settings/oauth-credentials', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    const cleanClientId = (clientId || '').trim();
    const cleanClientSecret = (clientSecret || '').trim();

    const ShopConfig = require('./models/ShopConfig');
    let config = await ShopConfig.findOne({});
    if (!config) {
      config = new ShopConfig({ userId: new mongoose.Types.ObjectId() });
    }

    const currentClientId = (config?.oauthConfig?.clientId || '').trim();
    const currentClientSecret = (config?.oauthConfig?.clientSecret || '').trim();
    
    let verified = Boolean(config?.oauthConfig?.verified);
    if (!cleanClientId || !cleanClientSecret || cleanClientId !== currentClientId || cleanClientSecret !== currentClientSecret) {
      verified = false;
    }

    config.oauthConfig = {
      clientId: cleanClientId,
      clientSecret: cleanClientSecret,
      verified,
      lastVerifiedAt: verified ? config?.oauthConfig?.lastVerifiedAt : null
    };
    await config.save();

    const oauthStatus = await getOauthStatus();
    broadcastTenantUpdate({
      type: 'PERMISSIONS_UPDATED',
      oauthStatus
    });

    res.json({ success: true, oauthStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tenant/sync-push', async (req, res) => {
  const { screenPermissions, oauthEnforced, clientId, revoked, whatsappSenderMode, dockerThrottleSeconds } = req.body;
  if (screenPermissions) cachedScreenPermissions = screenPermissions;
  if (oauthEnforced !== undefined) cachedOauthEnforced = !!oauthEnforced;

  try {
    const ShopConfig = require('./models/ShopConfig');
    let config = await ShopConfig.findOne({});
    if (!config) {
      config = new ShopConfig({ userId: new mongoose.Types.ObjectId() });
    }
    if (screenPermissions) config.screenPermissions = screenPermissions;
    if (oauthEnforced !== undefined) config.oauthEnforced = !!oauthEnforced;
    if (whatsappSenderMode) config.whatsappSenderMode = whatsappSenderMode;
    if (dockerThrottleSeconds !== undefined) config.dockerThrottleSeconds = Number(dockerThrottleSeconds) || 6;
    if (revoked) {
      if (config.oauthConfig) config.oauthConfig.verified = false;
    }
    if (clientId && config.oauthConfig?.clientId && config.oauthConfig.clientId !== clientId) {
      config.oauthConfig.verified = false;
    }
    await config.save();
  } catch (e) {
    console.error('[WA_INSTA OTA Live Push] DB update error:', e.message);
  }

  const oauthStatus = await getOauthStatus();
  broadcastTenantUpdate({
    type: 'PERMISSIONS_UPDATED',
    screenPermissions: cachedScreenPermissions,
    oauthEnforced: cachedOauthEnforced,
    oauthStatus,
    whatsappSenderMode: whatsappSenderMode || 'META',
    dockerThrottleSeconds: Number(dockerThrottleSeconds) || 6
  });

  res.json({ success: true, message: 'WA_INSTA OTA sync received and broadcasted' });
});

// ============ HEALTH CHECK ============
const healthHandler = (_, res) => {
  res.json({ 
    status: 'ok', 
    service: 'RENIC TECHNOLOGY API', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============ DATABASE & SERVER START ============
const connectWithRetry = async (mongoUri, attempts = 0) => {
  try {
    return await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    if (attempts < 10) {
      console.warn(`⏳ MongoDB not ready yet (attempt ${attempts + 1}/10). Retrying in 5s...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectWithRetry(mongoUri, attempts + 1);
    }
    throw err;
  }
};

const startServer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.NODE_ENV === 'development' 
      ? process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation'
      : process.env.MONGODB_ATLAS_URI;

    await connectWithRetry(mongoUri);

    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${process.env.NODE_ENV === 'development' ? 'Local MongoDB' : 'MongoDB Atlas'}`);

    // Seed default admin user (9345578103 / 123456)
    try {
      const User = require('./models/User');
      const adminPhone = '9345578103';
      const adminEmail = 'admin@renic.com';
      const rawPassword = '123456';
      let adminUser = await User.findOne({ phone: adminPhone });
      
      if (!adminUser) {
        adminUser = new User({
          firstName: 'Admin',
          lastName: 'Renic',
          email: adminEmail,
          phone: adminPhone,
          password: rawPassword,
          role: 'PLATFORM_OWNER',
          companyName: 'Renic Automation',
          isActive: true
        });
        await adminUser.save();
        console.log(`✅ Admin user seeded successfully: ${adminPhone} / ${rawPassword} (PLATFORM_OWNER)`);
      } else {
        if (adminUser.role !== 'PLATFORM_OWNER' || !adminUser.isActive) {
          adminUser.role = 'PLATFORM_OWNER';
          adminUser.isActive = true;
          await adminUser.save();
        }
        console.log(`ℹ️ Admin user (${adminPhone}) already active with PLATFORM_OWNER.`);
      }
    } catch (seedErr) {
      console.error('⚠️ Admin user seeding failed:', seedErr.message);
    }

    // Initialize WAHA WhatsApp service
    try {
      const WhatsAppService = require('./services/WhatsAppService');
      const wahaStatus = await WhatsAppService.initialize();
      
      if (wahaStatus.success) {
        console.log('✅ WAHA WhatsApp service initialized');
        if (wahaStatus.qrCodeUrl) {
          console.log(`📸 QR Code available at: ${wahaStatus.qrCodeUrl}`);
        }
      } else {
        console.warn('⚠️ WAHA initialization warning:', wahaStatus.error);
      }
    } catch (err) {
      console.warn('⚠️ WAHA initialization skipped:', err.message);
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 RENIC TECHNOLOGY API running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API Base: http://localhost:${PORT}/api`);

      // Initialize scheduled jobs
      try {
        require('./services/schedulerService').init();
        console.log('📅 Scheduler initialized');
      } catch (err) {
        console.warn('⚠️ Scheduler initialization skipped:', err.message);
      }

      // Initialize Renic HQ Heartbeat Telemetry
      try {
        const { startHeartbeatService } = require('./services/heartbeatService');
        startHeartbeatService();
        console.log('📡 [Telemetry] Renic HQ heartbeat service initialized');
      } catch (hbErr) {
        console.warn('⚠️ [Telemetry] Heartbeat skipped:', hbErr.message);
      }

      // Auto-start Docker Desktop & WAHA container
      try {
        const { exec } = require('child_process');
        const fs = require('fs');
        const path = require('path');

        console.log(`🐳 [Auto-Docker] Checking WAHA container status...`);
        exec('docker start waha', (error) => {
          if (error) {
            console.warn(`⚠️ [Auto-Docker] Docker daemon unreachable or container stopped: ${error.message}`);
            
            // Check if Docker Desktop can be launched automatically
            const candidatePaths = [
              path.join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
              'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'
            ];
            const desktopExe = candidatePaths.find(p => fs.existsSync(p));
            if (desktopExe) {
              console.log(`🐳 [Auto-Docker] Auto-launching Docker Desktop from: ${desktopExe}`);
              exec(`"${desktopExe}"`, () => {});
              
              // Poll until Docker daemon is up and start waha container
              let attempts = 0;
              const checkInterval = setInterval(() => {
                attempts++;
                exec('docker start waha', (retryErr) => {
                  if (!retryErr) {
                    console.log(`\x1b[32m✅ [Auto-Docker] WAHA container started successfully after Docker Desktop launch!\x1b[0m`);
                    clearInterval(checkInterval);
                  } else if (attempts >= 15) {
                    clearInterval(checkInterval);
                    console.warn(`⚠️ [Auto-Docker] Timed out waiting for Docker Desktop to boot.`);
                  }
                });
              }, 4000);
            }
          } else {
            console.log(`\x1b[32m✅ [Auto-Docker] WAHA container started successfully!\x1b[0m`);
          }
        });
      } catch (err) {
        console.warn(`⚠️ [Auto-Docker] Failed to execute docker command.`);
      }

      // Auto-start ngrok tunnel if packaged as an EXE or explicitly enabled
      const isExe = typeof process.pkg !== 'undefined';
      const shouldStartNgrok = isExe || process.env.START_NGROK === 'true';
      
      if (shouldStartNgrok) {
        const webhookUrl = process.env.WAHA_WEBHOOK_URL || '';
        let ngrokDomain = process.env.NGROK_DOMAIN || null;
        if (!ngrokDomain && webhookUrl) {
          const match = webhookUrl.match(/https?:\/\/([a-zA-Z0-9.-]+\.ngrok(?:-free)?\.(?:dev|app|io))/i);
          if (match) {
            ngrokDomain = match[1];
          }
        }
        
        console.log(`⚡ [Auto-Ngrok] Initializing ngrok tunnel on port ${PORT}...`);
        const token = process.env.NGROK_AUTHTOKEN;
        
        if (!token) {
          console.warn('ℹ️  [Auto-Ngrok] NGROK_AUTHTOKEN is not set in backend/.env. Recommended for stable tunnels.');
        }

        try {
          const ngrok = require('@ngrok/ngrok');
          const connectOpts = {
            addr: PORT,
            authtoken: token || undefined
          };
          if (ngrokDomain) {
            connectOpts.domain = ngrokDomain;
            console.log(`⚡ [Auto-Ngrok] Using configured domain: ${ngrokDomain}`);
          }

          ngrok.connect(connectOpts).then(url => {
            const tunnelUrl = typeof url === 'string' ? url : (url.url ? url.url() : String(url));
            console.log(`\x1b[32m✅ [Auto-Ngrok] Tunnel online: ${tunnelUrl} -> http://localhost:${PORT}\x1b[0m`);
            console.log(`\x1b[36m🔗 [Auto-Ngrok] Webhook URL: ${tunnelUrl}/api/webhooks/whatsapp\x1b[0m`);
            global.ngrokStatus = { running: true, url: tunnelUrl };
          }).catch(e => {
            console.error(`❌ [Auto-Ngrok] Failed to start programmatic tunnel: ${e.message}`);
            global.ngrokStatus = { running: false, url: null, error: e.message };
            if (e.message.includes('authentication failed') || e.message.includes('authtoken')) {
              console.error('❌ [Auto-Ngrok] Please provide a valid NGROK_AUTHTOKEN in your .env file.');
            }
          });
        } catch (e) {
          console.warn(`⚠️ [Auto-Ngrok] @ngrok/ngrok error: ${e.message}. Falling back to system CLI...`);
          const { exec } = require('child_process');
          const authCmd = token ? `ngrok config add-authtoken ${token} && ` : '';
          const domainFlag = ngrokDomain ? ` --domain=${ngrokDomain}` : '';
          const ngrokCmd = `${authCmd}ngrok http ${PORT}${domainFlag}`;
          console.log(`⚡ [Auto-Ngrok] Launching child process: ${ngrokCmd}`);
          
          const ngrokProcess = exec(ngrokCmd, (error) => {
            if (error) {
              console.error(`❌ [Auto-Ngrok] Process failed: ${error.message}`);
              global.ngrokStatus = { running: false, url: null };
            }
          });
          
          ngrokProcess.stdout.on('data', (data) => {
            console.log(`[ngrok-stdout] ${data.trim()}`);
          });
          ngrokProcess.stderr.on('data', (data) => {
            console.warn(`[ngrok-stderr] ${data.trim()}`);
          });
        }
      }
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('ℹ️ Server will keep running and retry MongoDB connection in 15s...');
    setTimeout(startServer, 15000);
  }
};
  // If this file is the entrypoint, start the server. Otherwise export the app for integration tests.
  if (require.main === module) {
    startServer();
  }

  module.exports = { app, startServer };

module.exports = app;