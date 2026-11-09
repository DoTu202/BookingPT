const crypto = require('crypto');
const Otp = require('../models/OtpModel');
const {badRequest, tooManyRequests} = require('../utils/httpError');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const LOCKED_MESSAGE = 'Too many wrong attempts. Please try again in 15 minutes.';

const hashCode = (email, code) =>
  crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');

// Creates (or replaces) the code for an email/purpose pair and returns it so
// the caller can email it. The code itself is never stored or returned to the
// API client.
const issueOtp = async (email, purpose, {userId} = {}) => {
  const now = Date.now();
  const existing = await Otp.findOne({email, purpose});
  if (existing?.lockedUntil && existing.lockedUntil.getTime() > now) {
    throw tooManyRequests(LOCKED_MESSAGE);
  }
  if (existing && now - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
    throw tooManyRequests('Please wait a minute before requesting a new code.');
  }
  // Wrong guesses are kept across re-sends until the previous code expires.
  // Otherwise asking for a fresh code every minute would give an attacker a
  // new set of guesses at a 4-digit code each time.
  const attempts = existing && existing.expiresAt.getTime() > now ? existing.attempts : 0;

  // crypto.randomInt is cryptographically secure, unlike Math.random.
  const code = String(crypto.randomInt(0, 10000)).padStart(4, '0');
  await Otp.findOneAndUpdate(
    {email, purpose},
    {
      codeHash: hashCode(email, code),
      attempts,
      expiresAt: new Date(now + OTP_TTL_MS),
      lockedUntil: null,
      userId,
    },
    {upsert: true, setDefaultsOnInsert: true},
  );
  return code;
};

// Consumes the code. Wrong guesses are counted so a 4-digit code cannot be
// brute forced: after MAX_ATTEMPTS the email/purpose is locked for LOCK_MS.
const verifyOtp = async (email, purpose, code, {userId} = {}) => {
  const otp = await Otp.findOne({email, purpose});
  if (otp?.lockedUntil && otp.lockedUntil > new Date()) {
    throw tooManyRequests(LOCKED_MESSAGE);
  }
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
      // Keep the record (it blocks re-sending) until the lock runs out.
      otp.lockedUntil = new Date(Date.now() + LOCK_MS);
      otp.expiresAt = otp.lockedUntil;
      await otp.save();
      throw tooManyRequests(LOCKED_MESSAGE);
    }
    await otp.save();
    throw badRequest('Code is not correct.');
  }

  await otp.deleteOne();
};

module.exports = {issueOtp, verifyOtp};
