const express = require('express');
const { register, login, verification } = require('../controllers/authController');

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/verification', verification)

module.exports = authRouter;