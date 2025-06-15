const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing login API with existing user...\n');

  try {
    console.log('Testing login for: jane@example.com');
    const response = await axios.post('http://localhost:3001/auth/login', {
      email: 'jane@example.com',
      password: 'password123'
    });
    
    console.log('Response:', response.data);
    
    if (response.data.token || response.data.accessToken) {
      console.log('✅ Login successful!');
      const token = response.data.token || response.data.accessToken;
      console.log(`   Token: ${token.substring(0, 30)}...`);
      console.log(`   User: ${response.data.user?.email} (${response.data.user?.role})`);
      
      // Test API lấy danh sách PTs với token này
      await testGetPTs(token);
    } else {
      console.log('❌ Login failed - no token received');
    }
  } catch (error) {
    console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    console.log('Response data:', error.response?.data);
  }
}

async function testGetPTs(token) {
  try {
    console.log('\n🏃‍♂️ Testing get PTs API...');
    const response = await axios.get('http://localhost:3001/api/client/trainers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Get PTs successful!');
    console.log(`   Found ${response.data.length} trainers:`);
    response.data.forEach((pt, index) => {
      console.log(`   ${index + 1}. ${pt.fullname || pt.username} - ${pt.email}`);
      console.log(`      Specialization: ${pt.specialization || 'None'}`);
      console.log(`      Rating: ${pt.rating || 'No rating'}`);
    });
    
    return response.data;
  } catch (error) {
    console.log(`❌ Get PTs failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 401) {
      console.log('   → Authentication issue');
    }
    console.log('Response data:', error.response?.data);
  }
}

testLogin();
