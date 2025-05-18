const express = require('express');
const { register, login, verification, forgotPassword } = require('../controllers/authController');

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/verification', verification)
authRouter.post('/forgotPassword', forgotPassword)

module.exports = authRouter;