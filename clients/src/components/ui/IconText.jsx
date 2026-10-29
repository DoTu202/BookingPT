import React from 'react';
import {StyleSheet, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';

// Small icon followed by one line of text (date, time, location rows).
const IconText = ({icon, text, size = 13, color = appColors.textMuted, font, numberOfLines = 1, style}) => (
  <View style={[styles.row, style]}>
    {icon}
    <TextComponent
      text={text}
      size={size}
      color={color}
      font={font}
      numberOfLines={numberOfLines}
      styles={styles.text}
    />
  </View>
);

export default IconText;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    flexShrink: 1,
  },
});
