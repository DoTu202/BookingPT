import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {ArrowLeft2, ArrowRight2, Crown1, Star1, TrendDown, TrendUp} from 'iconsax-react-native';
import {
  Avatar,
  BarChart,
  GradientView,
  RingProgress,
  ScreenHeader,
  SegmentedControl,
  StateView,
  TextComponent,
} from '../../components';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';
import {getBookingStatus} from '../../constants/labels';
import {formatCompactCurrency, formatCurrency, formatHours} from '../../utils/format';
import {
  PERIOD_OPTIONS,
  WEEKDAY_SHORT,
  bucketLabel,
  bucketTitle,
  comparisonLabel,
  formatRate,
  percentChange,
  periodTitle,
  rangeLabel,
} from '../../utils/dashboard';

const MAX_OFFSET = 60;
const CHART_METRICS = [
  {key: 'earnings', label: 'Thu nhập'},
  {key: 'sessions', label: 'Số buổi'},
];
// Order of the status breakdown bar.
const STATUS_ORDER = [
  'completed',
  'confirmed',
  'pending_confirmation',
  'cancelled_by_client',
  'cancelled_by_pt',
  'rejected_by_pt',
  'rejected_by_system',
];
const STATUS_COLORS = {
  completed: appColors.info,
  confirmed: appColors.success,
  pending_confirmation: appColors.warning,
  cancelled_by_client: appColors.danger,
  cancelled_by_pt: '#F28B8E',
  rejected_by_pt: appColors.textDisabled,
  rejected_by_system: appColors.borderStrong,
};

const Card = ({title, subtitle, right, children}) => (
  <View style={styles.card}>
    {title ? (
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <TextComponent text={title} size={16} font={fontFamilies.semiBold} />
          {subtitle ? <TextComponent text={subtitle} size={12} color={appColors.textMuted} /> : null}
        </View>
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

// Change badge on the dark earnings card.
const Delta = ({current, previous, period}) => {
  const change = percentChange(current, previous);
  if (change === null) {
    return (
      <TextComponent
        text={current > 0 ? 'Kỳ trước chưa có thu nhập để so sánh' : 'Chưa có thu nhập trong kỳ này'}
        size={12}
        color="rgba(255,255,255,0.7)"
      />
    );
  }
  const up = change >= 0;
  const Icon = up ? TrendUp : TrendDown;
  return (
    <View style={styles.deltaRow}>
      <View style={[styles.deltaPill, up ? styles.deltaUp : styles.deltaDown]}>
        <Icon size={14} color={up ? '#4ADE80' : '#FF8A8D'} />
        <TextComponent
          text={`${up ? '+' : ''}${change}%`}
          size={12}
          font={fontFamilies.semiBold}
          color={up ? '#4ADE80' : '#FF8A8D'}
        />
      </View>
      <TextComponent text={comparisonLabel(period)} size={12} color="rgba(255,255,255,0.7)" />
    </View>
  );
};

const RateTile = ({title, value, caption, color}) => (
  <View style={styles.tile}>
    <RingProgress progress={value} color={color} size={56} stroke={6}>
      <TextComponent text={formatRate(value)} size={12} font={fontFamilies.bold} />
    </RingProgress>
    <View style={styles.flex}>
      <TextComponent text={title} size={13} font={fontFamilies.semiBold} numberOfLines={2} />
      <TextComponent text={caption} size={11} color={appColors.textMuted} numberOfLines={2} />
    </View>
  </View>
);

const NumberTile = ({title, value, caption}) => (
  <View style={[styles.tile, styles.numberTile]}>
    <TextComponent text={String(value)} size={22} font={fontFamilies.bold} />
    <TextComponent text={title} size={13} font={fontFamilies.semiBold} numberOfLines={1} />
    <TextComponent text={caption} size={11} color={appColors.textMuted} numberOfLines={1} />
  </View>
);

const PTDashboardScreen = ({navigation}) => {
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState('earnings');
  const [selected, setSelected] = useState(null);
  // Ignores a slower response for a period the user already left.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setFetching(true);
    try {
      const res = await ptApi.getDashboard({period, offset});
      if (id === requestId.current) {
        setData(res.data?.data || null);
        setStatus('ready');
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(err.message);
        setStatus('error');
      }
    } finally {
      if (id === requestId.current) {
        setFetching(false);
        setRefreshing(false);
      }
    }
  }, [period, offset]);

  useEffect(() => {
    setSelected(null);
    load();
  }, [load]);

  const changePeriod = key => {
    setPeriod(key);
    setOffset(0);
  };

  // `data` still holds the previous selection while the new one loads.
  const isCurrent = data && data.period === period && data.offset === offset;

  const renderContent = () => {
    if (status === 'loading' && !data) {
      return <StateView type="loading" title="Đang tải thống kê..." />;
    }
    if (status === 'error' && !data) {
      return <StateView type="error" message={error} onAction={load} />;
    }

    const series = data.series.map(item => ({key: item.key, value: item[metric]}));
    const selectedItem = selected !== null ? data.series[selected] : null;
    const chartTotal = metric === 'earnings' ? formatCurrency(data.earnings.total) : `${data.sessions.completed} buổi`;
    const statusTotal = STATUS_ORDER.reduce((sum, key) => sum + (data.status[key] || 0), 0);
    const busiest = Math.max(...data.weekdays);
    const ratingMax = Math.max(1, ...Object.values(data.rating.distribution));

    return (
      <View style={[styles.content, !isCurrent && styles.stale]}>
        <GradientView colors={appColors.gradientDark} direction="diagonal" style={styles.earnings}>
          <TextComponent text="Thu nhập" size={13} color="rgba(255,255,255,0.75)" />
          <TextComponent
            text={formatCurrency(data.earnings.total)}
            size={30}
            font={fontFamilies.bold}
            color={appColors.white}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
          <Delta current={data.earnings.total} previous={data.earnings.previous} period={data.period} />
          <View style={styles.earningsStats}>
            {[
              {label: 'Buổi hoàn thành', value: String(data.sessions.completed)},
              {label: 'Giờ dạy', value: formatHours(data.sessions.hours).replace(' giờ', '')},
              {
                label: 'Dự kiến thêm',
                value: data.earnings.expected > 0 ? formatCompactCurrency(data.earnings.expected) : '0',
              },
            ].map(item => (
              <View key={item.label} style={styles.earningsStat}>
                <TextComponent text={item.value} size={17} font={fontFamilies.bold} color={appColors.white} />
                <TextComponent text={item.label} size={11} color="rgba(255,255,255,0.7)" />
              </View>
            ))}
          </View>
        </GradientView>

        <Card
          title={selectedItem ? bucketTitle(data.period, selectedItem.key) : 'Diễn biến'}
          subtitle={
            selectedItem
              ? metric === 'earnings'
                ? `${formatCurrency(selectedItem.earnings)} • ${selectedItem.sessions} buổi`
                : `${selectedItem.sessions} buổi • ${formatCurrency(selectedItem.earnings)}`
              : data.series.some(item => item[metric] > 0)
                ? `Tổng: ${chartTotal} • chạm vào cột để xem chi tiết`
                : `Tổng: ${chartTotal}`
          }>
          <SegmentedControl options={CHART_METRICS} value={metric} onChange={setMetric} />
          <BarChart
            data={series}
            color={metric === 'earnings' ? appColors.primary : appColors.info}
            selectedIndex={selected}
            onSelect={setSelected}
            labelFor={key => bucketLabel(data.period, key)}
            formatAxis={value => (metric === 'earnings' ? formatCompactCurrency(value) : String(Math.round(value)))}
            emptyText={metric === 'earnings' ? 'Chưa có thu nhập trong kỳ này' : 'Chưa có buổi hoàn thành trong kỳ này'}
          />
        </Card>

        <View style={styles.grid}>
          <RateTile
            title="Tỉ lệ hoàn thành"
            value={data.completionRate}
            caption={`${data.status.cancelled_by_client + data.status.cancelled_by_pt} buổi bị huỷ`}
            color={appColors.success}
          />
          <RateTile
            title="Lấp đầy lịch rảnh"
            value={data.slots.fillRate}
            caption={`${data.slots.booked}/${data.slots.booked + data.slots.available} khung giờ`}
            color={appColors.primary}
          />
        </View>
        <View style={styles.grid}>
          <NumberTile title="Học viên" value={data.clients.active} caption={`${data.clients.new} học viên mới`} />
          <NumberTile
            title="Đánh giá"
            value={data.rating.inPeriod.average !== null ? data.rating.inPeriod.average.toFixed(1) : '—'}
            caption={`${data.rating.inPeriod.count} đánh giá trong kỳ`}
          />
        </View>

        <Card title="Trạng thái lịch đặt" subtitle={`${statusTotal} lịch trong kỳ`}>
          {statusTotal === 0 ? (
            <TextComponent text="Chưa có lịch đặt nào trong kỳ này." size={13} color={appColors.textMuted} />
          ) : (
            <>
              <View style={styles.stack}>
                {STATUS_ORDER.filter(key => data.status[key] > 0).map(key => (
                  <View key={key} style={{flex: data.status[key], backgroundColor: STATUS_COLORS[key]}} />
                ))}
              </View>
              <View style={styles.legend}>
                {STATUS_ORDER.filter(key => data.status[key] > 0).map(key => (
                  <View key={key} style={styles.legendItem}>
                    <View style={[styles.dot, {backgroundColor: STATUS_COLORS[key]}]} />
                    <TextComponent text={getBookingStatus(key).label} size={12} styles={styles.flex} numberOfLines={1} />
                    <TextComponent text={String(data.status[key])} size={12} font={fontFamilies.semiBold} />
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <Card title="Ngày bận rộn" subtitle="Số buổi đã xác nhận và hoàn thành theo thứ">
          <View style={styles.weekdays}>
            {data.weekdays.map((count, index) => (
              <View key={WEEKDAY_SHORT[index]} style={styles.weekday}>
                <TextComponent text={String(count)} size={11} color={appColors.textMuted} />
                <View style={styles.weekdayTrack}>
                  <View
                    style={[
                      styles.weekdayFill,
                      {
                        height: `${busiest > 0 ? (count / busiest) * 100 : 0}%`,
                        backgroundColor: count === busiest && busiest > 0 ? appColors.primary : appColors.primaryLight,
                      },
                    ]}
                  />
                </View>
                <TextComponent text={WEEKDAY_SHORT[index]} size={11} font={fontFamilies.medium} />
              </View>
            ))}
          </View>
        </Card>

        <Card title="Học viên nổi bật" subtitle="Theo số buổi hoàn thành trong kỳ">
          {data.topClients.length === 0 ? (
            <TextComponent text="Chưa có buổi tập hoàn thành trong kỳ này." size={13} color={appColors.textMuted} />
          ) : (
            data.topClients.map((client, index) => (
              <View key={client._id} style={[styles.clientRow, index > 0 && styles.divider]}>
                <View style={styles.rank}>
                  {index === 0 ? (
                    <Crown1 size={16} color={appColors.warning} variant="Bold" />
                  ) : (
                    <TextComponent text={String(index + 1)} size={13} font={fontFamilies.bold} color={appColors.textMuted} />
                  )}
                </View>
                <Avatar uri={client.photoUrl} name={client.username} size={36} />
                <TextComponent
                  text={client.username || 'Tài khoản đã xoá'}
                  font={fontFamilies.medium}
                  numberOfLines={1}
                  styles={styles.flex}
                />
                <View style={styles.alignEnd}>
                  <TextComponent text={`${client.sessions} buổi`} size={13} font={fontFamilies.semiBold} />
                  <TextComponent text={formatCompactCurrency(client.earnings)} size={11} color={appColors.textMuted} />
                </View>
              </View>
            ))
          )}
        </Card>

        <Card
          title="Đánh giá"
          subtitle={data.rating.count > 0 ? `${data.rating.count} đánh giá từ trước đến nay` : 'Chưa có đánh giá'}
          right={
            <View style={styles.ratingBadge}>
              <Star1 size={16} color={appColors.warning} variant="Bold" />
              <TextComponent
                text={data.rating.count > 0 ? Number(data.rating.average).toFixed(1) : '—'}
                size={16}
                font={fontFamilies.bold}
              />
            </View>
          }>
          {[5, 4, 3, 2, 1].map(stars => (
            <View key={stars} style={styles.ratingRow}>
              <TextComponent text={`${stars}`} size={12} font={fontFamilies.medium} styles={styles.ratingLabel} />
              <Star1 size={12} color={appColors.warning} variant="Bold" />
              <View style={styles.ratingTrack}>
                <View
                  style={[styles.ratingFill, {width: `${(data.rating.distribution[stars] / ratingMax) * 100}%`}]}
                />
              </View>
              <TextComponent
                text={String(data.rating.distribution[stars])}
                size={12}
                color={appColors.textMuted}
                styles={styles.ratingCount}
              />
            </View>
          ))}
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Thống kê" subtitle="Hiệu quả công việc của bạn" onBack={() => navigation.goBack()} />
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
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={changePeriod} />
        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[styles.periodButton, offset >= MAX_OFFSET && styles.disabled]}
            onPress={() => setOffset(value => Math.min(value + 1, MAX_OFFSET))}
            disabled={offset >= MAX_OFFSET}
            accessibilityRole="button"
            accessibilityLabel="Kỳ trước">
            <ArrowLeft2 size={18} color={appColors.text} />
          </TouchableOpacity>
          <View style={styles.periodTitle}>
            <View style={styles.periodTitleRow}>
              <TextComponent
                text={offset <= 1 || isCurrent ? periodTitle(period, offset, data?.range) : '...'}
                size={16}
                font={fontFamilies.semiBold}
              />
              {fetching && data ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
            </View>
            {isCurrent ? (
              <TextComponent text={rangeLabel(period, data.range)} size={12} color={appColors.textMuted} />
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.periodButton, offset === 0 && styles.disabled]}
            onPress={() => setOffset(value => Math.max(value - 1, 0))}
            disabled={offset === 0}
            accessibilityRole="button"
            accessibilityLabel="Kỳ sau">
            <ArrowRight2 size={18} color={appColors.text} />
          </TouchableOpacity>
        </View>
        {status === 'error' && data ? (
          <TextComponent text={error} size={12} color={appColors.danger} styles={styles.center} />
        ) : null}
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default PTDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  content: {
    gap: spacing.md,
  },
  stale: {
    opacity: 0.5,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  disabled: {
    opacity: 0.35,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  periodTitle: {
    flex: 1,
    alignItems: 'center',
  },
  periodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earnings: {
    borderRadius: radius.xl,
    padding: spacing.lg + 4,
    gap: spacing.xs,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  deltaUp: {
    backgroundColor: 'rgba(22,163,74,0.25)',
  },
  deltaDown: {
    backgroundColor: 'rgba(229,72,77,0.25)',
  },
  earningsStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  earningsStat: {
    flex: 1,
    gap: 2,
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
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  numberTile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  stack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
    columnGap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    width: '45%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekdays: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekday: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekdayTrack: {
    width: '100%',
    maxWidth: 28,
    height: 80,
    borderRadius: 8,
    backgroundColor: appColors.gray6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekdayFill: {
    width: '100%',
    borderRadius: 8,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  rank: {
    width: 20,
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: appColors.warningSoft,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingLabel: {
    width: 10,
  },
  ratingTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.gray6,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: appColors.warning,
  },
  ratingCount: {
    width: 24,
    textAlign: 'right',
  },
});
