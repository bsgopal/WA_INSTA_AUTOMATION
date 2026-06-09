// renic-automation-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Please provide a valid authorization token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'renic_secret_key_2026');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'User inactive',
        message: 'This user account has been deactivated'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }

    res.status(500).json({ 
      error: 'Authentication error',
      message: error.message
    });
  }
};