const asyncHandler = require('express-async-handler');
const {ChatRoom, Message} = require('../models/ChatModel');
const User = require('../models/userModel');
const {assertValidId} = require('../utils/helpers');

const MESSAGE_PAGE_SIZE = 100;
const PARTICIPANT_FIELDS = 'username photoUrl role';

// Loads a room and checks that the current user is one of its two members.
const findRoomForMember = async (req, res) => {
  const {chatRoomId} = req.params;
  assertValidId(res, chatRoomId, 'chat room id');

  const userId = req.user._id.toString();
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (
    !chatRoom ||
    (chatRoom.ptUser.toString() !== userId && chatRoom.clientUser.toString() !== userId)
  ) {
    res.status(403);
    throw new Error('Access denied');
  }
  return chatRoom;
};

const getOrCreateChatRoom = asyncHandler(async (req, res) => {
  const {otherUserId} = req.params;
  assertValidId(res, otherUserId, 'user id');

  // Chats are always between one PT and one client.
  const otherRole = req.user.role === 'pt' ? 'client' : 'pt';
  const otherUser = await User.exists({_id: otherUserId, role: otherRole, isActive: true});
  if (!otherUser) {
    res.status(404);
    throw new Error('User not found');
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
  const chatRoom = await findRoomForMember(req, res);

  // Take the newest messages, then return them oldest-first for display.
  // (Previously the oldest 100 were returned, so new messages never appeared
  // once a conversation grew past 100.)
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
    res.status(400);
    throw new Error('Message content required');
  }

  // Membership check: previously any logged-in user could post into any room.
  const chatRoom = await findRoomForMember(req, res);

  const message = await Message.create({
    chatRoom: chatRoom._id,
    sender: req.user._id,
    content,
  });
  await message.populate('sender', 'username role');

  chatRoom.lastMessage = {
    content,
    sender: req.user._id,
    timestamp: message.createdAt,
  };
  await chatRoom.save();

  res.json({success: true, data: message});
});

module.exports = {getOrCreateChatRoom, getChatRooms, getMessages, sendMessage};
