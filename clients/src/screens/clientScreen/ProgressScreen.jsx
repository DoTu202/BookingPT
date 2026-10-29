import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Chart, HambergerMenu, Profile2User, TickCircle, Timer1, Wallet, Weight} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  Avatar,
  Card,
  GradientView,
  HeaderIconButton,
  ListItem,
  Screen,
  ScreenHeader,
  StatCard,
  StateView,
  TextComponent,
} from '../../components';
import MonthlyChart from './components/MonthlyChart';
import {useAsync} from '../../hooks';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';
import {bookingHours} from '../../utils/booking';
import {formatBookingDate, formatCompactCurrency, formatHours} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';

const MONTHS_SHOWN = 6;

// Everything on this screen is derived from the client's completed sessions.
const buildSummary = completed => {
  const now = dayjs();
  const months = Array.from({length: MONTHS_SHOWN}, (_, i) => now.subtract(MONTHS_SHOWN - 1 - i, 'month')).map(
    month => ({
      label: `T${month.month() + 1}`,
      count: completed.filter(b => dayjs(b.bookingTime.startTime).isSame(month, 'month')).length,
    }),
  );
  return {
    sessions: completed.length,
    hours: completed.reduce((sum, b) => sum + bookingHours(b), 0),
    trainers: new Set(completed.map(b => b.pt?._id).filter(Boolean)).size,
    spent: completed.reduce((sum, b) => sum + (b.priceAtBooking || 0), 0),
    thisMonth: months[months.length - 1].count,
    months,
  };
};

const fetchCompleted = () =>
  clientApi.getMyBookings({status: 'completed', pageSize: 50}).then(res => res.data?.data || []);

const ProgressScreen = ({navigation}) => {
  const {data: completed, status, error, reload, refresh, refreshing} = useAsync(fetchCompleted, {
    trigger: 'focus',
    initialData: [],
  });
  const summary = useMemo(() => buildSummary(completed), [completed]);

  const renderContent = () =>
    completed.length === 0 ? (
      <StateView
        icon={<Weight size={30} color={appColors.primary} />}
        title="Chưa có buổi tập hoàn thành"
        message="Thống kê và lịch sử tập luyện sẽ xuất hiện sau buổi tập đầu tiên của bạn."
        actionText="Tìm huấn luyện viên"
        onAction={() => navigation.navigate('SearchPtScreen')}
      />
    ) : (
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
            text={summary.thisMonth > 0 ? 'Giữ vững phong độ nhé! 💪' : 'Đặt một buổi tập để giữ nhịp luyện tập.'}
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

        <Card title="Số buổi theo tháng" icon={<Chart size={18} color={appColors.primary} />}>
          <MonthlyChart months={summary.months} />
        </Card>

        <Card title="Lịch sử buổi tập">
          {completed.map((item, index) => (
            <ListItem
              key={item._id}
              divider={index > 0}
              leading={<Avatar uri={item.pt?.photoUrl} name={item.pt?.username} size={42} />}
              title={item.pt?.username || 'Huấn luyện viên'}
              subtitle={`${formatBookingDate(item.bookingTime.startTime)} • ${timeUtils.formatTo24HourTime(
                item.bookingTime.startTime,
              )}`}
              trailing={
                <TextComponent
                  text={formatHours(bookingHours(item))}
                  size={12}
                  font={fontFamilies.medium}
                  color={appColors.textMuted}
                />
              }
            />
          ))}
        </Card>
      </View>
    );

  return (
    <Screen>
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
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <AsyncView status={status} error={error} onRetry={reload} loadingTitle="Đang tải tiến độ...">
          {renderContent}
        </AsyncView>
      </ScrollView>
    </Screen>
  );
};

export default ProgressScreen;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
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
});
