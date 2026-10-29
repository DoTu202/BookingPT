import React from 'react';
import {StyleSheet, View} from 'react-native';
import {TickCircle} from 'iconsax-react-native';
import {TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {spacing} from '../../../constants/theme';

// One password requirement with a tick that turns green when met.
const PasswordRule = ({ok, text}) => (
  <View style={styles.rule} accessibilityLabel={`${text}: ${ok ? 'đạt' : 'chưa đạt'}`}>
    <TickCircle size={16} color={ok ? appColors.success : appColors.border} variant={ok ? 'Bold' : 'Linear'} />
    <TextComponent text={text} size={13} color={ok ? appColors.text : appColors.textMuted} />
  </View>
);

export default PasswordRule;

const styles = StyleSheet.create({
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
