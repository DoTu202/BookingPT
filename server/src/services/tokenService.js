const jwt = require('jsonwebtoken');
const {JWT_SECRET, JWT_EXPIRES_IN} = require('../configs/env');

const JWT_ALGORITHM = 'HS256';

// Keep the payload minimal: it is only base64-encoded, not encrypted.
const signAccessToken = user =>
  jwt.sign({id: user._id.toString(), role: user.role}, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });

const verifyAccessToken = token =>
  jwt.verify(token, JWT_SECRET, {algorithms: [JWT_ALGORITHM]});

// Shape returned to the mobile app after login/register/password change.
const buildAuthResponse = user => ({
  id: user._id,
  email: user.email,
  username: user.username,
  role: user.role,
  photoUrl: user.photoUrl ?? '',
  accesstoken: signAccessToken(user),
});

module.exports = {signAccessToken, verifyAccessToken, buildAuthResponse};
