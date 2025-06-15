const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config();

// Load models
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Availability = require('../models/AvailabilityModel');
const connectDB = require('../configs/connectDB');

// Dữ liệu mẫu hoàn chỉnh và chính xác 100% với schema của bạn
const ptUsers = [
  {
    name: 'Liam Johnson',
    email: 'liam.johnson@example.com',
    password: 'password123',
    username: 'liamjohnson',
    phoneNumber: '0911111111',
    dob: new Date('1990-05-15'),
    profile: {
      specializations: ['weight_loss', 'strength'],
      experienceYears: 5,
      hourlyRate: 250000,
      bio: 'A certified instructor helping you find balance and a healthy lifestyle.',
      certifications: ['ACE Certified Personal Trainer', 'Nutrition Coach'],
      location: { city: 'Hanoi', district: 'Ba Dinh' },
    },
    availabilities: [
      {
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        timeSlots: [
          { startTime: '07:00', endTime: '08:00', isBooked: false },
          { startTime: '08:00', endTime: '09:00', isBooked: false },
        ],
      },
    ],
  },
  {
    name: 'Olivia Smith',
    email: 'olivia.smith@example.com',
    password: 'password123',
    username: 'oliviasmith',
    phoneNumber: '0922222222',
    dob: new Date('1992-08-20'),
    profile: {
      specializations: ['strength', 'cardio'],
      experienceYears: 8,
      hourlyRate: 350000,
      bio: 'Expert in strength training and weight management. Let me help you build a strong and lean physique.',
      certifications: ['International Bodybuilding Certificate', 'Powerlifting Level 2'],
      location: { city: 'Ho Chi Minh City', district: 'District 1' },
    },
    availabilities: [
      {
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        timeSlots: [
          { startTime: '18:00', endTime: '19:00', isBooked: false },
          { startTime: '19:00', endTime: '20:00', isBooked: true },
        ],
      },
    ],
  },
  {
    name: 'Noah Williams',
    email: 'noah.williams@example.com',
    password: 'password123',
    username: 'noahwilliams',
    phoneNumber: '0933333333',
    dob: new Date('1995-01-10'),
    profile: {
      specializations: ['cardio', 'functional_training'], // 'kick-boxing' không có trong enum, đã sửa
      experienceYears: 4,
      hourlyRate: 200000,
      bio: 'Passionate and energetic. My cardio sessions will help you burn calories effectively.',
      certifications: ['Group Fitness Instructor', 'Functional Training Certificate'],
      location: { city: 'Da Nang', district: 'Hai Chau' },
    },
    availabilities: [
        {
            date: new Date(new Date().setDate(new Date().getDate() + 3)),
            timeSlots: [
              { startTime: '06:00', endTime: '07:00', isBooked: false },
            ],
        },
    ]
  },
  {
    name: 'Emma Brown',
    email: 'emma.brown@example.com',
    password: 'password123',
    username: 'emmabrown',
    phoneNumber: '0944444444',
    dob: new Date('1988-11-25'),
    profile: {
      specializations: ['rehabilitation', 'pilates'],
      experienceYears: 12,
      hourlyRate: 400000,
      bio: 'With over 12 years of experience, I specialize in post-injury recovery exercises and posture correction.',
      certifications: ['Doctor of Physical Therapy', 'Certified Pilates Instructor'],
      location: { city: 'Hanoi', district: 'Tay Ho' },
    },
    availabilities: []
  },
  {
    name: 'Oliver Jones',
    email: 'oliver.jones@example.com',
    password: 'password123',
    username: 'oliverjones',
    phoneNumber: '0955555555',
    dob: new Date('1993-07-30'),
    profile: {
      specializations: ['strength', 'nutrition'],
      experienceYears: 6,
      hourlyRate: 300000,
      bio: 'Helping clients achieve their strength goals through tailored programs and smart nutrition.',
      certifications: ['NASM Certified Personal Trainer', 'Precision Nutrition Level 1'],
      location: { city: 'Ho Chi Minh City', district: 'District 7' },
    },
    availabilities: []
  },
];


const importData = async () => {
  try {
    await User.deleteMany({ role: 'pt' });
    await PTProfile.deleteMany();
    await Availability.deleteMany();
    console.log('Old data cleared... Seeding new data...'.yellow);

    for (const ptData of ptUsers) {
      const user = new User({
        name: ptData.name,
        email: ptData.email,
        username: ptData.username,
        phoneNumber: ptData.phoneNumber,
        dob: ptData.dob,
        password: ptData.password,
        role: 'pt',
        isVerified: true,
      });
      await user.save();

      const profileData = {
          user: user._id,
          name: ptData.name,
          bio: ptData.profile.bio,
          specializations: ptData.profile.specializations,
          experienceYears: ptData.profile.experienceYears,
          hourlyRate: ptData.profile.hourlyRate,
          location: ptData.profile.location,
          certifications: ptData.profile.certifications
      };
      
      await PTProfile.create(profileData);

      if (ptData.availabilities && ptData.availabilities.length > 0) {
        for (const avail of ptData.availabilities) {
          await Availability.create({
            pt: user._id,
            date: avail.date,
            timeSlots: avail.timeSlots,
          });
        }
      }
    }

    console.log('Data Imported Successfully!'.green.inverse);
  } catch (error) {
    console.error(`Error during data import: ${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Availability.deleteMany();
    await PTProfile.deleteMany();
    await User.deleteMany({ role: 'pt' });
    console.log('Data Destroyed Successfully!'.red.inverse);
  } catch (error) {
    console.error(`Error during data destruction: ${error}`.red.inverse);
    process.exit(1);
  }
};

const runSeeder = async () => {
  try {
    await connectDB();

    if (process.argv[2] === '-d') {
      await destroyData();
    } else {
      await importData();
    }

    await mongoose.connection.close();
    console.log('Database connection closed.'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Seeder failed to run:'.red.bold, error);
    process.exit(1);
  }
};

runSeeder();