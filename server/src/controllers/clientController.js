const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel'); 
const Availability = require('../models/AvailabilityModel');
const { createNotification } = require('./notificationController');
const Booking = require('../models/bookingModel');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const searchPTs = asyncHandler(async (req, res) => {
  const {
    specialization,
    name,
    location,
    availableDate,
    minRate,
    maxRate,
    sortBy,
    order = 'asc',
  } = req.query;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.pageNumber) || 1;

  // Validate sortBy and order
  const profileQueryConditions = {};

  if (specialization) {
    profileQueryConditions.specializations = {
      $regex: specialization,
      $options: 'i',
    };
  }
  if (location) {
    profileQueryConditions.location = {$regex: location, $options: 'i'};
  }
  if (minRate) {
    profileQueryConditions.hourlyRate = {
      ...profileQueryConditions.hourlyRate,
      $gte: parseFloat(minRate),
    };
  }
  if (maxRate) {
    profileQueryConditions.hourlyRate = {
      ...profileQueryConditions.hourlyRate,
      $lte: parseFloat(maxRate),
    };
  }

  // Filter PTs by name if provided
  const userQueryConditions = {role: 'pt'};
  if (name) {
    userQueryConditions.username = {$regex: name, $options: 'i'};
  }

  let ptUserIds = (await User.find(userQueryConditions).select('_id')).map(
    user => user._id,
  );

  if (name && ptUserIds.length === 0) {
    return res
      .status(200)
      .json({
        data: [],
        page,
        pages: 0,
        count: 0,
        message: 'Can not find any PTs matching the name filter.',
      });
  }

  if (ptUserIds.length > 0) {
    profileQueryConditions.user = {$in: ptUserIds};
  }

  if (availableDate) {
    // Convert date from Vietnam timezone to UTC for database query
    const startOfDay = dayjs.tz(availableDate, 'Asia/Ho_Chi_Minh').startOf('day').utc().toDate();
    const endOfDay = dayjs.tz(availableDate, 'Asia/Ho_Chi_Minh').endOf('day').utc().toDate();

    const ptIdsCurrentlyInQuery = profileQueryConditions.user
      ? profileQueryConditions.user.$in
      : null;

    const availabilityQuery = {
      status: 'available',
      startTime: {$lte: endOfDay},
      endTime: {$gte: startOfDay},
    };
    if (ptIdsCurrentlyInQuery && ptIdsCurrentlyInQuery.length > 0) {
      availabilityQuery.pt = {$in: ptIdsCurrentlyInQuery};
    }

    // Find PTs with available slots on the selected date
    const availablePTsFromSlots = await Availability.find(
      availabilityQuery,
    ).distinct('pt');

    if (availablePTsFromSlots.length === 0) {
      return res
        .status(200)
        .json({
          data: [],
          page,
          pages: 0,
          count: 0,
          message: 'Do not find any PTs available on the selected date.',
        });
    }
    profileQueryConditions.user = {$in: availablePTsFromSlots};
  }

  const count = await PTProfile.countDocuments(profileQueryConditions);
  if (count === 0) {
    return res
      .status(200)
      .json({
        data: [],
        page,
        pages: 0,
        count: 0,
        message: 'Can not find any PTs matching the criteria.',
      });
  }

  let sortOptions = {averageRating: -1}; 
  if (sortBy === 'hourlyRate') {
    sortOptions = {hourlyRate: order === 'desc' ? -1 : 1};
  } else if (sortBy === 'experienceYears') {
    sortOptions = {experienceYears: order === 'desc' ? -1 : 1};
  }

  const ptProfiles = await PTProfile.find(profileQueryConditions)
    .populate('user', 'username email photoUrl') 
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(sortOptions);

  res.status(200).json({
    message: 'Successfully get PT profiles.',
    data: ptProfiles,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});


// View PT Profile details
const viewPTProfile = asyncHandler(async (req, res) => {
  const {ptId} = req.params;

  const ptUser = await User.findOne({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Can not find this Personal Trainer.');
  }

  const profile = await PTProfile.findOne({user: ptId}).populate(
    'user',
    'username email photoUrl phoneNumber dob role imageGallery', 
  ); 

  if (!profile) {
    return res.status(200).json({
      user: {
        _id: ptUser._id,
        username: ptUser.username,
        email: ptUser.email,
        photoUrl: ptUser.photoUrl,
        role: ptUser.role,
      },
      message: 'PT has not created a detailed profile yet.',
    });
  }
  res.status(200).json(profile);
});


//Client get PT Profile details and availability
const getPTAvailabilityForClient = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  const {startDate, endDate} = req.query;

  const ptUser = await User.findOne({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Personal Trainer not found.');
  }

  const queryOptions = {
    pt: ptId,
    status: 'available',
  };

  if (startDate) {
    // Convert date from Vietnam timezone to UTC for database query
    const startOfDay = dayjs.tz(startDate, 'Asia/Ho_Chi_Minh').startOf('day').utc().toDate();
    queryOptions.startTime = {$gte: startOfDay};
  }
  
  if (endDate) {
    // Convert date from Vietnam timezone to UTC for database query
    const endOfDay = dayjs.tz(endDate, 'Asia/Ho_Chi_Minh').endOf('day').utc().toDate();
    if (queryOptions.startTime) {
      queryOptions.startTime = {...queryOptions.startTime, $lte: endOfDay};
    } else {
      queryOptions.startTime = {$lte: endOfDay};
    }
  }

  const slots = await Availability.find(queryOptions).sort({startTime: 'asc'});

  // Return raw slots data - frontend will handle timezone conversion for display
  res.status(200).json({
    message: 'PT availability retrieved successfully.',
    count: slots.length,
    data: slots,
  });
});


//Create booking request 
const createBookingRequest = asyncHandler(async (req, res) => {
  const {ptId, availabilitySlotId, notesFromClient} = req.body;
  const clientId = req.user._id;

  if (!ptId || !availabilitySlotId) {
    res.status(400);
    throw new Error('Please provide PT ID and availability slot ID.');
  }

  const ptUser = await User.findById(ptId);
  if (!ptUser || ptUser.role !== 'pt') {
    res.status(404);
    throw new Error('Personal Trainer not found.');
  }

  const ptProfile = await PTProfile.findOne({user: ptId});
  if (!ptProfile || typeof ptProfile.hourlyRate !== 'number') {
    res.status(400);
    throw new Error(
      'PT has not updated pricing information or profile is incomplete.',
    );
  }

  const slot = await Availability.findById(availabilitySlotId);
  if (!slot) {
    res.status(404);
    throw new Error('Selected time slot does not exist.');
  }
  if (slot.pt.toString() !== ptId) {
    res.status(400);
    throw new Error('Time slot does not belong to this PT.');
  }
  if (slot.status !== 'available') {
    res.status(400);
    throw new Error('Time slot is no longer available.');
  }
  if (dayjs(slot.startTime).isBefore(dayjs())) {
    res.status(400);
    throw new Error('Cannot book past time slots.');
  }


  const existingClientBooking = await Booking.findOne({
    client: clientId,
    status: {$in: ['pending_confirmation', 'confirmed']},
    'bookingTime.startTime': {$lt: slot.endTime},
    'bookingTime.endTime': {$gt: slot.startTime},
  });

  if (existingClientBooking) {
    res.status(400);
    throw new Error(
      'You already have another booking that conflicts with this time slot.',
    );
  }

  const newBooking = new Booking({
    client: clientId,
    pt: ptId,
    availabilitySlot: availabilitySlotId,
    bookingTime: {
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
    status: 'pending_confirmation',
    notesFromClient: notesFromClient || '',
    priceAtBooking: ptProfile.hourlyRate,
  });

  const createdBooking = await newBooking.save();
  

  try {
    await createNotification({
      recipient: ptId,
      sender: clientId,
      type: 'new_booking_request',
      message: `New booking request from ${req.user.username}`,
      relatedBooking: createdBooking._id
    });
  } catch (error) {
    console.error('Error sending booking notification:', error);
  }
  
  res.status(201).json({
    message: 'Your booking request has been sent successfully and is waiting for PT confirmation.',
    data: createdBooking,
  });
});



// Get client all bookings 
const getClientBookings = asyncHandler(async (req, res) => {
  const {status, upcoming} = req.query; 
  const pageSize = parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.pageNumber) || 1;

  const queryOptions = {client: req.user._id};

  if (status) {
    queryOptions.status = status;
  }
  if (upcoming === 'true') {
    queryOptions['bookingTime.startTime'] = {$gte: new Date()};
    if (!status) {
      queryOptions.status = {$in: ['pending_confirmation', 'confirmed']};
    }
  }
  
  if (upcoming === 'false') {
    queryOptions['bookingTime.startTime'] = {$lt: new Date()};
  }

  const count = await Booking.countDocuments(queryOptions);
  
  const bookings = await Booking.find(queryOptions)
    .populate('pt', 'username email photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({'bookingTime.startTime': upcoming === 'true' ? 'asc' : 'desc'});


  const enrichedBookings = await Promise.all(
    bookings.map(async (booking) => {
      if (booking.pt && booking.pt._id) {
        const ptProfile = await PTProfile.findOne({ user: booking.pt._id })
          .select('hourlyRate specializations location');
        
        return {
          ...booking.toObject(),
          pt: {
            ...booking.pt.toObject(),
            ptProfile: ptProfile || null
          }
        };
      }
      return booking.toObject();
    })
  );

  res.status(200).json({
    message: 'Get client bookings list successfully.',
    data: enrichedBookings,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});


// Client cancel booking
const cancelBookingByClient = asyncHandler(async (req, res) => {
  const {bookingId} = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (booking.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to cancel this booking.');
  }

  const now = new Date();
  const bookingStartTime = new Date(booking.bookingTime.startTime);
  const hoursBeforeAllowedToCancel = 24; // Example: PT can configure this

  if (
    booking.status === 'confirmed' &&
    bookingStartTime.getTime() - now.getTime() <
      hoursBeforeAllowedToCancel * 60 * 60 * 1000
  ) {
    res.status(400);
    throw new Error(
      `Cannot cancel this booking because it's too close to the appointment time (must cancel at least ${hoursBeforeAllowedToCancel} hours before).`,
    );
  }

  if (!['pending_confirmation', 'confirmed'].includes(booking.status)) {
    res.status(400);
    throw new Error(
      `Cannot cancel booking in "${booking.status}" status.`,
    );
  }

  const originalStatus = booking.status;
  booking.status = 'cancelled_by_client';

  if (
    originalStatus === 'pending_confirmation' ||
    originalStatus === 'confirmed'
  ) {
    const slot = await Availability.findById(booking.availabilitySlot);
    if (slot && slot.status === 'booked') {
      const otherBookingsForSlot = await Booking.findOne({
        availabilitySlot: slot._id,
        _id: {$ne: booking._id}, 
        status: {$in: ['pending_confirmation', 'confirmed']},
      });
      if (!otherBookingsForSlot) {
        slot.status = 'available';
        await slot.save();
      }
    }
  }
  const updatedBooking = await booking.save();
  res
    .status(200)
    .json({message: 'Booking cancelled successfully.', data: updatedBooking});
});


// Get client profile
const getClientProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Successfully retrieved client profile',
      data: user
    });
  } catch (error) {
    console.error('Error getting client profile:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update client profile
const updateClientProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phoneNumber, dob } = req.body;
    
    // Validate email uniqueness if changed
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already exists' 
        });
      }
    }
    
    // Validate username uniqueness if changed
    if (username) {
      const existingUser = await User.findOne({ 
        username: username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username already exists' 
        });
      }
    }
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dob) updateData.dob = new Date(dob);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await User.findByIdAndUpdate(userId, { 
      password: hashedNewPassword 
    });
    
    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Upload profile photo
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ 
        message: 'Photo URL is required' 
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photoUrl: photoUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile photo updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Delete account
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to delete account' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        message: 'Password is incorrect' 
      });
    }
    
    // Check for active bookings
    const activeBookings = await Booking.find({
      client: userId,
      status: { $in: ['pending_confirmation', 'confirmed'] }
    });
    
    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active bookings. Please cancel all bookings first.' 
      });
    }
    
    // Delete user account
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
  getClientProfile,
  updateClientProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
};
