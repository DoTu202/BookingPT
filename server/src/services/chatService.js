const {ChatRoom, Message} = require('../models/ChatModel');
const {emitToUsers} = require('./realtimeService');
const {sendPush} = require('./pushService');

const PUSH_BODY_MAX = 150;

// Stores a message, moves it into the room's preview and pushes it to both
// members over the socket. `clientId` is the sender app's temporary id for
// its optimistic bubble; it is echoed back, never stored.
const sendMessage = async ({chatRoom, senderId, content, clientId}) => {
  const message = await Message.create({chatRoom: chatRoom._id, sender: senderId, content});
  await message.populate('sender', 'username role photoUrl');

  // Conditional so a slower request can't overwrite a newer preview.
  await ChatRoom.updateOne(
    {
      _id: chatRoom._id,
      $or: [
        {'lastMessage.timestamp': {$lte: message.createdAt}},
        {'lastMessage.timestamp': {$exists: false}},
      ],
    },
    {lastMessage: {content, sender: senderId, timestamp: message.createdAt}},
  );

  emitToUsers([chatRoom.ptUser, chatRoom.clientUser], 'chat:message', {
    chatRoomId: chatRoom._id.toString(),
    message,
    ...(clientId ? {clientId} : {}),
  });

  // Push for when the recipient's app is in the background or closed. In the
  // foreground the OS doesn't show it; the socket event updates the screen.
  const recipient = [chatRoom.ptUser, chatRoom.clientUser].find(id => !id.equals(senderId));
  const {sender} = message;
  sendPush([recipient], {
    title: sender.username,
    body: content.length > PUSH_BODY_MAX ? `${content.slice(0, PUSH_BODY_MAX - 1)}…` : content,
    data: {
      type: 'chat',
      chatRoomId: chatRoom._id,
      senderId: sender._id,
      senderName: sender.username,
      senderRole: sender.role,
      senderPhoto: sender.photoUrl,
    },
  });

  return message;
};

module.exports = {sendMessage};
