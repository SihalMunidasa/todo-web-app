import jwt from 'jsonwebtoken';
import { redisClient } from './db.js';

// Token generation
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );

  // Store refresh token in Redis
  redisClient.setEx(
    `refresh:${userId}`,
    parseInt(process.env.JWT_REFRESH_EXPIRE) * 86400, // Convert days to seconds
    refreshToken
  );

  return { accessToken, refreshToken };
};

// Token verification
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
  if (token !== storedToken) throw new Error('Invalid refresh token');
  return decoded;
};

// Token revocation
export const revokeTokens = async (userId) => {
  await redisClient.del(`refresh:${userId}`);
};