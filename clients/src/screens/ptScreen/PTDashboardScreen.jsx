import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
  AppRefreshControl,
  BarChart,
  Card,
  Screen,
  ScreenHeader,
  SegmentedControl,
  StateView,
  TextComponent,
} from '../../components';
import {
  EarningsCard,
  NumberTile,
  PeriodNavigator,
  RateTile,
  RatingCard,
  StatusBreakdownCard,
  TopClientsCard,
  WeekdayCard,
} from './components/dashboard';
import {useAsync} from '../../hooks';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';
import {formatCompactCurrency, formatCurrency} from '../../utils/format';
import {PERIOD_OPTIONS, bucketLabel, bucketTitle, periodTitle, rangeLabel} from '../../utils/dashboard';

const MAX_OFFSET = 60;
const CHART_METRICS = [
  {key: 'earnings', label: 'Thu nhập'},
  {key: 'sessions', label: 'Số buổi'},
];

const chartSubtitle = (data, metric, selectedItem) => {
  if (selectedItem) {
    return metric === 'earnings'
      ? `${formatCurrency(selectedItem.earnings)} • ${selectedItem.sessions} buổi`
      : `${selectedItem.sessions} buổi • ${formatCurrency(selectedItem.earnings)}`;
  }
  const total = metric === 'earnings' ? formatCurrency(data.earnings.total) : `${data.sessions.completed} buổi`;
  return data.series.some(item => item[metric] > 0)
    ? `Tổng: ${total} • chạm vào cột để xem chi tiết`
    : `Tổng: ${total}`;
};

const PTDashboardScreen = ({navigation}) => {
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);
  const [metric, setMetric] = useState('earnings');
  const [selected, setSelected] = useState(null);

  const fetchDashboard = useCallback(
    () => ptApi.getDashboard({period, offset}).then(res => res.data?.data || null),
    [period, offset],
  );
  // `data` keeps the previous period while the next one loads.
  const {data, status, error, fetching, refreshing, reload, refresh} = useAsync(fetchDashboard);

  useEffect(() => {
    setSelected(null);
  }, [period, offset]);

  const changePeriod = key => {
    setPeriod(key);
    setOffset(0);
  };

  const isCurrent = data && data.period === period && data.offset === offset;

  const renderContent = () => {
    if (!data) {
      return status === 'error' ? (
        <StateView type="error" message={error} onAction={reload} />
      ) : (
        <StateView type="loading" title="Đang tải thống kê..." />
      );
    }

    const selectedItem = selected !== null ? data.series[selected] : null;
    return (
      <View style={[styles.content, !isCurrent && styles.stale]}>
        <EarningsCard data={data} />

        <Card
          title={selectedItem ? bucketTitle(data.period, selectedItem.key) : 'Diễn biến'}
          subtitle={chartSubtitle(data, metric, selectedItem)}>
          <SegmentedControl options={CHART_METRICS} value={metric} onChange={setMetric} />
          <BarChart
            data={data.series.map(item => ({key: item.key, value: item[metric]}))}
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

        <StatusBreakdownCard counts={data.status} />
        <WeekdayCard weekdays={data.weekdays} />
        <TopClientsCard clients={data.topClients} />
        <RatingCard rating={data.rating} />
      </View>
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Thống kê" subtitle="Hiệu quả công việc của bạn" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={changePeriod} />
        <PeriodNavigator
          title={offset <= 1 || isCurrent ? periodTitle(period, offset, data?.range) : '...'}
          subtitle={isCurrent ? rangeLabel(period, data.range) : null}
          loading={fetching && Boolean(data)}
          canGoBack={offset < MAX_OFFSET}
          canGoForward={offset > 0}
          onBack={() => setOffset(value => Math.min(value + 1, MAX_OFFSET))}
          onForward={() => setOffset(value => Math.max(value - 1, 0))}
        />
        {status === 'error' && data ? (
          <TextComponent text={error} size={12} color={appColors.danger} styles={styles.center} />
        ) : null}
        {renderContent()}
      </ScrollView>
    </Screen>
  );
};

export default PTDashboardScreen;

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
