require('dotenv').config();
const mongoose = require('mongoose');
const ActivityLog = require('./models/ActivityLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function checkLogs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const logs = await ActivityLog.find({ action: { $in: ['login_failed', 'login_locked', 'login'] } })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('Recent Login Activity Logs:');
    console.log('─'.repeat(55));
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] Action: ${log.action} | Success: ${log.success} | Email: ${log.userEmail || 'N/A'} | IP: ${log.ip}`);
      if (log.details) console.log('   Details:', JSON.stringify(log.details));
    });
    console.log('─'.repeat(55));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLogs();
