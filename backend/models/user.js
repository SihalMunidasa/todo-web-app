// backend/models/User.js

import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Middleware: Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost factor of 12
    this.password = await bcrypt.hash(this.password, 12);
    
    // Update passwordChangedAt timestamp for existing users
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // 1 second in past
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Method: Compare entered password with stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method: Check if password was changed after token was issued
 * @param {number} JWTTimestamp - Timestamp when token was issued
 * @returns {boolean} True if password was changed after token issuance
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Method: Generate verification token
 */
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.verificationTokenExpires = Date.now() + 3600000; // 1 hour
  
  return token;
};

/**
 * Method: Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 600000; // 10 minutes
  
  return resetToken;
};

/**
 * Method: Check if verification token is valid
 */
userSchema.methods.isValidVerificationToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return (
    this.verificationToken === hashedToken &&
    this.verificationTokenExpires > Date.now()
  );
};

/**
 * Method: Check if password reset token is valid
 */
userSchema.methods.isValidPasswordResetToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return (
    this.resetPasswordToken === hashedToken &&
    this.resetPasswordExpires > Date.now()
  );
};

const User = mongoose.model('User', userSchema);

export default User;