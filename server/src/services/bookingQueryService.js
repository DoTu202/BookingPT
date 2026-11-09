const Booking = require('../models/bookingModel');
const PTProfile = require('../models/PTProfileModel');
const Review = require('../models/ReviewModel');
const {BOOKING_STATUSES, ACTIVE_BOOKING_STATUSES} = require('./bookingService');
const {badRequest} = require('../utils/httpError');

const buildClientBookingFilter = (clientId, {status, upcoming}) => {
  const filter = {client: clientId};

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      throw badRequest('Invalid booking status.');
    }
    filter.status = status;
  }
  if (upcoming === 'true') {
    filter['bookingTime.startTime'] = {$gte: new Date()};
    if (!status) {
      filter.status = {$in: ACTIVE_BOOKING_STATUSES};
    }
  }
  if (upcoming === 'false') {
    // History: sessions that already started, plus future ones that will no
    // longer happen (cancelled / rejected).
    filter.$or = [
      {'bookingTime.startTime': {$lt: new Date()}},
      {status: {$nin: ACTIVE_BOOKING_STATUSES}},
    ];
  }
  return filter;
};

// Adds `reviewed` and the PT's profile to each booking, with one query each
// for all bookings (no N+1).
const enrichClientBookings = async bookings => {
  const ptIds = bookings.map(booking => booking.pt?._id).filter(Boolean);
  const profiles = await PTProfile.find({user: {$in: ptIds}})
    .select('user hourlyRate specializations location')
    .lean();
  const profileByUser = new Map(profiles.map(p => [p.user.toString(), p]));

  const reviewedIds = new Set(
    (await Review.find({booking: {$in: bookings.map(b => b._id)}}).distinct('booking')).map(id =>
      id.toString(),
    ),
  );

  return bookings.map(booking => ({
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
};

// Returns {bookings, page, pages, count} for the client's booking list.
const listClientBookings = async (clientId, query, {page, size, skip}) => {
  const filter = buildClientBookingFilter(clientId, query);
  const count = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .populate('pt', 'username photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .sort({'bookingTime.startTime': query.upcoming === 'true' ? 'asc' : 'desc'})
    .skip(skip)
    .limit(size)
    .lean();

  return {
    bookings: await enrichClientBookings(bookings),
    page,
    pages: Math.ceil(count / size),
    count,
  };
};

module.exports = {listClientBookings};
