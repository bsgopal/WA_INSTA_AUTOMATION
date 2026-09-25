// backend/seed_admin.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/User');

const seedAdmin = async () => {
  const mongoUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/renic-automation';

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully');

    const adminPhone = '9345578103';
    const rawPassword = '123456';
    const adminEmail = 'admin@renic.com';

    let user = await User.findOne({ 
      $or: [{ phone: adminPhone }, { email: adminEmail }] 
    });

    if (user) {
      console.log(`Found existing user with phone ${user.phone} or email ${user.email}. Updating...`);
      user.phone = adminPhone;
      user.email = adminEmail;
      user.role = 'PLATFORM_OWNER';
      user.firstName = 'Admin';
      user.lastName = 'Renic';
      user.companyName = 'Renic Automation';
      user.isActive = true;
      user.password = rawPassword; // pre('save') hook will hash this if changed
      await user.save();
      console.log(`✅ Updated user ${adminPhone} to PLATFORM_OWNER with password '${rawPassword}'`);
    } else {
      console.log(`Creating new user with phone ${adminPhone}...`);
      user = new User({
        firstName: 'Admin',
        lastName: 'Renic',
        email: adminEmail,
        phone: adminPhone,
        password: rawPassword,
        role: 'PLATFORM_OWNER',
        companyName: 'Renic Automation',
        isActive: true
      });
      await user.save();
      console.log(`✅ Seeded admin user successfully: Phone: ${adminPhone} | Password: ${rawPassword} | Role: PLATFORM_OWNER`);
    }

    // Verify password comparison
    const userForCheck = await User.findOne({ phone: adminPhone }).select('+password');
    const isValid = await userForCheck.comparePassword(rawPassword);
    console.log(`🔐 Password verification test: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
