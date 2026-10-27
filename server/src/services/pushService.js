const fs = require('fs');
const DeviceToken = require('../models/DeviceTokenModel');
const logger = require('../configs/logger');
const {FIREBASE_SERVICE_ACCOUNT, isTest} = require('../configs/env');

// Push notifications through Firebase Cloud Messaging (FCM delivers to APNs
// on iOS). Optional: without FIREBASE_SERVICE_ACCOUNT every send is a no-op,
// so development and tests work without a Firebase project. Like
// notifySafely, sending never throws; failures are only logged.

// FCM error codes meaning the token is gone for good (app uninstalled,
// token rotated, signed out with deleteToken).
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

let transport; // async (message) => BatchResponse; null when not configured

const loadServiceAccount = () => {
  const value = FIREBASE_SERVICE_ACCOUNT.trim();
  // Either the JSON itself (handy for hosted env vars) or a path to the file.
  return JSON.parse(value.startsWith('{') ? value : fs.readFileSync(value, 'utf8'));
};

const getTransport = () => {
  if (transport !== undefined) {
    return transport;
  }
  transport = null;
  if (!FIREBASE_SERVICE_ACCOUNT || isTest) {
    return transport;
  }
  try {
    const {initializeApp, cert} = require('firebase-admin/app');
    const {getMessaging} = require('firebase-admin/messaging');
    const messaging = getMessaging(initializeApp({credential: cert(loadServiceAccount())}));
    transport = message => messaging.sendEachForMulticast(message);
  } catch (error) {
    logger.error({err: error}, 'Push notifications disabled: invalid FIREBASE_SERVICE_ACCOUNT');
  }
  return transport;
};

// Tests replace FCM with a fake; pass undefined to go back to the default.
const setPushTransport = fake => {
  transport = fake;
};

const registerDeviceToken = (userId, token, platform) =>
  DeviceToken.findOneAndUpdate(
    {token},
    {user: userId, token, platform},
    {upsert: true, new: true, setDefaultsOnInsert: true},
  );

const unregisterDeviceToken = (userId, token) => DeviceToken.deleteOne({user: userId, token});

// Call wherever sessions are revoked (same places as disconnectUser): a
// signed-out device must stop receiving the user's messages.
const removeUserDeviceTokens = userId => DeviceToken.deleteMany({user: userId});

// FCM data values must be strings; drop empty ones.
const toData = data =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );

const sendPush = async (userIds, {title, body, data = {}}) => {
  try {
    const send = getTransport();
    if (!send) {
      return;
    }
    const devices = await DeviceToken.find({user: {$in: userIds}}).select('token').lean();
    if (devices.length === 0) {
      return;
    }
    const tokens = devices.map(device => device.token);
    const response = await send({
      tokens,
      notification: {title, body},
      data: toData(data),
      android: {priority: 'high', notification: {sound: 'default'}},
      apns: {payload: {aps: {sound: 'default'}}},
    });
    const dead = tokens.filter((token, i) => {
      const result = response.responses[i];
      return !result.success && DEAD_TOKEN_CODES.has(result.error?.code);
    });
    if (dead.length > 0) {
      await DeviceToken.deleteMany({token: {$in: dead}});
    }
  } catch (error) {
    logger.error({err: error}, 'Error sending push notification');
  }
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  removeUserDeviceTokens,
  sendPush,
  setPushTransport,
};
