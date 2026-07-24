require('dotenv').config();
const { validateEnv } = require('./config/env');
// Run env validation before anything else
validateEnv();

const express = require('express');
const http = require('http');  
const { Server } = require('socket.io'); 
const cors = require('cors'); 
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const { logger } = require('./utils/logger');
const { getRedisClient } = require('./config/redis');

// Initialize Redis Client connection
getRedisClient();

const connectDB = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const notificationService = require('./services/notificationService');
const cronService = require('./services/cronService');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const projectRoutes = require('./routes/projects');
const analyticsRoutes = require('./routes/analytics');
const profileRoutes = require('./routes/profile');
const whatsappRoutes = require('./routes/whatsapp');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const server = http.createServer(app);

// Robust CORS origin helper
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.allindia3dstudio.deepitlabs.in',
  'https://allindia3dstudio.deepitlabs.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isAllowed = allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV !== 'production' &&
      (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Inject io into notification service
notificationService.setIO(io);

const securityService = require('./services/securityService');
securityService.setIO(io);

// Socket authentication + room join
io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(`user_${userId}`);
    logger.info(`🔌 Socket connected: User ${userId}`);
  }
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Security & middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(compression());
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Pipe Morgan output into Winston logger
app.use(morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: { write: (message) => logger.info(message.trim()) } }
));

app.use(generalLimiter);

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public project download token route (used by WhatsApp links)
const { downloadProjectByToken } = require('./controllers/projectController');
app.get('/project/:projectIdCode', downloadProjectByToken);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

const healthRoutes = require('./routes/health');
app.use('/api', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error:', { message: err.message, stack: err.stack });
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || 500;
  if (status === 500) {
    try {
      const whatsappService = require('./services/whatsappService');
      const message = 
        `System Error Detected\n\n` +
        `Module: Express Web Server\n` +
        `Error: ${err.message || 'Internal Server Error'}\n` +
        `Time: ${new Date().toLocaleTimeString()}\n\n` +
        `Ye attack nahi hai.`;
      
      whatsappService.sendAndLogMessage({
        message,
        type: 'system'
      }).catch(() => {});
    } catch (e) {}
  }

  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 All3DStudio Backend Started`);
    logger.info(`📡 Server running on: http://localhost:${PORT}`);
    logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📱 WhatsApp: ${process.env.WHATSAPP_ENABLED === 'true' ? 'Enabled' : 'Simulator Mode'}`);
    
    // Initialize cron jobs
    cronService.initCron();
  });
});

module.exports = { app, server, io };
