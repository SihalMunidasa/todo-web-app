import mongoose from 'mongoose';
import redis from 'redis';
import { promisify } from 'util';

/**
 * MongoDB Connection Setup
 * Establishes connection to MongoDB and configures event handlers
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected');
});

/**
 * Redis Client Setup
 * Creates Redis client and promisifies get/set methods
 */
let redisClient;

if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });

  redisClient.connect().catch(console.error);
  
  // Promisify Redis methods
  redisClient.getAsync = promisify(redisClient.get).bind(redisClient);
  redisClient.setAsync = promisify(redisClient.set).bind(redisClient);
  redisClient.delAsync = promisify(redisClient.del).bind(redisClient);
  
  // Redis event handlers
  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  
  redisClient.on('error', (err) => {
    console.error(`Redis connection error: ${err}`);
  });
  
  redisClient.on('end', () => {
    console.log('Redis connection closed');
  });
} else {
  console.warn('REDIS_URL not found. Caching disabled');
}

export { connectDB, redisClient };