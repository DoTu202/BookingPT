const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./src/models/userModel'); // Use consistent naming
const PTProfile = require('./src/models/PTProfileModel');
const Availability = require('./src/models/AvailabilityModel');
const connectDB = require('./src/configs/connectDB');

const seedFullDatabase = async () => {
  try {
    console.log('🌱 Seeding full database...');
    
    await connectDB();
    
    // Generate dates for next 7 days
    const generateFutureDates = () => {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      return dates;
    };
    
    const futureDates = generateFutureDates();
    console.log('📅 Generating availability for dates:', futureDates.map(d => d.toISOString().split('T')[0]).join(', '));
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await PTProfile.deleteMany({});
    await Availability.deleteMany({});
    
  // Helper function to generate availability dates from 10/7 to 22/7
  const generateAvailabilityDates = () => {
    const dates = [];
    const startDate = new Date('2025-07-10'); // July 10, 2025
    const endDate = new Date('2025-07-22');   // July 22, 2025
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const availabilityDates = generateAvailabilityDates();

  // Generate different time slots for variety
  const morningSlots = [
    { startTime: '06:00', endTime: '07:00', isBooked: false },
    { startTime: '07:00', endTime: '08:00', isBooked: false },
    { startTime: '08:00', endTime: '09:00', isBooked: false },
    { startTime: '09:00', endTime: '10:00', isBooked: false }
  ];

  const afternoonSlots = [
    { startTime: '14:00', endTime: '15:00', isBooked: false },
    { startTime: '15:00', endTime: '16:00', isBooked: false },
    { startTime: '16:00', endTime: '17:00', isBooked: false },
    { startTime: '17:00', endTime: '18:00', isBooked: false }
  ];

  const eveningSlots = [
    { startTime: '18:00', endTime: '19:00', isBooked: false },
    { startTime: '19:00', endTime: '20:00', isBooked: false },
    { startTime: '20:00', endTime: '21:00', isBooked: false }
  ];

  // Function to randomly select slots for each PT
  const getRandomSlots = (ptIndex) => {
    const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
    const numSlots = 3 + (ptIndex % 3); // 3-5 slots per day
    const selectedSlots = [];
    
    // Different patterns for different PTs
    if (ptIndex % 3 === 0) {
      // Morning person
      selectedSlots.push(...morningSlots.slice(0, 2));
      selectedSlots.push(...eveningSlots.slice(0, 1));
    } else if (ptIndex % 3 === 1) {
      // Afternoon person  
      selectedSlots.push(...morningSlots.slice(0, 1));
      selectedSlots.push(...afternoonSlots.slice(0, 2));
      selectedSlots.push(...eveningSlots.slice(0, 1));
    } else {
      // Evening person
      selectedSlots.push(...afternoonSlots.slice(0, 1));
      selectedSlots.push(...eveningSlots.slice(0, 2));
    }
    
    return selectedSlots;
  };
    
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
      // 1. Jane
      {
        username: 'jane_pt',
        email: 'jane@fitness.com',
        password: hashedPassword,
        dob: new Date('1988-03-20'),
        phoneNumber: '0902345678',
        role: 'pt',
        bio: 'Professional yoga coach with 5 years of experience. Specializes in therapeutic yoga and meditation.',
        specialization: ['Yoga', 'Pilates', 'Meditation'],
        location: 'District 1, Ho Chi Minh City',
        experience: '5 years',
        certification: ['RYT-200', 'Yoga Alliance Certified'],
        hourlyRate: 300000,
        profileImage: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face',
        rating: 4.8,
        totalSessions: 150,
        availability: availabilityDates.map(date => ({
          date: new Date(date),
          slots: getRandomSlots(0)
        }))
      },
      // 2. Mike
      {
        username: 'mike_pt',
        email: 'mike@fitness.com',
        password: hashedPassword,
        dob: new Date('1985-07-12'),
        phoneNumber: '0903456789',
        role: 'pt',
        bio: 'Gym and muscle gain expert. Helping you achieve your dream body with scientific training programs.',
        specialization: ['Weight Training', 'Bodybuilding', 'Strength Training'],
        location: 'District 3, Ho Chi Minh City',
        experience: '8 years',
        certification: ['NASM-CPT', 'ACSM Certified'],
        hourlyRate: 400000,
        profileImage: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=400&fit=crop&crop=face',
        rating: 4.9,
        totalSessions: 250,
        availability: [
          { date: futureDates[0], slots: [ { startTime: '06:00', endTime: '07:00', isBooked: false }, { startTime: '07:00', endTime: '08:00', isBooked: false }, { startTime: '19:00', endTime: '20:00', isBooked: false }, { startTime: '20:00', endTime: '21:00', isBooked: false } ] },
          { date: futureDates[2], slots: [ { startTime: '06:00', endTime: '07:00', isBooked: false }, { startTime: '07:00', endTime: '08:00', isBooked: false }, { startTime: '18:00', endTime: '19:00', isBooked: false } ] },
          { date: futureDates[3], slots: [ { startTime: '06:30', endTime: '07:30', isBooked: false }, { startTime: '18:30', endTime: '19:30', isBooked: false }, { startTime: '19:30', endTime: '20:30', isBooked: false } ] }
        ]
      },
      // 3. Lisa
      {
        username: 'lisa_pt',
        email: 'lisa@fitness.com',
        password: hashedPassword,
        dob: new Date('1992-11-08'),
        phoneNumber: '0904567890',
        role: 'pt',
        bio: 'Cardio and weight loss coach. Expert in designing effective fat-burning workout programs.',
        specialization: ['Cardio', 'Weight Loss', 'HIIT Training'],
        location: 'District 7, Ho Chi Minh City',
        experience: '4 years',
        certification: ['ACE-CPT', 'TRX Certified'],
        hourlyRate: 350000,
        profileImage: 'https://images.unsplash.com/photo-1544348817-5f2cf14b88c8?w=400&h=400&fit=crop&crop=face',
        rating: 4.7,
        totalSessions: 180,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '08:00', endTime: '09:00', isBooked: false }, { startTime: '10:00', endTime: '11:00', isBooked: false }, { startTime: '15:00', endTime: '16:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '08:30', endTime: '09:30', isBooked: false }, { startTime: '14:00', endTime: '15:00', isBooked: false }, { startTime: '16:00', endTime: '17:00', isBooked: false } ] }
        ]
      },
      // 4. David
      {
        username: 'david_pt',
        email: 'david@fitness.com',
        password: hashedPassword,
        dob: new Date('1987-02-14'),
        phoneNumber: '0905678901',
        role: 'pt',
        bio: 'Certified personal trainer specializing in functional training and injury prevention.',
        specialization: ['Functional Training', 'Injury Prevention', 'Rehabilitation'],
        location: 'District 5, Ho Chi Minh City',
        experience: '6 years',
        certification: ['NSCA-CPT', 'First Aid Certified'],
        hourlyRate: 380000,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        rating: 4.6,
        totalSessions: 120,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '07:00', endTime: '08:00', isBooked: false }, { startTime: '09:00', endTime: '10:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '10:00', endTime: '11:00', isBooked: false }, { startTime: '15:00', endTime: '16:00', isBooked: false } ] }
        ]
      },
      // 5. Emily
      {
        username: 'emily_pt',
        email: 'emily@fitness.com',
        password: hashedPassword,
        dob: new Date('1990-09-25'),
        phoneNumber: '0906789012',
        role: 'pt',
        bio: 'Pilates and flexibility coach. Passionate about helping clients improve mobility and posture.',
        specialization: ['Pilates', 'Flexibility', 'Mobility'],
        location: 'District 2, Ho Chi Minh City',
        experience: '5 years',
        certification: ['STOTT Pilates Certified'],
        hourlyRate: 320000,
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616c332efae?w=400&h=400&fit=crop&crop=face',
        rating: 4.5,
        totalSessions: 100,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '08:00', endTime: '09:00', isBooked: false }, { startTime: '11:00', endTime: '12:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '09:00', endTime: '10:00', isBooked: false }, { startTime: '13:00', endTime: '14:00', isBooked: false } ] }
        ]
      },
      // 6. Alex
      {
        username: 'alex_pt',
        email: 'alex@fitness.com',
        password: hashedPassword,
        dob: new Date('1984-06-18'),
        phoneNumber: '0907890123',
        role: 'pt',
        bio: 'Strength and conditioning coach. Focused on athletic performance and powerlifting.',
        specialization: ['Strength', 'Conditioning', 'Powerlifting'],
        location: 'District 10, Ho Chi Minh City',
        experience: '10 years',
        certification: ['CSCS', 'USAW Certified'],
        hourlyRate: 450000,
        profileImage: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop&crop=face',
        rating: 4.9,
        totalSessions: 300,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '06:00', endTime: '07:00', isBooked: false }, { startTime: '08:00', endTime: '09:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '07:00', endTime: '08:00', isBooked: false }, { startTime: '17:00', endTime: '18:00', isBooked: false } ] }
        ]
      },
      // 7. Sarah
      {
        username: 'sarah_pt',
        email: 'sarah@fitness.com',
        password: hashedPassword,
        dob: new Date('1995-04-10'),
        phoneNumber: '0908901234',
        role: 'pt',
        bio: 'Zumba and dance fitness instructor. Brings energy and fun to every workout session.',
        specialization: ['Zumba', 'Dance Fitness', 'Aerobics'],
        location: 'District 4, Ho Chi Minh City',
        experience: '3 years',
        certification: ['Zumba Certified'],
        hourlyRate: 300000,
        profileImage: 'https://images.unsplash.com/photo-1506629905607-45cc9a27ed28?w=400&h=400&fit=crop&crop=face',
        rating: 4.4,
        totalSessions: 80,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '09:00', endTime: '10:00', isBooked: false }, { startTime: '18:00', endTime: '19:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '10:00', endTime: '11:00', isBooked: false }, { startTime: '19:00', endTime: '20:00', isBooked: false } ] }
        ]
      },
      // 8. Tom
      {
        username: 'tom_pt',
        email: 'tom@fitness.com',
        password: hashedPassword,
        dob: new Date('1989-12-01'),
        phoneNumber: '0909012345',
        role: 'pt',
        bio: 'CrossFit and HIIT coach. Focused on high-intensity training and endurance.',
        specialization: ['CrossFit', 'HIIT', 'Endurance'],
        location: 'Binh Thanh District, Ho Chi Minh City',
        experience: '7 years',
        certification: ['CrossFit Level 1'],
        hourlyRate: 420000,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        rating: 4.7,
        totalSessions: 160,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '07:00', endTime: '08:00', isBooked: false }, { startTime: '17:00', endTime: '18:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '08:00', endTime: '09:00', isBooked: false }, { startTime: '18:00', endTime: '19:00', isBooked: false } ] }
        ]
      },
      // 9. Anna
      {
        username: 'anna_pt',
        email: 'anna@fitness.com',
        password: hashedPassword,
        dob: new Date('1993-08-22'),
        phoneNumber: '0901234568',
        role: 'pt',
        bio: 'Prenatal and postnatal fitness coach. Supporting women through every stage of motherhood.',
        specialization: ['Prenatal Fitness', 'Postnatal Fitness', 'Women Health'],
        location: 'Phu Nhuan District, Ho Chi Minh City',
        experience: '4 years',
        certification: ['Pre/Postnatal Certified'],
        hourlyRate: 350000,
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        rating: 4.5,
        totalSessions: 90,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '10:00', endTime: '11:00', isBooked: false }, { startTime: '15:00', endTime: '16:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '11:00', endTime: '12:00', isBooked: false }, { startTime: '16:00', endTime: '17:00', isBooked: false } ] }
        ]
      },
      // 10. Ben
      {
        username: 'ben_pt',
        email: 'ben@fitness.com',
        password: hashedPassword,
        dob: new Date('1986-10-05'),
        phoneNumber: '0901122334',
        role: 'pt',
        bio: 'Sports performance coach. Specializes in agility, speed, and sports-specific training.',
        specialization: ['Sports Performance', 'Agility', 'Speed Training'],
        location: 'District 6, Ho Chi Minh City',
        experience: '9 years',
        certification: ['ISSA Certified'],
        hourlyRate: 390000,
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        rating: 4.8,
        totalSessions: 210,
        availability: [
          { date: new Date('2024-12-30'), slots: [ { startTime: '06:00', endTime: '07:00', isBooked: false }, { startTime: '08:00', endTime: '09:00', isBooked: false } ] },
          { date: new Date('2025-01-01'), slots: [ { startTime: '09:00', endTime: '10:00', isBooked: false }, { startTime: '17:00', endTime: '18:00', isBooked: false } ] }
        ]
      }
    ];
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Save all PT users and create PT profiles
    for (const ptData of ptUsers) {
      // Create user first
      const { bio, specialization, location, experience, certification, hourlyRate, rating, totalSessions, availability, ...userData } = ptData;
      
      const pt = new User(userData);
      await pt.save();
      console.log(`✅ Created PT User: ${ptData.username} (${ptData.email})`);
      
      // Create PT profile
      // Map specializations to valid enum values
      const specializationMapping = {
        'yoga': 'yoga',
        'pilates': 'pilates', 
        'meditation': 'general',
        'weight training': 'strength',
        'bodybuilding': 'muscle_building',
        'strength training': 'strength',
        'cardio': 'cardio',
        'weight loss': 'weight_loss',
        'hiit training': 'cardio',
        'functional training': 'functional_training',
        'injury prevention': 'rehabilitation',
        'rehabilitation': 'rehabilitation',
        'flexibility': 'general',
        'mobility': 'general',
        'strength': 'strength',
        'conditioning': 'strength',
        'powerlifting': 'strength',
        'zumba': 'cardio',
        'dance fitness': 'cardio',
        'aerobics': 'cardio',
        'crossfit': 'cardio',
        'hiit': 'cardio',
        'endurance': 'cardio',
        'prenatal fitness': 'general',
        'postnatal fitness': 'general',
        'women health': 'general',
        'sports performance': 'strength',
        'agility': 'strength',
        'speed training': 'strength'
      };
      
      const mappedSpecializations = specialization.map(spec => 
        specializationMapping[spec.toLowerCase()] || 'general'
      );
      
      const ptProfile = new PTProfile({
        user: pt._id,
        bio: bio,
        specializations: [...new Set(mappedSpecializations)], // Remove duplicates
        experienceYears: parseInt(experience.replace(/\D/g, '')) || 0, // Extract number from "5 years"
        hourlyRate: hourlyRate,
        location: location,
        rating: rating,
        totalSessions: totalSessions,
        certifications: certification,
        isAvailable: true,
        profileImage: ptData.profileImage
      });
      
      await ptProfile.save();
      console.log(`✅ Created PT Profile for: ${ptData.username}`);
      
      // Create availability slots for this PT
      const availabilitySlots = [];
      const today = new Date();
      
      // Create slots for next 14 days
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + dayOffset);
        
        // Skip weekends for some variety (only for some PTs)
        const isWeekend = slotDate.getDay() === 0 || slotDate.getDay() === 6;
        if (isWeekend && Math.random() > 0.3) continue; // 30% chance to work on weekends
        
        // Create different time slots based on PT specialty
        let timeSlots = [];
        if (specialization.includes('Yoga') || specialization.includes('Pilates')) {
          // Morning and evening slots for yoga/pilates
          timeSlots = [
            { start: 7, end: 8 }, { start: 8, end: 9 }, { start: 9, end: 10 },
            { start: 17, end: 18 }, { start: 18, end: 19 }
          ];
        } else if (specialization.includes('Weight Training') || specialization.includes('Strength')) {
          // More flexible hours for strength training
          timeSlots = [
            { start: 6, end: 7 }, { start: 7, end: 8 }, { start: 8, end: 9 },
            { start: 18, end: 19 }, { start: 19, end: 20 }, { start: 20, end: 21 }
          ];
        } else if (specialization.includes('Cardio') || specialization.includes('HIIT')) {
          // Peak energy hours
          timeSlots = [
            { start: 8, end: 9 }, { start: 9, end: 10 }, { start: 10, end: 11 },
            { start: 16, end: 17 }, { start: 17, end: 18 }
          ];
        } else {
          // General schedule
          timeSlots = [
            { start: 8, end: 9 }, { start: 9, end: 10 }, { start: 15, end: 16 },
            { start: 16, end: 17 }, { start: 17, end: 18 }
          ];
        }
        
        // Create availability records for each time slot
        for (const slot of timeSlots) {
          // Random chance some slots are already booked
          const isBooked = Math.random() < 0.2; // 20% chance already booked
          
          const startTime = new Date(slotDate);
          startTime.setHours(slot.start, 0, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(slot.end, 0, 0, 0);
          
          availabilitySlots.push({
            pt: pt._id,
            startTime: startTime,
            endTime: endTime,
            status: isBooked ? 'booked' : 'available'
          });
        }
      }
      
      // Save all availability slots for this PT
      if (availabilitySlots.length > 0) {
        await Availability.insertMany(availabilitySlots);
        console.log(`✅ Created ${availabilitySlots.length} availability slots for: ${ptData.username}`);
      }
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
