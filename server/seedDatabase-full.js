const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./src/models/userModel'); // Use consistent naming
const connectDB = require('./src/configs/connectDB');

const seedFullDatabase = async () => {
  try {
    console.log('🌱 Seeding full database...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create test client
    console.log('👤 Creating test client...');
    const client = new User({
      username: 'john_client',
      email: 'john@example.com',
      password: hashedPassword,
      dob: new Date('1990-05-15'),
      phoneNumber: '0901234567',
      role: 'client'
    });
    await client.save();
    
    // Create PT users with detailed profiles
    console.log('🏋️ Creating PT users...');
    
    const ptUsers = [
      {
        username: 'jane_pt',
        email: 'jane@fitness.com',
        password: hashedPassword,
        dob: new Date('1988-03-20'),
        phoneNumber: '0902345678',
        role: 'trainer',
        bio: 'Huấn luyện viên yoga chuyên nghiệp với 5 năm kinh nghiệm. Chuyên về yoga trị liệu và meditation.',
        specialization: ['Yoga', 'Pilates', 'Meditation'],
        location: 'Quận 1, TP.HCM',
        experience: '5 năm',
        certification: ['RYT-200', 'Yoga Alliance Certified'],
        hourlyRate: 300000,
        profileImage: 'https://example.com/jane.jpg',
        rating: 4.8,
        totalSessions: 150,
        // Availability for this week and next week
        availability: [
          // Today and next few days
          {
            date: new Date('2024-12-30'),
            slots: [
              { startTime: '08:00', endTime: '09:00', isBooked: false },
              { startTime: '09:00', endTime: '10:00', isBooked: false },
              { startTime: '16:00', endTime: '17:00', isBooked: false },
              { startTime: '17:00', endTime: '18:00', isBooked: false }
            ]
          },
          {
            date: new Date('2024-12-31'),
            slots: [
              { startTime: '07:00', endTime: '08:00', isBooked: false },
              { startTime: '08:00', endTime: '09:00', isBooked: false },
              { startTime: '18:00', endTime: '19:00', isBooked: false }
            ]
          },
          // Next year dates
          {
            date: new Date('2025-01-01'),
            slots: [
              { startTime: '09:00', endTime: '10:00', isBooked: false },
              { startTime: '10:00', endTime: '11:00', isBooked: false },
              { startTime: '15:00', endTime: '16:00', isBooked: false }
            ]
          },
          {
            date: new Date('2025-01-02'),
            slots: [
              { startTime: '08:00', endTime: '09:00', isBooked: false },
              { startTime: '16:00', endTime: '17:00', isBooked: false },
              { startTime: '17:00', endTime: '18:00', isBooked: false }
            ]
          }
        ]
      },
      {
        username: 'mike_pt',
        email: 'mike@fitness.com',
        password: hashedPassword,
        dob: new Date('1985-07-12'),
        phoneNumber: '0903456789',
        role: 'trainer',
        bio: 'Chuyên gia tập gym và tăng cơ. Giúp bạn đạt được body mơ ước với chương trình tập luyện khoa học.',
        specialization: ['Weight Training', 'Bodybuilding', 'Strength Training'],
        location: 'Quận 3, TP.HCM',
        experience: '8 năm',
        certification: ['NASM-CPT', 'ACSM Certified'],
        hourlyRate: 400000,
        profileImage: 'https://example.com/mike.jpg',
        rating: 4.9,
        totalSessions: 250,
        availability: [
          {
            date: new Date('2024-12-30'),
            slots: [
              { startTime: '06:00', endTime: '07:00', isBooked: false },
              { startTime: '07:00', endTime: '08:00', isBooked: false },
              { startTime: '19:00', endTime: '20:00', isBooked: false },
              { startTime: '20:00', endTime: '21:00', isBooked: false }
            ]
          },
          {
            date: new Date('2025-01-01'),
            slots: [
              { startTime: '06:00', endTime: '07:00', isBooked: false },
              { startTime: '07:00', endTime: '08:00', isBooked: false },
              { startTime: '18:00', endTime: '19:00', isBooked: false }
            ]
          },
          {
            date: new Date('2025-01-02'),
            slots: [
              { startTime: '06:30', endTime: '07:30', isBooked: false },
              { startTime: '18:30', endTime: '19:30', isBooked: false },
              { startTime: '19:30', endTime: '20:30', isBooked: false }
            ]
          }
        ]
      },
      {
        username: 'lisa_pt',
        email: 'lisa@fitness.com',
        password: hashedPassword,
        dob: new Date('1992-11-08'),
        phoneNumber: '0904567890',
        role: 'trainer',
        bio: 'Huấn luyện viên cardio và giảm cân. Chuyên thiết kế chương trình tập luyện đốt cháy mỡ thừa hiệu quả.',
        specialization: ['Cardio', 'Weight Loss', 'HIIT Training'],
        location: 'Quận 7, TP.HCM',
        experience: '4 năm',
        certification: ['ACE-CPT', 'TRX Certified'],
        hourlyRate: 350000,
        profileImage: 'https://example.com/lisa.jpg',
        rating: 4.7,
        totalSessions: 180,
        availability: [
          {
            date: new Date('2024-12-30'),
            slots: [
              { startTime: '08:00', endTime: '09:00', isBooked: false },
              { startTime: '10:00', endTime: '11:00', isBooked: false },
              { startTime: '15:00', endTime: '16:00', isBooked: false }
            ]
          },
          {
            date: new Date('2025-01-01'),
            slots: [
              { startTime: '08:30', endTime: '09:30', isBooked: false },
              { startTime: '14:00', endTime: '15:00', isBooked: false },
              { startTime: '16:00', endTime: '17:00', isBooked: false }
            ]
          }
        ]
      }
    ];
    
    // Save all PT users
    for (const ptData of ptUsers) {
      const pt = new User(ptData);
      await pt.save();
      console.log(`✅ Created PT: ${ptData.username} (${ptData.email})`);
    }
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test accounts:');
    console.log('👤 Client: john@example.com / password123');
    console.log('🏋️ PT 1: jane@fitness.com / password123 (Yoga specialist)');
    console.log('🏋️ PT 2: mike@fitness.com / password123 (Weight training)');
    console.log('🏋️ PT 3: lisa@fitness.com / password123 (Cardio specialist)');
    
    console.log('\n📅 Availability created for dates:');
    console.log('- 2024-12-30 (Today)');
    console.log('- 2024-12-31');
    console.log('- 2025-01-01');
    console.log('- 2025-01-02');
    
    // Count created records
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users created: ${userCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedFullDatabase();
