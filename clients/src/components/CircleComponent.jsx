import {View, Text, TouchableOpacity, StyleProp, ViewStyle} from 'react-native';
import React from 'react';
import appColors from '../constants/appColors';

const CircleComponent = props => {
  const {size, color, onPress, children, styles} = props;

  const localStyle = {
    width: size ?? 40,
    height: size ?? 40,
    backgroundColor: color ?? appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  };

  return onPress ? (
    <TouchableOpacity style={[localStyle, styles]} onPress={onPress}>
      {children}
    </TouchableOpacity>
  ) : (
    <View style={[localStyle, styles]}>{children}</View>
  );
};

export default CircleComponent;
