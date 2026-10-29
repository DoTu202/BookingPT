import React from 'react';
import {StyleSheet, View} from 'react-native';
import {TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {SLOT_STATUS} from './constants';

// Free / booked / locked counts over the loaded window.
const AvailabilityTotals = ({available, booked, locked}) => {
  const items = [
    {label: 'Còn trống', value: available, ...SLOT_STATUS.available},
    {label: 'Đã đặt', value: booked, ...SLOT_STATUS.booked},
    {label: 'Đã khóa', value: locked, ...SLOT_STATUS.unavailable_by_pt},
  ];
  return (
    <View style={styles.row}>
      {items.map(item => (
        <View key={item.label} style={[styles.total, {backgroundColor: item.soft}]}>
          <TextComponent text={String(item.value)} size={20} font={fontFamilies.bold} color={item.color} />
          <TextComponent text={item.label} size={12} color={appColors.textMuted} />
        </View>
      ))}
    </View>
  );
};

export default AvailabilityTotals;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  total: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
});
