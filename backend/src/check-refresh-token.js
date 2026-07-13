require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { generateTokens } = require('./middleware/auth');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'sandippandit896@gmail.com' }).select('+refreshTokens');
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('User refresh tokens array before login:', user.refreshTokens);

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Save
    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log('Saved token:', refreshToken);

    // Fetch again
    const user2 = await User.findById(user._id).select('+refreshTokens');
    console.log('User refresh tokens array after save:', user2.refreshTokens);
    console.log('Includes saved token?:', user2.refreshTokens.includes(refreshToken));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
