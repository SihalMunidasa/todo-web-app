import { redisClient } from '../config/db.js';

/**
 * Cache service abstraction layer
 * Provides a simple interface for caching data using Redis
 */
class CacheService {
  /**
   * Set a value in cache with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} True if successful
   */
  static async set(key, value, ttl) {
    if (!redisClient) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setAsync(key, serialized, 'EX', ttl);
      } else {
        await redisClient.setAsync(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  static async get(key) {
    if (!redisClient) return null;
    
    try {
      const data = await redisClient.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if successful
   */
  static async del(key) {
    if (!redisClient) return false;
    
    try {
      await redisClient.delAsync(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   * @param {string} pattern - Redis key pattern
   * @returns {Promise<boolean>} True if successful
   */
  static async clearPattern(pattern) {
    if (!redisClient) return false;
    
    try {
      const keys = await redisClient.keysAsync(pattern);
      if (keys.length > 0) {
        await redisClient.delAsync(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clearPattern error:', error);
      return false;
    }
  }

  /**
   * Get cache keys by pattern
   * @param {string} pattern - Redis key pattern
   * @returns {Promise<string[]>} Array of keys
   */
  static async keys(pattern) {
    if (!redisClient) return [];
    
    try {
      return await redisClient.keysAsync(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
}

export default CacheService;