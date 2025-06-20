const Notification = require('../models/NotificationModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

// Get all notifications for user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; // Sử dụng _id thay vì id
        const { page = 1, limit = 20, isRead } = req.query;

        // Build filter
        const filter = { recipient: userId };
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        const notifications = await Notification.find(filter)
            .populate('sender', 'username photoUrl')
            .populate('relatedBooking', 'bookingTime status')
            .populate('relatedUser', 'username photoUrl')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ 
            recipient: userId, 
            isRead: false 
        });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    total,
                    hasMore: page * limit < total
                },
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Create notification (helper function)
const createNotification = async ({
    recipient,
    sender = null,
    senderType = 'User',
    type,
    message,
    relatedBooking = null,
    relatedReview = null,
    relatedUser = null
}) => {
    try {
        const notification = new Notification({
            recipient,
            sender,
            senderType,
            type,
            message,
            relatedBooking,
            relatedReview,
            relatedUser
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getUnreadCount
};
