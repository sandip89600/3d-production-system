require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI;

async function resetAndUnlockUsers() {
  try {
    if (!MONGO_URI) {
      console.error('Error: MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to Database.');

    const allUsers = await User.find({});
    console.log(`\nFound ${allUsers.length} users in database. Resetting passwords & unlocking...`);

    const tableData = [];

    for (let user of allUsers) {
      // Determine role-based default password
      let plainPassword = 'Admin@123'; // Default fallback
      if (user.role === 'developer') {
        plainPassword = 'Developer@123';
      } else if (user.role === 'admin') {
        plainPassword = 'Admin@123';
      } else if (user.role === 'employee') {
        plainPassword = 'Emp@123';
      } else if (user.role === 'client') {
        plainPassword = 'Client@123';
      }

      // Update password hash, unlock state, activate, verify
      user.password = plainPassword;
      user.isActive = true;
      user.accountStatus = 'active';
      user.emailVerified = true;
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      user.twoFactorEnabled = false; // Disable 2FA so it doesn't block testing
      
      await user.save();

      tableData.push({
        Name: user.name,
        Role: user.role,
        Email: user.email,
        Password: plainPassword,
        Status: 'ACTIVE & UNLOCKED'
      });
    }

    console.log('\n✅ ALL USERS SUCCESSFULLY UPDATED & UNLOCKED:');
    console.log('─'.repeat(80));
    tableData.forEach(row => {
      console.log(`Email:    ${row.Email}`);
      console.log(`Password: ${row.Password}`);
      console.log(`Role:     ${row.Role}`);
      console.log(`Name:     ${row.Name}`);
      console.log(`Status:   ${row.Status}`);
      console.log('─'.repeat(80));
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error running reset script:', error);
    process.exit(1);
  }
}

resetAndUnlockUsers();
