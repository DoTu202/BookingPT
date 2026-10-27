import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ButtonComponent, RowComponent, TextComponent} from '../../components';
import AuthLayout, {FormError} from './components/AuthLayout';
import authApi from '../../apis/authApi';
import {addAuth} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

// "nguyenvana@gmail.com" -> "ng••••••@gmail.com"
const maskEmail = email => {
  const [name, domain] = String(email).split('@');
  if (!domain) {
    return email;
  }
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

const VerifyCodeScreen = ({navigation, route}) => {
  const {email, password, username, dob, phoneNumber, role} = route.params;

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const inputs = useRef([]);
  const dispatch = useDispatch();

  const code = digits.join('');

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const submit = async fullCode => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await authApi.HandleAuthentication(
        '/register',
        {email, password, username, dob, phoneNumber, role, code: fullCode},
        'post',
      );
      const authData = res.data.data || res.data;
      await AsyncStorage.setItem('auth', JSON.stringify(authData));
      dispatch(addAuth(authData));
    } catch (error) {
      setErrorMessage(error.message);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleChange = (text, index) => {
    const clean = text.replace(/[^0-9]/g, '');
    const next = [...digits];
    if (clean.length > 1) {
      // Pasted or autofilled code: spread it across the boxes.
      clean
        .slice(0, CODE_LENGTH - index)
        .split('')
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
    } else {
      next[index] = clean;
    }
    setDigits(next);
    setErrorMessage('');

    const firstEmpty = next.findIndex(d => !d);
    if (firstEmpty === -1) {
      inputs.current[CODE_LENGTH - 1]?.blur();
      submit(next.join(''));
    } else if (clean) {
      inputs.current[Math.min(index + clean.length, firstEmpty)]?.focus();
    }
  };

  const handleKeyPress = ({nativeEvent}, index) => {
    if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setNotice('');
    setIsResending(true);
    try {
      await authApi.HandleAuthentication('/verification', {email}, 'post');
      setDigits(Array(CODE_LENGTH).fill(''));
      setSecondsLeft(RESEND_SECONDS);
      setNotice('Đã gửi mã mới. Vui lòng kiểm tra hộp thư (kể cả mục Spam).');
      inputs.current[0]?.focus();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Xác minh email"
      subtitle={`Nhập mã ${CODE_LENGTH} số chúng tôi vừa gửi tới ${maskEmail(email)}.`}
      onBack={() => navigation.goBack()}>
      <View style={styles.codeRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={el => {
              inputs.current[index] = el;
            }}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={event => handleKeyPress(event, index)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={index === 0 ? CODE_LENGTH : 1}
            selectTextOnFocus
            editable={!isLoading}
            style={[styles.codeBox, digit && styles.codeBoxFilled, errorMessage && styles.codeBoxError]}
            accessibilityLabel={`Chữ số thứ ${index + 1}`}
          />
        ))}
      </View>

      <FormError message={errorMessage} />
      {notice && !errorMessage ? (
        <TextComponent text={notice} size={13} color={appColors.success} />
      ) : null}

      <ButtonComponent
        text="Xác minh"
        type="primary"
        size="lg"
        disable={code.length < CODE_LENGTH}
        isLoading={isLoading}
        onPress={() => submit(code)}
      />

      <RowComponent justify="center">
        {secondsLeft > 0 ? (
          <TextComponent
            text={`Gửi lại mã sau 00:${String(secondsLeft).padStart(2, '0')}`}
            size={13}
            color={appColors.textMuted}
          />
        ) : (
          <ButtonComponent
            type="link"
            text={isResending ? 'Đang gửi...' : 'Gửi lại mã'}
            textFont={fontFamilies.semiBold}
            disable={isResending}
            onPress={handleResend}
          />
        )}
      </RowComponent>
    </AuthLayout>
  );
};

export default VerifyCodeScreen;

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  codeBox: {
    flex: 1,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: appColors.border,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    backgroundColor: appColors.background,
  },
  codeBoxFilled: {
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
  },
  codeBoxError: {
    borderColor: appColors.danger,
  },
});
