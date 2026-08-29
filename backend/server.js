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

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ ROUTES ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./middlewares/auth-middleware'), require('./routes/customers'));
app.use('/api/messages', require('./middlewares/auth-middleware'), require('./routes/messages'));
app.use('/api/campaigns', require('./middlewares/auth-middleware'), require('./routes/campaigns'));
app.use('/api/templates', require('./middlewares/auth-middleware'), require('./routes/templates'));
app.use('/api/analytics', require('./middlewares/auth-middleware'), require('./routes/analytics'));
app.use('/api/ai', require('./middlewares/auth-middleware'), require('./routes/ai'));
app.use('/api/workflows', require('./middlewares/auth-middleware'), require('./routes/workflows'));
app.use('/api/categories', require('./middlewares/auth-middleware'), require('./routes/categories'));
app.use('/api/catalog', require('./middlewares/auth-middleware'), require('./routes/catalog'));
app.use('/api/conversations', require('./middlewares/auth-middleware'), require('./routes/conversations'));
app.use('/api/shop-config', require('./middlewares/auth-middleware'), require('./routes/shopConfigRoutes'));
app.use('/api/quick-replies', require('./middlewares/auth-middleware'), require('./routes/quickReplies'));
app.use('/api/ai-chat', require('./middlewares/auth-middleware'), require('./routes/aiChat'));
app.use('/api/response-rules', require('./middlewares/auth-middleware'), require('./routes/responseRules'));
app.use('/api/knowledge-documents', require('./middlewares/auth-middleware'), require('./routes/knowledgeDocuments'));
app.use('/api/lists', require('./middlewares/auth-middleware'), require('./routes/lists'));
// app.use('/api/multilingual', require('./middlewares/auth-middleware'), require('./routes/multilingual'));
app.use('/api/webhooks', require('./routes/webhooks'));

// ============ HEALTH CHECK ============
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    service: 'RENIC TECHNOLOGY API', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ ERROR HANDLING ============
app.use((err, _, res) => {
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

    // Seed default admin user if no user exists
    try {
      const User = require('./models/User');
      const adminPhone = '9876543210';
      const adminEmail = 'admin@renic.com';
      const existingUser = await User.findOne({ $or: [{ phone: adminPhone }, { email: adminEmail }] });
      
      if (!existingUser) {
        const adminUser = new User({
          firstName: 'Admin',
          lastName: 'User',
          email: adminEmail,
          phone: adminPhone,
          password: 'Password123!',
          role: 'ADMIN',
          companyName: 'Renic Technology'
        });
        await adminUser.save();
        console.log('✅ Default admin user seeded successfully: 9876543210 / Password123!');
      } else {
        console.log('ℹ️ Admin user already exists. Seeding skipped.');
      }
    } catch (seedErr) {
      console.error('⚠️ Default admin user seeding failed:', seedErr.message);
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

      // Auto-start Docker WAHA
      try {
        const { exec } = require('child_process');
        console.log(`🐳 [Auto-Docker] Attempting to start WAHA container...`);
        exec('docker start waha', (error) => {
          if (error) {
            console.warn(`⚠️ [Auto-Docker] Could not start WAHA container (it might already be running or docker is not installed): ${error.message}`);
          } else {
            console.log(`✅ [Auto-Docker] WAHA container started successfully!`);
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
        let ngrokDomain = null;
        if (webhookUrl.includes('.ngrok-free.dev')) {
          const match = webhookUrl.match(/https?:\/\/([a-zA-Z0-9.-]+\.ngrok-free\.dev)/);
          if (match) {
            ngrokDomain = match[1];
          }
        }
        
        if (ngrokDomain) {
          console.log(`⚡ [Auto-Ngrok] Programmatic tunnel request detected (EXE / Prod mode)`);
          const token = process.env.NGROK_AUTHTOKEN;
          
          if (!token) {
             console.warn('⚠️ [Auto-Ngrok] NGROK_AUTHTOKEN is missing in .env! Custom domains require an authtoken.');
             console.warn('⚠️ [Auto-Ngrok] Please add NGROK_AUTHTOKEN=your_token to your .env file.');
          }

          try {
            const ngrok = require('@ngrok/ngrok');
            ngrok.connect({
              addr: PORT,
              domain: ngrokDomain,
              authtoken: token || undefined
            }).then(url => {
              const tunnelUrl = typeof url === 'string' ? url : (url.url ? url.url() : String(url));
              console.log(`✅ [Auto-Ngrok] Tunnel established programmatically at: ${tunnelUrl}`);
              global.ngrokStatus = { running: true, url: tunnelUrl };
            }).catch(e => {
              console.error(`❌ [Auto-Ngrok] Failed to start programmatic tunnel: ${e.message}`);
              global.ngrokStatus = { running: false, url: null, error: e.message };
              if (e.message.includes('authentication failed')) {
                console.error('❌ [Auto-Ngrok] You MUST provide a valid NGROK_AUTHTOKEN in your .env file.');
              }
            });
          } catch (e) {
            console.warn(`⚠️ [Auto-Ngrok] @ngrok/ngrok module not found. Falling back to system ngrok. ERROR: ${e.message}`);
            const { exec } = require('child_process');
            const authCmd = token ? `ngrok config add-authtoken ${token} && ` : '';
            const ngrokCmd = `${authCmd}ngrok http ${PORT} --domain=${ngrokDomain}`;
            console.log(`⚡ [Auto-Ngrok] Launching child process: ${ngrokCmd}`);
            global.ngrokStatus = { running: true, url: `https://${ngrokDomain}` };
            
            const ngrokProcess = exec(ngrokCmd, (error) => {
              if (error) {
                console.error(`❌ [Auto-Ngrok] Process failed or was terminated: ${error.message}`);
                console.error(`❌ [Auto-Ngrok] Ensure ngrok is installed and added to your system PATH!`);
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
        } else {
          console.warn(`⚠️ [Auto-Ngrok] Could not autostart ngrok: No static ngrok domain found in WAHA_WEBHOOK_URL.`);
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