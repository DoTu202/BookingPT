const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Availability = require('../models/AvailabilityModel');
const bookingService = require('../services/bookingService');
const {PUBLIC_PT_USER_FIELDS, searchPTs: searchPTsService} = require('../services/ptSearchService');
const {listClientBookings} = require('../services/bookingQueryService');
const {dayRange, assertValidId, parsePagination} = require('../utils/helpers');
const {badRequest, notFound} = require('../utils/httpError');

const searchPTs = asyncHandler(async (req, res) => {
  const {profiles, page, pages, count} = await searchPTsService(req.query, parsePagination(req.query));

  res.status(200).json({
    message: count === 0 ? 'No PT found.' : 'Successfully get PT profiles.',
    data: profiles,
    page,
    pages,
    count,
  });
});

const viewPTProfile = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  assertValidId(ptId, 'PT id');

  const ptUser = await User.findOne({_id: ptId, role: 'pt', isActive: true});
  if (!ptUser) {
    throw notFound('Can not find this Personal Trainer.');
  }

  const profile = await PTProfile.findOne({user: ptId}).populate(
    'user',
    PUBLIC_PT_USER_FIELDS,
  );

  if (!profile) {
    return res.status(200).json({
      user: {
        _id: ptUser._id,
        username: ptUser.username,
        photoUrl: ptUser.photoUrl,
        role: ptUser.role,
      },
      message: 'PT has not created a detailed profile yet.',
    });
  }
  res.status(200).json(profile);
});

const getPTAvailabilityForClient = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  const {startDate, endDate} = req.query;
  assertValidId(ptId, 'PT id');

  const ptUser = await User.exists({_id: ptId, role: 'pt', isActive: true});
  if (!ptUser) {
    throw notFound('Personal Trainer not found.');
  }

  // Past slots can never be booked, so never return them.
  const startTime = {$gte: new Date()};
  if (startDate) {
    const range = dayRange(startDate);
    if (range && range.start > startTime.$gte) {
      startTime.$gte = range.start;
    }
  }
  if (endDate) {
    const range = dayRange(endDate);
    if (range) {
      startTime.$lte = range.end;
    }
  }

  const slots = await Availability.find({pt: ptId, status: 'available', startTime})
    .sort({startTime: 'asc'})
    .limit(500);

  res.status(200).json({
    message: 'PT availability retrieved successfully.',
    count: slots.length,
    data: slots,
  });
});

const createBookingRequest = asyncHandler(async (req, res) => {
  const {ptId, availabilitySlotId} = req.body;
  const notesFromClient =
    typeof req.body.notesFromClient === 'string' ? req.body.notesFromClient.trim() : '';

  if (!ptId || !availabilitySlotId) {
    throw badRequest('Please provide PT ID and availability slot ID.');
  }
  assertValidId(ptId, 'PT id');
  assertValidId(availabilitySlotId, 'availability slot id');

  const createdBooking = await bookingService.createBooking({
    client: req.user,
    ptId,
    availabilitySlotId,
    notesFromClient,
    log: req.log,
  });

  res.status(201).json({
    success: true,
    message:
      'Your booking request has been sent successfully and is waiting for PT confirmation.',
    data: createdBooking,
  });
});

const getClientBookings = asyncHandler(async (req, res) => {
  const {bookings, page, pages, count} = await listClientBookings(
    req.user._id,
    req.query,
    parsePagination(req.query),
  );

  res.status(200).json({
    message: 'Get client bookings list successfully.',
    data: bookings,
    page,
    pages,
    count,
  });
});

const cancelBookingByClient = asyncHandler(async (req, res) => {
  const {bookingId} = req.params;
  assertValidId(bookingId, 'booking id');

  const updatedBooking = await bookingService.cancelByClient({
    client: req.user,
    bookingId,
    reason: req.body?.reason,
    log: req.log,
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    data: updatedBooking,
  });
});

module.exports = {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
};
