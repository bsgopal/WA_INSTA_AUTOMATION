// renic-automation-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

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
const path = require('path');
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
const startServer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.NODE_ENV === 'development' 
      ? process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation'
      : process.env.MONGODB_ATLAS_URI;

    await mongoose.connect(mongoUri);

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
    app.listen(PORT, () => {
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
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;