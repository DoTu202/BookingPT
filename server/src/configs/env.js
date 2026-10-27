require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';
const isProduction = NODE_ENV === 'production';

const {JWT_SECRET} = process.env;

const required = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET,
};

if (!isTest) {
  const missing = Object.keys(required).filter(key => !required[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See server/.env.example.`,
    );
  }
  if (isProduction && JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
}

module.exports = {
  isTest,
  isProduction,
  PORT: Number(process.env.PORT) || 3001,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: JWT_SECRET || 'test-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  // Public base URL used to build links to uploaded files. When empty, the
  // URL is derived from the incoming request (fine for local development).
  PUBLIC_URL: (process.env.PUBLIC_URL || '').replace(/\/$/, ''),
  // Comma-separated list of allowed browser origins. Native apps do not send
  // an Origin header, so this only matters for web clients.
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  // Number of reverse proxies in front of the app (for correct client IPs in
  // rate limiting). 0 when the app is exposed directly.
  TRUST_PROXY: Number(process.env.TRUST_PROXY) || 0,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,
  // Firebase service account (JSON or a path to the JSON file) for push
  // notifications. Push is disabled when empty.
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || '',
};
