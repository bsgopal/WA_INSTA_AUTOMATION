const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth-middleware');
const User = require('../models/User');
const License = require('../models/License');
const { decryptLicense } = require('../utils/licenseCrypto');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, companyName, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (companyName) user.companyName = companyName;

    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    await user.save();
    
    // Remove password from returned user object
    user.password = undefined;

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// @route   POST /api/auth/license/extract
// @desc    Extract and decrypt license details from a pasted key
// @access  Public
router.post('/license/extract', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Please provide a license key' });
    }

    let details = {};
    let isDbLicense = false;
    const dbLicense = await License.findOne({ key: key.trim() });
    
    if (dbLicense) {
      isDbLicense = true;
      details = {
        name: dbLicense.companyName,
        email: dbLicense.email,
        phone: dbLicense.phone,
        firstName: dbLicense.firstName,
        lastName: dbLicense.lastName,
        planTier: dbLicense.planTier,
        licenseStart: dbLicense.licenseStart,
        licenseEnd: dbLicense.licenseEnd,
        isUsed: dbLicense.isUsed,
        createdAt: dbLicense.createdAt
      };
    } else {
      try {
        const decoded = decryptLicense(key.trim());
        
        const nameParts = (decoded.pendingOwnerName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || decoded.name || 'Admin';
        const lastName = nameParts.slice(1).join(' ') || '.';

        details = {
          name: decoded.name,
          email: decoded.pendingOwnerEmail,
          phone: decoded.pendingOwnerMobile,
          firstName,
          lastName,
          planTier: decoded.planTier || 'basic',
          licenseStart: decoded.licenseStart,
          licenseEnd: decoded.licenseEnd,
          isUsed: false
        };

        // Check if locally marked as used already
        const existingLicense = await License.findOne({ key: key.trim() });
        if (existingLicense && existingLicense.isUsed) {
          details.isUsed = true;
        }
      } catch (err) {
        console.error('Decryption failed:', err);
        return res.status(400).json({ error: 'Invalid or corrupted license key' });
      }
    }

    // Add expiry info used by the UI warning
    if (details.licenseEnd) {
      const end = new Date(details.licenseEnd);
      const now = new Date();
      details.daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      details.expired = now > end;
      details.expiringSoon = !details.expired && details.daysRemaining <= 15;
    }

    res.json({
      success: true,
      details,
      isDbLicense
    });
  } catch (err) {
    console.error('Extract license error:', err);
    res.status(500).json({ error: 'Failed to extract license details' });
  }
});

// @route   POST /api/auth/license/activate
// @desc    Activate license key to create user login
// @access  Public
router.post('/license/activate', async (req, res) => {
  try {
    const { key } = req.body;
    // If caller explicitly wants to auto-login after activation, pass { autoLogin: true }
    const autoLogin = Boolean(req.body.autoLogin);
    if (!key) {
      return res.status(400).json({ error: 'Please provide a license key' });
    }

    let license = await License.findOne({ key: key.trim() });
    
    // If not found locally, try to decrypt it and register a new local license document
    if (!license) {
      try {
        const decoded = decryptLicense(key.trim());
        
        // Verify expiry date
        if (decoded.licenseEnd && new Date(decoded.licenseEnd) < new Date()) {
          return res.status(400).json({ error: 'This license key has expired' });
        }

        const nameParts = (decoded.pendingOwnerName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || decoded.name || 'Admin';
        const lastName = nameParts.slice(1).join(' ') || '.';

        license = new License({
          key: key.trim(),
          email: decoded.pendingOwnerEmail,
          firstName,
          lastName,
          phone: decoded.pendingOwnerMobile,
          companyName: decoded.name,
          password: decoded.pendingOwnerPassword, // pre-hashed bcrypt password from Renic_Soft
          role: (decoded.role || decoded.pendingOwnerRole || 'ADMIN').toUpperCase(),
          planTier: decoded.planTier || 'basic',
          licenseStart: decoded.licenseStart ? new Date(decoded.licenseStart) : new Date(),
          licenseEnd: decoded.licenseEnd ? new Date(decoded.licenseEnd) : undefined,
          isUsed: false
        });
        
        try {
          await license.save();
        } catch (saveErr) {
          // If another process created the license concurrently, reload the existing one.
          if (saveErr && saveErr.code === 11000) {
            console.warn('License activation: duplicate key on save, fetching existing license');
            license = await License.findOne({ key: key.trim() });
          } else {
            throw saveErr;
          }
        }
      } catch (err) {
        console.error('License decryption error on activation:', err);
        return res.status(400).json({ error: 'Invalid or corrupted license key' });
      }
    }

    if (license.isUsed) {
      return res.status(400).json({ error: 'This license key has already been activated' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: license.email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const existingPhone = await User.findOne({ phone: license.phone });
    if (existingPhone) {
      return res.status(400).json({ error: 'A user with this phone number already exists' });
    }

    // Create the user login account
    const jwt = require('jsonwebtoken');
    const newUser = new User({
      firstName: license.firstName,
      lastName: license.lastName,
      email: license.email,
      phone: license.phone,
      companyName: license.companyName,
      password: license.password, // Saved directly, model handles skipping if it is already bcrypt hashed
      role: (license.role || 'ADMIN').toUpperCase(),
      isActive: true
    });

    await newUser.save();

    // Mark license as used
    license.isUsed = true;
    await license.save();

    // Prepare user object for response (hide password)
    newUser.password = undefined;

    // If the client explicitly requested auto-login, return a JWT token.
    if (autoLogin) {
      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );

      return res.json({
        success: true,
        message: 'License activated and account created successfully!',
        token,
        user: newUser
      });
    }

    // Default: do NOT auto-login; return created user info without token
    return res.json({
      success: true,
      message: 'License activated and account created successfully! Please login to continue.',
      user: newUser
    });
  } catch (err) {
    console.error('Activate license error:', err);
    res.status(500).json({ error: 'Failed to activate license key' });
  }
});

// @route   POST /api/auth/license/send-otp
// @desc    Send OTP to license owner email/phone before activation
// @access  Public
router.post('/license/send-otp', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Please provide a license key' });

    let license = await License.findOne({ key: key.trim() });
    if (!license) {
      try {
        const decoded = decryptLicense(key.trim());
        license = new License({
          key: key.trim(),
          email: decoded.pendingOwnerEmail,
          firstName: (decoded.pendingOwnerName || '').split('\n')[0] || decoded.name || 'Admin',
          lastName: '.',
          phone: decoded.pendingOwnerMobile,
          companyName: decoded.name,
          password: decoded.pendingOwnerPassword || 'Password123!',
          role: (decoded.role || decoded.pendingOwnerRole || 'ADMIN').toUpperCase(),
          planTier: decoded.planTier || 'basic',
          licenseStart: decoded.licenseStart ? new Date(decoded.licenseStart) : new Date(),
          licenseEnd: decoded.licenseEnd ? new Date(decoded.licenseEnd) : undefined,
          isUsed: false
        });
        await license.save();
      } catch (err) {
        return res.status(400).json({ error: 'Invalid or corrupted license key' });
      }
    }

    // Generate 6-digit OTP
    const crypto = require('crypto');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    license.otpHash = otpHash;
    license.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await license.save();

    // Send OTP via email if possible
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
          to: license.email,
          subject: 'Your license activation OTP',
          text: `Your OTP for license activation is: ${otp}. It expires in 10 minutes.`
        });
        emailSent = true;
      }
    } catch (mailErr) {
      console.warn('License OTP mail send failed:', mailErr.message);
    }

    // Fallback: log OTP to server console for testing
    console.log(`[LICENSE OTP] Key: ${key.trim()} | OTP: ${otp} | sentToEmail: ${license.email} | emailSent: ${emailSent}`);

    res.json({ success: true, message: 'OTP generated and sent', emailSent });
  } catch (err) {
    console.error('License send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// @route   POST /api/auth/license/verify-otp
// @desc    Verify OTP and create user account for license
// @access  Public
router.post('/license/verify-otp', async (req, res) => {
  try {
    const { key, otp } = req.body;
    if (!key || !otp) return res.status(400).json({ error: 'Please provide key and otp' });

    const license = await License.findOne({ key: key.trim() });
    if (!license) return res.status(404).json({ error: 'License not found' });
    if (!license.otpHash || !license.otpExpire) return res.status(400).json({ error: 'No OTP generated for this license' });
    if (Date.now() > license.otpExpire) return res.status(400).json({ error: 'OTP expired' });

    const crypto = require('crypto');
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (otpHash !== license.otpHash) return res.status(400).json({ error: 'Invalid OTP' });

    // Create user if not exists
    const existingUser = await User.findOne({ $or: [{ email: license.email }, { phone: license.phone }] });
    if (existingUser) {
      // mark license used and return
      license.isUsed = true;
      await license.save();
      return res.json({ success: true, message: 'License verified. Please login to continue.' });
    }

    const newUser = new User({
      firstName: license.firstName || 'Admin',
      lastName: license.lastName || '',
      email: license.email,
      phone: license.phone,
      companyName: license.companyName,
      password: license.password,
      role: license.role || 'ADMIN',
      isActive: true
    });

    await newUser.save();
    license.isUsed = true;
    await license.save();

    res.json({ success: true, message: 'License activated and account created. Please login.' });
  } catch (err) {
    console.error('License verify-otp error:', err.message);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// @route POST /api/auth/verify-login-otp
// @desc Verify admin login OTP and return JWT
// @access Public
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Please provide email and otp' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+loginOtp +password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.loginOtp || !user.loginOtpExpire) return res.status(400).json({ error: 'No login OTP generated for this user' });
    if (Date.now() > user.loginOtpExpire) return res.status(400).json({ error: 'OTP expired' });

    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (hash !== user.loginOtp) return res.status(400).json({ error: 'Invalid OTP' });

    // Clear otp fields
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save();

    // Generate JWT
    const token = require('jsonwebtoken').sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    user.password = undefined;
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Verify login OTP error:', err.message);
    res.status(500).json({ error: 'Login OTP verification failed' });
  }
});

// @route   GET /api/auth/license/status
// @desc    Get license status for the logged-in user (for expiry warnings)
// @access  Private
router.get('/license/status', auth, async (req, res) => {
  try {
    const user = req.user;
    const license = await License.findOne({ email: user.email.toLowerCase().trim() })
      || await License.findOne({ phone: user.phone });

    const status = require('../utils/licenseStatus').getLicenseStatus(license);

    res.json({
      success: true,
      license: status
    });
  } catch (err) {
    console.error('License status error:', err);
    res.status(500).json({ error: 'Failed to fetch license status' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token and send email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // Set expire (1 hour)
    user.resetPasswordExpire = Date.now() + 3600000;

    await user.save();

    // Reset link
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Send email
    let emailSent = false;
    let info = null;
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      });

      const mailOptions = {
        from: `"Renic AI Support" <no-reply@renic.ai>`,
        to: user.email,
        subject: 'Password Reset Request - Renic AI CRM',
        html: `
          <h3>Hello ${user.firstName},</h3>
          <p>You requested to reset your password. Please click the link below to set a new password:</p>
          <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
          <p>This link is valid for 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        info = await transporter.sendMail(mailOptions);
        emailSent = true;
      }
    } catch (mailError) {
      console.error('Mail sending failed, logging link instead:', mailError);
    }

    console.log(`[FORGOT PASSWORD EMAIL] Send to: ${user.email} | Link: ${resetUrl}`);

    res.json({
      success: true,
      message: 'Reset link generated successfully!',
      resetLink: resetUrl, // Return resetLink for testing/fallback
      emailSent
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Forgot password operation failed' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Verify reset token and update password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { email, password, retypePassword } = req.body;
    const { token } = req.params;

    if (!email || !password || !retypePassword) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }

    if (password !== retypePassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with email, matching token, and not expired
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token or email, or token has expired' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Reset password operation failed' });
  }
});

module.exports = router;
