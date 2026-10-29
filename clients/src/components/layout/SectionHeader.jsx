import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {ArrowRight2} from 'iconsax-react-native';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';

// Title of a page section with an optional "Xem tất cả ›" link.
const SectionHeader = ({title, actionText, onAction, style}) => (
  <View style={[styles.row, style]}>
    <TextComponent text={title} size={18} font={fontFamilies.bold} styles={styles.title} />
    {actionText ? (
      <TouchableOpacity onPress={onAction} style={styles.action} accessibilityRole="button">
        <TextComponent text={actionText} size={13} font={fontFamilies.semiBold} color={appColors.primary} />
        <ArrowRight2 size={14} color={appColors.primary} />
      </TouchableOpacity>
    ) : null}
  </View>
);

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
});
