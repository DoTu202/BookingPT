const fs = require('fs/promises');
const path = require('path');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');
const Notification = require('../models/NotificationModel');
const Review = require('../models/ReviewModel');
const {PUBLIC_URL} = require('../configs/env');
const {PROFILE_DIR} = require('../middleware/uploadMiddleware');
const {buildAuthResponse} = require('../services/tokenService');
const {issueOtp, verifyOtp} = require('../services/otpService');
const {sendOtpMail} = require('../services/mailService');
const {verifyImageFile} = require('../utils/imageSignature');
const {ACTIVE_BOOKING_STATUSES} = require('../services/bookingService');
const {badRequest} = require('../utils/httpError');
const {disconnectUser} = require('../services/realtimeService');
const {
  registerDeviceToken,
  unregisterDeviceToken,
  removeUserDeviceTokens,
} = require('../services/pushService');
const {
  BCRYPT_ROUNDS,
  str,
  normalizeEmail,
  isValidEmail,
  assertPassword,
  assertPhone,
  parseDob,
} = require('../utils/validators');

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
  const email = normalizeEmail(req.body.email);
  const phoneNumber = str(req.body.phoneNumber);
  const dob = str(req.body.dob);

  // Changing the email needs proof of ownership of the new address, so it
  // goes through /email/request + /email/confirm instead.
  if (email && email !== req.user.email) {
    throw badRequest('To change your email, request a verification code for the new address.');
  }
  if (username && username !== req.user.username) {
    if (await User.exists({username, _id: {$ne: userId}})) {
      throw badRequest('Username is already in use');
    }
  }
  if (phoneNumber) {
    assertPhone(phoneNumber);
  }

  // Whitelist: role, password, isActive... can never be changed here.
  const updateData = {};
  if (username) updateData.username = username;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (dob) updateData.dob = parseDob(dob);

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
    throw badRequest('Current password, new password, and confirm password are required');
  }
  if (newPassword !== confirmPassword) {
    throw badRequest('New password and confirm password do not match');
  }
  assertPassword(newPassword, 'New password');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw badRequest('Current password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Signs out every other device: tokens issued before this are rejected.
  // Back-dated by 1s because JWT iat has second precision.
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save({validateModifiedOnly: true});
  // Open sockets were authorized with old tokens; the app reconnects with
  // the fresh one below. Push tokens too: the app registers again once it
  // has the new token.
  disconnectUser(user._id);
  await removeUserDeviceTokens(user._id);

  res.status(200).json({
    message: 'Password changed successfully',
    success: true,
    // Fresh token so the current device stays signed in.
    data: buildAuthResponse(user),
  });
});

const readNewEmail = req => {
  const newEmail = normalizeEmail(req.body.newEmail);
  if (!isValidEmail(newEmail)) {
    throw badRequest('Please provide a valid email address.');
  }
  if (newEmail === req.user.email) {
    throw badRequest('This is already your email address.');
  }
  return newEmail;
};

// Step 1 of an email change: send a code to the NEW address.
const requestEmailChange = asyncHandler(async (req, res) => {
  const newEmail = readNewEmail(req);
  if (await User.exists({email: newEmail})) {
    throw badRequest('Email is already in use');
  }

  const code = await issueOtp(newEmail, 'change_email', {userId: req.user._id});
  await sendOtpMail(newEmail, code, 'change_email');

  res.status(200).json({
    success: true,
    message: `A verification code has been sent to ${newEmail}.`,
  });
});

// Step 2: apply the change once the code from the new inbox is confirmed.
const confirmEmailChange = asyncHandler(async (req, res) => {
  const newEmail = readNewEmail(req);
  const code = str(req.body.code);
  if (!code) {
    throw badRequest('Verification code is required.');
  }

  await verifyOtp(newEmail, 'change_email', code, {userId: req.user._id});

  if (await User.exists({email: newEmail})) {
    throw badRequest('Email is already in use');
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {email: newEmail},
    {new: true},
  );

  res.status(200).json({
    success: true,
    message: 'Email updated successfully',
    data: updatedUser,
  });
});

// Revokes every token issued so far (all devices, including this one).
const logoutAllDevices = asyncHandler(async (req, res) => {
  await User.updateOne({_id: req.user._id}, {tokensValidAfter: new Date()});
  disconnectUser(req.user._id);
  await removeUserDeviceTokens(req.user._id);
  res.status(200).json({success: true, message: 'Signed out of all devices'});
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('No image file provided');
  }
  // The MIME type is supplied by the client; check the file's real content.
  if (!(await verifyImageFile(req.file.path, req.file.mimetype))) {
    await fs.unlink(req.file.path).catch(() => {});
    throw badRequest('The uploaded file is not a valid image');
  }

  // Absolute URL the app can load (localhost would not resolve on a phone).
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

const PUSH_PLATFORMS = ['ios', 'android'];

const validPushToken = token =>
  typeof token === 'string' && token.length > 0 && token.length <= 4096;

// Registers this device's FCM token for the signed-in user (called on every
// app start and whenever FCM rotates the token).
const registerPushToken = asyncHandler(async (req, res) => {
  const {token, platform} = req.body;
  if (!validPushToken(token) || !PUSH_PLATFORMS.includes(platform)) {
    throw badRequest('A valid push token and platform are required');
  }
  await registerDeviceToken(req.user._id, token, platform);
  res.status(200).json({success: true, message: 'Push token registered'});
});

// Called on sign-out so the device stops receiving this user's pushes.
const unregisterPushToken = asyncHandler(async (req, res) => {
  const {token} = req.body;
  if (!validPushToken(token)) {
    throw badRequest('A valid push token is required');
  }
  await unregisterDeviceToken(req.user._id, token);
  res.status(200).json({success: true, message: 'Push token removed'});
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {password, confirmDelete} = req.body;

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
    removeUserDeviceTokens(userId),
    // Reviews about a deleted PT have nothing left to describe.
    Review.deleteMany({pt: userId}),
    Booking.updateMany({client: userId}, {$set: {clientDeleted: true}}),
    Booking.updateMany({pt: userId}, {$set: {ptDeleted: true}}),
    removeLocalPhoto(user.photoUrl),
  ]);
  await User.deleteOne({_id: userId});
  disconnectUser(userId);

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
  requestEmailChange,
  confirmEmailChange,
  logoutAllDevices,
  registerPushToken,
  unregisterPushToken,
};
