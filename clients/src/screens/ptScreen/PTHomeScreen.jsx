import React, {useCallback, useMemo, useState} from 'react';
import {RefreshControl, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import dayjs from '../../utils/dayjs';
import {
  ArrowRight2,
  Calendar,
  CalendarAdd,
  CalendarTick,
  Chart1,
  Profile2User,
  ProfileCircle,
  Star1,
  TaskSquare,
  Wallet,
} from 'iconsax-react-native';
import {
  Avatar,
  ButtonComponent,
  GradientView,
  HeroScrollView,
  StatCard,
  StateView,
  StatusBadge,
  TextComponent,
} from '../../components';
import HeaderNotificationButton from '../../components/HeaderNotificationButton';
import {todayKey} from '../../components/DateStrip';
import ptApi from '../../apis/ptApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, shadow, spacing} from '../../constants/theme';
import {formatCompactCurrency} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';

const vn = iso => dayjs(iso).utcOffset(7 * 60);

const greeting = () => {
  const hour = timeUtils.getCurrentVietnamHour();
  return hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
};

// Today's sessions, in order. The other numbers come from the dashboard API
// (counting them from a page of bookings went wrong past 200 bookings).
const todaySessions = bookings =>
  bookings
    .filter(b => ['pending_confirmation', 'confirmed', 'completed'].includes(b.status))
    .sort((a, b) => new Date(a.bookingTime.startTime) - new Date(b.bookingTime.startTime));

const QuickAction = ({icon, label, onPress}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
    <View style={styles.quickIcon}>{icon}</View>
    <TextComponent text={label} size={12} font={fontFamilies.medium} styles={styles.center} numberOfLines={2} />
  </TouchableOpacity>
);

const PTHomeScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, bookingsRes, statsRes] = await Promise.all([
        ptApi.getProfile(),
        ptApi.getBookings({date: todayKey()}),
        ptApi.getDashboard({period: 'month'}),
      ]);
      setProfile(profileRes.data?.data?._id ? profileRes.data.data : null);
      setBookings(bookingsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
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

  const today = useMemo(() => todaySessions(bookings), [bookings]);
  const pending = stats?.attention.pending || 0;
  const toComplete = stats?.attention.toComplete || 0;
  const needsAttention = pending + toComplete;

  const renderBody = () => {
    if (status === 'loading') {
      return <StateView type="loading" compact />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={load} compact />;
    }
    if (!profile) {
      return (
        <View style={[styles.floatCard, styles.setupCard]}>
          <View style={styles.setupIcon}>
            <ProfileCircle size={32} color={appColors.primary} variant="Bold" />
          </View>
          <TextComponent text="Hoàn thiện hồ sơ của bạn" size={18} font={fontFamilies.bold} styles={styles.center} />
          <TextComponent
            text="Thêm chuyên môn, giá và khu vực để xuất hiện trong kết quả tìm kiếm và bắt đầu nhận học viên."
            size={14}
            color={appColors.textMuted}
            styles={styles.center}
          />
          <ButtonComponent
            text="Tạo hồ sơ ngay"
            type="primary"
            onPress={() => navigation.navigate('PTProfile')}
            fullWidth
          />
        </View>
      );
    }
    return (
      <>
        <TouchableOpacity
          style={styles.floatCard}
          onPress={() => navigation.navigate('PTBookings')}
          activeOpacity={0.9}
          accessibilityRole="button">
          <View style={styles.attentionRow}>
            <View style={[styles.attentionIcon, needsAttention > 0 && styles.attentionIconActive]}>
              <TaskSquare size={22} color={needsAttention > 0 ? appColors.white : appColors.success} variant="Bold" />
            </View>
            <View style={styles.flex}>
              <TextComponent
                text={needsAttention > 0 ? 'Cần bạn xử lý' : 'Bạn đã xử lý hết'}
                size={16}
                font={fontFamilies.semiBold}
              />
              <TextComponent
                text={
                  needsAttention > 0
                    ? `${pending} yêu cầu chờ xác nhận • ${toComplete} buổi chờ hoàn thành`
                    : 'Không có yêu cầu nào đang chờ.'
                }
                size={13}
                color={appColors.textMuted}
              />
            </View>
            <ArrowRight2 size={18} color={appColors.placeholder} />
          </View>
        </TouchableOpacity>

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

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TextComponent text="Lịch hôm nay" size={16} font={fontFamilies.semiBold} />
            <TouchableOpacity onPress={() => navigation.navigate('PTBookings')} accessibilityRole="button">
              <TextComponent text="Xem tất cả" size={13} font={fontFamilies.semiBold} color={appColors.primary} />
            </TouchableOpacity>
          </View>
          {today.length === 0 ? (
            <StateView
              compact
              icon={<CalendarTick size={28} color={appColors.primary} />}
              title="Hôm nay chưa có buổi tập"
              message="Mở thêm khung giờ rảnh để học viên đặt lịch."
              actionText="Thêm lịch rảnh"
              onAction={() => navigation.navigate('PTAvailability')}
            />
          ) : (
            today.map((booking, index) => (
              <View key={booking._id} style={[styles.todayRow, index > 0 && styles.divider]}>
                <View style={styles.timeBox}>
                  <TextComponent
                    text={timeUtils.formatTo24HourTime(booking.bookingTime.startTime)}
                    size={14}
                    font={fontFamilies.bold}
                    color={appColors.primary}
                  />
                  <TextComponent
                    text={timeUtils.formatTo24HourTime(booking.bookingTime.endTime)}
                    size={11}
                    color={appColors.textMuted}
                  />
                </View>
                <Avatar uri={booking.client?.photoUrl} name={booking.client?.username} size={38} />
                <TextComponent
                  text={booking.client?.username || 'Học viên'}
                  font={fontFamilies.medium}
                  numberOfLines={1}
                  styles={styles.flex}
                />
                <StatusBadge status={booking.status} />
              </View>
            ))
          )}
        </View>

        <View style={styles.quickRow}>
          <QuickAction
            icon={<CalendarAdd size={22} color={appColors.primary} />}
            label="Thêm lịch rảnh"
            onPress={() => navigation.navigate('PTAvailability')}
          />
          <QuickAction
            icon={<Chart1 size={22} color={appColors.primary} />}
            label="Thống kê"
            onPress={() => navigation.navigate('PTDashboard')}
          />
          <QuickAction
            icon={<ProfileCircle size={22} color={appColors.primary} />}
            label="Hồ sơ của tôi"
            onPress={() => navigation.navigate('PTProfile')}
          />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <HeroScrollView
        hero={
          <GradientView style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={styles.flex}>
                <TextComponent text={`${greeting()},`} size={15} color="rgba(255,255,255,0.85)" />
                <TextComponent
                  text={auth.username || 'Huấn luyện viên'}
                  size={26}
                  font={fontFamilies.bold}
                  color={appColors.white}
                  numberOfLines={1}
                />
                <TextComponent
                  text={vn(new Date().toISOString()).format('DD/MM/YYYY')}
                  size={13}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
              <HeaderNotificationButton />
            </View>
          </GradientView>
        }
        title={auth.username || 'Huấn luyện viên'}
        subtitle="Tổng quan hôm nay"
        right={<HeaderNotificationButton />}
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
        <View style={styles.body}>{renderBody()}</View>
      </HeroScrollView>
    </View>
  );
};

export default PTHomeScreen;

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
  center: {
    textAlign: 'center',
  },
  hero: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: 60,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  body: {
    marginTop: -40,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  floatCard: {
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  setupCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  setupIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  attentionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: appColors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionIconActive: {
    backgroundColor: appColors.primary,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  timeBox: {
    width: 48,
    alignItems: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
