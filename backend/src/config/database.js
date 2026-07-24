const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB connection error (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      message: error.message,
    });

    if (retryCount < MAX_RETRIES - 1) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      logger.info(`🔄 Retrying database connection in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return connectDB(retryCount + 1);
    }

    // Trigger alert if maximum retries reached
    try {
      const whatsappService = require('../services/whatsappService');
      const message = 
        `System Error Detected\n\n` +
        `Module: Database Initialization\n` +
        `Error: MONGODB_CONNECT_FAILED (${error.message})\n` +
        `Status: Max Connection Retries Reached (${MAX_RETRIES})\n` +
        `Time: ${new Date().toLocaleTimeString()}\n\n` +
        `Ye attack nahi hai.`;
      whatsappService.sendAndLogMessage({ message, type: 'system' }).catch(() => {});
    } catch (e) {
      logger.error('Failed to trigger database connection failure WhatsApp warning:', e.message);
    }

    // Exit process in staging/production if database connection fails
    if (['production', 'staging'].includes(process.env.NODE_ENV)) {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', async () => {
  logger.warn('⚠️  MongoDB disconnected');
  try {
    const whatsappService = require('../services/whatsappService');
    const message = 
      `System Error Detected\n\n` +
      `Module: Database Connection\n` +
      `Error: Database Connection Failed / MongoDB Disconnected\n` +
      `Time: ${new Date().toLocaleTimeString()}\n\n` +
      `Ye attack nahi hai.`;
    await whatsappService.sendAndLogMessage({ message, type: 'system' });
  } catch (err) {
    logger.error('Failed to trigger database disconnection WhatsApp warning:', { error: err.message });
  }
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB reconnected');
});

module.exports = connectDB;
