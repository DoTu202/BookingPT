import React from 'react';
import {StyleSheet, View} from 'react-native';
import {TrendDown, TrendUp} from 'iconsax-react-native';
import {GradientView, Tag, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {formatCompactCurrency, formatCurrency, formatHours} from '../../../../utils/format';
import {comparisonLabel, percentChange} from '../../../../utils/dashboard';

const MUTED = 'rgba(255,255,255,0.7)';
const UP = {fg: '#4ADE80', bg: 'rgba(22,163,74,0.25)'};
const DOWN = {fg: '#FF8A8D', bg: 'rgba(229,72,77,0.25)'};

// Change vs the previous period, on the dark card.
const Delta = ({current, previous, period}) => {
  const change = percentChange(current, previous);
  if (change === null) {
    return (
      <TextComponent
        text={current > 0 ? 'Kỳ trước chưa có thu nhập để so sánh' : 'Chưa có thu nhập trong kỳ này'}
        size={12}
        color={MUTED}
      />
    );
  }
  const up = change >= 0;
  const tone = up ? UP : DOWN;
  const Icon = up ? TrendUp : TrendDown;
  return (
    <View style={styles.deltaRow}>
      <Tag
        size="sm"
        label={`${up ? '+' : ''}${change}%`}
        color={tone.fg}
        backgroundColor={tone.bg}
        icon={<Icon size={14} color={tone.fg} />}
      />
      <TextComponent text={comparisonLabel(period)} size={12} color={MUTED} />
    </View>
  );
};

// Dark headline card: earnings of the period + change + three key numbers.
const EarningsCard = ({data}) => {
  const stats = [
    {label: 'Buổi hoàn thành', value: String(data.sessions.completed)},
    {label: 'Giờ dạy', value: formatHours(data.sessions.hours).replace(' giờ', '')},
    {
      label: 'Dự kiến thêm',
      value: data.earnings.expected > 0 ? formatCompactCurrency(data.earnings.expected) : '0',
    },
  ];
  return (
    <GradientView colors={appColors.gradientDark} direction="diagonal" style={styles.card}>
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
      <View style={styles.stats}>
        {stats.map(item => (
          <View key={item.label} style={styles.stat}>
            <TextComponent text={item.value} size={17} font={fontFamilies.bold} color={appColors.white} />
            <TextComponent text={item.label} size={11} color={MUTED} />
          </View>
        ))}
      </View>
    </GradientView>
  );
};

export default EarningsCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg + 4,
    gap: spacing.xs,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  stat: {
    flex: 1,
    gap: 2,
  },
});
