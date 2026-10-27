const User = require('../models/userModel');
const {verifyAccessToken} = require('../services/tokenService');
const {isValidId} = require('../utils/helpers');

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({success: false, message});

// Resolves a bearer token to an active user. Shared by the HTTP middleware
// and the Socket.IO handshake. Returns {user} or {error: <401 message>}.
const userFromToken = async token => {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return {error: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'};
  }

  if (!isValidId(payload.id)) {
    return {error: 'Invalid token'};
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) {
    return {error: 'Unauthorized'};
  }

  // Tokens issued before the last password change or "sign out of all
  // devices" are no longer valid. JWT iat has second precision.
  const revokedBefore = Math.max(
    user.passwordChangedAt?.getTime() || 0,
    user.tokensValidAfter?.getTime() || 0,
  );
  if (revokedBefore && payload.iat < Math.floor(revokedBefore / 1000)) {
    return {error: 'Token expired'};
  }

  return {user};
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return unauthorized(res);
  }

  try {
    const {user, error} = await userFromToken(token);
    if (error) {
      return unauthorized(res, error);
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
  userFromToken,
  authenticateToken,
  authorizeRoles,
};
