// Quick test to check if the API endpoints work
const testEndpoints = async () => {
  try {
    // First login to get a token
    console.log('Testing login...');
    const loginResponse = await fetch('46.224.104.227:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('No token received!');
      return;
    }
    
    const token = loginData.token;
    
    // Test leaderboard endpoint
    console.log('\nTesting leaderboard endpoint...');
    const leaderboardResponse = await fetch('46.224.104.227:5000/api/leaderboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const leaderboardData = await leaderboardResponse.json();
    console.log('Leaderboard status:', leaderboardResponse.status);
    console.log('Leaderboard data:', leaderboardData);
    
    // Test empires endpoint
    console.log('\nTesting empires endpoint...');
    const empiresResponse = await fetch('46.224.104.227:5000/api/admin/empires', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const empiresData = await empiresResponse.json();
    console.log('Empires status:', empiresResponse.status);
    console.log('Empires data:', empiresData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testEndpoints();
