const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

async function runTest() {
  try {
    console.log('🧪 Starting Auth Persistence Simulation...');
    
    // 1. Simulate Login
    console.log('1. Logging in as Super Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@all3dstudio.com',
      password: 'SuperAdmin@123'
    });

    const { accessToken, refreshToken, user } = loginRes.data;
    console.log(`   Success! Logged in as: ${user.name}`);
    console.log(`   Access Token (shortened): ${accessToken.substring(0, 15)}...`);
    console.log(`   Refresh Token (shortened): ${refreshToken.substring(0, 15)}...`);

    // 2. Simulate page reload (make a /me request with the retrieved access token)
    console.log('\n2. Simulating browser refresh (fetching profile /me with Access Token)...');
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`   Success! Loaded profile for: ${meRes.data.user.name}`);

    // 3. Simulate access token expiration & token refresh
    console.log('\n3. Simulating token refresh (calling /auth/refresh with Refresh Token)...');
    const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });
    const newAccessToken = refreshRes.data.accessToken;
    console.log(`   Success! Received new Access Token: ${newAccessToken.substring(0, 15)}...`);

    // 4. Verify the new access token works
    console.log('\n4. Verifying new Access Token works on /me...');
    const newMeRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    console.log(`   Success! Loaded profile for: ${newMeRes.data.user.name}`);

    console.log('\n🎉 ALL PERSISTENCE TESTS PASSED! Backend logic is fully operational.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
