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
      enum: ['register', 'reset_password', 'change_email'],
      required: true,
    },
    // For change_email: the account the new address is being verified for,
    // so a code can only be used by the user who requested it.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
