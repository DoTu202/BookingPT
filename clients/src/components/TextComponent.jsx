import {StyleSheet, Text, View, TextStyle, Platform} from 'react-native';
import React from 'react';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {globalStyles} from '../styles/globalStyles';

const TextComponent = props => {
  const {text, size, flex, font, color, styles, title, numberOfLine} = props;

  const fontSizeDefault = Platform.OS === 'ios' ? 16 : 14;
  
  return (
    <Text
      numberOfLines={numberOfLine}
      style={[
        globalStyles.text,
        {
          color: color ?? appColors.text,
          fontSize: size !== undefined ? size : (title ? 24 : 14),
          flex: flex ?? 0,
          fontFamily: font
            ? font
            : title
            ? fontFamilies.medium
            : fontFamilies.regular,
        },
        styles,
      ]}>
      {text}
    </Text>
  );
};

export default TextComponent;

const styles = StyleSheet.create({});
