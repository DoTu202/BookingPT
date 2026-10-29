import React from 'react';
import {StyleSheet, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// Non-interactive pill (specializations, slot status, deltas). For a
// selectable one use ChipComponent.
const Tag = ({
  label,
  icon,
  color = appColors.primaryDark,
  backgroundColor = appColors.primarySoft,
  size = 'md',
  style,
}) => (
  <View style={[styles.tag, size === 'sm' ? styles.sm : styles.md, {backgroundColor}, style]}>
    {icon}
    <TextComponent
      text={label}
      size={size === 'sm' ? 11 : 12}
      font={size === 'sm' ? fontFamilies.semiBold : fontFamilies.medium}
      color={color}
    />
  </View>
);

export default Tag;

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.pill,
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
});
