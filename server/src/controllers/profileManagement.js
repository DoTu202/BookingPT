const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');

// Get user profile (basic info from User model)
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user basic info
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: user,
      success: true,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      message: 'Failed to get profile',
      success: false,
      error: error.message,
    });
  }
});

// Update basic user info (username, email, phone, etc.)
const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const {username, email, phoneNumber, dob} = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({email, _id: {$ne: userId}});
      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already in use',
          success: false,
        });
      }
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({username, _id: {$ne: userId}});
      if (existingUser) {
        return res.status(400).json({
          message: 'Username is already in use',
          success: false,
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
    if (dob) updateData.dob = new Date(dob);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser,
      success: true,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message:
          'Validation failed: ' +
          Object.values(error.errors)
            .map(e => e.message)
            .join(', '),
        success: false,
      });
    }

    res.status(500).json({
      message: 'Failed to update profile',
      success: false,
      error: error.message,
    });
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const {currentPassword, newPassword, confirmPassword} = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          'Current password, new password, and confirm password are required',
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirm password do not match',
        success: false,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
        success: false,
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect',
        success: false,
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, {password: hashedNewPassword});

    res.status(200).json({
      message: 'Password changed successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      message: 'Failed to change password',
      success: false,
      error: error.message,
    });
  }
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided',
        success: false,
      });
    }

    const serverUrl = 'http://localhost:3001';
    const photoUrl = `${serverUrl}/uploads/profiles/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {photoUrl},
      {new: true},
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Profile photo updated successfully',
      data: {
        photoUrl: updatedUser.photoUrl,
        user: updatedUser,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      message: 'Failed to upload profile photo',
      success: false,
      error: error.message,
    });
  }
});

// Delete account
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const {password, confirmDelete} = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({
        message: 'Password is required to delete account',
        success: false,
      });
    }

    if (confirmDelete !== 'DELETE') {
      return res.status(400).json({
        message: 'Please type "DELETE" to confirm account deletion',
        success: false,
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Incorrect password',
        success: false,
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.find({
      $or: [{client: userId}, {pt: userId}],
      status: {$in: ['pending_confirmation', 'confirmed']},
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        message: `Cannot delete account. You have ${activeBookings.length} active booking(s). Please cancel or complete them first.`,
        success: false,
      });
    }

    await Promise.all([
      PTProfile.findOneAndDelete({user: userId}),

      Availability.deleteMany({pt: userId}),

      Booking.updateMany({client: userId}, {$set: {clientDeleted: true}}),
      Booking.updateMany({pt: userId}, {$set: {ptDeleted: true}}),
    ]);

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Account deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      message: 'Failed to delete account',
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
};
