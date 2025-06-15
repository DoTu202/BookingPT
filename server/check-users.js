const mongoose = require('mongoose');
const User = require('./src/models/userModel');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fitness-app');
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`📊 Total users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users list:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Has Password: ${!!user.password}`);
        console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'None'}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
