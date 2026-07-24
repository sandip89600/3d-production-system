const { client } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * Redis cache management service
 */
const redisService = {
  /**
   * Set key value with optional TTL
   */
  set: async (key, value, expirySeconds = null) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      if (expirySeconds) {
        await client.set(key, stringValue, 'EX', expirySeconds);
      } else {
        await client.set(key, stringValue);
      }
      return true;
    } catch (err) {
      logger.error(`[RedisService] Failed to set key "${key}":`, err.message);
      return false;
    }
  },

  /**
   * Get value of key. Parses JSON if valid.
   */
  get: async (key) => {
    try {
      const value = await client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (err) {
      logger.error(`[RedisService] Failed to get key "${key}":`, err.message);
      return null;
    }
  },

  /**
   * Delete key
   */
  del: async (key) => {
    try {
      await client.del(key);
      return true;
    } catch (err) {
      logger.error(`[RedisService] Failed to delete key "${key}":`, err.message);
      return false;
    }
  },

  /**
   * Increment key value (for rate limit or attempts)
   */
  incr: async (key) => {
    try {
      return await client.incr(key);
    } catch (err) {
      logger.error(`[RedisService] Failed to increment key "${key}":`, err.message);
      return null;
    }
  },

  /**
   * Set TTL for key
   */
  expire: async (key, seconds) => {
    try {
      await client.expire(key, seconds);
      return true;
    } catch (err) {
      logger.error(`[RedisService] Failed to set expire for key "${key}":`, err.message);
      return false;
    }
  },

  // ─── OTP Helper Functions ──────────────────────────────────────────

  /**
   * Save OTP code and reset attempts
   */
  saveOTP: async (emailOrMobile, otp, expirySeconds = 300) => {
    const key = `otp:${emailOrMobile}`;
    const attemptsKey = `otp_attempts:${emailOrMobile}`;
    
    // Save code
    await redisService.set(key, otp, expirySeconds);
    // Reset attempts to 0
    await redisService.set(attemptsKey, 0, expirySeconds);
  },

  /**
   * Get OTP code
   */
  getOTP: async (emailOrMobile) => {
    return await redisService.get(`otp:${emailOrMobile}`);
  },

  /**
   * Get OTP attempts count
   */
  getOTPAttempts: async (emailOrMobile) => {
    const count = await redisService.get(`otp_attempts:${emailOrMobile}`);
    return count ? parseInt(count) : 0;
  },

  /**
   * Increment OTP incorrect attempts
   */
  incrementOTPAttempts: async (emailOrMobile) => {
    const attemptsKey = `otp_attempts:${emailOrMobile}`;
    return await redisService.incr(attemptsKey);
  },

  /**
   * Delete OTP and attempts cache
   */
  clearOTP: async (emailOrMobile) => {
    await redisService.del(`otp:${emailOrMobile}`);
    await redisService.del(`otp_attempts:${emailOrMobile}`);
  },

  // ─── Dashboard Stats Helpers ────────────────────────────────────────

  /**
   * Wrap function call with caching
   */
  wrap: async (cacheKey, fetchFunction, expirySeconds = 1800) => {
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      logger.info(`[RedisService] Cache hit for key: ${cacheKey}`);
      return cachedData;
    }

    logger.info(`[RedisService] Cache miss for key: ${cacheKey}. Fetching fresh data.`);
    const freshData = await fetchFunction();
    await redisService.set(cacheKey, freshData, expirySeconds);
    return freshData;
  }
};

module.exports = redisService;
