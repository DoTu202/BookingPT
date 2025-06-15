const mongoose = require('mongoose');
const User = require('./src/models/userModel');

async function checkPTs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fitness-app');
    console.log('✅ Connected to MongoDB');
    
    // Tìm users có role là 'pt'
    const pts = await User.find({ role: 'pt' });
    console.log(`📊 Found ${pts.length} PTs in database:`);
    
    if (pts.length > 0) {
      pts.forEach((pt, index) => {
        console.log(`${index + 1}. ${pt.username} - ${pt.email}`);
      });
    } else {
      console.log('❌ No PTs found! Need to seed PT data.');
      console.log('You may need to run: node seedDatabase-simple.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPTs();
