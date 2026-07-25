require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

async function clearDashboardData() {
  try {
    if (!MONGO_URI) {
      console.error('Error: MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // We clear all transaction/dummy project data, but we DO NOT delete users or departments.
    // This allows users to still log in, but their dashboards will show exactly 0 data!
    console.log('Clearing projects, assignments, logs, and activity records...');
    
    const db = mongoose.connection.db;
    
    // Clear collections
    await db.collection('projects').deleteMany({});
    await db.collection('projectassignments').deleteMany({});
    await db.collection('progresslogs').deleteMany({});
    await db.collection('activitylogs').deleteMany({});
    await db.collection('loginlogs').deleteMany({});
    await db.collection('uploadlogs').deleteMany({});
    await db.collection('messagelogs').deleteMany({});
    await db.collection('notificationlogs').deleteMany({});
    await db.collection('projectdownloadlogs').deleteMany({});
    
    // If files collection exists, clear it too
    try {
      await db.collection('files').deleteMany({});
    } catch (e) {}

    // Reset user project count parameters
    await db.collection('users').updateMany(
      {},
      { 
        $set: { 
          totalProjects: 0, 
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          refreshTokens: []
        } 
      }
    );

    console.log('✅ All dummy project and log data cleared. User accounts kept active.');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearDashboardData();
