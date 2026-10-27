const crypto = require('crypto');
const Otp = require('../models/OtpModel');
const {badRequest, tooManyRequests} = require('../utils/httpError');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (email, code) =>
  crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');

// Creates (or replaces) the code for an email/purpose pair and returns it so
// the caller can email it. The code itself is never stored or returned to the
// API client.
const issueOtp = async (email, purpose, {userId} = {}) => {
  const existing = await Otp.findOne({email, purpose});
  if (existing && Date.now() - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
    throw tooManyRequests('Please wait a minute before requesting a new code.');
  }

  // crypto.randomInt is cryptographically secure, unlike Math.random.
  const code = String(crypto.randomInt(0, 10000)).padStart(4, '0');
  await Otp.findOneAndUpdate(
    {email, purpose},
    {
      codeHash: hashCode(email, code),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      userId,
    },
    {upsert: true, setDefaultsOnInsert: true},
  );
  return code;
};

// Consumes the code. Wrong guesses are counted so a 4-digit code cannot be
// brute forced: after MAX_ATTEMPTS the code is invalidated.
const verifyOtp = async (email, purpose, code, {userId} = {}) => {
  const otp = await Otp.findOne({email, purpose});
  if (
    !otp ||
    otp.expiresAt < new Date() ||
    (userId && otp.userId?.toString() !== userId.toString())
  ) {
    throw badRequest('Code is invalid or has expired. Please request a new one.');
  }

  const expected = Buffer.from(otp.codeHash, 'hex');
  const actual = Buffer.from(hashCode(email, String(code)), 'hex');
  if (!crypto.timingSafeEqual(expected, actual)) {
    otp.attempts += 1;
    if (otp.attempts >= MAX_ATTEMPTS) {
      await otp.deleteOne();
      throw badRequest('Too many wrong attempts. Please request a new code.');
    }
    await otp.save();
    throw badRequest('Code is not correct.');
  }

  await otp.deleteOne();
};

module.exports = {issueOtp, verifyOtp};
