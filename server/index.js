const mongoose = require('mongoose');
const {PORT} = require('./src/configs/env');
const connectDB = require('./src/configs/connectDB');
const app = require('./src/app');
const logger = require('./src/configs/logger');
const {startBookingMaintenance} = require('./src/services/bookingMaintenance');
const {initRealtime, closeRealtime} = require('./src/services/realtimeService');

process.on('unhandledRejection', reason => {
  logger.error({err: reason}, 'Unhandled promise rejection');
});
process.on('uncaughtException', error => {
  // State is unknown after an uncaught exception: log and let the process
  // manager (Docker, PM2...) restart the app.
  logger.fatal({err: error}, 'Uncaught exception');
  process.exit(1);
});

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    logger.fatal({err: error}, 'MongoDB connection error');
    process.exit(1);
  }

  const stopMaintenance = startBookingMaintenance();

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
  });
  initRealtime(server);

  const shutdown = signal => {
    logger.info(`${signal} received, shutting down gracefully...`);
    stopMaintenance();
    // Closes the sockets first (they would keep the server open), then the
    // HTTP server itself.
    closeRealtime(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
