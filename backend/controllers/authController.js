const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Auth user & get token using phone
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const identifier = (req.body.phone || req.body.mobile || req.body.email || req.body.username || req.body.login || req.body.identifier || '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide registered phone/mobile/email and password' });
    }

    const mongoose = require('mongoose');
    const bcryptjs = require('bcryptjs');
    const explicitCode = (req.customerCode || req.clientId || req.body.clientId || req.body.customerCode || '').trim();

    // 1. If explicit tenant/client code is supplied, target that exact tenant database first
    let user = null;
    if (explicitCode && explicitCode !== 'DEFAULT') {
      try {
        const cleanCode = explicitCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const targetDbName = `renic_tenant_${cleanCode}`;
        const tDb = mongoose.connection.useDb(targetDbName, { useCache: true });
        const rawUser = await tDb.collection('users').findOne({
          $or: [
            { phone: identifier },
            { mobile: identifier },
            { email: identifier.toLowerCase() }
          ]
        });

        if (rawUser) {
          const isMatch = await bcryptjs.compare(password, rawUser.password);
          if (isMatch) {
            user = await User.findOneAndUpdate(
              {
                $or: [
                  { email: (rawUser.email || '').toLowerCase() },
                  { phone: rawUser.phone || rawUser.mobile || identifier }
                ]
              },
              {
                $set: {
                  companyName: rawUser.companyName || rawUser.name || 'Renic Technology',
                  firstName: rawUser.firstName || rawUser.name?.split(' ')[0] || 'Admin',
                  lastName: rawUser.lastName || rawUser.name?.split(' ').slice(1).join(' ') || 'User',
                  email: (rawUser.email || `${identifier}@client.com`).toLowerCase().trim(),
                  phone: (rawUser.phone || rawUser.mobile || identifier).trim(),
                  password: rawUser.password,
                  role: 'ADMIN',
                  isActive: true
                }
              },
              { upsert: true, new: true }
            ).select('+password');
          }
        }
      } catch (tErr) {
        console.warn('[Direct Tenant Lookup Note]:', tErr.message);
      }
    }

    // 2. Check in default User collection
    if (!user) {
      user = await User.findOne({
        $or: [
          { phone: identifier },
          { mobile: identifier },
          { email: identifier.toLowerCase() }
        ]
      }).select('+password');
    }

    // 2. If not found, check in tenant database
    if (!user) {
      try {
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        const tenantDbNames = dbs.databases
          .map(d => d.name)
          .filter(name => name.startsWith('renic_tenant_') || name.startsWith('renic_trial_'));

        for (const dbName of tenantDbNames) {
          const tDb = mongoose.connection.useDb(dbName, { useCache: true });
          const rawUser = await tDb.collection('users').findOne({
            $or: [
              { phone: identifier },
              { mobile: identifier },
              { email: identifier.toLowerCase() }
            ]
          });

          if (rawUser) {
            // Found in tenant database — create or sync into local User model
            const bcryptjs = require('bcryptjs');
            const isMatch = await bcryptjs.compare(password, rawUser.password);
            if (isMatch) {
              const upserted = await User.findOneAndUpdate(
                {
                  $or: [
                    { email: (rawUser.email || '').toLowerCase() },
                    { phone: rawUser.phone || rawUser.mobile || identifier }
                  ]
                },
                {
                  $set: {
                    companyName: rawUser.companyName || rawUser.name || 'Renic Technology',
                    firstName: rawUser.firstName || rawUser.name?.split(' ')[0] || 'Admin',
                    lastName: rawUser.lastName || rawUser.name?.split(' ').slice(1).join(' ') || 'User',
                    email: (rawUser.email || `${identifier}@client.com`).toLowerCase().trim(),
                    phone: (rawUser.phone || rawUser.mobile || identifier).trim(),
                    password: rawUser.password,
                    role: 'ADMIN',
                    isActive: true
                  }
                },
                { upsert: true, new: true }
              ).select('+password');

              user = upserted;
              break;
            }
          }
        }
      } catch (tErr) {
        console.warn('[Tenant Lookup Note]:', tErr.message);
      }
    }

    // 3. If still not found, check Master HQ client table to resolve customer
    if (!user) {
      try {
        const masterDb = mongoose.connection.useDb('renic_soft', { useCache: true });
        const client = await masterDb.collection('clients').findOne({
          $or: [
            { pendingOwnerMobile: identifier },
            { pendingOwnerEmail: identifier.toLowerCase() },
            { contact: identifier },
            { customerCode: identifier.toUpperCase() }
          ]
        });

        if (client && client.pendingOwnerPassword) {
          const bcryptjs = require('bcryptjs');
          const isMatch = await bcryptjs.compare(password, client.pendingOwnerPassword);
          if (isMatch) {
            user = await User.findOneAndUpdate(
              { email: (client.pendingOwnerEmail || `${client.customerCode.toLowerCase()}@client.com`).toLowerCase() },
              {
                $set: {
                  companyName: client.name || 'Renic Technology',
                  firstName: client.pendingOwnerName?.split(' ')[0] || client.name?.split(' ')[0] || 'Admin',
                  lastName: client.pendingOwnerName?.split(' ').slice(1).join(' ') || 'User',
                  email: (client.pendingOwnerEmail || `${client.customerCode.toLowerCase()}@client.com`).toLowerCase(),
                  phone: (client.pendingOwnerMobile || client.contact || identifier).trim(),
                  password: client.pendingOwnerPassword,
                  role: 'ADMIN',
                  isActive: true
                }
              },
              { upsert: true, new: true }
            ).select('+password');
          }
        }
      } catch (mErr) {
        console.warn('[Master Client Lookup Note]:', mErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Auto promote phone 9345578103 to PLATFORM_OWNER
    if (identifier.includes('9345578103') || user.phone?.includes('9345578103')) {
      if (user.role !== 'PLATFORM_OWNER') {
        user.role = 'PLATFORM_OWNER';
        await user.save();
      }
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated. Please contact support.' });
    }

    // ============ LICENSE EXPIRY ENFORCEMENT ============
    // Platform owner is never blocked. Other users are blocked once their license expires.
    let licenseStatus = null;
    try {
      const License = require('../models/License');
      const { getLicenseStatus } = require('../utils/licenseStatus');

      const license = await License.findOne({ email: user.email.toLowerCase().trim() })
        || await License.findOne({ phone: user.phone });

      licenseStatus = getLicenseStatus(license);

      if (licenseStatus.status === 'expired' && user.role !== 'PLATFORM_OWNER' && user.role !== 'ADMIN') {
        return res.status(403).json({
          message: `Your license has expired on ${new Date(licenseStatus.expiresAt).toLocaleDateString()}. Please contact your provider to renew your license.`
        });
      }
    } catch (licenseErr) {
      console.error('License check error on login:', licenseErr.message);
    }

    // For ADMIN role, only require OTP if explicitly configured via REQUIRE_ADMIN_OTP=true
    if (user.role === 'ADMIN' && process.env.REQUIRE_ADMIN_OTP === 'true') {
      try {
        const crypto = require('crypto');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        user.loginOtp = otpHash;
        user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send email
        let emailSent = false;
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: process.env.SMTP_PORT || 2525,
            auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
          });
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail({
              from: 'no-reply@renic.ai',
              to: user.email,
              subject: 'Your login OTP',
              text: `Your OTP for admin login is: ${otp}. It expires in 10 minutes.`
            });
            emailSent = true;
          }
        } catch (mailErr) {
          console.warn('Admin login OTP mail send failed:', mailErr.message);
        }

        console.log(`[ADMIN LOGIN OTP] User: ${user.email} | OTP: ${otp} | emailSent: ${emailSent}`);

        // Don't return token yet — require OTP verification via /verify-login-otp
        user.password = undefined;
        return res.status(200).json({ success: true, requiresOtp: true, emailSent, email: user.email });
      } catch (err) {
        console.error('Failed to generate admin login OTP:', err.message);
      }
    }

    // Resolve client details from Master HQ if available
    const effectiveCode = (req.customerCode || req.clientId || explicitCode || '').trim();
    let resolvedClient = null;
    try {
      const masterDb = mongoose.connection.useDb('renic_soft', { useCache: true });
      resolvedClient = await masterDb.collection('clients').findOne({
        $or: [
          { pendingOwnerEmail: user.email },
          { pendingOwnerMobile: user.phone },
          { contact: user.phone },
          { email: user.email },
          ...(effectiveCode && effectiveCode !== 'DEFAULT' ? [{ customerCode: effectiveCode.toUpperCase() }, { clientId: effectiveCode }] : [])
        ]
      });
    } catch (cErr) {
      // ignore
    }

    const finalCustomerCode = resolvedClient?.customerCode || (effectiveCode && effectiveCode !== 'DEFAULT' ? effectiveCode : 'APX-WA01');
    const finalClientId = resolvedClient?.clientId || resolvedClient?._id?.toString() || finalCustomerCode;

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        customerCode: finalCustomerCode,
        clientId: finalClientId
      },
      process.env.JWT_SECRET || 'renic_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Remove password from user object before sending
    const userObj = user.toJSON ? user.toJSON() : user.toObject();
    delete userObj.password;
    userObj.customerCode = finalCustomerCode;
    userObj.clientId = finalClientId;
    if (resolvedClient?.clientSecret) {
      userObj.clientSecret = resolvedClient.clientSecret;
    }

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      client: resolvedClient ? {
        _id: resolvedClient._id,
        name: resolvedClient.name,
        customerCode: resolvedClient.customerCode,
        clientId: resolvedClient.clientId,
        clientSecret: resolvedClient.clientSecret,
        planTier: resolvedClient.planTier,
        licenseEnd: resolvedClient.licenseEnd
      } : null,
      license: licenseStatus
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
