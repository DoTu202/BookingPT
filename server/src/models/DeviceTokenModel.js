const mongoose = require('mongoose');

// FCM registration token of one app install. A token belongs to the user
// last signed in on that device: registering it again moves it.
const deviceTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      maxlength: 4096,
    },
    platform: {
      type: String,
      enum: ['ios', 'android'],
      required: true,
    },
  },
  {timestamps: true},
);

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
