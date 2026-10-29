import React from 'react';
import {StyleSheet, View} from 'react-native';
import {RingProgress, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../../../constants/theme';
import {formatRate} from '../../../../utils/dashboard';

// Percentage in a ring, with a title and caption.
export const RateTile = ({title, value, caption, color}) => (
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

// Big number with a title and caption.
export const NumberTile = ({title, value, caption}) => (
  <View style={[styles.tile, styles.number]}>
    <TextComponent text={String(value)} size={22} font={fontFamilies.bold} />
    <TextComponent text={title} size={13} font={fontFamilies.semiBold} numberOfLines={1} />
    <TextComponent text={caption} size={11} color={appColors.textMuted} numberOfLines={1} />
  </View>
);

const styles = StyleSheet.create({
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
  number: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  flex: {
    flex: 1,
  },
});
