// Populates the database with demo data so the app can be explored right
// away. Usage: npm run seed   (uses MONGODB_URI from .env)
//
// WARNING: deletes all existing data in the target database.
// `npm run seed -- --append` keeps existing data and only replaces the demo
// accounts (`@demo.com`) and everything linked to them.
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
const Review = require('../src/models/ReviewModel');
const {refreshPtRating} = require('../src/services/reviewService');
const {dayjs, APP_TIMEZONE} = require('../src/utils/helpers');
const {BCRYPT_ROUNDS} = require('../src/utils/validators');

const DEMO_PASSWORD = 'Password123!';
const APPEND = process.argv.includes('--append');

const trainers = [
  {
    username: 'Linh Nguyen',
    bio: 'Certified strength coach with 6 years of experience helping busy professionals build muscle and confidence.',
    specializations: ['muscle_building', 'strength', 'nutrition'],
    experienceYears: 6,
    hourlyRate: 350000,
    location: {city: 'Ha Noi', district: 'Cau Giay'},
  },
  {
    username: 'Minh Tran',
    bio: 'Former athlete focused on fat loss and conditioning. Sessions are intense, fun and measurable.',
    specializations: ['weight_loss', 'cardio', 'functional_training'],
    experienceYears: 4,
    hourlyRate: 250000,
    location: {city: 'Ha Noi', district: 'Dong Da'},
  },
  {
    username: 'An Pham',
    bio: 'Yoga and pilates instructor. I help clients improve mobility, posture and reduce stress.',
    specializations: ['yoga', 'pilates', 'rehabilitation'],
    experienceYears: 8,
    hourlyRate: 300000,
    location: {city: 'Ho Chi Minh', district: 'District 1'},
  },
  {
    username: 'Huy Le',
    bio: 'Beginner-friendly personal trainer. Let us build healthy habits together, one session at a time.',
    specializations: ['general', 'weight_loss'],
    experienceYears: 2,
    hourlyRate: 180000,
    location: {city: 'Ho Chi Minh', district: 'Binh Thanh'},
  },
];

// A slot at `hour`:00 Vietnam time, `dayOffset` days from today.
const slotAt = (dayOffset, hour) => {
  const start = dayjs().tz(APP_TIMEZONE).add(dayOffset, 'day').hour(hour).minute(0).second(0).millisecond(0);
  return {startTime: start.toDate(), endTime: start.add(1, 'hour').toDate()};
};

const removeDemoData = async () => {
  const ids = (await User.find({email: /@demo\.com$/}).select('_id')).map(u => u._id);
  const rooms = await ChatRoom.find({$or: [{ptUser: {$in: ids}}, {clientUser: {$in: ids}}]}).select('_id');
  // Trainers outside the demo set reviewed by demo clients get their rating recomputed below.
  const reviewedPts = await Review.distinct('pt', {client: {$in: ids}, pt: {$nin: ids}});
  await Promise.all([
    PTProfile.deleteMany({user: {$in: ids}}),
    Availability.deleteMany({pt: {$in: ids}}),
    Booking.deleteMany({$or: [{client: {$in: ids}}, {pt: {$in: ids}}]}),
    Notification.deleteMany({$or: [{recipient: {$in: ids}}, {sender: {$in: ids}}]}),
    Message.deleteMany({chatRoom: {$in: rooms.map(r => r._id)}}),
    ChatRoom.deleteMany({_id: {$in: rooms.map(r => r._id)}}),
    Review.deleteMany({$or: [{client: {$in: ids}}, {pt: {$in: ids}}]}),
  ]);
  await User.deleteMany({_id: {$in: ids}});
  await Promise.all(reviewedPts.map(refreshPtRating));
};

const seed = async () => {
  if (isProduction) {
    throw new Error('Refusing to seed a production database.');
  }
  await connectDB();
  if (APPEND) {
    await removeDemoData();
  } else {
    await Promise.all(
      [User, PTProfile, Availability, Booking, Notification, ChatRoom, Message, Review].map(m =>
        m.deleteMany({}),
      ),
    );
  }

  const password = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
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
    const {username: _username, ...profile} = t;
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
  const makeBooking = async (dayOffset, hour, status, extra = {}) => {
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
      ...extra,
    });
  };
  const pending = await makeBooking(2, 17, 'pending_confirmation');
  const confirmed = await makeBooking(3, 9, 'confirmed');
  await makeBooking(-3, 17, 'completed');
  await makeBooking(-7, 9, 'completed');
  const cancelledByPt = await makeBooking(4, 19, 'cancelled_by_pt', {
    cancellationReason: 'I have a competition that day, sorry! Please pick another slot.',
    cancelledAt: new Date(),
  });
  // A PT cancellation blocks the slot instead of re-opening it.
  await Availability.updateOne({_id: cancelledByPt.availabilitySlot}, {status: 'unavailable_by_pt'});

  await Notification.insertMany([
    {recipient: mainPt._id, sender: client._id, type: 'new_booking_request', message: `New booking request from ${client.username}`, relatedBooking: pending._id},
    {recipient: client._id, sender: mainPt._id, type: 'booking_confirmed', message: `Your booking has been confirmed by ${mainPt.username}`, relatedBooking: confirmed._id},
    {recipient: client._id, sender: mainPt._id, type: 'booking_cancelled_by_pt', message: `${mainPt.username} cancelled your session. Reason: ${cancelledByPt.cancellationReason}`, relatedBooking: cancelledByPt._id},
  ]);

  // Past sessions with reviews from a few other clients, so every trainer has
  // a real rating (computed from reviews, never hardcoded).
  const reviewers = await User.insertMany(
    ['Lan Vo', 'Quang Do', 'Mai Bui'].map((username, i) => ({
      username,
      email: `reviewer${i + 1}@demo.com`,
      password,
      phoneNumber: `09000002${i}0`,
      dob: new Date('1995-06-01'),
      role: 'client',
    })),
  );
  const comments = [
    [5, 'Very knowledgeable and motivating. Saw results in a month!'],
    [5, 'Sessions are well planned and fun.'],
    [4, 'Great trainer, sometimes runs a few minutes late.'],
  ];
  for (const [i, pt] of pts.entries()) {
    for (const [j, reviewer] of reviewers.slice(0, 3 - (i % 2)).entries()) {
      const times = slotAt(-10 - j * 3, 7 + i);
      const slot = await Availability.create({pt: pt._id, status: 'booked', ...times});
      const booking = await Booking.create({
        client: reviewer._id,
        pt: pt._id,
        availabilitySlot: slot._id,
        bookingTime: times,
        status: 'completed',
        priceAtBooking: trainers[i].hourlyRate,
      });
      const [rating, comment] = comments[(i + j) % comments.length];
      await Review.create({booking: booking._id, client: reviewer._id, pt: pt._id, rating, comment});
    }
    await refreshPtRating(pt._id);
  }

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
