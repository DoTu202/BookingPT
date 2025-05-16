import {StyleSheet, Text, View, TextInput} from 'react-native';
import {useState} from 'react';
import React from 'react';
import appColors from '../constants/appColors';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {EyeSlash} from 'iconsax-react-native';
import {TouchableOpacity} from 'react-native';
import {fontFamilies} from '../constants/fontFamilies';

const InputComponent = props => {
  const {
    value,
    onChange,
    affix,
    suffix,
    placeholder,
    isPassword,
    allowClear,
    type,
    isOtp,
    maxLength,
    onEnd
  } = props;
  const [isShowPass, setIsShowPass] = useState(isPassword ?? false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputContainer,
        isFocused && {borderColor: appColors.primary},
        isOtp && styles.otpInput
      ]}>
      {/* {affix ?? affix} */}
      {/* {affix && <View style={styles.affixWrapper}>{affix}</View>} */}
      <TextInput
        style={[
          styles.input, 
          {backgroundColor: 'transparent'},
          isOtp && styles.otpText
        ]}
        placeholder={placeholder ?? ''}
        value={value}
        onChangeText={val => onChange(val)}
        secureTextEntry={isShowPass}
        placeholderTextColor={appColors.placeholder}
        keyboardType={type || (isOtp ? 'numeric' : 'default')}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        textAlign={isOtp ? 'center' : 'left'} //OTP
        autoCapitalize="none"
        onEndEditing={onEnd}
      />
      {/* {suffix ?? suffix} */}
      {suffix && <View style={styles.suffixWrapper}>{suffix}</View>}
      {!isOtp && (
        <TouchableOpacity
          onPress={
            isPassword ? () => setIsShowPass(!isShowPass) : () => onChange('')
          }>
          {isPassword ? (
            <EyeSlash size={22} color={appColors.gray} />
          ) : (
            value.length > 0 &&
            allowClear && (
              <AntDesign name="close" size={22} color={appColors.gray} />
            )
          )}
        </TouchableOpacity>
        )}

    </View>
  );
};

export default InputComponent;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: appColors.gray,
    width: '100%',
    height: 40,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: appColors.white,
  },
  input: {
    padding: 0,
    margin: 0,
    paddingHorizontal: 10,
    flex: 1,

  },
  affixWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suffixWrapper: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    height: 55,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpText: {
    fontSize: 24,
    fontFamily: fontFamilies.medium,
    textAlign: 'center',
    paddingHorizontal: 0,
  }
});
