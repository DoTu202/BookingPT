const mongoose = require('mongoose');

// SIMPLE VERSION - Much easier for beginners
const SimpleChatSchema = new mongoose.Schema({
  // Just store user IDs directly
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  
  // Simple last message
  lastMessage: {
    type: String,
    default: ''
  },
  
  lastMessageTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Simple Message Schema
const SimpleMessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleChat',
    required: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = {
  SimpleChat: mongoose.model('SimpleChat', SimpleChatSchema),
  SimpleMessage: mongoose.model('SimpleMessage', SimpleMessageSchema)
};
