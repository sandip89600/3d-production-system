const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Redis removed — all rate limiters use in-memory MemoryStore
const getRateLimitOptions = (prefix, options) => {
  logger.info(`[RateLimiter] "${prefix}" limiter using in-memory MemoryStore`);
  return {
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  };
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
