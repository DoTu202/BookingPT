const express = require('express');
const router = express.Router();

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware'); 

const {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
} = require('../controllers/clientController');

router.get('/pt', searchPTs);
router.get('/trainers', searchPTs); // Alias for better naming

router.get('/pt/:ptId/profile', authenticateToken, viewPTProfile);

router.get(
  '/pt/:ptId/availability',
  authenticateToken,
  getPTAvailabilityForClient,
);

router.post(
  '/bookings',
  authenticateToken,
  authorizeRoles('client'),
  createBookingRequest,
);

router.get(
  '/my-bookings',
  authenticateToken,
  authorizeRoles('client'),
  getClientBookings,
);

router.post(
  '/my-bookings/:bookingId/cancel',
  authenticateToken,
  authorizeRoles('client'),
  cancelBookingByClient,
);

module.exports = router;
