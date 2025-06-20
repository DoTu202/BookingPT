const mongoose = require('mongoose');
const Notification = require('./src/models/NotificationModel');
const User = require('./src/models/userModel');
require('dotenv').config();

const createTestNotifications = async () => {
  try {
    // Connect to MongoDB
    const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zgfg3pd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
    await mongoose.connect(dbURL);
    console.log('Connected to MongoDB');

    // Find some users to create notifications for
    const users = await User.find({ role: { $in: ['client', 'pt'] } }).limit(5);
    console.log(`Found ${users.length} users`);

    if (users.length < 2) {
      console.log('Need at least 2 users to create test notifications');
      return;
    }

    // Create test notifications
    const notifications = [
      {
        recipient: users[0]._id,
        sender: users[1]._id,
        senderType: 'User',
        type: 'new_booking_request',
        message: `New booking request from ${users[1].username}`,
        isRead: false
      },
      {
        recipient: users[0]._id,
        senderType: 'System',
        type: 'general_update',
        message: 'Welcome to FitnessPT! Your profile is now active.',
        isRead: false
      },
      {
        recipient: users[1]._id,
        sender: users[0]._id,
        senderType: 'User',
        type: 'booking_confirmed',
        message: `Your booking has been confirmed by ${users[0].username}`,
        isRead: true
      },
      {
        recipient: users[1]._id,
        senderType: 'System',
        type: 'booking_reminder',
        message: 'Don\'t forget your session tomorrow at 10:00 AM',
        isRead: false
      }
    ];

    // Insert notifications
    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} test notifications`);

    // Show summary
    const userNotifications = await Notification.find({})
      .populate('recipient', 'username email role')
      .populate('sender', 'username email');

    console.log('\n=== Test Notifications Created ===');
    userNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.recipient.username} (${notif.recipient.role}): ${notif.message}`);
      console.log(`   Type: ${notif.type}, Read: ${notif.isRead}`);
      console.log('');
    });

    // Show unread counts
    for (const user of users) {
      const unreadCount = await Notification.countDocuments({
        recipient: user._id,
        isRead: false
      });
      console.log(`${user.username} has ${unreadCount} unread notifications`);
    }

  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createTestNotifications();
