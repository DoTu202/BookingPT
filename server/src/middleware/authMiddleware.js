const UserModal = require('../models/userModel');
const {verifyAccessToken} = require('../services/tokenService');
const {isValidId} = require('../utils/helpers');

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({success: false, message});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return unauthorized(res);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return unauthorized(
      res,
      error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    );
  }

  if (!isValidId(payload.id)) {
    return unauthorized(res, 'Invalid token');
  }

  try {
    const user = await UserModal.findById(payload.id);
    if (!user || !user.isActive) {
      return unauthorized(res);
    }

    // Tokens issued before the last password change are no longer valid.
    // JWT iat has second precision, so compare in seconds.
    if (
      user.passwordChangedAt &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return unauthorized(res, 'Token expired');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return unauthorized(res);
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({success: false, message: 'Forbidden'});
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
