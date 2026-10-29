import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, ProgressBar, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';
import {WEEKDAY_SHORT} from '../../../../utils/dashboard';

// Sessions per weekday as vertical bars; the busiest day is highlighted.
const WeekdayCard = ({weekdays}) => {
  const busiest = Math.max(...weekdays);
  return (
    <Card title="Ngày bận rộn" subtitle="Số buổi đã xác nhận và hoàn thành theo thứ">
      <View style={styles.row}>
        {weekdays.map((count, index) => (
          <View key={WEEKDAY_SHORT[index]} style={styles.day}>
            <TextComponent text={String(count)} size={11} color={appColors.textMuted} />
            <ProgressBar
              vertical
              value={busiest > 0 ? count / busiest : 0}
              color={count === busiest && busiest > 0 ? appColors.primary : appColors.primaryLight}
              style={styles.bar}
            />
            <TextComponent text={WEEKDAY_SHORT[index]} size={11} font={fontFamilies.medium} />
          </View>
        ))}
      </View>
    </Card>
  );
};

export default WeekdayCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  bar: {
    width: '100%',
    maxWidth: 28,
    height: 80,
  },
});
