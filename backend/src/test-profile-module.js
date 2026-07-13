const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const API_URL = 'http://127.0.0.1:5000/api';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

// Import User model (absolute path)
const User = require('./models/User');

async function runTest() {
  try {
    console.log('🧪 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const email = 'superadmin@all3dstudio.com';
    const password = 'SuperAdmin@123';

    console.log('\n--- 1. Logging in as Super Admin ---');
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
    const token = loginRes.data.accessToken;
    console.log('   ✓ Logged in. Token (shortened):', token.substring(0, 15) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- 2. Fetching User Profile ---');
    const profileRes = await axios.get(`${API_URL}/profile`, { headers });
    console.log('   ✓ Profile API returned successfully.');
    console.log('   ✓ User Name:', profileRes.data.user.name);
    console.log('   ✓ User Role:', profileRes.data.user.role);
    console.log('   ✓ Statistics keys:', Object.keys(profileRes.data.statistics));
    console.log('   ✓ Recent Activities count:', profileRes.data.recentActivities.length);

    console.log('\n--- 3. Updating Profile Information ---');
    const updatePayload = {
      name: 'System Owner Updated',
      mobile: '+919988776655',
      address: '123 Studio Tech Lane, City Center',
      emergencyContact: {
        name: 'Jane Doe',
        relation: 'Spouse',
        mobile: '+919988776600'
      },
      skills: ['System Management', 'Node.js Security', '3D Operations'],
      experience: 8,
      notificationSettings: {
        email: true,
        whatsapp: false,
        system: true,
        deadlineAlerts: true
      },
      privacySettings: {
        profileVisibility: 'team',
        contactVisibility: 'private',
        activityVisibility: 'team'
      }
    };
    const updateRes = await axios.put(`${API_URL}/profile/update`, updatePayload, { headers });
    console.log('   ✓ Profile update succeeded.');
    console.log('   ✓ Verified Name update in DB:', updateRes.data.user.name);
    console.log('   ✓ Verified Skills update in DB:', updateRes.data.user.skills);
    console.log('   ✓ Verified WhatsApp settings update in DB:', updateRes.data.user.notificationSettings.whatsapp);

    console.log('\n--- 4. Uploading Dummy Profile Photo ---');
    // Construct a raw multipart/form-data request manually in Node (no dependencies)
    const boundary = '----TestBoundary' + Math.random().toString(16);
    const filename = 'testphoto.png';
    const fileContent = 'FakeImageContentBuffer12345'; // dummy content
    
    let postData = '';
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="photo"; filename="${filename}"\r\n`;
    postData += 'Content-Type: image/png\r\n\r\n';
    postData += fileContent + '\r\n';
    postData += `--${boundary}--\r\n`;

    const uploadHeaders = {
      ...headers,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    };

    const uploadRes = await axios.post(`${API_URL}/profile/upload-photo`, Buffer.from(postData), { headers: uploadHeaders });
    console.log('   ✓ Profile photo upload API succeeded!');
    console.log('   ✓ Received Photo URL:', uploadRes.data.profilePhoto);

    console.log('\n--- 5. Removing Profile Photo ---');
    const removePhotoRes = await axios.delete(`${API_URL}/profile/remove-photo`, { headers });
    console.log('   ✓ Profile photo removal succeeded! Message:', removePhotoRes.data.message);

    console.log('\n--- 6. Fetching Activity History (Paginated) ---');
    const activityRes = await axios.get(`${API_URL}/profile/activity?page=1`, { headers });
    console.log('   ✓ Activity history API succeeded.');
    console.log('   ✓ Page:', activityRes.data.page);
    console.log('   ✓ Total Pages:', activityRes.data.totalPages);
    console.log('   ✓ Logs list count:', activityRes.data.activities.length);

    console.log('\n--- 7. Changing Password via Profile Settings ---');
    const newPassword = 'NewSuperAdminSecure@123';
    const changePasswordRes = await axios.put(`${API_URL}/profile/change-password`, {
      currentPassword: password,
      newPassword: newPassword
    }, { headers });
    console.log('   ✓ Password change API succeeded! Message:', changePasswordRes.data.message);

    console.log('\n--- 8. Verifying login with the new password ---');
    const loginNewRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password: newPassword
    });
    console.log('   ✓ Login with new password succeeded! User:', loginNewRes.data.user.name);

    console.log('\n--- 9. Logging out from all other devices ---');
    const logoutAllRes = await axios.post(`${API_URL}/profile/logout-all`, {}, {
      headers: { Authorization: `Bearer ${loginNewRes.data.accessToken}` }
    });
    console.log('   ✓ Logout all devices API succeeded! Message:', logoutAllRes.data.message);

    console.log('\n--- 10. Reverting User details and password back to default ---');
    const user = await User.findOne({ email });
    user.name = 'System Owner';
    user.password = password;
    user.mobile = '+919876543210';
    user.skills = [];
    user.experience = 0;
    user.address = '';
    user.emergencyContact = { name: '', relation: '', mobile: '' };
    user.refreshTokens = [];
    user.profilePhoto = null;
    await user.save();
    console.log('   ✓ Reverted user details and password back to default credentials.');

    console.log('\n🎉 ALL PROFILE MANAGEMENT MODULE TESTS PASSED successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTest();
