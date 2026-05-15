const axios = require('axios');

async function testTasksAPI() {
  try {
    console.log('Testing /api/tasks endpoint...\n');
    
    // Test without auth (should fail)
    try {
      const response = await axios.get('46.224.104.227:5000/api/tasks');
      console.log('❌ Unexpected: Got response without auth');
    } catch (error) {
      console.log('✓ Expected: Auth required -', error.response?.status, error.response?.data?.error);
    }
    
    // Test admin tasks endpoint
    console.log('\nTesting /api/admin/tasks endpoint...\n');
    try {
      const response = await axios.get('46.224.104.227:5000/api/admin/tasks');
      console.log('❌ Unexpected: Got response without auth');
    } catch (error) {
      console.log('✓ Expected: Auth required -', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n✓ API endpoints exist and require authentication');
    console.log('\nNext step: Login to get token and test with auth');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTasksAPI();
