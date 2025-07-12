const mongoose = require('mongoose');

const ptProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  specializations: {
    type: [String],
    default: [],
    enum: ['weight_loss', 'muscle_building', 'cardio', 'yoga', 'strength', 'general', 'functional_training', 'rehabilitation', 'nutrition', 'pilates']
  },
  experienceYears: {
    type: Number,
    default: 0,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 10000, 
    max: 1000000 
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  },

  location: {
    city: String,
    district: String
  },
  isAcceptingClients: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PTProfile', ptProfileSchema);