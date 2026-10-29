import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {getBookingStatus} from '../../../../constants/labels';
import {spacing} from '../../../../constants/theme';

// Order of the stacked bar.
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

// Bookings of the period by status: one stacked bar + legend with counts.
const StatusBreakdownCard = ({counts}) => {
  const shown = STATUS_ORDER.filter(key => counts[key] > 0);
  const total = STATUS_ORDER.reduce((sum, key) => sum + (counts[key] || 0), 0);

  return (
    <Card title="Trạng thái lịch đặt" subtitle={`${total} lịch trong kỳ`}>
      {total === 0 ? (
        <TextComponent text="Chưa có lịch đặt nào trong kỳ này." size={13} color={appColors.textMuted} />
      ) : (
        <>
          <View style={styles.stack}>
            {shown.map(key => (
              <View key={key} style={{flex: counts[key], backgroundColor: STATUS_COLORS[key]}} />
            ))}
          </View>
          <View style={styles.legend}>
            {shown.map(key => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: STATUS_COLORS[key]}]} />
                <TextComponent text={getBookingStatus(key).label} size={12} styles={styles.flex} numberOfLines={1} />
                <TextComponent text={String(counts[key])} size={12} font={fontFamilies.semiBold} />
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
};

export default StatusBreakdownCard;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
});
