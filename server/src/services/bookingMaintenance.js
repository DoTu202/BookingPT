const logger = require('../configs/logger');
const {
  expireStaleBookings,
  sendBookingReminders,
  autoCompleteBookings,
} = require('./bookingService');

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

const JOBS = [
  ['expire stale requests', expireStaleBookings],
  ['send reminders', sendBookingReminders],
  ['auto-complete sessions', autoCompleteBookings],
];

// Runs every job once; one failing job does not stop the others.
const runMaintenance = async (now = new Date()) => {
  for (const [name, job] of JOBS) {
    try {
      await job(now);
    } catch (error) {
      logger.error({err: error, job: name}, 'Booking maintenance job failed');
    }
  }
};

// Runs the jobs periodically (not in tests: call the jobs directly there).
// The timer is unref'd so it never keeps the process alive on shutdown. Every
// job is safe to run concurrently on several API instances.
const startBookingMaintenance = (intervalMs = DEFAULT_INTERVAL_MS) => {
  let running = false;
  const run = async () => {
    // Skip a tick rather than overlap with a slow previous run.
    if (running) {
      return;
    }
    running = true;
    await runMaintenance();
    running = false;
  };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
};

module.exports = {startBookingMaintenance};
