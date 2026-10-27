const mongoose = require('mongoose');

// One review per completed booking, written by its client.
const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {validator: Number.isInteger, message: 'Rating must be a whole number'},
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {timestamps: true},
);

reviewSchema.index({pt: 1, createdAt: -1});

module.exports = mongoose.model('Review', reviewSchema);
