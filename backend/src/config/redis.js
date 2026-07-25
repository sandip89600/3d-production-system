// Redis removed — stub kept so existing imports don't break at startup
// All features use in-memory fallback via redisService.js

const getRedisClient = () => null;

module.exports = {
  getRedisClient,
  get client() { return null; },
};
