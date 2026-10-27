import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Notification} from 'iconsax-react-native';
import NotificationBadge from './NotificationBadge';
import appColors from '../constants/appColors';
import {header} from '../constants/theme';

// Bell with unread badge, styled for the gradient headers.
const HeaderNotificationButton = ({color = appColors.white}) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('Notifications')}
      accessibilityRole="button"
      accessibilityLabel="Thông báo">
      <Notification size={header.iconSize} color={color} />
      <NotificationBadge />
    </TouchableOpacity>
  );
};

export default HeaderNotificationButton;

const styles = StyleSheet.create({
  button: {
    width: header.iconButton,
    height: header.iconButton,
    borderRadius: header.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
