require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

async function migrateRole() {
  try {
    if (!MONGO_URI) {
      console.error('Error: MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to database for role migration...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Bypassing schema validation by using native collection update
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateMany(
      { role: 'superadmin' },
      { $set: { role: 'developer' } }
    );

    console.log(`✅ Role migration completed. Updated ${result.modifiedCount} user records from "superadmin" to "developer".`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateRole();
