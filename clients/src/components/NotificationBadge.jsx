import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import notificationApi from '../apis/notificationApi';
import { authSelector } from '../redux/reducers/authReducer';
import appColors from '../constants/appColors';

const NotificationBadge = ({ size = 16, style }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const auth = useSelector(authSelector);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (auth.accesstoken) {
          const response = await notificationApi.getUnreadCount(auth.accesstoken);
          if (response.success) {
            setUnreadCount(response.data.unreadCount);
          }
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [auth.accesstoken]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, { width: size, height: size }, style]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.6 }]}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

export default NotificationBadge;

const styles = StyleSheet.create({
  badge: {
    backgroundColor: appColors.danger,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    borderWidth: 2,
    borderColor: appColors.white,
  },
  badgeText: {
    color: appColors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});