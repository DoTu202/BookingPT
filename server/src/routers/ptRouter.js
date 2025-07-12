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
  deletedAvailabilitySlot,
} = require('../controllers/pt/availabilityController');

const {
  confirmBooking,
  getPtBookings,
  rejectBooking,
  markBookingAsCompleted,
} = require('../controllers/pt/bookingPtController');

const ptRouter = express.Router();

ptRouter.use(authenticateToken, authorizeRoles('pt'));

ptRouter.get('/profile', getProfile);
ptRouter.put('/profile', updateProfile);

ptRouter.post('/availability', addAvailability);
ptRouter.put('/availability/:availabilityId', updateAvailability);
ptRouter.get('/availability', getAvailabilitySlots);
ptRouter.delete('/availability/:availabilityId', deletedAvailabilitySlot);

ptRouter.get('/bookings', getPtBookings);
ptRouter.post('/bookings/:bookingId/confirm', confirmBooking);
ptRouter.post('/bookings/:bookingId/reject', rejectBooking);
ptRouter.post('/bookings/:bookingId/complete', markBookingAsCompleted);

module.exports = ptRouter;
