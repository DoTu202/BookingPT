const http = require('http');

function testLoginDebug() {
  const loginData = JSON.stringify({
    email: 'jane@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  console.log('🧪 Testing login API - Debug mode...\n');
  console.log('Request:', {
    url: `http://localhost:3001${options.path}`,
    method: options.method,
    body: JSON.parse(loginData)
  });

  const req = http.request(options, (res) => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    console.log(`📊 Response Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\n📦 Raw Response Body:`);
      console.log(data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log(`\n✅ Parsed JSON:`);
        console.log(JSON.stringify(jsonData, null, 2));
        
        const token = jsonData.token || jsonData.accessToken || jsonData.data?.accesstoken || jsonData.data?.token;
        if (token) {
          console.log('\n🎉 Login appears successful!');
          console.log(`Token found: ${token.substring(0, 30)}...`);
          testGetPTs(token);
        } else {
          console.log('\n❌ No token found in response');
          console.log('Available keys:', Object.keys(jsonData));
          if (jsonData.data) {
            console.log('Data keys:', Object.keys(jsonData.data));
          }
        }
      } catch (e) {
        console.log(`\n❌ Failed to parse JSON: ${e.message}`);
        console.log('Response might be HTML or plain text');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ Request failed: ${error.message}`);
  });
  
  req.write(loginData);
  req.end();
}

function testGetPTs(token) {
  console.log('\n🏃‍♂️ Testing get PTs API...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/client/trainers',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 PTs API Status: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📦 PTs API Response:`);
      console.log(data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log(`✅ Found ${jsonData.length} trainers`);
      } catch (e) {
        console.log(`❌ Failed to parse PTs response: ${e.message}`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ PTs API failed: ${error.message}`);
  });
  
  req.end();
}

testLoginDebug();
