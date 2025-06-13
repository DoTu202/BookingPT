import {View, Text, TouchableOpacity, StyleProp, ViewStyle} from 'react-native';
import React from 'react';
import {globalStyles} from '../styles/globalStyles';
import appColors from '../constants/appColors';

const CardComponent = prop => {
  const {children, onPress, styles, bgColor} = prop;
  return (
    <TouchableOpacity
      style={[
        globalStyles.shadow,
        globalStyles.card,
        {
          backgroundColor: bgColor ?? appColors.white,
        },
        styles,
      ]}>
      {children}
    </TouchableOpacity>
  );
};

export default CardComponent;


