const express = require('express');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const {
  getProfile,
  updatePtProfile: updateProfile,
} = require('../controllers/pt/ptProfileController');
const {
  addAvailability,
  updateAvailability,
  getAvailabilitySlots,
  deleteAvailabilitySlot,
} = require('../controllers/pt/availabilityController');

const {
  confirmBooking,
  getPtBookings,
  rejectBooking,
  cancelBooking,
  markBookingAsCompleted,
} = require('../controllers/pt/bookingPtController');

const {getMyReviews} = require('../controllers/reviewController');
const {getDashboard} = require('../controllers/pt/dashboardController');

const ptRouter = express.Router();

ptRouter.use(authenticateToken, authorizeRoles('pt'));

ptRouter.get('/profile', getProfile);
ptRouter.put('/profile', updateProfile);

ptRouter.post('/availability', addAvailability);
ptRouter.put('/availability/:availabilityId', updateAvailability);
ptRouter.get('/availability', getAvailabilitySlots);
ptRouter.delete('/availability/:availabilityId', deleteAvailabilitySlot);

ptRouter.get('/bookings', getPtBookings);
ptRouter.post('/bookings/:bookingId/confirm', confirmBooking);
ptRouter.post('/bookings/:bookingId/reject', rejectBooking);
ptRouter.post('/bookings/:bookingId/cancel', cancelBooking);
ptRouter.post('/bookings/:bookingId/complete', markBookingAsCompleted);

ptRouter.get('/reviews', getMyReviews);
ptRouter.get('/dashboard', getDashboard);

module.exports = ptRouter;
