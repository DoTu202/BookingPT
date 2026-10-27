import React, {useCallback, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Switch, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  Briefcase,
  Edit2,
  Location,
  Lock,
  LogoutCurve,
  Mobile,
  Moneys,
  Star1,
  Trash,
  User,
} from 'iconsax-react-native';
import {
  HeaderIconButton,
  HeroScrollView,
  MenuList,
  ProfileHero,
  StateView,
  TextComponent,
} from '../../components';
import DeleteAccountModal from '../../modals/DeleteAccountModal';
import ptApi from '../../apis/ptApi';
import profileApi from '../../apis/profileApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {signOut, updateSession} from '../../utils/session';
import {pickAndUploadProfilePhoto} from '../../utils/photoUpload';
import {formatCurrency, formatLocation, formatRelativeTime} from '../../utils/format';
import {getSpecializationLabel} from '../../constants/labels';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

const DetailRow = ({icon, label, value}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <TextComponent text={label} size={13} color={appColors.textMuted} styles={styles.flex} />
    <TextComponent text={value} size={14} font={fontFamilies.semiBold} />
  </View>
);

const PTProfileDisplayScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [clients, setClients] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, bookingsRes, reviewsRes] = await Promise.all([
        ptApi.getProfile(),
        ptApi.getBookings(),
        ptApi.getMyReviews({limit: 3}).catch(() => ({data: {data: []}})),
      ]);
      setProfile(profileRes.data?.data || null);
      setClients(new Set((bookingsRes.data?.data || []).map(b => b.client?._id).filter(Boolean)).size);
      setReviews(reviewsRes.data?.data || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changePhoto = async () => {
    setUploading(true);
    try {
      const photoUrl = await pickAndUploadProfilePhoto();
      if (photoUrl) {
        setProfile(prev => ({...prev, user: {...prev.user, photoUrl}}));
        await updateSession(dispatch, auth, {photoUrl});
      }
    } catch (err) {
      Alert.alert('Không đổi được ảnh', err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleAccepting = async value => {
    setTogglingAccepting(true);
    setProfile(prev => ({...prev, isAcceptingClients: value}));
    try {
      await ptApi.updateProfile({isAcceptingClients: value});
    } catch (err) {
      setProfile(prev => ({...prev, isAcceptingClients: !value}));
      Alert.alert('Không cập nhật được', err.message);
    } finally {
      setTogglingAccepting(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(dispatch)},
    ]);

  const confirmSignOutEverywhere = () =>
    Alert.alert('Đăng xuất khỏi mọi thiết bị', 'Tất cả thiết bị (kể cả máy này) sẽ phải đăng nhập lại.', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Đăng xuất tất cả',
        style: 'destructive',
        onPress: async () => {
          try {
            await profileApi.logoutAllDevices();
            signOut(dispatch);
          } catch (err) {
            Alert.alert('Không thực hiện được', err.message);
          }
        },
      },
    ]);

  if (status === 'loading') {
    return <StateView type="loading" />;
  }
  if (status === 'error') {
    return <StateView type="error" message={error} onAction={load} />;
  }

  const user = profile?.user || {};
  const specs = profile?.specializations || [];
  const accepting = profile?.isAcceptingClients !== false;

  const editButton = (
    <HeaderIconButton
      icon={<Edit2 size={20} color={appColors.white} />}
      onPress={() => navigation.navigate('PTProfileEdit')}
      accessibilityLabel="Sửa hồ sơ huấn luyện viên"
    />
  );

  return (
    <View style={styles.container}>
      <DeleteAccountModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
      <HeroScrollView
        hero={
          <ProfileHero
            photoUrl={user.photoUrl || auth.photoUrl}
            name={user.username || auth.username}
            subtitle={specs.length ? specs.slice(0, 3).map(getSpecializationLabel).join(' • ') : 'Huấn luyện viên'}
            onChangePhoto={changePhoto}
            uploading={uploading}
            right={editButton}
          />
        }
        title={user.username || auth.username}
        right={editButton}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={appColors.white}
            colors={[appColors.primary]}
          />
        }>
        <View style={styles.statsCard}>
          <Stat
            value={profile?.numReviews > 0 ? `${Number(profile.rating).toFixed(1)} ★` : 'Mới'}
            label={profile?.numReviews > 0 ? `${profile.numReviews} đánh giá` : 'Chưa có đánh giá'}
          />
          <View style={styles.statDivider} />
          <Stat value={profile?.totalSessions || 0} label="Buổi đã dạy" />
          <View style={styles.statDivider} />
          <Stat value={clients} label="Học viên" />
        </View>

        <View style={styles.body}>
          <View style={[styles.card, styles.acceptRow]}>
            <View style={styles.flex}>
              <TextComponent text="Nhận học viên mới" size={15} font={fontFamilies.semiBold} />
              <TextComponent
                text={accepting ? 'Bạn đang hiển thị trong kết quả tìm kiếm.' : 'Bạn đang ẩn khỏi kết quả tìm kiếm.'}
                size={12}
                color={appColors.textMuted}
              />
            </View>
            <Switch
              value={accepting}
              onValueChange={toggleAccepting}
              disabled={togglingAccepting}
              trackColor={{true: appColors.primary, false: appColors.border}}
              thumbColor={appColors.white}
              accessibilityLabel="Nhận học viên mới"
            />
          </View>

          <View style={styles.card}>
            <TextComponent text="Giới thiệu" size={15} font={fontFamilies.semiBold} />
            <TextComponent
              text={profile?.bio || 'Chưa có giới thiệu. Bấm biểu tượng bút để thêm.'}
              size={14}
              color={appColors.textMuted}
              styles={styles.bio}
            />
            {specs.length ? (
              <View style={styles.wrap}>
                {specs.map(spec => (
                  <View key={spec} style={styles.tag}>
                    <TextComponent
                      text={getSpecializationLabel(spec)}
                      size={12}
                      font={fontFamilies.medium}
                      color={appColors.primaryDark}
                    />
                  </View>
                ))}
              </View>
            ) : null}
            <DetailRow
              icon={<Moneys size={18} color={appColors.primary} />}
              label="Giá mỗi giờ"
              value={profile?.hourlyRate ? formatCurrency(profile.hourlyRate) : '—'}
            />
            <DetailRow
              icon={<Briefcase size={18} color={appColors.primary} />}
              label="Kinh nghiệm"
              value={`${profile?.experienceYears || 0} năm`}
            />
            <DetailRow
              icon={<Location size={18} color={appColors.primary} />}
              label="Khu vực"
              value={formatLocation(profile?.location, '—')}
            />
          </View>

          {reviews.length > 0 ? (
            <View style={styles.card}>
              <TextComponent text="Đánh giá gần đây" size={15} font={fontFamilies.semiBold} />
              {reviews.map(review => (
                <View key={review._id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <TextComponent
                      text={review.client?.username || 'Học viên'}
                      font={fontFamilies.medium}
                      styles={styles.flex}
                    />
                    <View style={styles.stars}>
                      {Array.from({length: 5}, (_, i) => (
                        <Star1
                          key={i}
                          size={12}
                          color={i < review.rating ? appColors.yellow : appColors.border}
                          variant="Bold"
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <TextComponent text={review.comment} size={13} color={appColors.textMuted} />
                  ) : null}
                  <TextComponent text={formatRelativeTime(review.createdAt)} size={11} color={appColors.placeholder} />
                </View>
              ))}
            </View>
          ) : null}

          <MenuList
            title="Tài khoản"
            items={[
              {
                key: 'personal',
                title: 'Thông tin cá nhân',
                subtitle: 'Tên, số điện thoại, ngày sinh',
                icon: User,
                onPress: () => navigation.navigate('EditProfileScreen'),
              },
              {key: 'password', title: 'Đổi mật khẩu', icon: Lock, onPress: () => navigation.navigate('ChangePasswordScreen')},
              {key: 'devices', title: 'Đăng xuất khỏi mọi thiết bị', icon: Mobile, onPress: confirmSignOutEverywhere},
            ]}
          />
          <MenuList
            items={[
              {key: 'logout', title: 'Đăng xuất', icon: LogoutCurve, danger: true, onPress: confirmSignOut},
              {key: 'delete', title: 'Xóa tài khoản', icon: Trash, danger: true, onPress: () => setShowDeleteModal(true)},
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
    <TextComponent text={label} size={12} color={appColors.textMuted} numberOfLines={1} />
  </View>
);

export default PTProfileDisplayScreen;

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
    paddingHorizontal: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: appColors.border,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bio: {
    lineHeight: 21,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  review: {
    gap: 2,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
});
