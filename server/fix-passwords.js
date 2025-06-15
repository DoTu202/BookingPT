const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Same as authController
require('dotenv').config();

const UserModal = require('./src/models/userModel');
const connectDB = require('./src/configs/connectDB');

const fixUserPasswords = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding users with unhashed passwords...');
    
    // Get all users
    const users = await UserModal.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (!user.password.startsWith('$2b$')) {
        console.log(`🔒 Hashing password for user: ${user.email}`);
        
        // Hash the plain text password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt); // Default password
        
        // Update user with hashed password
        await UserModal.findByIdAndUpdate(user._id, {
          password: hashedPassword
        });
        
        console.log(`✅ Updated password for: ${user.email}`);
      } else {
        console.log(`✅ Password already hashed for: ${user.email}`);
      }
    }
    
    console.log('\n📋 All users with default password "password123":');
    const allUsers = await UserModal.find({}).select('email username role');
    allUsers.forEach(user => {
      console.log(`📧 ${user.email} | 👤 ${user.username} | 🏷️ ${user.role}`);
    });
    
    console.log('\n🔑 Default password for all users: password123');
    console.log('✅ Password fix completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixUserPasswords();
