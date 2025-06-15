const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Same as authController
require('dotenv').config();

const UserModal = require('./src/models/userModel');
const connectDB = require('./src/configs/connectDB');

const createTestUser = async () => {
  try {
    console.log('🌱 Creating test user...');
    
    await connectDB();
    
    // Check if user already exists
    const existingUser = await UserModal.findOne({email: 'john@example.com'});
    if (existingUser) {
      console.log('✅ User already exists');
      process.exit(0);
    }
    
    // Hash password using same method as authController
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const newUser = new UserModal({
      username: 'john_test',
      email: 'john@example.com',
      password: hashedPassword,
      dob: new Date('1990-05-15'),
      phoneNumber: '0901234567',
      role: 'client'
    });
    
    await newUser.save();
    console.log('✅ Test user created successfully');
    console.log('📧 Email: john@example.com');
    console.log('🔒 Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestUser();