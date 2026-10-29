import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import dayjs from '../../utils/dayjs';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Horizontal day picker starting today (Vietnam time). `value` and the
// argument of `onChange` are 'YYYY-MM-DD' strings. Optional `marks`
// ({'YYYY-MM-DD': [color, ...]}) draws a dot per color under the day.
const DateStrip = ({value, onChange, days = 14, style, marks}) => {
  const dates = useMemo(() => {
    const today = dayjs().utcOffset(7 * 60).startOf('day');
    return Array.from({length: days}, (_, i) => today.add(i, 'day'));
  }, [days]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without this it stretches to fill a parent with flexGrow content.
      style={styles.scroll}
      contentContainerStyle={[styles.row, style]}>
      {dates.map((date, index) => {
        const key = date.format('YYYY-MM-DD');
        const selected = key === value;
        const dots = marks?.[key] || [];
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={[styles.item, selected && styles.itemSelected]}
            accessibilityRole="button"
            accessibilityState={{selected}}
            accessibilityLabel={`Ngày ${date.format('DD/MM')}`}>
            <TextComponent
              text={index === 0 ? 'Hôm nay' : WEEKDAYS[date.day()]}
              size={11}
              color={selected ? appColors.white : appColors.textMuted}
            />
            <TextComponent
              text={date.format('DD')}
              size={18}
              font={fontFamilies.semiBold}
              color={selected ? appColors.white : appColors.text}
            />
            <TextComponent
              text={`Th${date.format('M')}`}
              size={11}
              color={selected ? appColors.white : appColors.textMuted}
            />
            {marks ? (
              <View style={styles.dots}>
                {dots.map(color => (
                  <View
                    key={color}
                    style={[styles.dot, {backgroundColor: selected ? appColors.white : color}]}
                  />
                ))}
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default DateStrip;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  item: {
    width: 64,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemSelected: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
});
