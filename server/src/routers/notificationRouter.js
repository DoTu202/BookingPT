const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');
const {authenticateToken} = require('../middleware/authMiddleware');

const notificationRouter = express.Router();

notificationRouter.use(authenticateToken);

notificationRouter.get('/', getNotifications);
notificationRouter.get('/unread-count', getUnreadCount);
notificationRouter.put('/:notificationId/read', markAsRead);
notificationRouter.put('/mark-all-read', markAllAsRead);
notificationRouter.delete('/:notificationId', deleteNotification);

module.exports = notificationRouter;
