import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// Selectable pill used for filters, specializations and time slots.
const ChipComponent = ({label, selected, onPress, disabled, styles: customStyles, icon}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || !onPress}
    activeOpacity={0.75}
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityState={{selected: Boolean(selected), disabled: Boolean(disabled)}}
    style={[
      styles.chip,
      selected && styles.selected,
      disabled && styles.disabled,
      customStyles,
    ]}>
    {icon}
    <TextComponent
      text={label}
      size={13}
      font={selected ? fontFamilies.semiBold : fontFamilies.medium}
      color={selected ? appColors.white : appColors.text}
      styles={icon ? styles.labelWithIcon : null}
    />
  </TouchableOpacity>
);

export default ChipComponent;

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  selected: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  labelWithIcon: {
    marginLeft: 6,
  },
});
