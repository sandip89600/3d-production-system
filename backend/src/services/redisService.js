const { logger } = require('../utils/logger');

/**
 * In-memory cache service (Redis removed — uses Node.js Map as store)
 * OTP storage, dashboard caching, rate-limit helpers all work without Redis.
 */

const store = new Map(); // { key: { value, expiresAt } }

const _get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const _set = (key, value, expirySeconds = null) => {
  store.set(key, {
    value,
    expiresAt: expirySeconds ? Date.now() + expirySeconds * 1000 : null,
  });
};

const _del = (key) => store.delete(key);

const redisService = {
  set: async (key, value, expirySeconds = null) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      _set(key, stringValue, expirySeconds);
      return true;
    } catch (err) {
      logger.error(`[CacheService] Failed to set key "${key}":`, err.message);
      return false;
    }
  },

  get: async (key) => {
    try {
      const value = _get(key);
      if (value === null) return null;
      try { return JSON.parse(value); } catch { return value; }
    } catch (err) {
      logger.error(`[CacheService] Failed to get key "${key}":`, err.message);
      return null;
    }
  },

  del: async (key) => {
    try { _del(key); return true; } catch (err) {
      logger.error(`[CacheService] Failed to delete key "${key}":`, err.message);
      return false;
    }
  },

  incr: async (key) => {
    try {
      const current = parseInt(_get(key) || '0');
      const next = current + 1;
      // Preserve existing TTL if any
      const entry = store.get(key);
      const expiresAt = entry?.expiresAt || null;
      store.set(key, { value: String(next), expiresAt });
      return next;
    } catch (err) {
      logger.error(`[CacheService] Failed to increment key "${key}":`, err.message);
      return null;
    }
  },

  expire: async (key, seconds) => {
    try {
      const entry = store.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + seconds * 1000;
        store.set(key, entry);
      }
      return true;
    } catch (err) {
      logger.error(`[CacheService] Failed to set expire for key "${key}":`, err.message);
      return false;
    }
  },

  // ─── OTP Helpers ────────────────────────────────────────────────────

  saveOTP: async (emailOrMobile, otp, expirySeconds = 300) => {
    const key = `otp:${emailOrMobile}`;
    const attemptsKey = `otp_attempts:${emailOrMobile}`;
    await redisService.set(key, otp, expirySeconds);
    await redisService.set(attemptsKey, 0, expirySeconds);
  },

  getOTP: async (emailOrMobile) => {
    return await redisService.get(`otp:${emailOrMobile}`);
  },

  getOTPAttempts: async (emailOrMobile) => {
    const count = await redisService.get(`otp_attempts:${emailOrMobile}`);
    return count ? parseInt(count) : 0;
  },

  incrementOTPAttempts: async (emailOrMobile) => {
    const attemptsKey = `otp_attempts:${emailOrMobile}`;
    return await redisService.incr(attemptsKey);
  },

  clearOTP: async (emailOrMobile) => {
    await redisService.del(`otp:${emailOrMobile}`);
    await redisService.del(`otp_attempts:${emailOrMobile}`);
  },

  // ─── Dashboard Cache Helpers ─────────────────────────────────────────

  wrap: async (cacheKey, fetchFunction, expirySeconds = 1800) => {
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      logger.info(`[CacheService] Cache hit for key: ${cacheKey}`);
      return cachedData;
    }
    logger.info(`[CacheService] Cache miss for key: ${cacheKey}. Fetching fresh data.`);
    const freshData = await fetchFunction();
    await redisService.set(cacheKey, freshData, expirySeconds);
    return freshData;
  },
};

module.exports = redisService;
