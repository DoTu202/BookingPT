const asyncHandler = require('express-async-handler');
const Review = require('../models/ReviewModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const {notifySafely} = require('../services/notificationService');
const {refreshPtRating} = require('../services/reviewService');
const {assertValidId, parsePagination} = require('../utils/helpers');
const {badRequest, forbidden, notFound, conflict} = require('../utils/httpError');

const createReview = asyncHandler(async (req, res) => {
  const {bookingId} = req.params;
  assertValidId(bookingId, 'booking id');

  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw badRequest('Rating must be a whole number from 1 to 5.');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw notFound('Booking not found.');
  }
  // Only the client of a session that actually happened can review it.
  if (booking.client.toString() !== req.user._id.toString()) {
    throw forbidden('You can only review your own sessions.');
  }
  if (booking.status !== 'completed') {
    throw badRequest('Only completed sessions can be reviewed.');
  }
  if (await Review.exists({booking: booking._id})) {
    throw conflict('You have already reviewed this session.');
  }

  const review = await Review.create({
    booking: booking._id,
    client: req.user._id,
    pt: booking.pt,
    rating,
    comment,
  });
  await refreshPtRating(booking.pt);

  await notifySafely(
    {
      recipient: booking.pt,
      sender: req.user._id,
      type: 'new_review_on_pt_profile',
      message: `${req.user.username} left you a ${rating}-star review`,
      relatedBooking: booking._id,
      relatedReview: review._id,
    },
    req.log,
  );

  res.status(201).json({success: true, message: 'Thank you for your review!', data: review});
});

const listReviews = async (res, ptId, query) => {
  const {page, size, skip} = parsePagination(query, {pageKey: 'page', sizeKey: 'limit'});
  const [reviews, count] = await Promise.all([
    Review.find({pt: ptId})
      .populate('client', 'username photoUrl')
      .sort({createdAt: -1})
      .skip(skip)
      .limit(size),
    Review.countDocuments({pt: ptId}),
  ]);
  res.status(200).json({
    success: true,
    data: reviews,
    page,
    pages: Math.ceil(count / size),
    count,
  });
};

// Reviews of any PT, shown on the PT's public profile.
const getPtReviews = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  assertValidId(ptId, 'PT id');
  if (!(await User.exists({_id: ptId, role: 'pt', isActive: true}))) {
    throw notFound('Personal Trainer not found.');
  }
  await listReviews(res, ptId, req.query);
});

// The signed-in PT's own reviews.
const getMyReviews = asyncHandler(async (req, res) => {
  await listReviews(res, req.user._id, req.query);
});

module.exports = {createReview, getPtReviews, getMyReviews};
