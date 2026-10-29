import React from 'react';
import {StyleSheet, View} from 'react-native';
import appColors from '../../constants/appColors';

// An icon centred on a tinted rounded square (or a circle with `round`).
// Used by stat tiles, menu rows, info rows and notifications.
const IconBox = ({children, size = 40, color = appColors.primarySoft, round, style}) => (
  <View
    style={[
      styles.box,
      {
        width: size,
        height: size,
        borderRadius: round ? size / 2 : Math.round(size * 0.3),
        backgroundColor: color,
      },
      style,
    ]}>
    {children}
  </View>
);

export default IconBox;

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
