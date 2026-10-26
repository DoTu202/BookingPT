const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const UserModal = require('../models/userModel');
const {issueOtp, verifyOtp} = require('../services/otpService');
const {sendOtpMail} = require('../services/mailService');
const {buildAuthResponse} = require('../services/tokenService');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Every field read from req.body must be a string: this rejects objects such
// as {"$ne": null} and arrays before they reach a query.
const str = value => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = value => str(value).toLowerCase();

const badRequest = (res, message) => {
  res.status(400);
  throw new Error(message);
};

const assertEmail = (res, email) => {
  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    badRequest(res, 'Please provide a valid email address.');
  }
};

const assertPassword = (res, password) => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    // bcrypt only uses the first 72 bytes of the input.
    badRequest(res, `Password must be ${MIN_PASSWORD_LENGTH}-72 characters long.`);
  }
};

// Step 1 of sign up: email a one-time code. The code is never returned in the
// response; the client must send it back to /register.
const verification = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  assertEmail(res, email);

  if (await UserModal.exists({email})) {
    badRequest(res, 'User already exists');
  }

  const code = await issueOtp(email, 'register');
  await sendOtpMail(email, code, 'register');

  res.status(200).json({
    success: true,
    message: 'Verification code sent successfully',
  });
});

// Step 2 of sign up: create the account if the emailed code is correct.
const register = asyncHandler(async (req, res) => {
  const username = str(req.body.username);
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const phoneNumber = str(req.body.phoneNumber);
  const code = str(req.body.code);
  const dob = new Date(str(req.body.dob));
  const role = str(req.body.role) || 'client';

  if (!username || !email || !password || !phoneNumber || !code) {
    badRequest(res, 'All fields are required');
  }
  assertEmail(res, email);
  assertPassword(res, password);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) {
    badRequest(res, 'Date of birth is not valid');
  }
  if (!/^\d{9,12}$/.test(phoneNumber)) {
    badRequest(res, 'Phone number is not valid');
  }
  // Only these two roles may self-register.
  if (!['client', 'pt'].includes(role)) {
    badRequest(res, 'Role is not valid');
  }

  if (await UserModal.exists({email})) {
    badRequest(res, 'User already exists');
  }

  await verifyOtp(email, 'register', code);

  const newUser = await UserModal.create({
    username,
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    dob,
    phoneNumber,
    role,
    photoUrl: '',
    lastLoginAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: buildAuthResponse(newUser),
  });
});

// Used to keep login timing similar whether or not the email exists, so
// response times do not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    badRequest(res, 'All fields are required');
  }

  const user = await UserModal.findOne({email}).select('+password');
  const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message for unknown email and wrong password (no user enumeration).
  if (!user || !isMatch || !user.isActive) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  await UserModal.updateOne({_id: user._id}, {lastLoginAt: new Date()});

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: buildAuthResponse(user),
  });
});

// Step 1 of password reset: email a code. Always answers the same way so it
// cannot be used to discover which emails have an account, and it no longer
// changes the password itself (previously anyone could reset anyone's
// password just by knowing their email).
const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  assertEmail(res, email);

  const user = await UserModal.findOne({email});
  if (user && user.isActive) {
    try {
      const code = await issueOtp(email, 'reset_password');
      await sendOtpMail(email, code, 'reset_password');
    } catch (error) {
      // Rate-limit errors from issueOtp are safe to surface; anything else is
      // logged but hidden to keep the response uniform.
      if (error.statusCode === 429) {
        throw error;
      }
      console.error('Failed to send reset code:', error);
    }
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, a reset code has been sent.',
  });
});

// Step 2 of password reset: set a new password with the emailed code.
const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = str(req.body.code);
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

  if (!email || !code || !newPassword) {
    badRequest(res, 'Email, code and new password are required');
  }
  assertPassword(res, newPassword);

  await verifyOtp(email, 'reset_password', code);

  const user = await UserModal.findOne({email});
  if (!user) {
    badRequest(res, 'Code is invalid or has expired. Please request a new one.');
  }

  // Also invalidates every token issued before now (see authMiddleware).
  await UserModal.updateOne(
    {_id: user._id},
    {
      password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      passwordChangedAt: new Date(),
    },
  );

  res.status(200).json({
    success: true,
    message: 'Password has been reset. Please sign in with your new password.',
  });
});

module.exports = {
  register,
  login,
  verification,
  forgotPassword,
  resetPassword,
  BCRYPT_ROUNDS,
  MIN_PASSWORD_LENGTH,
};
