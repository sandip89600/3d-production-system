const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

const isDev = process.env.NODE_ENV !== 'production';

// Redis removed — all rate limiters use in-memory MemoryStore
const getRateLimitOptions = (prefix, options) => {
  logger.info(`[RateLimiter] "${prefix}" limiter using in-memory MemoryStore${isDev ? ' (Dev Mode - Limits Relaxed)' : ''}`);
  return {
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  };
};

const generalLimiter = rateLimit(getRateLimitOptions('general', {
  windowMs: isDev ? 1000 : (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000),
  max: isDev ? 100000 : (parseInt(process.env.RATE_LIMIT_MAX) || 2000),
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

const loginLimiter = rateLimit(getRateLimitOptions('login', {
  windowMs: isDev ? 1000 : (15 * 60 * 1000),
  max: isDev ? 10000 : (parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5),
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
  keyGenerator: (req) => req.body?.email || req.ip,
}));

const uploadLimiter = rateLimit(getRateLimitOptions('upload', {
  windowMs: isDev ? 1000 : (60 * 60 * 1000),
  max: isDev ? 10000 : 50,
  message: { success: false, message: 'Upload limit reached, please try again later.' },
}));

const otpLimiter = rateLimit(getRateLimitOptions('otp', {
  windowMs: isDev ? 1000 : (15 * 60 * 1000),
  max: isDev ? 10000 : 5,
  message: { success: false, message: 'Too many OTP requests, please try again in 15 minutes.' },
  keyGenerator: (req) => req.body?.email || req.body?.mobile || req.ip,
}));

module.exports = { generalLimiter, loginLimiter, uploadLimiter, otpLimiter };
