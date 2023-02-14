const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
  },
  password: {
    type: String,
    required: [true, 'Please set a password'],
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true,
  },
  isModerator: {
    type: Boolean,
    default: false,
    required: true,
  },
  role: {
    type: String,
    enum: ['Moderator', 'Admin', 'User'],
    default: 'User',
    required: true,
  },

  username: {
    type: String,
    required: [true, 'Please add a username'],
  },
  hasPosts: {
    type: Boolean,
    default: false,
  },
  qpending: {
    type: Number,
    required: true,
    default: 0,
  },
  qposted: {
    type: Number,
    required: true,
    default: 0,
  },
  qrejected: {
    type: Number,
    required: true,
    default: 0,
  },
  qapproved: {
    type: Number,
    required: true,
    default: 0,
  },
  verifyEmailToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  ttl: {
    type: Date,
    expires: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.generateVerifyEmailToken = function () {
  this.verifyEmailToken = crypto.randomBytes(30).toString('hex');
  return this.verifyEmailToken;
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      isAdmin: this.isAdmin,
      isModerator: this.isModerator,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);

