import crypto from 'crypto';
import User from '../models/User.js';
import { AppError, globalErrorHandler } from '../utils/error.js';
import { generateTokens, storeRefreshToken } from '../config/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already registered', 400));
    }
    
    // Create new user
    const user = await User.create({ name, email, password });
    
    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // Respond without sensitive data
    res.status(201).json({
      status: 'success',
      message: 'Verification email sent. Please verify your email.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // 2. Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    
    // 3. Check if email is verified
    if (!user.isVerified) {
      return next(new AppError('Please verify your email first', 401));
    }
    
    // 4. Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // 5. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // 6. Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // 7. Send response
    res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return next(new AppError('Verification token is missing', 400));
    }
    
    // 1. Find user by token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    // 2. If token is invalid or expired
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    
    // 3. Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    // 4. Log the user in automatically
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // 5. Redirect to dashboard or send success response
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive a reset link',
      });
    }
    
    // 2. Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // 3. Send reset email
    try {
      await sendPasswordResetEmail(email, user.name, resetToken);
      
      res.status(200).json({
        status: 'success',
        message: 'Password reset instructions sent to your email',
      });
    } catch (err) {
      // Reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return next(
        new AppError('There was an error sending the email. Try again later!', 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password } = req.body;
    
    if (!token) {
      return next(new AppError('Token is missing', 400));
    }
    
    // 1. Hash token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // 2. Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    
    // 3. Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();
    
    // 4. Log user in with new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // 5. Send response
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    // 1. Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }
    
    // 2. Update password
    user.password = newPassword;
    await user.save();
    
    // 3. Generate new tokens (invalidate old ones)
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // Set new tokens in cookies
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // 4. Send response
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
  try {
    // 1. Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // 2. Remove refresh token from Redis
    if (redisClient) {
      await redisClient.delAsync(`refresh_token:${req.user.id}`);
    }
    
    // 3. Send response
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};