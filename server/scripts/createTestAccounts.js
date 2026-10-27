// Creates (or resets) one client and one PT account for manual testing,
// using the credentials in .env. Unlike `npm run seed`, it never deletes
// anything: other users and data are left untouched, and running it again
// only resets these two accounts' passwords and tops up the PT's open slots.
//
// Usage: npm run test-accounts
//   TEST_CLIENT_EMAIL / TEST_CLIENT_PASSWORD
//   TEST_PT_EMAIL     / TEST_PT_PASSWORD
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../src/configs/connectDB');
const {isProduction} = require('../src/configs/env');
const User = require('../src/models/userModel');
const PTProfile = require('../src/models/PTProfileModel');
const Availability = require('../src/models/AvailabilityModel');
const {dayjs, APP_TIMEZONE} = require('../src/utils/helpers');
const {BCRYPT_ROUNDS, assertEmail, assertPassword} = require('../src/utils/validators');

const SLOT_DAYS = 7;
const SLOT_HOURS = [7, 9, 17, 19];

const ACCOUNTS = [
  {
    role: 'client',
    emailKey: 'TEST_CLIENT_EMAIL',
    passwordKey: 'TEST_CLIENT_PASSWORD',
    username: 'Test Client',
    phoneNumber: '0911000001',
    dob: new Date('1998-04-12'),
  },
  {
    role: 'pt',
    emailKey: 'TEST_PT_EMAIL',
    passwordKey: 'TEST_PT_PASSWORD',
    username: 'Test Trainer',
    phoneNumber: '0911000002',
    dob: new Date('1992-01-01'),
  },
];

const readCredentials = ({emailKey, passwordKey}) => {
  const email = (process.env[emailKey] || '').trim().toLowerCase();
  const password = process.env[passwordKey] || '';
  if (!email || !password) {
    throw new Error(`Set ${emailKey} and ${passwordKey} in server/.env first.`);
  }
  assertEmail(email);
  assertPassword(password);
  return {email, password};
};

const upsertUser = async account => {
  const {email, password} = readCredentials(account);
  return User.findOneAndUpdate(
    {email},
    {
      $set: {
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: account.role,
        isActive: true,
        // Revokes tokens issued with the previous password.
        passwordChangedAt: new Date(Date.now() - 1000),
      },
      $setOnInsert: {
        email,
        username: account.username,
        phoneNumber: account.phoneNumber,
        dob: account.dob,
        photoUrl: '',
      },
    },
    {upsert: true, new: true, runValidators: true},
  );
};

// Open slots for the coming week, skipping any time the PT already has.
const topUpSlots = async ptId => {
  const today = dayjs().tz(APP_TIMEZONE).startOf('day');
  const slots = [];
  for (let day = 1; day <= SLOT_DAYS; day++) {
    for (const hour of SLOT_HOURS) {
      const start = today.add(day, 'day').hour(hour);
      slots.push({startTime: start.toDate(), endTime: start.add(1, 'hour').toDate()});
    }
  }
  const existing = await Availability.find({
    pt: ptId,
    startTime: {$in: slots.map(slot => slot.startTime)},
  }).distinct('startTime');
  const taken = new Set(existing.map(date => date.getTime()));
  const fresh = slots.filter(slot => !taken.has(slot.startTime.getTime()));
  if (fresh.length > 0) {
    await Availability.insertMany(fresh.map(slot => ({pt: ptId, ...slot})));
  }
  return fresh.length;
};

const run = async () => {
  if (isProduction) {
    throw new Error('Refusing to create test accounts in production.');
  }
  // Validate everything before touching the database.
  ACCOUNTS.forEach(readCredentials);
  await connectDB();

  for (const account of ACCOUNTS) {
    const user = await upsertUser(account);
    let extra = '';
    if (account.role === 'pt') {
      await PTProfile.updateOne(
        {user: user._id},
        {
          $setOnInsert: {
            user: user._id,
            bio: 'Test trainer account for development.',
            specializations: ['general', 'strength'],
            experienceYears: 3,
            hourlyRate: 200000,
            location: {city: 'Ha Noi', district: 'Cau Giay'},
          },
        },
        {upsert: true},
      );
      extra = `, ${await topUpSlots(user._id)} new open slots`;
    }
    console.log(`  ${account.role.padEnd(6)} ${user.email}${extra}`);
  }
  console.log('Test accounts ready. Passwords are in server/.env.');
};

run()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
