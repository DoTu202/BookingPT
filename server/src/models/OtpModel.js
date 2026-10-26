const mongoose = require('mongoose');

// One-time codes for email verification and password reset. Only a hash of
// the code is stored; MongoDB's TTL index deletes expired documents.
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'reset_password'],
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {timestamps: true},
);

otpSchema.index({email: 1, purpose: 1}, {unique: true});
otpSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

module.exports = mongoose.model('Otp', otpSchema);
