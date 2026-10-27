import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import dayjs from '../../utils/dayjs';
import {
  Calendar,
  Call,
  Edit,
  Lock,
  LogoutCurve,
  Mobile,
  Sms,
  Trash,
  Cake,
} from 'iconsax-react-native';
import {HeroScrollView, MenuList, ProfileHero, TextComponent} from '../../components';
import DeleteAccountModal from '../../modals/DeleteAccountModal';
import profileApi from '../../apis/profileApi';
import clientApi from '../../apis/clientApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {signOut, updateSession} from '../../utils/session';
import {pickAndUploadProfilePhoto} from '../../utils/photoUpload';
import {formatHours} from '../../utils/format';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

const hoursOf = booking =>
  (new Date(booking.bookingTime.endTime) - new Date(booking.bookingTime.startTime)) / 3600000;

const InfoRow = ({icon, label, value}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <View style={styles.flex}>
      <TextComponent text={label} size={12} color={appColors.textMuted} />
      <TextComponent text={value || 'Chưa cập nhật'} size={15} font={fontFamilies.medium} />
    </View>
  </View>
);

const ClientProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({sessions: 0, hours: 0, trainers: 0});
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Reload on focus so edits made on EditProfileScreen show up.
  useFocusEffect(
    useCallback(() => {
      profileApi
        .getProfile()
        .then(res => setProfile(res.data?.data))
        .catch(() => {});
      clientApi
        .getMyBookings({status: 'completed', pageSize: 50})
        .then(res => {
          const completed = res.data?.data || [];
          setStats({
            sessions: res.data?.count ?? completed.length,
            hours: completed.reduce((sum, b) => sum + hoursOf(b), 0),
            trainers: new Set(completed.map(b => b.pt?._id).filter(Boolean)).size,
          });
        })
        .catch(() => {});
    }, []),
  );

  const changePhoto = async () => {
    setUploading(true);
    try {
      const photoUrl = await pickAndUploadProfilePhoto();
      if (photoUrl) {
        setProfile(prev => ({...prev, photoUrl}));
        await updateSession(dispatch, auth, {photoUrl});
      }
    } catch (error) {
      Alert.alert('Không đổi được ảnh', error.message);
    } finally {
      setUploading(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(dispatch)},
    ]);

  const confirmSignOutEverywhere = () =>
    Alert.alert(
      'Đăng xuất khỏi mọi thiết bị',
      'Tất cả thiết bị đang đăng nhập (kể cả máy này) sẽ phải đăng nhập lại.',
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Đăng xuất tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.logoutAllDevices();
            } catch (error) {
              Alert.alert('Không thực hiện được', error.message);
              return;
            }
            signOut(dispatch);
          },
        },
      ],
    );

  const name = profile?.username || auth.username || 'Học viên';
  const memberSince = profile?.createdAt
    ? `Thành viên từ tháng ${dayjs(profile.createdAt).format('M/YYYY')}`
    : profile?.email || auth.email;

  return (
    <View style={styles.container}>
      <DeleteAccountModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
      <HeroScrollView
        hero={
          <ProfileHero
            photoUrl={profile?.photoUrl || auth.photoUrl}
            name={name}
            subtitle={memberSince}
            onChangePhoto={changePhoto}
            uploading={uploading}
          />
        }
        title={name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.statsCard}>
          <Stat value={stats.sessions} label="Buổi tập" />
          <View style={styles.statDivider} />
          <Stat value={formatHours(stats.hours)} label="Thời gian" />
          <View style={styles.statDivider} />
          <Stat value={stats.trainers} label="Huấn luyện viên" />
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <InfoRow
              icon={<Sms size={18} color={appColors.primary} />}
              label="Email"
              value={profile?.email || auth.email}
            />
            <InfoRow
              icon={<Call size={18} color={appColors.primary} />}
              label="Số điện thoại"
              value={profile?.phoneNumber}
            />
            <InfoRow
              icon={<Cake size={18} color={appColors.primary} />}
              label="Ngày sinh"
              value={profile?.dob ? dayjs(profile.dob).format('DD/MM/YYYY') : ''}
            />
          </View>

          <MenuList
            title="Tài khoản"
            items={[
              {
                key: 'edit',
                title: 'Chỉnh sửa hồ sơ',
                subtitle: 'Tên, số điện thoại, ngày sinh',
                icon: Edit,
                onPress: () => navigation.navigate('EditProfileScreen'),
              },
              {
                key: 'bookings',
                title: 'Lịch tập của tôi',
                icon: Calendar,
                onPress: () => navigation.navigate('ClientBookings'),
              },
              {
                key: 'password',
                title: 'Đổi mật khẩu',
                icon: Lock,
                onPress: () => navigation.navigate('ChangePasswordScreen'),
              },
              {
                key: 'devices',
                title: 'Đăng xuất khỏi mọi thiết bị',
                subtitle: 'Dùng khi bạn nghi ngờ tài khoản bị lộ',
                icon: Mobile,
                onPress: confirmSignOutEverywhere,
              },
            ]}
          />

          <MenuList
            items={[
              {key: 'logout', title: 'Đăng xuất', icon: LogoutCurve, danger: true, onPress: confirmSignOut},
              {
                key: 'delete',
                title: 'Xóa tài khoản',
                icon: Trash,
                danger: true,
                onPress: () => setShowDeleteModal(true),
              },
            ]}
          />
        </View>
      </HeroScrollView>
    </View>
  );
};

const Stat = ({value, label}) => (
  <View style={styles.stat}>
    <TextComponent text={String(value)} size={18} font={fontFamilies.bold} numberOfLines={1} />
    <TextComponent text={label} size={12} color={appColors.textMuted} />
  </View>
);

export default ClientProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  statsCard: {
    flexDirection: 'row',
    marginTop: -28,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    ...shadow.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: appColors.border,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
