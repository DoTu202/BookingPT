import React from 'react';
import {Alert, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Calendar,
  Chart,
  Lock,
  LogoutCurve,
  Message2,
  Notification,
  SearchNormal1,
  User,
} from 'iconsax-react-native';
import Avatar from '../ui/Avatar';
import GradientView from '../ui/GradientView';
import TextComponent from '../ui/TextComponent';
import {authSelector} from '../../redux/reducers/authReducer';
import {signOut} from '../../utils/session';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, spacing} from '../../constants/theme';

const DrawerCustom = ({navigation}) => {
  const user = useSelector(authSelector);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const goToTab = screen => () => navigation.navigate('ClientTabNavigator', {screen});

  const items = [
    {key: 'find', title: 'Tìm huấn luyện viên', icon: SearchNormal1, onPress: () => navigation.navigate('SearchPtScreen')},
    {key: 'bookings', title: 'Lịch tập của tôi', icon: Calendar, onPress: goToTab('ClientBookings')},
    {key: 'progress', title: 'Tiến độ', icon: Chart, onPress: goToTab('Progress')},
    {key: 'messages', title: 'Tin nhắn', icon: Message2, onPress: goToTab('Messages')},
    {key: 'notifications', title: 'Thông báo', icon: Notification, onPress: () => navigation.navigate('Notifications')},
    {key: 'profile', title: 'Tài khoản', icon: User, onPress: goToTab('ClientProfile')},
    {key: 'password', title: 'Đổi mật khẩu', icon: Lock, onPress: () => navigation.navigate('ChangePasswordScreen')},
  ];

  const handleSignOut = () =>
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(dispatch)},
    ]);

  return (
    <View style={styles.container}>
      <GradientView style={[styles.header, {paddingTop: insets.top + spacing.lg}]}>
        <TouchableOpacity onPress={goToTab('ClientProfile')} accessibilityRole="button">
          <Avatar uri={user.photoUrl} name={user.username} size={64} style={styles.avatar} />
          <TextComponent
            text={user.username || 'Học viên'}
            size={18}
            font={fontFamilies.bold}
            color={appColors.white}
            numberOfLines={1}
          />
          <TextComponent text={user.email} size={13} color="rgba(255,255,255,0.85)" numberOfLines={1} />
        </TouchableOpacity>
      </GradientView>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map(item => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => {
                navigation.closeDrawer();
                item.onPress();
              }}
              accessibilityRole="button">
              <View style={styles.itemIcon}>
                <Icon size={20} color={appColors.primary} />
              </View>
              <TextComponent text={item.title} size={15} font={fontFamilies.medium} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.item, styles.signOut, {marginBottom: insets.bottom + spacing.md}]}
        onPress={handleSignOut}
        accessibilityRole="button">
        <View style={[styles.itemIcon, styles.signOutIcon]}>
          <LogoutCurve size={20} color={appColors.danger} />
        </View>
        <TextComponent text="Đăng xuất" size={15} font={fontFamilies.medium} color={appColors.danger} />
      </TouchableOpacity>
    </View>
  );
};

export default DrawerCustom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.surface,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomRightRadius: header.radius,
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.md,
  },
  list: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOut: {
    marginHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
    paddingTop: spacing.md,
  },
  signOutIcon: {
    backgroundColor: appColors.dangerSoft,
  },
});
