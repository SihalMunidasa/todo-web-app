import mongoose from 'mongoose';
import { redisClient } from '../config/db.js';

export default async () => {
  // Close Redis connection if exists
  if (redisClient) {
    await redisClient.quit();
  }
  
  // Ensure mongoose connection is closed
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};