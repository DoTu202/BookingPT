import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow} from '../../constants/theme';

// Pill switch between a few options: options = [{key, label}].
const SegmentedControl = ({options, value, onChange, style}) => (
  <View style={[styles.track, style]} accessibilityRole="tablist">
    {options.map(option => {
      const active = option.key === value;
      return (
        <TouchableOpacity
          key={option.key}
          style={[styles.segment, active && styles.active]}
          onPress={() => onChange(option.key)}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{selected: active}}>
          <TextComponent
            text={option.label}
            size={13}
            font={active ? fontFamilies.semiBold : fontFamilies.medium}
            color={active ? appColors.primary : appColors.textMuted}
          />
        </TouchableOpacity>
      );
    })}
  </View>
);

export default SegmentedControl;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: appColors.gray6,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: radius.pill,
  },
  active: {
    backgroundColor: appColors.surface,
    ...shadow.sm,
  },
});
