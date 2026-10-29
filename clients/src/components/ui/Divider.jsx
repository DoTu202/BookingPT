import React from 'react';
import {StyleSheet, View} from 'react-native';
import appColors from '../../constants/appColors';

// Hairline separator; `vertical` for side-by-side stats.
const Divider = ({vertical, style}) => <View style={[vertical ? styles.vertical : styles.horizontal, style]} />;

export default Divider;

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: appColors.border,
  },
  vertical: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: appColors.border,
  },
});
