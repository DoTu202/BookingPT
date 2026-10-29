import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Cake, Calendar, Call, Edit, Lock, LogoutCurve, Mobile, Sms, Trash} from 'iconsax-react-native';
import {Card, HeroScrollView, InfoRow, MenuList, ProfileHero, Screen, StatGroup} from '../../components';
import {DeleteAccountModal} from '../../modals';
import {useProfilePhoto, useSignOut} from '../../hooks';
import profileApi from '../../apis/profileApi';
import clientApi from '../../apis/clientApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';
import {bookingHours} from '../../utils/booking';
import {formatHours} from '../../utils/format';

const ClientProfileScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({sessions: 0, hours: 0, trainers: 0});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {confirmSignOut, confirmSignOutEverywhere} = useSignOut();
  const {uploading, changePhoto} = useProfilePhoto(
    useCallback(photoUrl => setProfile(prev => ({...prev, photoUrl})), []),
  );

  // Reload on focus so edits made on EditProfileScreen show up. Both parts
  // are optional: the screen falls back to the session data.
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
            hours: completed.reduce((sum, b) => sum + bookingHours(b), 0),
            trainers: new Set(completed.map(b => b.pt?._id).filter(Boolean)).size,
          });
        })
        .catch(() => {});
    }, []),
  );

  const name = profile?.username || auth.username || 'Học viên';
  const memberSince = profile?.createdAt
    ? `Thành viên từ tháng ${dayjs(profile.createdAt).format('M/YYYY')}`
    : profile?.email || auth.email;

  return (
    <Screen>
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
        <StatGroup
          style={styles.stats}
          items={[
            {label: 'Buổi tập', value: stats.sessions},
            {label: 'Thời gian', value: formatHours(stats.hours)},
            {label: 'Huấn luyện viên', value: stats.trainers},
          ]}
        />

        <View style={styles.body}>
          <Card gap={spacing.lg}>
            <InfoRow icon={<Sms size={18} color={appColors.primary} />} label="Email" value={profile?.email || auth.email} />
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
          </Card>

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
    </Screen>
  );
};

export default ClientProfileScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  stats: {
    marginTop: -28,
    marginHorizontal: spacing.lg,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
});
