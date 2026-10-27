const asyncHandler = require('express-async-handler');
const {ChatRoom, Message} = require('../models/ChatModel');
const User = require('../models/userModel');
const chatService = require('../services/chatService');
const {assertValidId} = require('../utils/helpers');
const {badRequest, forbidden, notFound} = require('../utils/httpError');

const MESSAGE_PAGE_SIZE = 100;
const PARTICIPANT_FIELDS = 'username photoUrl role';

// Loads a room and checks that the current user is one of its two members.
const findRoomForMember = async req => {
  const {chatRoomId} = req.params;
  assertValidId(chatRoomId, 'chat room id');

  const userId = req.user._id.toString();
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (
    !chatRoom ||
    (chatRoom.ptUser.toString() !== userId && chatRoom.clientUser.toString() !== userId)
  ) {
    throw forbidden('Access denied');
  }
  return chatRoom;
};

const getOrCreateChatRoom = asyncHandler(async (req, res) => {
  const {otherUserId} = req.params;
  assertValidId(otherUserId, 'user id');

  // Chats are always between one PT and one client.
  const otherRole = req.user.role === 'pt' ? 'client' : 'pt';
  const otherUser = await User.exists({_id: otherUserId, role: otherRole, isActive: true});
  if (!otherUser) {
    throw notFound('User not found');
  }

  const members =
    req.user.role === 'pt'
      ? {ptUser: req.user._id, clientUser: otherUserId}
      : {ptUser: otherUserId, clientUser: req.user._id};

  // Upsert is atomic, so two simultaneous requests cannot create two rooms.
  const chatRoom = await ChatRoom.findOneAndUpdate(
    members,
    {$setOnInsert: members},
    {upsert: true, new: true},
  ).populate('ptUser clientUser', PARTICIPANT_FIELDS);

  res.json({success: true, data: chatRoom});
});

const getChatRooms = asyncHandler(async (req, res) => {
  const query =
    req.user.role === 'pt' ? {ptUser: req.user._id} : {clientUser: req.user._id};

  const chatRooms = await ChatRoom.find(query)
    .populate('ptUser clientUser', PARTICIPANT_FIELDS)
    .populate('lastMessage.sender', 'username')
    .sort({'lastMessage.timestamp': -1})
    .limit(100);

  res.json({success: true, data: chatRooms});
});

const getMessages = asyncHandler(async (req, res) => {
  const chatRoom = await findRoomForMember(req);

  // Take the newest messages, then return them oldest-first for display.
  const messages = await Message.find({chatRoom: chatRoom._id})
    .populate('sender', 'username role')
    .sort({createdAt: -1})
    .limit(MESSAGE_PAGE_SIZE);
  messages.reverse();

  res.json({success: true, data: {messages}});
});

const sendMessage = asyncHandler(async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    throw badRequest('Message content required');
  }
  // Optional id of the sender's optimistic bubble, echoed in the socket event.
  const {clientId} = req.body;
  const validClientId =
    typeof clientId === 'string' && /^[\w-]{1,64}$/.test(clientId) ? clientId : undefined;

  const chatRoom = await findRoomForMember(req);
  const message = await chatService.sendMessage({
    chatRoom,
    senderId: req.user._id,
    content,
    clientId: validClientId,
  });

  res.json({success: true, data: message});
});

module.exports = {getOrCreateChatRoom, getChatRooms, getMessages, sendMessage};
