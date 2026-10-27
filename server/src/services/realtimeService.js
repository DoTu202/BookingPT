const {Server} = require('socket.io');
const {CORS_ORIGINS} = require('../configs/env');
const logger = require('../configs/logger');
const {userFromToken} = require('../middleware/authMiddleware');
const {ChatRoom} = require('../models/ChatModel');
const {isValidId} = require('../utils/helpers');

// Socket.IO push channel. Clients connect with their access token
// (`auth: {token}`) and join a private `user:<id>` room; the server pushes
// events there. Writes still go through the REST API, so validation and
// authorization live in one place.
//
// Server → client events:
//   chat:message  {chatRoomId, message, clientId?}  new message (to both members)
//   chat:typing   {chatRoomId, userId}               the other member is typing
// Client → server events:
//   chat:typing   {chatRoomId}                       relayed to the other member

let io = null;

const TYPING_MIN_INTERVAL_MS = 1000;

const userRoom = userId => `user:${userId}`;

// Socket.IO never sees Express errors, so map auth failures to the same
// messages the REST API uses (the app translates them).
const authenticate = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string' || !token) {
    return next(new Error('Unauthorized'));
  }
  try {
    const {user, error} = await userFromToken(token);
    if (error) {
      return next(new Error(error));
    }
    socket.data.userId = user._id.toString();
    next();
  } catch (err) {
    logger.error({err}, 'Socket authentication failed');
    next(new Error('Internal server error'));
  }
};

// Returns the other member of a room the socket's user belongs to, or null.
// Cached per socket: membership of a room never changes.
const otherMemberOf = async (socket, chatRoomId) => {
  if (socket.data.rooms.has(chatRoomId)) {
    return socket.data.rooms.get(chatRoomId);
  }
  const room = await ChatRoom.findById(chatRoomId).select('ptUser clientUser').lean();
  const me = socket.data.userId;
  let other = null;
  if (room && room.ptUser.toString() === me) {
    other = room.clientUser.toString();
  } else if (room && room.clientUser.toString() === me) {
    other = room.ptUser.toString();
  }
  socket.data.rooms.set(chatRoomId, other);
  return other;
};

const onTyping = async (socket, payload) => {
  const chatRoomId = payload?.chatRoomId;
  if (!isValidId(chatRoomId)) {
    return;
  }
  const now = Date.now();
  if (now - (socket.data.lastTypingAt || 0) < TYPING_MIN_INTERVAL_MS) {
    return;
  }
  socket.data.lastTypingAt = now;

  const other = await otherMemberOf(socket, String(chatRoomId));
  if (other) {
    io.to(userRoom(other)).emit('chat:typing', {chatRoomId, userId: socket.data.userId});
  }
};

const initRealtime = httpServer => {
  io = new Server(httpServer, {
    serveClient: false,
    cors: {
      // Same rule as the REST API: native apps send no Origin header.
      origin: (origin, callback) => callback(null, !origin || CORS_ORIGINS.includes(origin)),
    },
  });

  io.use(authenticate);
  io.on('connection', socket => {
    socket.data.rooms = new Map();
    socket.join(userRoom(socket.data.userId));
    socket.on('chat:typing', payload => {
      onTyping(socket, payload).catch(err => logger.warn({err}, 'chat:typing failed'));
    });
  });

  return io;
};

// No-ops until initRealtime has run (e.g. in REST-only tests).
const emitToUsers = (userIds, event, payload) => {
  if (!io) {
    return;
  }
  io.to(userIds.map(id => userRoom(id.toString()))).emit(event, payload);
};

// Drops a user's open sockets, e.g. after their tokens were revoked. The app
// reconnects with its current token if it still has a valid one.
const disconnectUser = userId => {
  io?.in(userRoom(userId.toString())).disconnectSockets(true);
};

// Closes all sockets and the HTTP server they are attached to.
const closeRealtime = callback => {
  if (!io) {
    callback?.();
    return;
  }
  const current = io;
  io = null;
  current.close(() => callback?.());
};

module.exports = {initRealtime, emitToUsers, disconnectUser, closeRealtime};
