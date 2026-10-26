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
  createAt: {
    type: Date,
    // Pass the function, not Date.now(): calling it would freeze the value at
    // server start time for every document.
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
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
});

userSchema.pre('save', function (next) {
  this.updateAt = Date.now();
  next();
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const UserModal = mongoose.model('User', userSchema);
module.exports = UserModal;
