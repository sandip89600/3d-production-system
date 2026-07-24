const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { logger } = require('../utils/logger');

// GET /health
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /ready
router.get('/ready', async (req, res) => {
  const status = {
    database: 'DOWN',
    redis: 'DOWN',
    storage: 'DOWN',
  };

  let isReady = true;

  // 1. Mongoose Check
  try {
    if (mongoose.connection.readyState === 1) {
      status.database = 'UP';
    } else {
      isReady = false;
    }
  } catch (err) {
    logger.error('[Health] Database ready check failed:', err.message);
    isReady = false;
  }

  // 2. Redis Check
  try {
    const redisClient = getRedisClient();
    if (redisClient && redisClient.status === 'ready') {
      status.redis = 'UP';
    } else {
      isReady = false;
    }
  } catch (err) {
    logger.error('[Health] Redis ready check failed:', err.message);
    isReady = false;
  }

  // 3. Storage Check (S3 client verification if S3 is active provider)
  try {
    if (process.env.STORAGE_PROVIDER === 's3') {
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        maxAttempts: 1,
      });
      // Run light command to check bucket access
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        MaxKeys: 1,
      });
      await s3.send(command);
      status.storage = 'UP';
    } else {
      // Local storage check
      const fs = require('fs');
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      if (fs.existsSync(uploadPath)) {
        status.storage = 'UP';
      } else {
        isReady = false;
      }
    }
  } catch (err) {
    logger.error('[Health] Storage ready check failed:', err.message);
    isReady = false;
  }

  if (isReady) {
    res.status(200).json({ status: 'READY', details: status });
  } else {
    res.status(503).json({ status: 'NOT_READY', details: status });
  }
});

// GET /metrics
router.get('/metrics', (req, res) => {
  const memory = process.memoryUsage();
  const metrics = {
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(memory.external / 1024 / 1024 * 100) / 100} MB`,
    },
    cpu: process.cpuUsage(),
    connections: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    }
  };

  res.json(metrics);
});

module.exports = router;
