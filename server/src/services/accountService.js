const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');
const Notification = require('../models/NotificationModel');
const Review = require('../models/ReviewModel');
const {PROFILE_DIR} = require('../middleware/uploadMiddleware');
const {ACTIVE_BOOKING_STATUSES} = require('./bookingService');
const {revokeUserSessions} = require('./sessionService');
const {badRequest, conflict} = require('../utils/httpError');

// Removes a previously uploaded profile photo from disk. Only files inside
// the profile upload folder are ever touched.
const removeLocalPhoto = async photoUrl => {
  if (!photoUrl) {
    return;
  }
  const filename = path.basename(photoUrl.split('?')[0]);
  if (!filename.startsWith('profile-')) {
    return;
  }
  await fs.unlink(path.join(PROFILE_DIR, filename)).catch(() => {});
};

const deleteAccount = async ({userId, password, confirmDelete}) => {
  if (typeof password !== 'string' || !password) {
    throw badRequest('Password is required to delete account');
  }
  if (confirmDelete !== 'DELETE') {
    throw badRequest('Please type "DELETE" to confirm account deletion');
  }

  const user = await User.findById(userId).select('+password');
  if (!(await bcrypt.compare(password, user.password))) {
    throw badRequest('Incorrect password');
  }

  // Deactivate first: an inactive user's token is rejected and a PT can no
  // longer be booked, so no new booking can appear between the check below
  // and the deletion.
  const locked = await User.findOneAndUpdate({_id: userId, isActive: true}, {isActive: false});
  if (!locked) {
    throw conflict('This account is already being deleted.');
  }

  try {
    const activeBookings = await Booking.countDocuments({
      $or: [{client: userId}, {pt: userId}],
      status: {$in: ACTIVE_BOOKING_STATUSES},
    });
    if (activeBookings > 0) {
      throw badRequest(
        `Cannot delete account. You have ${activeBookings} active booking(s). Please cancel or complete them first.`,
      );
    }

    await Promise.all([
      PTProfile.deleteOne({user: userId}),
      Availability.deleteMany({pt: userId}),
      Notification.deleteMany({recipient: userId}),
      // Reviews about a deleted PT have nothing left to describe.
      Review.deleteMany({pt: userId}),
      Booking.updateMany({client: userId}, {$set: {clientDeleted: true}}),
      Booking.updateMany({pt: userId}, {$set: {ptDeleted: true}}),
      removeLocalPhoto(user.photoUrl),
    ]);
    await User.deleteOne({_id: userId});
  } catch (error) {
    // Nothing (or only some of it) was deleted: let the user sign in and retry.
    await User.updateOne({_id: userId}, {isActive: true});
    throw error;
  }
  await revokeUserSessions(userId);
};

module.exports = {deleteAccount, removeLocalPhoto};
