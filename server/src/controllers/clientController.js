const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Availability = require('../models/AvailabilityModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/ReviewModel');
const bookingService = require('../services/bookingService');
const {dayRange, escapeRegex, assertValidId, parsePagination} = require('../utils/helpers');
const {badRequest, notFound} = require('../utils/httpError');

const {BOOKING_STATUSES, ACTIVE_BOOKING_STATUSES} = bookingService;

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
      throw badRequest('availableDate is not a valid date.');
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

  // Deactivated trainers never show up, whatever the other filters are.
  const inactivePtIds = await User.find({role: 'pt', isActive: false}).distinct('_id');
  if (inactivePtIds.length > 0) {
    profileQueryConditions.user = {$nin: inactivePtIds};
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
    profileQueryConditions.user = {...profileQueryConditions.user, $in: finalUserIds};
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
  const {status, upcoming} = req.query;
  const {page, size, skip} = parsePagination(req.query);

  const queryOptions = {client: req.user._id};

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      throw badRequest('Invalid booking status.');
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
    // History: sessions that already started, plus future ones that will no
    // longer happen (cancelled / rejected).
    queryOptions.$or = [
      {'bookingTime.startTime': {$lt: new Date()}},
      {status: {$nin: ACTIVE_BOOKING_STATUSES}},
    ];
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

  const reviewedIds = new Set(
    (await Review.find({booking: {$in: bookings.map(b => b._id)}}).distinct('booking')).map(
      id => id.toString(),
    ),
  );

  const enrichedBookings = bookings.map(booking => ({
    ...booking,
    // Lets the app show a "Rate this session" button only when relevant.
    reviewed: reviewedIds.has(booking._id.toString()),
    ...(booking.pt?._id && {
      pt: {
        ...booking.pt,
        ptProfile: profileByUser.get(booking.pt._id.toString()) || null,
      },
    }),
  }));

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
