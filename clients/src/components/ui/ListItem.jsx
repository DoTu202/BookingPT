import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';

// One row of a list inside a Card: leading (avatar/icon/time), title +
// subtitle, trailing (badge/value). `divider` draws a line above the row,
// so pass `index > 0`.
const ListItem = ({leading, title, subtitle, trailing, divider, onPress, accessibilityLabel, style}) => {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[styles.row, divider && styles.divider, style]}
      {...(onPress ? {onPress, activeOpacity: 0.8, accessibilityRole: 'button', accessibilityLabel} : {})}>
      {leading}
      <View style={styles.flex}>
        <TextComponent text={title} font={fontFamilies.medium} numberOfLines={1} />
        {subtitle ? (
          <TextComponent text={subtitle} size={12} color={appColors.textMuted} numberOfLines={1} />
        ) : null}
      </View>
      {trailing}
    </Container>
  );
};

export default ListItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  flex: {
    flex: 1,
  },
});
