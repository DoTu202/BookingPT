import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

// Sticky action bar at the bottom of a screen, above the home indicator.
const BottomBar = ({children, style}) => {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, {paddingBottom: insets.bottom + spacing.md}, style]}>{children}</View>;
};

export default BottomBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: appColors.surface,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },
});
