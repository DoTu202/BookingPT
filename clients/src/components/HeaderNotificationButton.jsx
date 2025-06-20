import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import NotificationBadge from './NotificationBadge';
import appColors from '../constants/appColors';

const HeaderNotificationButton = ({ color = appColors.text, size = 24 }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon
          name="notifications"
          size={size}
          color={color}
        />
        <NotificationBadge size={16} />
      </View>
    </TouchableOpacity>
  );
};

export default HeaderNotificationButton;

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    marginTop: 20,
  },
  iconContainer: {
    position: 'relative',
    padding: 8,

  },
});
