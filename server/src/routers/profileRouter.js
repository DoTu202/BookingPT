const express = require('express');
const router = express.Router();

const {authenticateToken} = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); 

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
  requestEmailChange,
  confirmEmailChange,
  logoutAllDevices,
  registerPushToken,
  unregisterPushToken,
} = require('../controllers/profileController');
const {emailLimiter, loginLimiter} = require('../middleware/rateLimitMiddleware');

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/change-password', changePassword);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/delete-account', deleteAccount);
router.post('/email/request', emailLimiter, requestEmailChange);
router.post('/email/confirm', loginLimiter, confirmEmailChange);
router.post('/logout-all', logoutAllDevices);
router.post('/push-token', registerPushToken);
router.delete('/push-token', unregisterPushToken);

module.exports = router;
