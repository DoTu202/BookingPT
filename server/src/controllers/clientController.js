const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Availability = require('../models/AvailabilityModel');
const {createNotification} = require('./notificationController');
const Booking = require('../models/bookingModel');
const {
  dayjs,
  dayRange,
  escapeRegex,
  assertValidId,
  parsePagination,
} = require('../utils/helpers');

const BOOKING_STATUSES = Booking.schema.path('status').enumValues;
const ACTIVE_BOOKING_STATUSES = ['pending_confirmation', 'confirmed'];
const CANCEL_NOTICE_HOURS = 24;

// Public PT fields. Email, phone number and date of birth are personal data
// and are not exposed to other users.
const PUBLIC_PT_USER_FIELDS = 'username photoUrl role';

const emptyPage = (res, page) =>
  res.status(200).json({message: 'No PT found.', data: [], page, pages: 0, count: 0});

const searchPTs = asyncHandler(async (req, res) => {
  const {specialization, name, location, availableDate, minRate, maxRate, sortBy} =
    req.query;
  const order = req.query.order === 'desc' ? -1 : 1;
  const {page, size, skip} = parsePagination(req.query);

  const profileQueryConditions = {isAcceptingClients: true};

  if (specialization) {
    profileQueryConditions.specializations = {
      $regex: escapeRegex(specialization),
      $options: 'i',
    };
  }
  if (location) {
    // location is a sub-document, so match against its string fields.
    const locationRegex = {$regex: escapeRegex(location), $options: 'i'};
    profileQueryConditions.$or = [
      {'location.city': locationRegex},
      {'location.district': locationRegex},
    ];
  }
  const min = parseFloat(minRate);
  const max = parseFloat(maxRate);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    profileQueryConditions.hourlyRate = {};
    if (!Number.isNaN(min)) {
      profileQueryConditions.hourlyRate.$gte = min;
    }
    if (!Number.isNaN(max)) {
      profileQueryConditions.hourlyRate.$lte = max;
    }
  }

  const userIdFilters = [];

  if (name) {
    const idsFromNameFilter = await User.find({
      role: 'pt',
      isActive: true,
      username: {$regex: escapeRegex(name), $options: 'i'},
    }).distinct('_id');

    if (idsFromNameFilter.length === 0) {
      return emptyPage(res, page);
    }
    userIdFilters.push(idsFromNameFilter);
  }

  if (availableDate) {
    const range = dayRange(availableDate);
    if (!range) {
      res.status(400);
      throw new Error('availableDate is not a valid date.');
    }

    const availablePTs = await Availability.find({
      status: 'available',
      startTime: {$lte: range.end, $gte: new Date()},
      endTime: {$gte: range.start},
    }).distinct('pt');

    if (availablePTs.length === 0) {
      return emptyPage(res, page);
    }
    userIdFilters.push(availablePTs);
  }

  if (userIdFilters.length > 0) {
    let finalUserIds = userIdFilters[0];
    for (let i = 1; i < userIdFilters.length; i++) {
      const currentSet = new Set(userIdFilters[i].map(id => id.toString()));
      finalUserIds = finalUserIds.filter(id => currentSet.has(id.toString()));
    }

    if (finalUserIds.length === 0) {
      return emptyPage(res, page);
    }
    profileQueryConditions.user = {$in: finalUserIds};
  }

  const count = await PTProfile.countDocuments(profileQueryConditions);
  if (count === 0) {
    return emptyPage(res, page);
  }

  let sortOptions = {rating: -1, numReviews: -1};
  if (sortBy === 'hourlyRate') {
    sortOptions = {hourlyRate: order};
  } else if (sortBy === 'experienceYears') {
    sortOptions = {experienceYears: order};
  }

  const ptProfiles = await PTProfile.find(profileQueryConditions)
    .populate('user', PUBLIC_PT_USER_FIELDS)
    .sort({...sortOptions, _id: 1}) // _id keeps pagination stable
    .skip(skip)
    .limit(size);

  res.status(200).json({
    message: 'Successfully get PT profiles.',
    data: ptProfiles,
    page,
    pages: Math.ceil(count / size),
    count,
  });
});

const viewPTProfile = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  assertValidId(res, ptId, 'PT id');

  const ptUser = await User.findOne({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Can not find this Personal Trainer.');
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
  assertValidId(res, ptId, 'PT id');

  const ptUser = await User.exists({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Personal Trainer not found.');
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
  const clientId = req.user._id;

  if (!ptId || !availabilitySlotId) {
    res.status(400);
    throw new Error('Please provide PT ID and availability slot ID.');
  }
  assertValidId(res, ptId, 'PT id');
  assertValidId(res, availabilitySlotId, 'availability slot id');

  const ptUser = await User.findOne({_id: ptId, role: 'pt', isActive: true});
  if (!ptUser) {
    res.status(404);
    throw new Error('Personal Trainer not found.');
  }

  const ptProfile = await PTProfile.findOne({user: ptId});
  if (!ptProfile || typeof ptProfile.hourlyRate !== 'number') {
    res.status(400);
    throw new Error('PT has not updated pricing information or profile is incomplete.');
  }
  if (!ptProfile.isAcceptingClients) {
    res.status(400);
    throw new Error('This PT is not accepting new clients at the moment.');
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
  if (dayjs(slot.startTime).isBefore(dayjs())) {
    res.status(400);
    throw new Error('Cannot book past time slots.');
  }

  const existingClientBooking = await Booking.exists({
    client: clientId,
    status: {$in: ACTIVE_BOOKING_STATUSES},
    'bookingTime.startTime': {$lt: slot.endTime},
    'bookingTime.endTime': {$gt: slot.startTime},
  });
  if (existingClientBooking) {
    res.status(400);
    throw new Error('You already have another booking that conflicts with this time slot.');
  }

  // Reserve the slot atomically. Only one concurrent request can flip it from
  // "available" to "booked", which prevents two clients booking the same slot.
  const reservedSlot = await Availability.findOneAndUpdate(
    {_id: availabilitySlotId, pt: ptId, status: 'available'},
    {status: 'booked'},
    {new: true},
  );
  if (!reservedSlot) {
    res.status(409);
    throw new Error('Time slot is no longer available.');
  }

  let createdBooking;
  try {
    createdBooking = await Booking.create({
      client: clientId,
      pt: ptId,
      availabilitySlot: availabilitySlotId,
      bookingTime: {startTime: slot.startTime, endTime: slot.endTime},
      status: 'pending_confirmation',
      notesFromClient,
      priceAtBooking: ptProfile.hourlyRate,
    });
  } catch (error) {
    // Release the reservation if the booking could not be stored.
    await Availability.updateOne({_id: availabilitySlotId}, {status: 'available'});
    throw error;
  }

  try {
    await createNotification({
      recipient: ptId,
      sender: clientId,
      type: 'new_booking_request',
      message: `New booking request from ${req.user.username}`,
      relatedBooking: createdBooking._id,
    });
  } catch (error) {
    console.error('Error sending booking notification:', error);
  }

  res.status(201).json({
    message:
      'Your booking request has been sent successfully and is waiting for PT confirmation.',
    data: createdBooking,
  });
});

const getClientBookings = asyncHandler(async (req, res) => {
  const {status, upcoming} = req.query;
  const {page, size, skip} = parsePagination(req.query);

  const queryOptions = {client: req.user._id};

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      res.status(400);
      throw new Error('Invalid booking status.');
    }
    queryOptions.status = status;
  }
  if (upcoming === 'true') {
    queryOptions['bookingTime.startTime'] = {$gte: new Date()};
    if (!status) {
      queryOptions.status = {$in: ACTIVE_BOOKING_STATUSES};
    }
  }
  if (upcoming === 'false') {
    queryOptions['bookingTime.startTime'] = {$lt: new Date()};
  }

  const count = await Booking.countDocuments(queryOptions);

  const bookings = await Booking.find(queryOptions)
    .populate('pt', 'username photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .sort({'bookingTime.startTime': upcoming === 'true' ? 'asc' : 'desc'})
    .skip(skip)
    .limit(size)
    .lean();

  // One query for all PT profiles instead of one per booking (N+1).
  const ptIds = bookings.map(booking => booking.pt?._id).filter(Boolean);
  const profiles = await PTProfile.find({user: {$in: ptIds}})
    .select('user hourlyRate specializations location')
    .lean();
  const profileByUser = new Map(profiles.map(p => [p.user.toString(), p]));

  const enrichedBookings = bookings.map(booking =>
    booking.pt?._id
      ? {
          ...booking,
          pt: {
            ...booking.pt,
            ptProfile: profileByUser.get(booking.pt._id.toString()) || null,
          },
        }
      : booking,
  );

  res.status(200).json({
    message: 'Get client bookings list successfully.',
    data: enrichedBookings,
    page,
    pages: Math.ceil(count / size),
    count,
  });
});

const cancelBookingByClient = asyncHandler(async (req, res) => {
  const {bookingId} = req.params;
  assertValidId(res, bookingId, 'booking id');

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (booking.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to cancel this booking.');
  }
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    res.status(400);
    throw new Error(`Cannot cancel booking in "${booking.status}" status.`);
  }

  const msUntilStart = new Date(booking.bookingTime.startTime).getTime() - Date.now();
  if (booking.status === 'confirmed' && msUntilStart < CANCEL_NOTICE_HOURS * 60 * 60 * 1000) {
    res.status(400);
    throw new Error(
      `Cannot cancel this booking because it's too close to the appointment time (must cancel at least ${CANCEL_NOTICE_HOURS} hours before).`,
    );
  }

  booking.status = 'cancelled_by_client';
  const updatedBooking = await booking.save();

  // The slot was reserved by this booking; give it back to the PT.
  await Availability.updateOne(
    {_id: booking.availabilitySlot, status: 'booked'},
    {status: 'available'},
  );

  try {
    await createNotification({
      recipient: booking.pt,
      sender: req.user._id,
      type: 'booking_cancelled_by_client',
      message: `${req.user.username} cancelled their booking`,
      relatedBooking: booking._id,
    });
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }

  res.status(200).json({message: 'Booking cancelled successfully.', data: updatedBooking});
});

module.exports = {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
};
