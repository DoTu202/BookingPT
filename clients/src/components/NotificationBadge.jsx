import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import TextComponent from './TextComponent';
import notificationApi from '../apis/notificationApi';
import {authSelector} from '../redux/reducers/authReducer';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';

const POLL_MS = 30000;

// Unread-count bubble. Refreshes when its screen regains focus (e.g. after
// reading notifications) and every 30 seconds while mounted.
const NotificationBadge = ({style}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const auth = useSelector(authSelector);

  const fetchCount = useCallback(async () => {
    if (!auth.accesstoken) {
      return;
    }
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch {
      // A missing badge is not worth an error message.
    }
  }, [auth.accesstoken]);

  useFocusEffect(
    useCallback(() => {
      fetchCount();
    }, [fetchCount]),
  );

  useEffect(() => {
    const timer = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchCount]);

  if (!unreadCount) {
    return null;
  }
  return (
    <View style={[styles.badge, style]} accessibilityLabel={`${unreadCount} thông báo chưa đọc`}>
      <TextComponent
        text={unreadCount > 99 ? '99+' : String(unreadCount)}
        size={10}
        font={fontFamilies.bold}
        color={appColors.white}
      />
    </View>
  );
};

export default NotificationBadge;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: appColors.danger,
    borderWidth: 2,
    borderColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
