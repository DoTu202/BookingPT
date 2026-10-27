const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const User = require('../src/models/userModel');
const PTProfile = require('../src/models/PTProfileModel');
const Availability = require('../src/models/AvailabilityModel');
const {signAccessToken} = require('../src/services/tokenService');

let mongo;

const startDb = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Build unique indexes before tests rely on them.
  await Promise.all(Object.values(mongoose.models).map(model => model.syncIndexes()));
};

const clearDb = async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map(collection => collection.deleteMany({})),
  );
};

const stopDb = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};

let counter = 0;
const createUser = async (role = 'client', overrides = {}) => {
  counter += 1;
  const user = await User.create({
    username: `${role}${counter}`,
    email: `${role}${counter}@example.com`,
    // bcrypt hash of "password123" is not needed for most tests.
    password: overrides.passwordHash || 'not-a-real-hash',
    phoneNumber: `09000000${String(counter).padStart(2, '0')}`,
    dob: new Date('1995-01-01'),
    role,
    ...overrides,
  });
  return {user, token: signAccessToken(user), auth: `Bearer ${signAccessToken(user)}`};
};

const createPtWithSlot = async ({hoursFromNow = 48} = {}) => {
  const pt = await createUser('pt');
  await PTProfile.create({user: pt.user._id, hourlyRate: 200000, specializations: ['yoga']});
  const start = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  const slot = await Availability.create({
    pt: pt.user._id,
    startTime: start,
    endTime: new Date(start.getTime() + 3600 * 1000),
  });
  return {pt, slot};
};

module.exports = {startDb, clearDb, stopDb, createUser, createPtWithSlot};
