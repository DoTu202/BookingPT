import React from 'react';
import {StyleSheet, View} from 'react-native';
import IconBox from './IconBox';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';

// Icon + label + value for read-only profile details.
// layout 'stacked': label above the value; 'inline': label left, value right.
const InfoRow = ({icon, label, value, layout = 'stacked', placeholder = 'Chưa cập nhật'}) => {
  const shown = value || placeholder;
  if (layout === 'inline') {
    return (
      <View style={styles.row}>
        <IconBox size={36}>{icon}</IconBox>
        <TextComponent text={label} size={13} color={appColors.textMuted} styles={styles.flex} />
        <TextComponent text={shown} size={14} font={fontFamilies.semiBold} />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <IconBox size={38}>{icon}</IconBox>
      <View style={styles.flex}>
        <TextComponent text={label} size={12} color={appColors.textMuted} />
        <TextComponent text={shown} size={15} font={fontFamilies.medium} />
      </View>
    </View>
  );
};

export default InfoRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
