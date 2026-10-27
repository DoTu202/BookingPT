import React, {useRef, useState} from 'react';
import {StyleSheet, Switch} from 'react-native';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Lock, Sms} from 'iconsax-react-native';
import {ButtonComponent, InputComponent, RowComponent, TextComponent} from '../../components';
import AuthLayout, {FormError} from './components/AuthLayout';
import authApi from '../../apis/authApi';
import {addAuth} from '../../redux/reducers/authReducer';
import {Validate} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRemember, setIsRemember] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef(null);
  const dispatch = useDispatch();

  const emailError =
    emailTouched && email && !Validate.email(email.trim()) ? 'Email không hợp lệ' : '';
  const canSubmit = Validate.email(email.trim()) && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || isLoading) {
      setEmailTouched(true);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await authApi.HandleAuthentication(
        '/login',
        {email: email.trim(), password},
        'post',
      );
      const authData = res.data.data || res.data;
      if (isRemember) {
        await AsyncStorage.setItem('auth', JSON.stringify(authData));
      } else {
        await AsyncStorage.removeItem('auth');
      }
      dispatch(addAuth(authData));
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để đặt lịch và theo dõi buổi tập của bạn."
      footer={
        <RowComponent>
          <TextComponent text="Chưa có tài khoản? " color={appColors.white} />
          <ButtonComponent
            type="link"
            text="Đăng ký ngay"
            textColor={appColors.primaryLight}
            onPress={() => navigation.navigate('SignUpScreen')}
          />
        </RowComponent>
      }>
      <InputComponent
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="ban@email.com"
        type="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        onBlur={() => setEmailTouched(true)}
        error={emailError}
        prefix={<Sms size={20} color={appColors.textMuted} />}
        allowClear
      />
      <InputComponent
        ref={passwordRef}
        label="Mật khẩu"
        value={password}
        onChange={setPassword}
        placeholder="Nhập mật khẩu"
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        prefix={<Lock size={20} color={appColors.textMuted} />}
        isPassword
      />

      <RowComponent justify="space-between">
        <RowComponent>
          <Switch
            value={isRemember}
            onValueChange={setIsRemember}
            trackColor={{true: appColors.primary, false: appColors.border}}
            thumbColor={appColors.white}
            accessibilityLabel="Ghi nhớ đăng nhập"
          />
          <TextComponent text="Ghi nhớ" size={13} styles={styles.rememberText} />
        </RowComponent>
        <ButtonComponent
          type="link"
          text="Quên mật khẩu?"
          textFont={fontFamilies.medium}
          onPress={() => navigation.navigate('ForgotPasswordScreen')}
        />
      </RowComponent>

      <FormError message={error} />

      <ButtonComponent
        text="Đăng nhập"
        type="primary"
        size="lg"
        onPress={handleLogin}
        disable={!canSubmit}
        isLoading={isLoading}
      />
    </AuthLayout>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  rememberText: {
    marginLeft: 6,
  },
});
