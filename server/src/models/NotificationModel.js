const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderType: {
      type: String,
      enum: ['User', 'System'],
      default: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'new_booking_request',
        'booking_confirmed',
        'booking_rejected',
        'booking_cancelled_by_client',
        'booking_cancelled_by_pt',
        'booking_system_rejected',
        'booking_completed_pt',
        'booking_completed_client',
        'booking_reminder',
        'new_review_on_pt_profile',
        'general_update',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    relatedReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({recipient: 1, createdAt: -1});
notificationSchema.index({recipient: 1, isRead: 1, createdAt: -1});

module.exports = mongoose.model('Notification', notificationSchema);
