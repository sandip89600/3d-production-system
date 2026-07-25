require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

async function clearNonDevelopers() {
  try {
    if (!MONGO_URI) {
      console.error('Error: MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // We delete all users whose role is NOT developer (meaning all admins, employees, and clients)
    console.log('Deleting all admins, employees (users), and clients...');
    
    const db = mongoose.connection.db;

    // 1. Delete matching users
    const result = await db.collection('users').deleteMany({
      role: { $in: ['admin', 'employee', 'client'] }
    });
    console.log(`✅ Deleted ${result.deletedCount} user accounts (admins, employees, clients).`);

    // 2. Clean up department references (remove admins and employee rosters)
    console.log('Cleaning up department admin and employee rosters...');
    await db.collection('departments').updateMany(
      {},
      {
        $set: { admin: null, employees: [] }
      }
    );
    console.log('✅ Department records reset to empty rosters.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  }
}

clearNonDevelopers();
