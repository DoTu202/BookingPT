import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {IconBox, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../../../constants/theme';

// Row of shortcut tiles: [{key, icon, label, onPress}].
const QuickActions = ({actions}) => (
  <View style={styles.row}>
    {actions.map(action => (
      <TouchableOpacity
        key={action.key}
        style={styles.tile}
        onPress={action.onPress}
        activeOpacity={0.8}
        accessibilityRole="button">
        <IconBox size={44}>{action.icon}</IconBox>
        <TextComponent text={action.label} size={12} font={fontFamilies.medium} styles={styles.center} numberOfLines={2} />
      </TouchableOpacity>
    ))}
  </View>
);

export default QuickActions;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  center: {
    textAlign: 'center',
  },
});
