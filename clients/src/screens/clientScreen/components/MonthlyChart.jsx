import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ProgressBar, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {radius, spacing} from '../../../constants/theme';

// Sessions per month ([{label, count}]); the last month is the current one.
const MonthlyChart = ({months}) => {
  const max = Math.max(...months.map(m => m.count), 1);
  return (
    <View style={styles.chart} accessibilityLabel="Số buổi tập theo tháng">
      {months.map((month, index) => {
        const isCurrent = index === months.length - 1;
        return (
          <View key={month.label} style={styles.column}>
            <TextComponent
              text={month.count ? String(month.count) : ''}
              size={11}
              font={fontFamilies.semiBold}
              color={appColors.textMuted}
            />
            <ProgressBar
              vertical
              value={Math.max(month.count / max, month.count ? 0.08 : 0)}
              color={isCurrent ? appColors.primary : appColors.primaryLight}
              trackColor={appColors.background}
              style={styles.bar}
            />
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

export default MonthlyChart;

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    height: 150,
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    flex: 1,
    width: '70%',
    borderRadius: radius.sm,
  },
});
