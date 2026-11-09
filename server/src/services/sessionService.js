const {disconnectUser} = require('./realtimeService');
const {removeUserDeviceTokens} = require('./pushService');

// Call wherever a user's tokens stop being valid (password change/reset,
// "sign out of all devices", account deletion): closes their open sockets and
// stops pushes to their devices.
const revokeUserSessions = async userId => {
  disconnectUser(userId);
  await removeUserDeviceTokens(userId);
};

module.exports = {revokeUserSessions};
