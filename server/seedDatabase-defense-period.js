const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./src/models/userModel');
const PTProfile = require('./src/models/PTProfileModel');
const Availability = require('./src/models/AvailabilityModel');
const connectDB = require('./src/configs/connectDB');

const seedFullDatabase = async () => {
  try {
    console.log('🌱 Seeding full database with defense period dates...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await PTProfile.deleteMany({});
    await Availability.deleteMany({});
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create test client with avatar
    console.log('👤 Creating test client...');
    const client = new User({
      username: 'john_client',
      email: 'john@example.com',
      password: hashedPassword,
      dob: new Date('1990-05-15'),
      phoneNumber: '0901234567',
      role: 'client',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    });
    await client.save();
    
    // Generate dates from July 10-22, 2025 (defense period)
    const generateDefensePeriodDates = () => {
      const dates = [];
      for (let day = 10; day <= 22; day++) {
        dates.push(new Date(`2025-07-${day}`));
      }
      return dates;
    };
    
    const defenseDates = generateDefensePeriodDates();
    
    // PT data with diverse and vibrant fitness avatars
    const ptData = [
      {
        username: 'jane_pt', email: 'jane@fitness.com', bio: 'Professional yoga coach with 5 years of experience.',
        specialization: ['Yoga', 'Pilates', 'Meditation'], location: 'District 1, Ho Chi Minh City',
        experience: '5 years', certification: ['RYT-200', 'Yoga Alliance Certified'], hourlyRate: 300000,
        avatar: 'https://images.unsplash.com/photo-1506629905853-f86a415ab4db?w=400&h=400&fit=crop&crop=face',
        rating: 4.8, totalSessions: 150, timeSlots: ['08:00-09:00', '09:00-10:00', '16:00-17:00']
      },
      {
        username: 'mike_pt', email: 'mike@fitness.com', bio: 'Gym and muscle gain expert.',
        specialization: ['Weight Training', 'Bodybuilding', 'Strength Training'], location: 'District 3, Ho Chi Minh City',
        experience: '8 years', certification: ['NASM-CPT', 'ACSM Certified'], hourlyRate: 400000,
        avatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop&crop=face',
        rating: 4.9, totalSessions: 250, timeSlots: ['06:00-07:00', '07:00-08:00', '19:00-20:00']
      },
      {
        username: 'lisa_pt', email: 'lisa@fitness.com', bio: 'Cardio and weight loss coach.',
        specialization: ['Cardio', 'Weight Loss', 'HIIT Training'], location: 'District 7, Ho Chi Minh City',
        experience: '4 years', certification: ['ACE-CPT', 'TRX Certified'], hourlyRate: 350000,
        avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
        rating: 4.7, totalSessions: 180, timeSlots: ['08:00-09:00', '15:00-16:00', '18:00-19:00']
      },
      {
        username: 'david_pt', email: 'david@fitness.com', bio: 'Functional training and injury prevention specialist.',
        specialization: ['Functional Training', 'Injury Prevention', 'Rehabilitation'], location: 'District 5, Ho Chi Minh City',
        experience: '6 years', certification: ['NSCA-CPT', 'First Aid Certified'], hourlyRate: 380000,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        rating: 4.6, totalSessions: 120, timeSlots: ['07:00-08:00', '14:00-15:00', '17:00-18:00']
      },
      {
        username: 'emily_pt', email: 'emily@fitness.com', bio: 'Pilates and flexibility coach.',
        specialization: ['Pilates', 'Flexibility', 'Mobility'], location: 'District 2, Ho Chi Minh City',
        experience: '5 years', certification: ['STOTT Pilates Certified'], hourlyRate: 320000,
        avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face',
        rating: 4.5, totalSessions: 100, timeSlots: ['09:00-10:00', '11:00-12:00', '16:00-17:00']
      },
      {
        username: 'alex_pt', email: 'alex@fitness.com', bio: 'Strength and conditioning coach.',
        specialization: ['Strength', 'Conditioning', 'Powerlifting'], location: 'District 10, Ho Chi Minh City',
        experience: '10 years', certification: ['CSCS', 'USAW Certified'], hourlyRate: 450000,
        avatar: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=400&fit=crop&crop=face',
        rating: 4.9, totalSessions: 300, timeSlots: ['06:00-07:00', '08:00-09:00', '20:00-21:00']
      },
      {
        username: 'sarah_pt', email: 'sarah@fitness.com', bio: 'Zumba and dance fitness instructor.',
        specialization: ['Zumba', 'Dance Fitness', 'Aerobics'], location: 'District 4, Ho Chi Minh City',
        experience: '3 years', certification: ['Zumba Certified'], hourlyRate: 300000,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        rating: 4.4, totalSessions: 80, timeSlots: ['09:00-10:00', '18:00-19:00', '19:00-20:00']
      },
      {
        username: 'tom_pt', email: 'tom@fitness.com', bio: 'CrossFit and HIIT coach.',
        specialization: ['CrossFit', 'HIIT', 'Endurance'], location: 'Binh Thanh District, Ho Chi Minh City',
        experience: '7 years', certification: ['CrossFit Level 1'], hourlyRate: 420000,
        avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=face',
        rating: 4.7, totalSessions: 160, timeSlots: ['07:00-08:00', '17:00-18:00', '18:00-19:00']
      },
      {
        username: 'anna_pt', email: 'anna@fitness.com', bio: 'Prenatal and postnatal fitness coach.',
        specialization: ['Prenatal Fitness', 'Postnatal Fitness', 'Women Health'], location: 'Phu Nhuan District, Ho Chi Minh City',
        experience: '4 years', certification: ['Pre/Postnatal Certified'], hourlyRate: 350000,
        avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
        rating: 4.5, totalSessions: 90, timeSlots: ['10:00-11:00', '15:00-16:00', '16:00-17:00']
      },
      {
        username: 'ben_pt', email: 'ben@fitness.com', bio: 'Sports performance coach.',
        specialization: ['Sports Performance', 'Agility', 'Speed Training'], location: 'District 6, Ho Chi Minh City',
        experience: '9 years', certification: ['ISSA Certified'], hourlyRate: 390000,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        rating: 4.8, totalSessions: 210, timeSlots: ['06:00-07:00', '08:00-09:00', '17:00-18:00']
      }
    ];
    
    console.log('🏋️ Creating PT users and profiles...');
    
    // Specialization mapping
    const specializationMapping = {
      'yoga': 'yoga', 'pilates': 'pilates', 'meditation': 'general',
      'weight training': 'strength', 'bodybuilding': 'muscle_building', 'strength training': 'strength',
      'cardio': 'cardio', 'weight loss': 'weight_loss', 'hiit training': 'cardio',
      'functional training': 'functional_training', 'injury prevention': 'rehabilitation',
      'rehabilitation': 'rehabilitation', 'flexibility': 'general', 'mobility': 'general',
      'strength': 'strength', 'conditioning': 'strength', 'powerlifting': 'strength',
      'zumba': 'cardio', 'dance fitness': 'cardio', 'aerobics': 'cardio',
      'crossfit': 'cardio', 'hiit': 'cardio', 'endurance': 'cardio',
      'prenatal fitness': 'general', 'postnatal fitness': 'general', 'women health': 'general',
      'sports performance': 'strength', 'agility': 'strength', 'speed training': 'strength'
    };
    
    for (let i = 0; i < ptData.length; i++) {
      const pt = ptData[i];
      
      // Create user with photoUrl
      const ptUser = new User({
        username: pt.username,
        email: pt.email,
        password: hashedPassword,
        dob: new Date('1985-01-01'),
        phoneNumber: `090${2000000 + i}`,
        role: 'pt',
        photoUrl: pt.avatar // Store avatar in User model
      });
      await ptUser.save();
      
      // Map specializations
      const mappedSpecs = pt.specialization.map(spec => 
        specializationMapping[spec.toLowerCase()] || 'general'
      );
      
      // Parse location string to object
      const locationParts = pt.location.split(',').map(part => part.trim());
      const locationObj = {
        district: locationParts[0] || '',
        city: locationParts[1] || 'Ho Chi Minh City'
      };
      
      // Create PT profile (without profileImage since it's in User)
      const ptProfile = new PTProfile({
        user: ptUser._id,
        bio: pt.bio,
        specializations: [...new Set(mappedSpecs)],
        experienceYears: parseInt(pt.experience) || 0,
        hourlyRate: pt.hourlyRate,
        location: locationObj, // Use parsed location object
        rating: pt.rating,
        totalSessions: pt.totalSessions,
        certifications: pt.certification,
        isAvailable: true
      });
      await ptProfile.save();
      
      // Create availability for all defense period dates
      for (const date of defenseDates) {
        for (const timeSlot of pt.timeSlots) {
          const [startTime, endTime] = timeSlot.split('-');
          const [startHour, startMin] = startTime.split(':');
          const [endHour, endMin] = endTime.split(':');
          
          const startDateTime = new Date(date);
          startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
          
          const availability = new Availability({
            pt: ptUser._id,
            startTime: startDateTime,
            endTime: endDateTime,
            status: 'available'
          });
          await availability.save();
        }
      }
      
      console.log(`✅ Created PT: ${pt.username} with ${pt.timeSlots.length} slots per day`);
    }
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test accounts:');
    console.log('👤 Client: john@example.com / password123');
    console.log('🏋️ PT accounts: jane@fitness.com, mike@fitness.com, lisa@fitness.com, etc. / password123');
    
    console.log('\n📅 Availability created for defense period:');
    console.log('- July 10-22, 2025 (Your defense dates!)');
    
    const userCount = await User.countDocuments();
    const ptProfileCount = await PTProfile.countDocuments();
    const availabilityCount = await Availability.countDocuments();
    
    console.log(`\n📊 Database stats:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- PT Profiles: ${ptProfileCount}`);
    console.log(`- Availability slots: ${availabilityCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedFullDatabase();
