const rateLimit = require('express-rate-limit');
const {isTest} = require('../configs/env');

const createLimiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    message: {success: false, message},
  });

// Generous limit for the whole API to absorb abuse/scraping.
const apiLimiter = createLimiter(15, 500, 'Too many requests, please try again later.');

// Brute-force protection for credential checks.
const loginLimiter = createLimiter(
  15,
  10,
  'Too many login attempts, please try again in 15 minutes.',
);

// Endpoints that send email: protects users' inboxes and our SMTP quota.
const emailLimiter = createLimiter(
  15,
  5,
  'Too many email requests, please try again in 15 minutes.',
);

module.exports = {apiLimiter, loginLimiter, emailLimiter};
