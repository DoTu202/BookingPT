import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Calendar, CalendarAdd, Chart1, Profile2User, ProfileCircle, Star1, Wallet} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  GreetingHero,
  HeaderNotificationButton,
  HeroScrollView,
  Screen,
  StatCard,
} from '../../components';
import {AttentionCard, ProfileSetupCard, QuickActions, TodayScheduleCard} from './components/home';
import {useAsync} from '../../hooks';
import ptApi from '../../apis/ptApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';
import {formatCompactCurrency} from '../../utils/format';
import {todayKey} from '../../utils/timeUtils';

// Today's sessions, in order. The other numbers come from the dashboard API
// (counting them from a page of bookings went wrong past 200 bookings).
const todaySessions = bookings =>
  bookings
    .filter(b => ['pending_confirmation', 'confirmed', 'completed'].includes(b.status))
    .sort((a, b) => new Date(a.bookingTime.startTime) - new Date(b.bookingTime.startTime));

const fetchHome = async () => {
  const [profileRes, bookingsRes, statsRes] = await Promise.all([
    ptApi.getProfile(),
    ptApi.getBookings({date: todayKey()}),
    ptApi.getDashboard({period: 'month'}),
  ]);
  return {
    profile: profileRes.data?.data?._id ? profileRes.data.data : null,
    bookings: bookingsRes.data?.data || [],
    stats: statsRes.data?.data || null,
  };
};

const PTHomeScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const {data, status, error, reload, refresh, refreshing} = useAsync(fetchHome, {trigger: 'focus'});

  const today = useMemo(() => todaySessions(data?.bookings || []), [data]);
  const name = auth.username || 'Huấn luyện viên';

  const renderBody = () => {
    const {profile, stats} = data;
    if (!profile) {
      return <ProfileSetupCard onCreate={() => navigation.navigate('PTProfile')} />;
    }
    return (
      <>
        <AttentionCard
          pending={stats?.attention.pending || 0}
          toComplete={stats?.attention.toComplete || 0}
          onPress={() => navigation.navigate('PTBookings')}
        />

        <View style={styles.grid}>
          <StatCard
            icon={<Calendar size={18} color={appColors.primary} variant="Bold" />}
            value={today.length}
            label="Buổi hôm nay"
            onPress={() => navigation.navigate('PTBookings')}
          />
          <StatCard
            icon={<Wallet size={18} color={appColors.success} variant="Bold" />}
            value={formatCompactCurrency(stats?.earnings.total)}
            label={`Thu nhập tháng (${stats?.sessions.completed || 0} buổi)`}
            tint={appColors.success}
            soft={appColors.successSoft}
            onPress={() => navigation.navigate('PTDashboard')}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            icon={<Profile2User size={18} color={appColors.info} variant="Bold" />}
            value={stats?.clients.active || 0}
            label="Học viên tháng này"
            onPress={() => navigation.navigate('PTDashboard')}
            tint={appColors.info}
            soft={appColors.infoSoft}
          />
          <StatCard
            icon={<Star1 size={18} color={appColors.warning} variant="Bold" />}
            value={profile.numReviews > 0 ? Number(profile.rating).toFixed(1) : 'Mới'}
            label={profile.numReviews > 0 ? `${profile.numReviews} đánh giá` : 'Chưa có đánh giá'}
            tint={appColors.warning}
            soft={appColors.warningSoft}
          />
        </View>

        <TodayScheduleCard
          bookings={today}
          onSeeAll={() => navigation.navigate('PTBookings')}
          onAddSlots={() => navigation.navigate('PTAvailability')}
        />

        <QuickActions
          actions={[
            {
              key: 'slots',
              icon: <CalendarAdd size={22} color={appColors.primary} />,
              label: 'Thêm lịch rảnh',
              onPress: () => navigation.navigate('PTAvailability'),
            },
            {
              key: 'stats',
              icon: <Chart1 size={22} color={appColors.primary} />,
              label: 'Thống kê',
              onPress: () => navigation.navigate('PTDashboard'),
            },
            {
              key: 'profile',
              icon: <ProfileCircle size={22} color={appColors.primary} />,
              label: 'Hồ sơ của tôi',
              onPress: () => navigation.navigate('PTProfile'),
            },
          ]}
        />
      </>
    );
  };

  return (
    <Screen>
      <HeroScrollView
        hero={
          <GreetingHero
            name={name}
            caption={dayjs().utcOffset(7 * 60).format('DD/MM/YYYY')}
            right={<HeaderNotificationButton />}
          />
        }
        title={name}
        subtitle="Tổng quan hôm nay"
        right={<HeaderNotificationButton />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<AppRefreshControl onGradient refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.body}>
          <AsyncView status={status} error={error} onRetry={reload} compact>
            {renderBody}
          </AsyncView>
        </View>
      </HeroScrollView>
    </Screen>
  );
};

export default PTHomeScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  body: {
    marginTop: -40,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
