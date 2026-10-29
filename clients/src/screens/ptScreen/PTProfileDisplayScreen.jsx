import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, Switch, View} from 'react-native';
import {Briefcase, Edit2, Location, Lock, LogoutCurve, Mobile, Moneys, Trash, User} from 'iconsax-react-native';
import {useSelector} from 'react-redux';
import {
  AppRefreshControl,
  AsyncView,
  Card,
  HeaderIconButton,
  HeroScrollView,
  InfoRow,
  MenuList,
  ProfileHero,
  ReviewItem,
  RowComponent,
  Screen,
  StatGroup,
  Tag,
  TextComponent,
} from '../../components';
import {DeleteAccountModal} from '../../modals';
import {useAsync, useProfilePhoto, useSignOut} from '../../hooks';
import ptApi from '../../apis/ptApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {formatCurrency, formatLocation} from '../../utils/format';
import {getSpecializationLabel} from '../../constants/labels';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';

const fetchProfilePage = async () => {
  const [profileRes, bookingsRes, reviewsRes] = await Promise.all([
    ptApi.getProfile(),
    ptApi.getBookings(),
    ptApi.getMyReviews({limit: 3}).catch(() => ({data: {data: []}})),
  ]);
  return {
    profile: profileRes.data?.data || null,
    clients: new Set((bookingsRes.data?.data || []).map(b => b.client?._id).filter(Boolean)).size,
    reviews: reviewsRes.data?.data || [],
  };
};

const PTProfileDisplayScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {data, setData, status, error, reload, refresh, refreshing} = useAsync(fetchProfilePage, {trigger: 'focus'});
  const {confirmSignOut, confirmSignOutEverywhere} = useSignOut();

  const updateProfile = patch => setData(prev => ({...prev, profile: {...prev.profile, ...patch}}));
  const {uploading, changePhoto} = useProfilePhoto(
    useCallback(
      photoUrl =>
        setData(prev => ({...prev, profile: {...prev.profile, user: {...prev.profile.user, photoUrl}}})),
      [setData],
    ),
  );

  const toggleAccepting = async value => {
    setTogglingAccepting(true);
    updateProfile({isAcceptingClients: value});
    try {
      await ptApi.updateProfile({isAcceptingClients: value});
    } catch (err) {
      updateProfile({isAcceptingClients: !value});
      Alert.alert('Không cập nhật được', err.message);
    } finally {
      setTogglingAccepting(false);
    }
  };

  const editButton = (
    <HeaderIconButton
      icon={<Edit2 size={20} color={appColors.white} />}
      onPress={() => navigation.navigate('PTProfileEdit')}
      accessibilityLabel="Sửa hồ sơ huấn luyện viên"
    />
  );

  const renderContent = () => {
    const {profile, clients, reviews} = data;
    const user = profile?.user || {};
    const specs = profile?.specializations || [];
    const accepting = profile?.isAcceptingClients !== false;

    return (
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
        refreshControl={<AppRefreshControl onGradient refreshing={refreshing} onRefresh={refresh} />}>
        <StatGroup
          style={styles.stats}
          items={[
            {
              label: profile?.numReviews > 0 ? `${profile.numReviews} đánh giá` : 'Chưa có đánh giá',
              value: profile?.numReviews > 0 ? `${Number(profile.rating).toFixed(1)} ★` : 'Mới',
            },
            {label: 'Buổi đã dạy', value: profile?.totalSessions || 0},
            {label: 'Học viên', value: clients},
          ]}
        />

        <View style={styles.body}>
          <Card style={styles.acceptRow}>
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
          </Card>

          <Card title="Giới thiệu">
            <TextComponent
              text={profile?.bio || 'Chưa có giới thiệu. Bấm biểu tượng bút để thêm.'}
              size={14}
              color={appColors.textMuted}
              styles={styles.bio}
            />
            {specs.length ? (
              <RowComponent wrap gap={spacing.sm}>
                {specs.map(spec => (
                  <Tag key={spec} label={getSpecializationLabel(spec)} />
                ))}
              </RowComponent>
            ) : null}
            <InfoRow
              layout="inline"
              icon={<Moneys size={18} color={appColors.primary} />}
              label="Giá mỗi giờ"
              value={profile?.hourlyRate ? formatCurrency(profile.hourlyRate) : '—'}
            />
            <InfoRow
              layout="inline"
              icon={<Briefcase size={18} color={appColors.primary} />}
              label="Kinh nghiệm"
              value={`${profile?.experienceYears || 0} năm`}
            />
            <InfoRow
              layout="inline"
              icon={<Location size={18} color={appColors.primary} />}
              label="Khu vực"
              value={formatLocation(profile?.location, '—')}
            />
          </Card>

          {reviews.length > 0 ? (
            <Card title="Đánh giá gần đây">
              {reviews.map(review => (
                <ReviewItem key={review._id} review={review} showDate />
              ))}
            </Card>
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
              {
                key: 'password',
                title: 'Đổi mật khẩu',
                icon: Lock,
                onPress: () => navigation.navigate('ChangePasswordScreen'),
              },
              {key: 'devices', title: 'Đăng xuất khỏi mọi thiết bị', icon: Mobile, onPress: confirmSignOutEverywhere},
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
    );
  };

  return (
    <Screen>
      <DeleteAccountModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
      <AsyncView status={status} error={error} onRetry={reload}>
        {renderContent}
      </AsyncView>
    </Screen>
  );
};

export default PTProfileDisplayScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  stats: {
    marginTop: -28,
    marginHorizontal: spacing.lg,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bio: {
    lineHeight: 21,
  },
});
