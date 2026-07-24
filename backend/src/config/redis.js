const Redis = require('ioredis');
const { logger } = require('../utils/logger');

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    logger.info('🔌 Initializing Redis client using REDIS_URL');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      }
    });
  } else {
    logger.info('🔌 Initializing Redis client using local defaults');
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      }
    });
  }

  redisClient.on('connect', () => {
    logger.info('✅ Redis Connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('❌ Redis Connection Error:', err.message);
  });

  redisClient.on('reconnecting', () => {
    logger.warn('🔄 Redis client reconnecting...');
  });

  return redisClient;
};

module.exports = {
  getRedisClient,
  // Helper getter to access current client instance
  get client() {
    return getRedisClient();
  }
};
