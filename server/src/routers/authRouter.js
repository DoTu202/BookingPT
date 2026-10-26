const express = require('express');
const {
  register,
  login,
  verification,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const {loginLimiter, emailLimiter} = require('../middleware/rateLimitMiddleware');

const authRouter = express.Router();

authRouter.post('/verification', emailLimiter, verification);
authRouter.post('/register', loginLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/forgotPassword', emailLimiter, forgotPassword);
authRouter.post('/resetPassword', loginLimiter, resetPassword);

module.exports = authRouter;
