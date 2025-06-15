const http = require('http');

function testRoutes() {
  const routes = [
    '/api/client/pt',
    '/api/client/trainers',
    '/api/client',
  ];

  console.log('🔍 Testing available routes...\n');

  routes.forEach(async (route, index) => {
    setTimeout(() => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: route,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImphbmVAZXhhbXBsZS5jb20iLCJpZCI6IjY4NGQwNTkxNTNhZDY5NTE0MTE5MGUxYiIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3NDk4ODcwNzQsImV4cCI6MTc0OTk3MzQ3NH0.ytMQlIB9yurzEbPuQ4MZs6NF19KtwQjlpK6HAIDemco',
          'Content-Type': 'application/json'
        }
      };

      console.log(`Testing: ${route}`);
      
      const req = http.request(options, (res) => {
        console.log(`  Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`  ✅ Success! Response length: ${data.length}`);
            try {
              const json = JSON.parse(data);
              console.log(`  📊 Data: Found ${json.length} items`);
            } catch (e) {
              console.log(`  📊 Raw response: ${data.substring(0, 100)}...`);
            }
          } else if (res.statusCode === 404) {
            console.log(`  ❌ Route not found`);
          } else {
            console.log(`  ⚠️ Status ${res.statusCode}: ${data.substring(0, 100)}`);
          }
          console.log('');
        });
      });
      
      req.on('error', (error) => {
        console.log(`  ❌ Error: ${error.message}`);
        console.log('');
      });
      
      req.end();
    }, index * 1000);
  });
}

testRoutes();
