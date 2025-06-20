const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.use(authenticateToken);

router.get('/rooms', chatController.getChatRooms);                  
router.get('/room/:otherUserId', chatController.getOrCreateChatRoom); 
router.get('/messages/:chatRoomId', chatController.getMessages);      
router.post('/send/:chatRoomId', chatController.sendMessage);        

module.exports = router;
