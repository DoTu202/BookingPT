const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Same as authController
require('dotenv').config();

const UserModal = require('./src/models/userModel');
const connectDB = require('./src/configs/connectDB');

const debugUser = async () => {
  try {
    await connectDB();
    
    // Delete existing user
    await UserModal.deleteOne({email: 'test@example.com'});
    
    // Create hash using EXACT same method as authController
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    console.log('🔒 Generated hash:', hashedPassword);
    
    const user = new UserModal({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      dob: new Date('1990-01-01'),
      phoneNumber: '0999999999',
      role: 'client'
    });
    
    await user.save();
    console.log('✅ User created');
    
    // Now test password comparison
    const savedUser = await UserModal.findOne({email: 'test@example.com'});
    const isMatch = await bcrypt.compare('password123', savedUser.password);
    
    console.log('🧪 Password comparison result:', isMatch);
    
    if (isMatch) {
      console.log('✅ Password hash works correctly');
    } else {
      console.log('❌ Password hash NOT working');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugUser();
