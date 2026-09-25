const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Auth user & get token using phone
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Please provide phone and password' });
    }

    // Check for user by phone and include password field for comparison
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Auto promote phone 9345578103 to PLATFORM_OWNER
    if (phone.includes('9345578103') || user.phone.includes('9345578103')) {
      if (user.role !== 'PLATFORM_OWNER') {
        user.role = 'PLATFORM_OWNER';
        await user.save();
      }
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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

    // Generate token for non-admin / platform owner users
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'renic_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Remove password from user object before sending
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
      license: licenseStatus
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
