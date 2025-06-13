const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const JWT_SECRET = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }
  jwt.verify(token, JWT_SECRET, async (error, decodePayload) => {
    if (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expired',
        });
      }
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    try {
      const user = await User.findById(decodePayload.id).select('-password');
      if (!user) {
        return res.status(401).json({
          message: 'Unauthorized',
        });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  });
};

//authorizeRoles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
