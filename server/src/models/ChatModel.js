const mongoose = require('mongoose');

// Simple Chat Room Schema - just PT and Client
const chatRoomSchema = new mongoose.Schema({
  // Two participants: PT and Client
  ptUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  
  // Last message for preview
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Simple Message Schema
const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  content: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { ChatRoom, Message };
