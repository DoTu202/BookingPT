import React, {useState} from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {CloseCircle, Eye, EyeSlash} from 'iconsax-react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing, TOUCH_TARGET} from '../../constants/theme';

// Text field with optional label, helper/error text and leading icon.
// `isPassword` owns secureTextEntry and the show/hide toggle.
const InputComponent = React.forwardRef((props, ref) => {
  const {
    value = '',
    onChange,
    onChangeText,
    label,
    error,
    helperText,
    affix,
    prefix,
    suffix,
    placeholder,
    isPassword,
    allowClear,
    type,
    isOtp,
    maxLength,
    onEnd,
    editable = true,
    containerStyles,
    labelColor,
    multiline,
    style,
    onFocus,
    onBlur,
    ...otherProps
  } = props;
  const [isShowPass, setIsShowPass] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const leading = prefix || affix;
  const handleChange = val => (onChangeText || onChange)?.(val);
  const borderColor = error
    ? appColors.danger
    : isFocused
    ? appColors.primary
    : appColors.border;

  return (
    <View style={[styles.wrapper, containerStyles]}>
      {label ? (
        <TextComponent
          text={label}
          size={13}
          font={fontFamilies.medium}
          color={labelColor ?? appColors.text}
          styles={styles.label}
        />
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {borderColor},
          isFocused && !error && styles.focused,
          multiline && styles.multilineContainer,
          isOtp && styles.otpInput,
          !editable && styles.disabled,
        ]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            isOtp && styles.otpText,
            style,
          ]}
          placeholder={placeholder ?? ''}
          value={value}
          onChangeText={handleChange}
          placeholderTextColor={appColors.placeholder}
          keyboardType={type || (isOtp ? 'number-pad' : 'default')}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          autoCapitalize="none"
          accessibilityLabel={label || placeholder}
          {...otherProps}
          // After the spread so a caller's secureTextEntry cannot break the toggle.
          secureTextEntry={Boolean(isPassword) && !isShowPass}
          textAlign={isOtp ? 'center' : 'left'}
          onEndEditing={onEnd}
        />
        {suffix ? <View style={styles.trailing}>{suffix}</View> : null}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsShowPass(!isShowPass)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel={isShowPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            {isShowPass ? (
              <Eye size={20} color={appColors.textMuted} />
            ) : (
              <EyeSlash size={20} color={appColors.textMuted} />
            )}
          </TouchableOpacity>
        ) : allowClear && !isOtp && editable && String(value).length > 0 ? (
          <TouchableOpacity
            onPress={() => handleChange('')}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Xóa nội dung">
            <CloseCircle size={18} color={appColors.placeholder} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <TextComponent text={error} size={12} color={appColors.danger} styles={styles.helper} />
      ) : helperText ? (
        <TextComponent
          text={helperText}
          size={12}
          color={appColors.textMuted}
          styles={styles.helper}
        />
      ) : null}
    </View>
  );
});

export default InputComponent;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    backgroundColor: appColors.surface,
  },
  focused: {
    backgroundColor: appColors.white,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  disabled: {
    backgroundColor: appColors.gray6,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  leading: {
    marginRight: spacing.sm,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
  helper: {
    marginTop: 4,
  },
  otpInput: {
    height: 56,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  otpText: {
    fontSize: 24,
    fontFamily: fontFamilies.semiBold,
    paddingHorizontal: 0,
  },
});
