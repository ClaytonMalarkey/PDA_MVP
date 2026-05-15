require('dotenv').config();
const axios = require('axios');

const BASE_URL = '46.224.104.227:5000';

async function testLeaderboardAPI() {
  try {
    console.log('\n=== Testing Leaderboard API ===\n');
    
    // Test without authentication (should work for admin view)
    console.log('1. Testing GET /api/leaderboard (no auth)...');
    const response = await axios.get(`${BASE_URL}/api/leaderboard`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Data type: ${Array.isArray(response.data) ? 'Array' : 'Object'}`);
    console.log(`✅ Number of users: ${response.data.length || 0}`);
    
    if (response.data.length > 0) {
      console.log('\nFirst user in leaderboard:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
    // Test with sortBy parameter
    console.log('\n2. Testing GET /api/leaderboard?sortBy=currency...');
    const response2 = await axios.get(`${BASE_URL}/api/leaderboard?sortBy=currency`);
    console.log(`✅ Status: ${response2.status}`);
    console.log(`✅ Number of users: ${response2.data.length || 0}`);
    
    if (response2.data.length > 0) {
      console.log('\nFirst user sorted by currency:');
      console.log(JSON.stringify(response2.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testEmpireAPI() {
  try {
    console.log('\n=== Testing Empire API ===\n');
    
    // First, login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test empire endpoint with auth
    console.log('\n2. Testing GET /api/admin/empires...');
    const response = await axios.get(`${BASE_URL}/api/admin/empires`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Number of empires: ${response.data.length || 0}`);
    
    if (response.data.length > 0) {
      console.log('\nFirst empire:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  await testLeaderboardAPI();
  await testEmpireAPI();
  process.exit(0);
}

runTests();
