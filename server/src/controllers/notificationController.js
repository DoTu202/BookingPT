const asyncHandler = require('express-async-handler');
const Notification = require('../models/NotificationModel');
const {assertValidId, parsePagination} = require('../utils/helpers');

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {page, size, skip} = parsePagination(req.query, {
    pageKey: 'page',
    sizeKey: 'limit',
    defaultSize: 20,
  });

  const filter = {recipient: userId};
  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === 'true';
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'username photoUrl')
      .populate('relatedBooking', 'bookingTime status')
      .populate('relatedUser', 'username photoUrl')
      .sort({createdAt: -1})
      .skip(skip)
      .limit(size),
    Notification.countDocuments(filter),
    Notification.countDocuments({recipient: userId, isRead: false}),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / size),
        total,
        hasMore: page * size < total,
      },
      unreadCount,
    },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const {notificationId} = req.params;
  assertValidId(res, notificationId, 'notification id');

  // Filtering by recipient means users can only touch their own notifications.
  const notification = await Notification.findOneAndUpdate(
    {_id: notificationId, recipient: req.user._id},
    {isRead: true},
    {new: true},
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({success: true, data: notification});
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {recipient: req.user._id, isRead: false},
    {isRead: true},
  );

  res.status(200).json({success: true, message: 'All notifications marked as read'});
});

const deleteNotification = asyncHandler(async (req, res) => {
  const {notificationId} = req.params;
  assertValidId(res, notificationId, 'notification id');

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({success: true, message: 'Notification deleted successfully'});
});

// Internal helper used by booking flows (not an HTTP handler).
const createNotification = ({
  recipient,
  sender = null,
  senderType = 'User',
  type,
  message,
  relatedBooking = null,
  relatedReview = null,
  relatedUser = null,
}) =>
  Notification.create({
    recipient,
    sender,
    senderType,
    type,
    message,
    relatedBooking,
    relatedReview,
    relatedUser,
  });

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({success: true, data: {unreadCount}});
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
};
