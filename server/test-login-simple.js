const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('🧪 Testing login API with existing user...\n');

  const loginData = JSON.stringify({
    email: 'jane@example.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  try {
    console.log('Testing login for: jane@example.com');
    const response = await makeRequest(loginOptions, loginData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status === 200 && (response.data.token || response.data.accessToken)) {
      console.log('✅ Login successful!');
      const token = response.data.token || response.data.accessToken;
      console.log(`   Token: ${token.substring(0, 30)}...`);
      console.log(`   User: ${response.data.user?.email} (${response.data.user?.role})`);
      
      // Test API lấy danh sách PTs với token này
      await testGetPTs(token);
    } else {
      console.log('❌ Login failed');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Login failed: ${error.message}`);
  }
}

async function testGetPTs(token) {
  const ptOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/client/trainers',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    console.log('\n🏃‍♂️ Testing get PTs API...');
    const response = await makeRequest(ptOptions);
    
    console.log('Response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Get PTs successful!');
      const trainers = response.data;
      if (Array.isArray(trainers)) {
        console.log(`   Found ${trainers.length} trainers:`);
        trainers.forEach((pt, index) => {
          console.log(`   ${index + 1}. ${pt.fullname || pt.username || 'Unknown'} - ${pt.email}`);
          console.log(`      Specialization: ${pt.specialization || 'None'}`);
          console.log(`      Rating: ${pt.rating || 'No rating'}`);
        });
      } else {
        console.log('   Response data:', trainers);
      }
    } else {
      console.log(`❌ Get PTs failed with status: ${response.status}`);
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Get PTs failed: ${error.message}`);
  }
}

testLogin();
