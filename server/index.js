const mongoose = require('mongoose');
const {PORT} = require('./src/configs/env');
const connectDB = require('./src/configs/connectDB');
const app = require('./src/app');

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const shutdown = signal => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
