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
} = require('../controllers/profileManagement');

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/change-password', changePassword);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/delete-account', deleteAccount);

module.exports = router;
