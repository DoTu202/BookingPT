const fs = require('fs/promises');
const path = require('path');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');
const Notification = require('../models/NotificationModel');
const {PUBLIC_URL} = require('../configs/env');
const {PROFILE_DIR} = require('../middleware/uploadMiddleware');
const {BCRYPT_ROUNDS, MIN_PASSWORD_LENGTH} = require('./authController');
const {buildAuthResponse} = require('../services/tokenService');

const str = value => (typeof value === 'string' ? value.trim() : '');

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

const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'Profile retrieved successfully',
    data: req.user,
    success: true,
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const username = str(req.body.username);
  const email = str(req.body.email).toLowerCase();
  const phoneNumber = str(req.body.phoneNumber);
  const dob = str(req.body.dob);

  if (email && email !== req.user.email) {
    if (await User.exists({email, _id: {$ne: userId}})) {
      res.status(400);
      throw new Error('Email is already in use');
    }
  }
  if (username && username !== req.user.username) {
    if (await User.exists({username, _id: {$ne: userId}})) {
      res.status(400);
      throw new Error('Username is already in use');
    }
  }
  if (phoneNumber && !/^\d{9,12}$/.test(phoneNumber)) {
    res.status(400);
    throw new Error('Phone number is not valid');
  }

  // Whitelist: role, password, isActive... can never be changed here.
  const updateData = {updateAt: new Date()};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (dob) {
    const date = new Date(dob);
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      res.status(400);
      throw new Error('Date of birth is not valid');
    }
    updateData.dob = date;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: 'Profile updated successfully',
    data: updatedUser,
    success: true,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const {currentPassword, newPassword, confirmPassword} = req.body;

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    !currentPassword ||
    !newPassword
  ) {
    res.status(400);
    throw new Error('Current password, new password, and confirm password are required');
  }
  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirm password do not match');
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 72) {
    res.status(400);
    throw new Error(`New password must be ${MIN_PASSWORD_LENGTH}-72 characters long`);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Signs out every other device: tokens issued before this are rejected.
  // Back-dated by 1s because JWT iat has second precision.
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save({validateModifiedOnly: true});

  res.status(200).json({
    message: 'Password changed successfully',
    success: true,
    // Fresh token so the current device stays signed in.
    data: buildAuthResponse(user),
  });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Build an absolute URL the app can load. Previously this was hardcoded to
  // http://localhost:3001, which does not resolve on a phone.
  const baseUrl = PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const photoUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
  const previousPhotoUrl = req.user.photoUrl;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, {photoUrl}, {new: true});

  await removeLocalPhoto(previousPhotoUrl);

  res.status(200).json({
    message: 'Profile photo updated successfully',
    data: {
      photoUrl: updatedUser.photoUrl,
      user: updatedUser,
    },
    success: true,
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {password, confirmDelete} = req.body;

  if (typeof password !== 'string' || !password) {
    res.status(400);
    throw new Error('Password is required to delete account');
  }
  if (confirmDelete !== 'DELETE') {
    res.status(400);
    throw new Error('Please type "DELETE" to confirm account deletion');
  }

  const user = await User.findById(userId).select('+password');
  if (!(await bcrypt.compare(password, user.password))) {
    res.status(400);
    throw new Error('Incorrect password');
  }

  const activeBookings = await Booking.countDocuments({
    $or: [{client: userId}, {pt: userId}],
    status: {$in: ['pending_confirmation', 'confirmed']},
  });
  if (activeBookings > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete account. You have ${activeBookings} active booking(s). Please cancel or complete them first.`,
    );
  }

  await Promise.all([
    PTProfile.deleteOne({user: userId}),
    Availability.deleteMany({pt: userId}),
    Notification.deleteMany({recipient: userId}),
    Booking.updateMany({client: userId}, {$set: {clientDeleted: true}}),
    Booking.updateMany({pt: userId}, {$set: {ptDeleted: true}}),
    removeLocalPhoto(user.photoUrl),
  ]);
  await User.deleteOne({_id: userId});

  res.status(200).json({
    message: 'Account deleted successfully',
    success: true,
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
};
