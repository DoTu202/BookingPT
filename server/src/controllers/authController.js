const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const {issueOtp, verifyOtp} = require('../services/otpService');
const {sendOtpMail} = require('../services/mailService');
const {buildAuthResponse} = require('../services/tokenService');
const {badRequest, unauthorized} = require('../utils/httpError');
const {disconnectUser} = require('../services/realtimeService');
const {removeUserDeviceTokens} = require('../services/pushService');
const {
  BCRYPT_ROUNDS,
  str,
  normalizeEmail,
  rawString,
  assertEmail,
  assertPassword,
  assertPhone,
  parseDob,
} = require('../utils/validators');

// Step 1 of sign up: email a one-time code. The code is never returned in the
// response; the client must send it back to /register.
const verification = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  assertEmail(email);

  if (await User.exists({email})) {
    throw badRequest('User already exists');
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
  const password = rawString(req.body.password);
  const phoneNumber = str(req.body.phoneNumber);
  const code = str(req.body.code);
  const role = str(req.body.role) || 'client';

  if (!username || !email || !password || !phoneNumber || !code) {
    throw badRequest('All fields are required');
  }
  assertEmail(email);
  assertPassword(password);
  const dob = parseDob(req.body.dob);
  assertPhone(phoneNumber);
  // Only these two roles may self-register.
  if (!['client', 'pt'].includes(role)) {
    throw badRequest('Role is not valid');
  }

  if (await User.exists({email})) {
    throw badRequest('User already exists');
  }

  await verifyOtp(email, 'register', code);

  const newUser = await User.create({
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
  const password = rawString(req.body.password);

  if (!email || !password) {
    throw badRequest('All fields are required');
  }

  const user = await User.findOne({email}).select('+password');
  const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message for unknown email and wrong password (no user enumeration).
  if (!user || !isMatch || !user.isActive) {
    throw unauthorized('Invalid email or password');
  }

  await User.updateOne({_id: user._id}, {lastLoginAt: new Date()});

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: buildAuthResponse(user),
  });
});

// Step 1 of password reset: email a code. Always answers the same way so it
// cannot be used to discover which emails have an account.
const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  assertEmail(email);

  const user = await User.findOne({email});
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
      req.log.error({err: error}, 'Failed to send reset code');
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
  const newPassword = rawString(req.body.newPassword);

  if (!email || !code || !newPassword) {
    throw badRequest('Email, code and new password are required');
  }
  assertPassword(newPassword);

  await verifyOtp(email, 'reset_password', code);

  const user = await User.findOne({email});
  if (!user) {
    throw badRequest('Code is invalid or has expired. Please request a new one.');
  }

  // Also invalidates every token issued before now (see authMiddleware).
  await User.updateOne(
    {_id: user._id},
    {
      password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      passwordChangedAt: new Date(),
    },
  );
  disconnectUser(user._id);
  await removeUserDeviceTokens(user._id);

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
};
