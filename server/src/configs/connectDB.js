const mongoose = require('mongoose');
const {MONGODB_URI} = require('./env');

const connectDB = async (uri = MONGODB_URI) => {
  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
  console.log('Connected to MongoDB:', connection.connection.name);
  return connection;
};

module.exports = connectDB;
