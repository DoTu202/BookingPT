import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing, TOUCH_TARGET} from '../../constants/theme';

// type: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'text' | 'link'
const VARIANTS = {
  primary: {bg: appColors.primary, fg: appColors.white},
  secondary: {bg: appColors.primarySoft, fg: appColors.primaryDark},
  outline: {bg: 'transparent', fg: appColors.primary, border: appColors.primary},
  danger: {bg: appColors.danger, fg: appColors.white},
  ghost: {bg: 'transparent', fg: appColors.text},
  text: {bg: 'transparent', fg: appColors.text},
  link: {bg: 'transparent', fg: appColors.primary},
};

const SIZES = {
  sm: {minHeight: 36, paddingHorizontal: spacing.md, fontSize: 13},
  md: {minHeight: TOUCH_TARGET, paddingHorizontal: spacing.lg, fontSize: 15},
  lg: {minHeight: 54, paddingHorizontal: spacing.xl, fontSize: 16},
};

const ButtonComponent = props => {
  const {
    text,
    onPress,
    type = 'text',
    size = 'md',
    icon,
    iconFlex = 'left',
    color,
    textColor,
    textFont,
    textStyles,
    styles: customStyles,
    disable,
    disabled,
    isLoading: isLoadingProp,
    loading,
    fullWidth,
    accessibilityLabel,
  } = props;

  const isLoading = Boolean(isLoadingProp || loading);
  const variant = VARIANTS[type] || VARIANTS.text;
  const sizing = SIZES[size] || SIZES.md;
  const isLink = type === 'link';
  const isDisabled = Boolean(disable || disabled || isLoading);
  const foreground = textColor ?? variant.fg;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || text}
      accessibilityState={{disabled: isDisabled, busy: Boolean(isLoading)}}
      hitSlop={isLink ? {top: 8, bottom: 8, left: 4, right: 4} : undefined}
      style={[
        localStyles.base,
        !isLink && {minHeight: sizing.minHeight, paddingHorizontal: sizing.paddingHorizontal},
        isLink && localStyles.link,
        {backgroundColor: color ?? variant.bg},
        variant.border && [localStyles.bordered, {borderColor: variant.border}],
        fullWidth && localStyles.fullWidth,
        isDisabled && !isLoading && localStyles.disabled,
        customStyles,
      ]}>
      {isLoading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && iconFlex === 'left' && <View style={text ? localStyles.iconLeft : null}>{icon}</View>}
          {text ? (
            <TextComponent
              text={text}
              color={foreground}
              font={textFont ?? fontFamilies.semiBold}
              size={sizing.fontSize}
              styles={[localStyles.label, textStyles]}
            />
          ) : null}
          {icon && iconFlex === 'right' && <View style={text ? localStyles.iconRight : null}>{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default ButtonComponent;

const localStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  link: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  bordered: {
    borderWidth: 1.5,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
