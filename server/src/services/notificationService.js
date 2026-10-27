const Notification = require('../models/NotificationModel');
const logger = require('../configs/logger');
const {sendPush} = require('./pushService');

// Push titles; the body is the notification's own message.
const PUSH_TITLES = {
  new_booking_request: 'Yêu cầu đặt lịch mới',
  booking_confirmed: 'Lịch tập đã được xác nhận',
  booking_rejected: 'Yêu cầu đặt lịch bị từ chối',
  booking_cancelled_by_client: 'Học viên đã huỷ lịch',
  booking_cancelled_by_pt: 'Huấn luyện viên đã huỷ lịch',
  booking_system_rejected: 'Yêu cầu đặt lịch đã hết hạn',
  booking_completed_pt: 'Buổi tập đã hoàn thành',
  booking_completed_client: 'Buổi tập đã hoàn thành',
  booking_reminder: 'Nhắc lịch tập',
  new_review_on_pt_profile: 'Bạn có đánh giá mới',
};

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

// Notifications are a side effect: a failure is logged but never fails the
// action that triggered it.
const notifySafely = async (params, log = logger) => {
  try {
    const notification = await createNotification(params);
    // Not awaited: the push must not slow down the action.
    sendPush([notification.recipient], {
      title: PUSH_TITLES[notification.type] || 'BookingPT',
      body: notification.message,
      data: {
        type: 'notification',
        notificationId: notification._id,
        notificationType: notification.type,
        bookingId: notification.relatedBooking,
      },
    });
    return notification;
  } catch (error) {
    log.error({err: error, type: params.type}, 'Error sending notification');
    return null;
  }
};

module.exports = {notifySafely};
