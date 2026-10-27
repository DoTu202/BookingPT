const {badRequest} = require('./httpError');

// Shared with the app: MIN_PASSWORD_LENGTH must match clients/src/utils/validate.js.
const MIN_PASSWORD_LENGTH = 8;
// bcrypt only uses the first 72 bytes of the input.
const MAX_PASSWORD_LENGTH = 72;
const BCRYPT_ROUNDS = 12;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\d{9,12}$/;

// Every field read from req.body must be a string: this rejects objects such
// as {"$ne": null} and arrays before they reach a query.
const str = value => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = value => str(value).toLowerCase();
// Passwords are never trimmed.
const rawString = value => (typeof value === 'string' ? value : '');

const isValidEmail = email => EMAIL_REGEX.test(email) && email.length <= 254;

const assertEmail = email => {
  if (!isValidEmail(email)) {
    throw badRequest('Please provide a valid email address.');
  }
};

const assertPassword = (password, label = 'Password') => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw badRequest(
      `${label} must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters long.`,
    );
  }
};

const assertPhone = phoneNumber => {
  if (!PHONE_REGEX.test(phoneNumber)) {
    throw badRequest('Phone number is not valid');
  }
};

// Returns a Date in the past, or throws.
const parseDob = value => {
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime()) || date > new Date()) {
    throw badRequest('Date of birth is not valid');
  }
  return date;
};

// Optional free-text field with a length cap (e.g. a cancellation reason).
const optionalText = (value, {field, max}) => {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw badRequest(`${field} must be text.`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw badRequest(`${field} cannot be longer than ${max} characters.`);
  }
  return text;
};

module.exports = {
  BCRYPT_ROUNDS,
  str,
  normalizeEmail,
  rawString,
  isValidEmail,
  assertEmail,
  assertPassword,
  assertPhone,
  parseDob,
  optionalText,
};
