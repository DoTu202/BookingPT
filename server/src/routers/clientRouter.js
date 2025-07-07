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
  getClientProfile,
  updateClientProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
} = require('../controllers/clientController');

router.get('/pt', searchPTs); 

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


// Client Profile Management Routes
router.get(
  '/profile',
  authenticateToken,
  authorizeRoles('client'),
  getClientProfile,
);

router.put(
  '/profile',
  authenticateToken,
  authorizeRoles('client'),
  updateClientProfile,
);

router.post(
  '/profile/change-password',
  authenticateToken,
  authorizeRoles('client'),
  changePassword,
);

router.post(
  '/profile/upload-photo',
  authenticateToken,
  authorizeRoles('client'),
  uploadProfilePhoto,
);

router.delete(
  '/profile/delete-account',
  authenticateToken,
  authorizeRoles('client'),
  deleteAccount,
);

module.exports = router;
