const Booking = require('../../models/bookingModel');
const asyncHandler = require('express-async-handler');
const Availability = require('../../models/AvailabilityModel');
const PTProfile = require('../../models/PTProfileModel');
const {createNotification} = require('../notificationController');
const {dayjs, dayRange, assertValidId} = require('../../utils/helpers');

const BOOKING_STATUSES = Booking.schema.path('status').enumValues;

// Loads a booking owned by the current PT or throws 400/403/404.
const findOwnBooking = async (req, res) => {
  const {bookingId} = req.params;
  assertValidId(res, bookingId, 'booking id');

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }
  if (booking.pt.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to modify this booking.');
  }
  return booking;
};

// Notification failures must not fail the booking action itself.
const notifyClient = async (booking, sender, type, message) => {
  try {
    await createNotification({
      recipient: booking.client,
      sender: sender._id,
      type,
      message,
      relatedBooking: booking._id,
    });
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
  }
};

const getPtBookings = asyncHandler(async (req, res) => {
  const {status, date} = req.query;
  const queryOptions = {pt: req.user._id};

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      res.status(400);
      throw new Error('Invalid booking status.');
    }
    queryOptions.status = status;
  }
  if (date) {
    const range = dayRange(date);
    if (!range) {
      res.status(400);
      throw new Error('date is not a valid date.');
    }
    queryOptions['bookingTime.startTime'] = {$gte: range.start, $lte: range.end};
  }

  const bookings = await Booking.find(queryOptions)
    .populate('client', 'username email photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .sort({'bookingTime.startTime': 'desc'})
    .limit(200);

  res.status(200).json({
    message: 'PT bookings retrieved successfully.',
    count: bookings.length,
    data: bookings,
  });
});

const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req, res);

  if (booking.status !== 'pending_confirmation') {
    res.status(400);
    throw new Error(`Booking is currently in "${booking.status}" status, cannot confirm.`);
  }
  if (dayjs(booking.bookingTime.startTime).isBefore(dayjs())) {
    res.status(400);
    throw new Error('This session has already started and can no longer be confirmed.');
  }

  booking.status = 'confirmed';
  const updatedBooking = await booking.save();

  // The slot is reserved when the booking is created; this only repairs
  // bookings created before that rule existed.
  await Availability.updateOne({_id: booking.availabilitySlot}, {status: 'booked'});

  await notifyClient(
    booking,
    req.user,
    'booking_confirmed',
    `Your booking has been confirmed by ${req.user.username}`,
  );

  res.status(200).json({message: 'Booking confirmed successfully.', data: updatedBooking});
});

const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req, res);

  if (booking.status !== 'pending_confirmation') {
    res.status(400);
    throw new Error(`Booking is currently in "${booking.status}" status, cannot reject.`);
  }

  booking.status = 'rejected_by_pt';
  const updatedBooking = await booking.save();

  // Free the slot reserved by this booking so other clients can book it.
  await Availability.updateOne(
    {_id: booking.availabilitySlot, status: 'booked'},
    {status: 'available'},
  );

  await notifyClient(
    booking,
    req.user,
    'booking_rejected',
    `Your booking has been rejected by ${req.user.username}`,
  );

  res.status(200).json({message: 'Booking rejected successfully.', data: updatedBooking});
});

const markBookingAsCompleted = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req, res);

  if (booking.status !== 'confirmed') {
    res.status(400);
    throw new Error(
      `Only confirmed bookings can be marked as completed. Current status: "${booking.status}".`,
    );
  }
  if (dayjs(booking.bookingTime.endTime).isAfter(dayjs())) {
    res.status(400);
    throw new Error('Cannot mark session as completed before it ends.');
  }

  booking.status = 'completed';
  const updatedBooking = await booking.save();

  await PTProfile.updateOne({user: req.user._id}, {$inc: {totalSessions: 1}});

  await notifyClient(
    booking,
    req.user,
    'booking_completed_pt',
    `Your session with ${req.user.username} has been completed. Please leave a review!`,
  );

  res.status(200).json({
    message: 'Session marked as completed successfully.',
    data: updatedBooking,
  });
});

module.exports = {
  getPtBookings,
  confirmBooking,
  rejectBooking,
  markBookingAsCompleted,
};
