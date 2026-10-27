const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    // Never returned by queries unless explicitly requested with +password.
    select: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  photoUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ['client', 'pt'],
    default: 'client',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
  // Tokens issued before this moment are rejected (logout on password change).
  passwordChangedAt: {
    type: Date,
  },
  // Set by "sign out of all devices": tokens issued before it are rejected.
  tokensValidAfter: {
    type: Date,
  },
}, {
  timestamps: true,
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
