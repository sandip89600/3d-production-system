require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const superAdmin = await User.findOne({ email: 'superadmin@all3dstudio.com' }).select('+password +loginAttempts +lockUntil');
    if (!superAdmin) {
      console.log('❌ Super Admin not found in the database!');
      process.exit(1);
    }

    console.log('👑 Super Admin Status:');
    console.log('─'.repeat(40));
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Is Active: ${superAdmin.isActive}`);
    console.log(`2FA Enabled: ${superAdmin.twoFactorEnabled}`);
    console.log(`Login Attempts: ${superAdmin.loginAttempts}`);
    console.log(`Lock Until: ${superAdmin.lockUntil ? new Date(superAdmin.lockUntil).toISOString() : 'Not Locked'}`);
    console.log(`Is Locked: ${!!(superAdmin.lockUntil && superAdmin.lockUntil > Date.now())}`);
    console.log('─'.repeat(40));

    // Reset lock and login attempts automatically if they were locked out
    if (superAdmin.loginAttempts > 0 || superAdmin.lockUntil) {
      superAdmin.loginAttempts = 0;
      superAdmin.lockUntil = null;
      await superAdmin.save();
      console.log('🔓 Lock status and login attempts have been cleared!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
