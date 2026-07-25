const { logger } = require('../utils/logger');

const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// These are required only when specific features are enabled
// REDIS_URL  → required if Redis caching is active (optional — falls back to in-memory)
// AWS_*      → required only when STORAGE_PROVIDER=s3
const productionRequiredEnv = [];


const validateEnv = () => {
  const missing = [];

  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  const isProductionOrStaging = ['production', 'staging'].includes(process.env.NODE_ENV);

  if (isProductionOrStaging) {
    productionRequiredEnv.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    logger.error('❌ Environment validation failed. Missing required variables:', { missing });
    // Crash application in production/staging if keys are missing
    if (isProductionOrStaging) {
      process.exit(1);
    }
  } else {
    logger.info(`✅ Environment validation passed (${process.env.NODE_ENV || 'development'} mode)`);
  }
};

module.exports = {
  validateEnv,
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',
  isDevelopment: !['production', 'staging'].includes(process.env.NODE_ENV),
};
