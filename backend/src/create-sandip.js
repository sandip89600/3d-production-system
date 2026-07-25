require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI;

async function createSandip() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Check if email already exists
    const email = 'sandippandit896@gmail.com';
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'developer';
      existing.emailVerified = true;
      existing.isActive = true;
      existing.password = 'SuperAdmin@123';
      await existing.save();
      console.log('Updated existing Sandip Pandit user.');
    } else {
      await User.create({
        name: 'Sandip Pandit',
        email,
        password: 'SuperAdmin@123',
        role: 'developer',
        emailVerified: true,
        isActive: true,
      });
      console.log('Created Sandip Pandit user.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSandip();
