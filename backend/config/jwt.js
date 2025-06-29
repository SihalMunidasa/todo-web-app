// backend/config/jwt.js

import jwt from 'jsonwebtoken';
import { redisClient } from './db.js';

/**
 * Generates JWT tokens (access and refresh)
 * @param {string} userId - User ID to include in the token
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = (userId) => {
  // Create access token (short-lived)
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE }
  );

  // Create refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );

  return { accessToken, refreshToken };
};

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @returns {Object} Decoded token payload
 * @throws {Error} If token verification fails
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    // Handle specific verification errors
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

/**
 * Stores refresh token in Redis
 * @param {string} userId - User ID associated with the token
 * @param {string} refreshToken - Refresh token to store
 * @returns {Promise<void>}
 */
export const storeRefreshToken = async (userId, refreshToken) => {
  if (!redisClient) throw new Error('Redis client not available');
  
  // Parse expiration time
  const expiresIn = process.env.JWT_REFRESH_EXPIRE;
  let seconds;
  
  if (expiresIn.includes('d')) {
    seconds = parseInt(expiresIn) * 86400; // days to seconds
  } else if (expiresIn.includes('h')) {
    seconds = parseInt(expiresIn) * 3600; // hours to seconds
  } else if (expiresIn.includes('m')) {
    seconds = parseInt(expiresIn) * 60; // minutes to seconds
  } else {
    seconds = parseInt(expiresIn); // assume seconds
  }
  
  // Store token with expiration
  await redisClient.setAsync(
    `refresh_token:${userId}`,
    refreshToken,
    'EX',
    seconds
  );
};

/**
 * Verifies refresh token against Redis store
 * @param {string} userId - User ID to verify
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Promise<boolean>} True if token is valid, false otherwise
 */
export const verifyRefreshToken = async (userId, refreshToken) => {
  if (!redisClient) throw new Error('Redis client not available');
  
  const storedToken = await redisClient.getAsync(`refresh_token:${userId}`);
  return storedToken === refreshToken;
};

/**
 * Removes refresh token from Redis
 * @param {string} userId - User ID associated with the token
 * @returns {Promise<void>}
 */
export const removeRefreshToken = async (userId) => {
  if (!redisClient) throw new Error('Redis client not available');
  await redisClient.delAsync(`refresh_token:${userId}`);
};