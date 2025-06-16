// Script to update PT data with new avatars and correct field mapping
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/userModel');
const connectDB = require('./src/configs/connectDB');

// New fitness-themed avatar URLs
const avatars = [
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face', // Yoga woman
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face', // Strong man
  'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face', // Cardio woman
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', // Functional trainer
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop&crop=face', // Pilates woman
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=400&fit=crop&crop=face', // Strong athlete
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', // Dance fitness
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face', // CrossFit man
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', // Prenatal coach
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'  // Sports coach
];

const updatePTAvatars = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('👥 Finding all PT users...');
    const ptUsers = await User.find({ role: 'pt' }).sort({ username: 1 });
    
    if (ptUsers.length === 0) {
      console.log('❌ No PT users found!');
      return;
    }
    
    console.log(`📋 Found ${ptUsers.length} PT users to update`);
    
    for (let i = 0; i < ptUsers.length; i++) {
      const ptUser = ptUsers[i];
      const newAvatar = avatars[i % avatars.length]; // Cycle through avatars if more PTs than avatars
      
      console.log(`📸 Updating ${ptUser.username} with new avatar...`);
      
      // Update photoUrl field in User model (not profileImage!)
      await User.findByIdAndUpdate(
        ptUser._id,
        { 
          photoUrl: newAvatar,
          updateAt: new Date()
        },
        { new: true }
      );
      
      console.log(`✅ Updated ${ptUser.username}: ${newAvatar}`);
    }
    
    console.log('🎉 All PT users updated successfully!');
    
    // Verify updates
    const updatedPTs = await User.find({ role: 'pt' }).select('username photoUrl');
    console.log('\n📋 Updated PT users:');
    updatedPTs.forEach((pt, index) => {
      console.log(`${index + 1}. ${pt.username}: ${pt.photoUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating PT avatars:', error);
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
  }
};

// Run the update
updatePTAvatars();
