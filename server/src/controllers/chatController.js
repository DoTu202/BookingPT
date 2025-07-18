const {ChatRoom, Message} = require('../models/ChatModel');

const chatController = {
  getOrCreateChatRoom: async (req, res) => {
    try {
      const {otherUserId} = req.params;
      const currentUserId = req.user._id;
      const currentUserRole = req.user.role;

      //determine who is PT and who is Client
      let ptUserId, clientUserId;
      if (currentUserRole === 'pt') {
        ptUserId = currentUserId;
        clientUserId = otherUserId;
      } else {
        ptUserId = otherUserId;
        clientUserId = currentUserId;
      }

      // Find existing chat room
      let chatRoom = await ChatRoom.findOne({
        ptUser: ptUserId,
        clientUser: clientUserId,
      }).populate('ptUser clientUser', 'username email role');

      // Create new one if not exist
      if (!chatRoom) {
        chatRoom = new ChatRoom({
          ptUser: ptUserId,
          clientUser: clientUserId,
        });
        await chatRoom.save();
        await chatRoom.populate('ptUser clientUser', 'username email role');
      }

      res.json({success: true, data: chatRoom});
    } catch (error) {
      console.error('Error getting chat room:', error);
      res
        .status(500)
        .json({success: false, message: 'Failed to get chat room'});
    }
  },

  // Get user's chat rooms
  getChatRooms: async (req, res) => {
    try {
      const userId = req.user._id;
      const userRole = req.user.role;

      // Query based on user role
      let query = {};
      if (userRole === 'pt') {
        query.ptUser = userId;
      } else {
        query.clientUser = userId;
      }

      const chatRooms = await ChatRoom.find(query)
        .populate('ptUser clientUser', 'username email role')
        .populate('lastMessage.sender', 'username')
        .sort({'lastMessage.timestamp': -1});

      res.json({success: true, data: chatRooms});
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      res
        .status(500)
        .json({success: false, message: 'Failed to get chat rooms'});
    }
  },

  // Get messages
  getMessages: async (req, res) => {
    try {
      const {chatRoomId} = req.params;
      const userId = req.user._id;

      //user must be PT or Client in this room
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (
        !chatRoom ||
        (chatRoom.ptUser.toString() !== userId.toString() &&
          chatRoom.clientUser.toString() !== userId.toString())
      ) {
        return res.status(403).json({success: false, message: 'Access denied'});
      }

      // Get messages
      const messages = await Message.find({chatRoom: chatRoomId})
        .populate('sender', 'username role')
        .sort({createdAt: 1}) 
        .limit(100); 

      res.json({success: true, data: {messages}});
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({success: false, message: 'Failed to get messages'});
    }
  },

  // Send message
  sendMessage: async (req, res) => {
    try {
      const {chatRoomId} = req.params;
      const {content} = req.body;
      const userId = req.user._id;

      //Validation
      if (!content || !content.trim()) {
        return res
          .status(400)
          .json({success: false, message: 'Message content required'});
      }

      // Create message
      const message = new Message({
        chatRoom: chatRoomId,
        sender: userId,
        content: content.trim(),
      });

      await message.save();
      await message.populate('sender', 'username role');

      // Update last message in chat room
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        lastMessage: {
          content: content.trim(),
          sender: userId,
          timestamp: message.createdAt,
        },
      });

      res.json({success: true, data: message});
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({success: false, message: 'Failed to send message'});
    }
  },
};

module.exports = chatController;
