import React, {useCallback, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import dayjs from '../../utils/dayjs';
import {
  Chart,
  HambergerMenu,
  Profile2User,
  TickCircle,
  Timer1,
  Wallet,
  Weight,
} from 'iconsax-react-native';
import {
  Avatar,
  GradientView,
  HeaderIconButton,
  ScreenHeader,
  StatCard,
  StateView,
  TextComponent,
} from '../../components';
import {formatBookingDate} from '../../components/BookingCard';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, shadow, spacing} from '../../constants/theme';
import {formatCompactCurrency, formatHours} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';

const MONTHS_SHOWN = 6;

const hoursOf = booking =>
  (new Date(booking.bookingTime.endTime) - new Date(booking.bookingTime.startTime)) / 3600000;

// Everything on this screen is derived from the client's completed sessions.
const buildSummary = completed => {
  const now = dayjs();
  const months = Array.from({length: MONTHS_SHOWN}, (_, i) =>
    now.subtract(MONTHS_SHOWN - 1 - i, 'month'),
  ).map(month => ({
    label: `T${month.month() + 1}`,
    count: completed.filter(b => dayjs(b.bookingTime.startTime).isSame(month, 'month')).length,
  }));
  return {
    sessions: completed.length,
    hours: completed.reduce((sum, b) => sum + hoursOf(b), 0),
    trainers: new Set(completed.map(b => b.pt?._id).filter(Boolean)).size,
    spent: completed.reduce((sum, b) => sum + (b.priceAtBooking || 0), 0),
    thisMonth: months[months.length - 1].count,
    months,
  };
};

const MonthlyChart = ({months}) => {
  const max = Math.max(...months.map(m => m.count), 1);
  return (
    <View style={styles.chart} accessibilityLabel="Số buổi tập theo tháng">
      {months.map((month, index) => {
        const isCurrent = index === months.length - 1;
        return (
          <View key={month.label} style={styles.barColumn}>
            <TextComponent
              text={month.count ? String(month.count) : ''}
              size={11}
              font={fontFamilies.semiBold}
              color={appColors.textMuted}
            />
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {height: `${Math.max((month.count / max) * 100, month.count ? 8 : 0)}%`},
                  isCurrent && styles.barCurrent,
                ]}
              />
            </View>
            <TextComponent
              text={month.label}
              size={11}
              font={isCurrent ? fontFamilies.semiBold : fontFamilies.regular}
              color={isCurrent ? appColors.primary : appColors.textMuted}
            />
          </View>
        );
      })}
    </View>
  );
};

const ProgressScreen = ({navigation}) => {
  const [completed, setCompleted] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await clientApi.getMyBookings({status: 'completed', pageSize: 50});
      setCompleted(response.data?.data || []);
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

  const summary = useMemo(() => buildSummary(completed), [completed]);

  const renderContent = () => {
    if (status === 'loading') {
      return <StateView type="loading" title="Đang tải tiến độ..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={load} />;
    }
    if (completed.length === 0) {
      return (
        <StateView
          icon={<Weight size={30} color={appColors.primary} />}
          title="Chưa có buổi tập hoàn thành"
          message="Thống kê và lịch sử tập luyện sẽ xuất hiện sau buổi tập đầu tiên của bạn."
          actionText="Tìm huấn luyện viên"
          onAction={() => navigation.navigate('SearchPtScreen')}
        />
      );
    }
    return (
      <View style={styles.content}>
        <GradientView colors={appColors.gradientDark} direction="diagonal" style={styles.summary}>
          <TextComponent text="Tháng này" size={13} color="rgba(255,255,255,0.7)" />
          <TextComponent
            text={`${summary.thisMonth} buổi tập`}
            size={28}
            font={fontFamilies.bold}
            color={appColors.white}
          />
          <TextComponent
            text={
              summary.thisMonth > 0
                ? 'Giữ vững phong độ nhé! 💪'
                : 'Đặt một buổi tập để giữ nhịp luyện tập.'
            }
            size={13}
            color="rgba(255,255,255,0.8)"
          />
        </GradientView>

        <View style={styles.grid}>
          <StatCard
            icon={<TickCircle size={18} color={appColors.success} variant="Bold" />}
            value={summary.sessions}
            label="Tổng số buổi"
            tint={appColors.success}
            soft={appColors.successSoft}
          />
          <StatCard
            icon={<Timer1 size={18} color={appColors.info} variant="Bold" />}
            value={formatHours(summary.hours)}
            label="Thời gian tập"
            tint={appColors.info}
            soft={appColors.infoSoft}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            icon={<Profile2User size={18} color={appColors.primary2} variant="Bold" />}
            value={summary.trainers}
            label="Huấn luyện viên"
            tint={appColors.primary2}
            soft="#EEF0FE"
          />
          <StatCard
            icon={<Wallet size={18} color={appColors.primary} variant="Bold" />}
            value={formatCompactCurrency(summary.spent)}
            label="Đầu tư cho bản thân"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Chart size={18} color={appColors.primary} />
            <TextComponent text="Số buổi theo tháng" size={15} font={fontFamilies.semiBold} />
          </View>
          <MonthlyChart months={summary.months} />
        </View>

        <View style={styles.card}>
          <TextComponent text="Lịch sử buổi tập" size={15} font={fontFamilies.semiBold} />
          {completed.map((item, index) => (
            <View key={item._id} style={[styles.historyRow, index > 0 && styles.divider]}>
              <Avatar uri={item.pt?.photoUrl} name={item.pt?.username} size={42} />
              <View style={styles.flex}>
                <TextComponent
                  text={item.pt?.username || 'Huấn luyện viên'}
                  font={fontFamilies.medium}
                  numberOfLines={1}
                />
                <TextComponent
                  text={`${formatBookingDate(item.bookingTime.startTime)} • ${timeUtils.formatTo24HourTime(
                    item.bookingTime.startTime,
                  )}`}
                  size={12}
                  color={appColors.textMuted}
                />
              </View>
              <TextComponent
                text={formatHours(hoursOf(item))}
                size={12}
                font={fontFamilies.medium}
                color={appColors.textMuted}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tiến độ của tôi"
        left={
          <HeaderIconButton
            icon={<HambergerMenu size={header.iconSize} color={appColors.white} />}
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Mở menu"
          />
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default ProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summary: {
    borderRadius: radius.xl,
    padding: spacing.xl - 4,
    gap: 2,
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
    backgroundColor: appColors.background,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: appColors.primaryLight,
    borderRadius: radius.sm,
  },
  barCurrent: {
    backgroundColor: appColors.primary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
});
