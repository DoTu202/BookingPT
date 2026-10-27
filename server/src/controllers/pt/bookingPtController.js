const asyncHandler = require('express-async-handler');
const Booking = require('../../models/bookingModel');
const bookingService = require('../../services/bookingService');
const {dayRange, assertValidId} = require('../../utils/helpers');
const {badRequest} = require('../../utils/httpError');

const {BOOKING_STATUSES} = bookingService;

const getPtBookings = asyncHandler(async (req, res) => {
  const {status, date} = req.query;
  const queryOptions = {pt: req.user._id};

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      throw badRequest('Invalid booking status.');
    }
    queryOptions.status = status;
  }
  if (date) {
    const range = dayRange(date);
    if (!range) {
      throw badRequest('date is not a valid date.');
    }
    queryOptions['bookingTime.startTime'] = {$gte: range.start, $lte: range.end};
  }

  const bookings = await Booking.find(queryOptions)
    .populate('client', 'username email photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .sort({'bookingTime.startTime': 'desc'})
    .limit(200);

  res.status(200).json({
    success: true,
    message: 'PT bookings retrieved successfully.',
    count: bookings.length,
    data: bookings,
  });
});

// Builds a handler for a PT action on /bookings/:bookingId/<action>.
const bookingAction = (action, successMessage) =>
  asyncHandler(async (req, res) => {
    const {bookingId} = req.params;
    assertValidId(bookingId, 'booking id');

    const updatedBooking = await action({
      pt: req.user,
      bookingId,
      reason: req.body?.reason,
      log: req.log,
    });

    res.status(200).json({success: true, message: successMessage, data: updatedBooking});
  });

const confirmBooking = bookingAction(
  bookingService.confirmBooking,
  'Booking confirmed successfully.',
);
const rejectBooking = bookingAction(bookingService.rejectBooking, 'Booking rejected successfully.');
const cancelBooking = bookingAction(bookingService.cancelByPt, 'Session cancelled successfully.');
const markBookingAsCompleted = bookingAction(
  bookingService.completeBooking,
  'Session marked as completed successfully.',
);

module.exports = {
  getPtBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  markBookingAsCompleted,
};
