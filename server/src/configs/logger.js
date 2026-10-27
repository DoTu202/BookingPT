const pino = require('pino');
const {isProduction, isTest} = require('./env');

// JSON logs in production (for log aggregation), quiet in tests.
const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'newPassword',
      'currentPassword',
      'code',
    ],
    censor: '[redacted]',
  },
  ...(isProduction ? {} : {base: undefined}),
});

module.exports = logger;
