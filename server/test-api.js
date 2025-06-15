const axios = require('axios');

async function testLogin() {
  const testUsers = [
    { email: 'client@test.com', password: 'password123' },
    { email: 'user1@example.com', password: 'password123' },
    { email: 'pt1@example.com', password: 'password123' },
    { email: 'john.doe@example.com', password: 'password123' }
  ];

  console.log('🧪 Testing login API...\n');

  for (const user of testUsers) {
    try {
      console.log(`Testing login for: ${user.email}`);
      const response = await axios.post('http://localhost:3001/auth/login', user);
      
      if (response.data.token || response.data.accessToken) {
        console.log('✅ Login successful!');
        console.log(`   Token: ${(response.data.token || response.data.accessToken).substring(0, 20)}...`);
        console.log(`   User: ${response.data.user?.email} (${response.data.user?.role})`);
        
        // Test API lấy danh sách PTs với token này
        await testGetPTs(response.data.token || response.data.accessToken);
        break; // Thoát sau khi login thành công
      } else {
        console.log('❌ Login failed - no token received');
      }
    } catch (error) {
      console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
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
      console.log(`   ${index + 1}. ${pt.fullname} - ${pt.email} (${pt.specialization || 'No specialization'})`);
    });
  } catch (error) {
    console.log(`❌ Get PTs failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 401) {
      console.log('   → Authentication issue');
    }
  }
}

testLogin();
