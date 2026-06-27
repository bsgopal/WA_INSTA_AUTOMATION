const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth-middleware');
const User = require('../models/User');
const License = require('../models/License');

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

// @route   POST /api/auth/license/create
// @desc    Create a new license key (Helper / Admin route)
// @access  Public
router.post('/license/create', async (req, res) => {
  try {
    const { email, firstName, lastName, phone, companyName, password, key } = req.body;

    if (!email || !firstName || !lastName || !phone || !companyName || !password) {
      return res.status(400).json({ error: 'Please provide all details for the license' });
    }

    // Generate random license key if not provided
    const crypto = require('crypto');
    const licenseKey = key || `RENIC-LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Check if license key already exists
    const existingLicense = await License.findOne({ key: licenseKey });
    if (existingLicense) {
      return res.status(400).json({ error: 'License key already exists' });
    }

    const newLicense = new License({
      key: licenseKey,
      email,
      firstName,
      lastName,
      phone,
      companyName,
      password,
      role: req.body.role || 'ADMIN'
    });

    await newLicense.save();

    res.json({
      success: true,
      message: 'License key created successfully!',
      license: newLicense
    });
  } catch (err) {
    console.error('Create license error:', err);
    res.status(500).json({ error: 'Failed to create license key' });
  }
});

// @route   POST /api/auth/license/activate
// @desc    Activate license key to create user login
// @access  Public
router.post('/license/activate', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Please provide a license key' });
    }

    const license = await License.findOne({ key: key.trim() });
    if (!license) {
      return res.status(404).json({ error: 'Invalid license key' });
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
      password: license.password,
      role: license.role || 'ADMIN',
      isActive: true
    });

    await newUser.save();

    // Mark license as used
    license.isUsed = true;
    await license.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      message: 'License activated and account created successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Activate license error:', err);
    res.status(500).json({ error: 'Failed to activate license key' });
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
