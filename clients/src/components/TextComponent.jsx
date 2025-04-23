import {StyleSheet, Text, View, TextStyle} from 'react-native';
import React from 'react';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {globalStyles} from '../styles/globalStyles';

const TextComponent = props => {
  const {text, size, flex, font, color, styles, title} = props;
  return (
    <Text
      style={[
        globalStyles.text,
        {
          color: color ?? appColors.text,
          fontSize: size ?? title ? 24 : 14,
          flex: flex ?? undefined,
          fontFamily: font ? font : title ? fontFamilies.bold : fontFamilies.regular,
          includeFontPadding: false,
        },
        styles,
      ]}>
      {text}
    </Text>
  );
};

export default TextComponent;

const styles = StyleSheet.create({});
