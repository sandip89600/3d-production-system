require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function checkUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Print all users in the system to see what we have
    const allUsers = await User.find({});
    console.log('\nAll registered users in system:');
    console.log('─'.repeat(50));
    allUsers.forEach(u => console.log(`- ${u.name} | Role: ${u.role} | Email: ${u.email}`));
    console.log('─'.repeat(50));

    await mongoose.disconnect();
    process.exit(0);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
