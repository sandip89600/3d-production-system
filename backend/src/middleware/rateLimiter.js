const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');
const { logger } = require('../utils/logger');

let RedisStore = null;
try {
  RedisStore = require('rate-limit-redis').default || require('rate-limit-redis').RedisStore || require('rate-limit-redis');
} catch (err) {
  logger.warn('⚠️  Could not load rate-limit-redis library:', err.message);
}

const getRateLimitOptions = (prefix, options) => {
  const baseOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  };

  if (RedisStore) {
    try {
      const redisClient = getRedisClient();
      baseOptions.store = new RedisStore({
        // Send commands using the ioredis client
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`, // Unique rate limit prefix per limiter
      });
    } catch (err) {
      logger.warn(`⚠️  Rate limiting RedisStore initialization failed for "${prefix}", falling back to MemoryStore:`, err.message);
    }
  }

  return baseOptions;
};

const generalLimiter = rateLimit(getRateLimitOptions('general', {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 2000,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

const loginLimiter = rateLimit(getRateLimitOptions('login', {
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
  keyGenerator: (req) => req.body?.email || req.ip,
}));

const uploadLimiter = rateLimit(getRateLimitOptions('upload', {
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Upload limit reached, please try again later.' },
}));

const otpLimiter = rateLimit(getRateLimitOptions('otp', {
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please try again in 15 minutes.' },
  keyGenerator: (req) => req.body?.email || req.body?.mobile || req.ip,
}));

module.exports = { generalLimiter, loginLimiter, uploadLimiter, otpLimiter };
