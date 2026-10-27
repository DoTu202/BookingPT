import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {radius, shadow, spacing} from '../constants/theme';

// Small metric tile: icon in a tinted square, big value, short label.
const StatCard = ({icon, value, label, tint = appColors.primary, soft = appColors.primarySoft, onPress, style}) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.8}
    accessibilityRole={onPress ? 'button' : 'summary'}
    accessibilityLabel={`${label}: ${value}`}>
    <View style={[styles.icon, {backgroundColor: soft}]}>{icon}</View>
    <TextComponent text={String(value)} size={20} font={fontFamilies.bold} numberOfLines={1} />
    <TextComponent text={label} size={12} color={appColors.textMuted} numberOfLines={2} />
    <View style={[styles.accent, {backgroundColor: tint}]} />
  </TouchableOpacity>
);

export default StatCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    gap: 4,
    overflow: 'hidden',
    ...shadow.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  accent: {
    position: 'absolute',
    right: -18,
    top: -18,
    width: 54,
    height: 54,
    borderRadius: 27,
    opacity: 0.08,
  },
});
