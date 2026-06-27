// renic-automation-backend/models/User.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: 'Renic Technology'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't return password by default
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'USER'],
    default: 'USER'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  integrations: {
    whatsappConnected: {
      type: Boolean,
      default: false
    },
    instagramConnected: {
      type: Boolean,
      default: false
    },
    wordpressConnected: {
      type: Boolean,
      default: false
    }
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(inputPassword) {
  return await bcryptjs.compare(inputPassword, this.password);
};

// Method to get user without password
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);