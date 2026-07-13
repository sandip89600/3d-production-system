require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const superAdmin = await User.findOne({ email: 'sandippandit896@gmail.com' }).select('+password');
    if (!superAdmin) {
      console.log('❌ Super Admin not found!');
      process.exit(1);
    }

    const matches = await superAdmin.comparePassword('SuperAdmin@123');
    console.log(`Password "SuperAdmin@123" matches database hash: ${matches}`);

    if (!matches) {
      console.log('🔄 Password hash does not match. Resetting password to "SuperAdmin@123"...');
      superAdmin.password = 'SuperAdmin@123';
      await superAdmin.save();
      console.log('✅ Password has been reset back to "SuperAdmin@123"');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verify();
