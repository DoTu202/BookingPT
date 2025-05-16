import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextStyles,
} from 'react-native';
import React from 'react';
import {globalStyles} from '../styles/globalStyles';
import TextComponent from './TextComponent';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';

const ButtonComponent = props => {
  const {
    icon,
    text,
    textColor,
    textFont,
    textStyles,
    color,
    styles,
    onPress,
    iconFlex,
    type,
    disable,
  } = props;
  return type === 'primary' ? (
    <TouchableOpacity
      style={[
        globalStyles.button,
        {
          backgroundColor: color
            ? color
            : disable
            ? appColors.gray4
            : appColors.primary,
        },
        styles,
      ]}
      onPress={onPress}
      disabled={disable}>
      {iconFlex === 'left' && icon}
      <TextComponent
        text={text}
        color={textColor ?? appColors.white}
        styles={[
          {
            fontSize: 16,
          },
          textStyles,
        ]}
        flex={icon && iconFlex === 'right' ? 1 : 0}
        font={textFont ?? fontFamilies.regular}
      />
      {iconFlex === 'right' && icon}
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={[globalStyles.button, styles]} onPress={onPress}>
      <TextComponent
        text={text}
        color={type === 'link' ? appColors.primary : 'rgba(255, 255, 255, 0.8)'}
        styles={textStyles}
      />
    </TouchableOpacity>
  );
};

export default ButtonComponent;

const styles = StyleSheet.create({});
