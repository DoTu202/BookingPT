// Populates the database with demo data so the app can be explored right
// away. Usage: npm run seed   (uses MONGODB_URI from .env)
//
// WARNING: deletes all existing data in the target database.
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../src/configs/connectDB');
const {isProduction} = require('../src/configs/env');
const User = require('../src/models/userModel');
const PTProfile = require('../src/models/PTProfileModel');
const Availability = require('../src/models/AvailabilityModel');
const Booking = require('../src/models/bookingModel');
const Notification = require('../src/models/NotificationModel');
const {ChatRoom, Message} = require('../src/models/ChatModel');
const {dayjs, APP_TIMEZONE} = require('../src/utils/helpers');

const DEMO_PASSWORD = 'Password123!';

const trainers = [
  {
    username: 'Linh Nguyen',
    bio: 'Certified strength coach with 6 years of experience helping busy professionals build muscle and confidence.',
    specializations: ['muscle_building', 'strength', 'nutrition'],
    experienceYears: 6,
    hourlyRate: 350000,
    rating: 4.9,
    numReviews: 48,
    location: {city: 'Ha Noi', district: 'Cau Giay'},
  },
  {
    username: 'Minh Tran',
    bio: 'Former athlete focused on fat loss and conditioning. Sessions are intense, fun and measurable.',
    specializations: ['weight_loss', 'cardio', 'functional_training'],
    experienceYears: 4,
    hourlyRate: 250000,
    rating: 4.7,
    numReviews: 31,
    location: {city: 'Ha Noi', district: 'Dong Da'},
  },
  {
    username: 'An Pham',
    bio: 'Yoga and pilates instructor. I help clients improve mobility, posture and reduce stress.',
    specializations: ['yoga', 'pilates', 'rehabilitation'],
    experienceYears: 8,
    hourlyRate: 300000,
    rating: 4.8,
    numReviews: 62,
    location: {city: 'Ho Chi Minh', district: 'District 1'},
  },
  {
    username: 'Huy Le',
    bio: 'Beginner-friendly personal trainer. Let us build healthy habits together, one session at a time.',
    specializations: ['general', 'weight_loss'],
    experienceYears: 2,
    hourlyRate: 180000,
    rating: 4.5,
    numReviews: 12,
    location: {city: 'Ho Chi Minh', district: 'Binh Thanh'},
  },
];

// A slot at `hour`:00 Vietnam time, `dayOffset` days from today.
const slotAt = (dayOffset, hour) => {
  const start = dayjs().tz(APP_TIMEZONE).add(dayOffset, 'day').hour(hour).minute(0).second(0).millisecond(0);
  return {startTime: start.toDate(), endTime: start.add(1, 'hour').toDate()};
};

const seed = async () => {
  if (isProduction) {
    throw new Error('Refusing to seed a production database.');
  }
  await connectDB();
  await Promise.all(
    [User, PTProfile, Availability, Booking, Notification, ChatRoom, Message].map(m =>
      m.deleteMany({}),
    ),
  );

  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const client = await User.create({
    username: 'Demo Client',
    email: 'client@demo.com',
    password,
    phoneNumber: '0900000001',
    dob: new Date('1998-04-12'),
    role: 'client',
  });

  const pts = [];
  for (const [i, t] of trainers.entries()) {
    const user = await User.create({
      username: t.username,
      email: i === 0 ? 'pt@demo.com' : `pt${i + 1}@demo.com`,
      password,
      phoneNumber: `09000001${i}0`,
      dob: new Date('1992-01-01'),
      role: 'pt',
    });
    const {username, ...profile} = t;
    await PTProfile.create({user: user._id, ...profile});
    pts.push(user);

    // Open slots for the next week.
    const slots = [];
    for (let day = 1; day <= 7; day++) {
      for (const hour of [7, 9, 17, 19]) {
        slots.push({pt: user._id, ...slotAt(day, hour)});
      }
    }
    await Availability.insertMany(slots);
  }

  // Bookings for the demo client with the first trainer, in several states.
  const mainPt = pts[0];
  const makeBooking = async (dayOffset, hour, status) => {
    const times = slotAt(dayOffset, hour);
    const slot = await Availability.findOneAndUpdate(
      {pt: mainPt._id, startTime: times.startTime},
      {status: 'booked', ...times, pt: mainPt._id},
      {upsert: true, new: true},
    );
    return Booking.create({
      client: client._id,
      pt: mainPt._id,
      availabilitySlot: slot._id,
      bookingTime: times,
      status,
      priceAtBooking: trainers[0].hourlyRate,
      notesFromClient: 'Focus on upper body please',
    });
  };
  const pending = await makeBooking(2, 17, 'pending_confirmation');
  const confirmed = await makeBooking(3, 9, 'confirmed');
  await makeBooking(-3, 17, 'completed');
  await makeBooking(-7, 9, 'completed');

  await Notification.insertMany([
    {recipient: mainPt._id, sender: client._id, type: 'new_booking_request', message: `New booking request from ${client.username}`, relatedBooking: pending._id},
    {recipient: client._id, sender: mainPt._id, type: 'booking_confirmed', message: `Your booking has been confirmed by ${mainPt.username}`, relatedBooking: confirmed._id},
  ]);

  const room = await ChatRoom.create({ptUser: mainPt._id, clientUser: client._id});
  const conversation = [
    [client, 'Hi! Is the Thursday morning session still available?'],
    [mainPt, 'Yes it is. I have confirmed it for you 💪'],
    [client, 'Great, should I bring anything?'],
    [mainPt, 'Just water, a towel and good shoes. See you then!'],
  ];
  const base = Date.now() - conversation.length * 60000;
  const messages = await Message.insertMany(
    conversation.map(([sender, content], i) => ({
      chatRoom: room._id,
      sender: sender._id,
      content,
      createdAt: new Date(base + i * 60000),
    })),
  );
  const last = messages[messages.length - 1];
  room.lastMessage = {content: last.content, sender: last.sender, timestamp: last.createdAt};
  await room.save();

  console.log('Seed complete. Demo accounts (password: %s):', DEMO_PASSWORD);
  console.log('  client@demo.com  (client)');
  console.log('  pt@demo.com      (personal trainer)');
};

seed()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
