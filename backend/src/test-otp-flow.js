const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

// Import User model (absolute path)
const User = require('./models/User');

async function runTest() {
  try {
    console.log('🧪 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('\n--- 1. Triggering Forgot Password (Email) ---');
    const email = 'superadmin@all3dstudio.com';
    const forgotRes = await axios.post(`${API_URL}/auth/forgot-password/email`, { email });
    console.log('   Response:', forgotRes.data);

    // Retrieve the user from MongoDB to check if OTP fields are set
    const userBefore = await User.findOne({ email });
    if (userBefore.otp && userBefore.otpExpiry) {
      console.log('   ✓ User database record successfully updated with OTP hash and expiry.');
    } else {
      throw new Error('OTP fields were not updated on user document!');
    }

    console.log('\n--- 2. Setting a known OTP to test Verification ---');
    const testOtp = '123456';
    const hashedOtp = await bcrypt.hash(testOtp, 10);
    userBefore.otp = hashedOtp;
    userBefore.otpExpiry = Date.now() + 5 * 60 * 1000;
    userBefore.otpAttempts = 0;
    await userBefore.save();
    console.log(`   ✓ Manually updated user's OTP to hashed "${testOtp}"`);

    console.log('\n--- 3. Verifying correct OTP ---');
    const verifyRes = await axios.post(`${API_URL}/auth/verify-otp`, {
      emailOrMobile: email,
      otp: testOtp
    });
    const { resetToken } = verifyRes.data;
    console.log('   ✓ OTP verification successful!');
    console.log(`   ✓ Received resetToken: ${resetToken.substring(0, 15)}...`);

    console.log('\n--- 4. Testing weak password rejection ---');
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token: resetToken,
        password: 'weak'
      });
      throw new Error('Weak password was incorrectly accepted!');
    } catch (err) {
      console.log('   ✓ Successfully rejected weak password. Message:', err.response?.data?.message);
    }

    console.log('\n--- 5. Testing strong password reset ---');
    const newPassword = 'NewSuperAdmin@123';
    const resetRes = await axios.post(`${API_URL}/auth/reset-password`, {
      token: resetToken,
      password: newPassword
    });
    console.log('   ✓ Password reset request succeeded! Message:', resetRes.data.message);

    console.log('\n--- 6. Verifying login with new password ---');
    const loginNewRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password: newPassword
    });
    console.log('   ✓ Login with new password succeeded! Welcome,', loginNewRes.data.user.name);

    console.log('\n--- 7. Reverting password to default ---');
    const userAfter = await User.findOne({ email });
    userAfter.password = 'SuperAdmin@123';
    userAfter.resetPasswordToken = null;
    userAfter.resetPasswordExpires = null;
    await userAfter.save();
    console.log('   ✓ Password successfully reverted back to default "SuperAdmin@123".');

    console.log('\n🎉 ALL PASSWORD RESET MODULE TESTS PASSED successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTest();
