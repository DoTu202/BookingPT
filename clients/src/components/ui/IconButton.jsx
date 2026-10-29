import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import appColors from '../../constants/appColors';
import {shadow} from '../../constants/theme';

const TONES = {
  primary: {backgroundColor: appColors.primarySoft},
  danger: {backgroundColor: appColors.dangerSoft},
  surface: {backgroundColor: appColors.surface, ...shadow.sm},
};

// Icon-only button on light surfaces (gradient headers use HeaderIconButton).
// tone: 'primary' | 'danger' | 'surface'. Always pass an accessibilityLabel.
const IconButton = ({
  icon,
  onPress,
  tone = 'primary',
  size = 38,
  round,
  disabled,
  accessibilityLabel,
  style,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{disabled: Boolean(disabled)}}
    style={[
      styles.button,
      TONES[tone] || TONES.primary,
      {width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.32)},
      disabled && styles.disabled,
      style,
    ]}>
    {icon}
  </TouchableOpacity>
);

export default IconButton;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
});
