import React from 'react';
import {Text} from 'react-native';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {globalStyles} from '../styles/globalStyles';

// Large system text sizes are honoured up to this factor; beyond it fixed-size
// rows (headers, chips, tab bar) start to clip.
const MAX_FONT_SCALE = 1.3;

const TextComponent = props => {
  const {text, size, flex, font, color, styles, title, numberOfLine, numberOfLines, adjustsFontSizeToFit} = props;

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      numberOfLines={numberOfLines ?? numberOfLine}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      style={[
        globalStyles.text,
        {
          color: color ?? appColors.text,
          fontSize: size !== undefined ? size : title ? 24 : 14,
          flex: flex ?? 0,
          fontFamily: font ? font : title ? fontFamilies.medium : fontFamilies.regular,
        },
        styles,
      ]}>
      {text}
    </Text>
  );
};

export default TextComponent;
