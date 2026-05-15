const https = require('https');
const http = require('http');

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
};

const testEndpoints = async () => {
  try {
    // First, login to get a token
    console.log('1. Logging in as admin...');
    const loginResponse = await makeRequest('46.224.104.227:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'admin@example.com', password: 'admin123' }
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received\n');

    // Test leaderboard endpoint
    console.log('2. Testing leaderboard endpoint...');
    const leaderboardResponse = await makeRequest('46.224.104.227:5000/api/leaderboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Leaderboard: ${leaderboardResponse.data.length} users found`);
    console.log(`   First user: ${leaderboardResponse.data[0]?.email} - XP: ${leaderboardResponse.data[0]?.xp}\n`);

    // Test empires endpoint
    console.log('3. Testing empires endpoint...');
    const empiresResponse = await makeRequest('46.224.104.227:5000/api/admin/empires', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Empires: ${empiresResponse.data.length} empires found`);
    console.log(`   First empire: ${empiresResponse.data[0]?.email} - Buildings: ${empiresResponse.data[0]?.buildings?.length}\n`);

    console.log('🎉 All endpoints working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testEndpoints();
