const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    try {
      const whatsappService = require('../services/whatsappService');
      const message = 
        `System Error Detected\n\n` +
        `Module: Database Initialization\n` +
        `Error: MONGODB_CONNECT_FAILED (${error.message})\n` +
        `Time: ${new Date().toLocaleTimeString()}\n\n` +
        `Ye attack nahi hai.`;
      whatsappService.sendAndLogMessage({ message, type: 'system' }).catch(() => {});
    } catch (e) {}
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', async () => {
  console.warn('⚠️  MongoDB disconnected');
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
    console.error('Failed to trigger database disconnection WhatsApp warning:', err.message);
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

module.exports = connectDB;
