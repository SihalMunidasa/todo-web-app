import jwt from 'jsonwebtoken';
import { redisClient } from '../config/db.js';
import User from '../models/User.js';
import AppError from '../utils/error.js';
import { generateTokens, storeRefreshToken } from '../config/jwt.js';

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request object
 */
const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization header or cookies
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    // 2. Return error if no token is found
    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to access.', 401)
        );
    }

    try {
        // 3. Verify access token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // 4. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        // 5. Check if user changed password after token is issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(
                new AppError('User recently changed password! Please login again.', 401)
            );
        }

        // 6. Attach user to request object
        req.user = currentUser;
        res.local.user = currentUser;
        next();
    } catch (error) {
        // 7. Handle token expiration by attempting refresh
        if (error.name === 'TokenExpiredError') {
            return await handleExpiredToken(req, res, next);
        }
        next(new AppError('Invalid Token. Please login again.', 401));
    }
};

/**
 * Handle expired access tokens by attempting refresh
 */
const handleExpiredToken = async (req, res, next) => {
    try {
        // 1. Get refresh token from cookies
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return next(
                new AppError('Session exipred. Please login again.', 401)
            );
        }

        // 2. Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // 3. Check if refresh token exists in Redis
        const isValid = await redisClient.getAsync(`refresh_token${decoded.id}`);
        if (refreshToken !== isValid) {
            return next(
                new AppError('Invalid refresh token. Please login again.', 401)
            );
        }

        // 4. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        // 5. Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
        generateTokens(currentUser._id);

        // 6. Update Redis store with new refresh token
        await storeRefreshToken(currentUser._id, newRefreshToken);

        // 7. Set new tokens in cookies
        res.cookie('accessToken', newAccessToken, {
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });
        
        res.cookie('refreshToken', newRefreshToken, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });

        // 8. Attach user to request object
        req.user = currentUser;
        res.locals.user = currentUser;
        
        // 9. Continue to next middleware
        next();
    } catch (error) {
        // Clear invalid tokens
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        next(new AppError('Session expired. Please log in again.', 401));
    }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export { protect, restrictTo };