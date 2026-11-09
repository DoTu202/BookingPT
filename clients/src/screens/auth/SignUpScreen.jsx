import React, {useRef, useState} from 'react';
import {Call, Lock, Profile, Sms} from 'iconsax-react-native';
import {
  Banner,
  ButtonComponent,
  DatePickerField,
  InputComponent,
  RowComponent,
  TextComponent,
} from '../../components';
import AuthLayout from './components/AuthLayout';
import RoleSelector from './components/RoleSelector';
import authApi from '../../apis/authApi';
import {MIN_PASSWORD_LENGTH, validateSignUpField} from '../../utils/validate';
import appColors from '../../constants/appColors';

const initValue = {
  username: '',
  email: '',
  phoneNumber: '',
  dob: null,
  password: '',
  confirmPassword: '',
  role: 'client',
};

const FIELDS = ['username', 'email', 'phoneNumber', 'dob', 'password', 'confirmPassword'];

const SignUpScreen = ({navigation}) => {
  const [values, setValues] = useState(initValue);
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const refs = {
    email: useRef(null),
    phoneNumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const errors = Object.fromEntries(FIELDS.map(key => [key, validateSignUpField(key, values)]));
  const isValid = FIELDS.every(key => !errors[key]);
  const errorFor = key => (touched[key] ? errors[key] : '');

  const setValue = (key, value) => setValues(prev => ({...prev, [key]: value}));
  const touch = key => setTouched(prev => ({...prev, [key]: true}));

  const handleRegister = async () => {
    if (!isValid) {
      setTouched(Object.fromEntries(FIELDS.map(key => [key, true])));
      return;
    }
    setFormError('');
    setIsLoading(true);
    try {
      const email = values.email.trim();
      await authApi.HandleAuthentication('/verification', {email}, 'post');
      navigation.navigate('VerifyCodeScreen', {
        username: values.username.trim(),
        email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: values.role,
        dob: values.dob.toISOString(),
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Chỉ mất một phút. Chúng tôi sẽ gửi mã xác minh tới email của bạn."
      onBack={() => navigation.goBack()}
      footer={
        <RowComponent>
          <TextComponent text="Đã có tài khoản? " color={appColors.white} />
          <ButtonComponent
            type="link"
            text="Đăng nhập"
            textColor={appColors.primaryLight}
            onPress={() => navigation.navigate('LoginScreen')}
          />
        </RowComponent>
      }>
      <RoleSelector value={values.role} onChange={role => setValue('role', role)} />

      <InputComponent
        label="Họ và tên"
        value={values.username}
        onChange={val => setValue('username', val)}
        onBlur={() => touch('username')}
        placeholder="Nguyễn Văn A"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => refs.email.current?.focus()}
        error={errorFor('username')}
        prefix={<Profile size={20} color={appColors.textMuted} />}
      />
      <InputComponent
        ref={refs.email}
        label="Email"
        value={values.email}
        onChange={val => setValue('email', val)}
        onBlur={() => touch('email')}
        placeholder="ban@email.com"
        type="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => refs.phoneNumber.current?.focus()}
        error={errorFor('email')}
        prefix={<Sms size={20} color={appColors.textMuted} />}
      />
      <InputComponent
        ref={refs.phoneNumber}
        label="Số điện thoại"
        value={values.phoneNumber}
        onChange={val => setValue('phoneNumber', val.replace(/[^0-9]/g, ''))}
        onBlur={() => touch('phoneNumber')}
        placeholder="0901234567"
        type="phone-pad"
        autoComplete="tel"
        maxLength={12}
        error={errorFor('phoneNumber')}
        prefix={<Call size={20} color={appColors.textMuted} />}
      />

      <DatePickerField
        label="Ngày sinh"
        placeholder="Chọn ngày sinh"
        value={values.dob}
        onChange={date => setValue('dob', date)}
        onClose={() => touch('dob')}
        error={errorFor('dob')}
        minimumDate={new Date(1940, 0, 1)}
        maximumDate={new Date()}
      />

      <InputComponent
        ref={refs.password}
        label="Mật khẩu"
        value={values.password}
        onChange={val => setValue('password', val)}
        onBlur={() => touch('password')}
        placeholder="Tạo mật khẩu"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refs.confirmPassword.current?.focus()}
        helperText={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
        error={errorFor('password')}
        prefix={<Lock size={20} color={appColors.textMuted} />}
        isPassword
      />
      <InputComponent
        ref={refs.confirmPassword}
        label="Nhập lại mật khẩu"
        value={values.confirmPassword}
        onChange={val => setValue('confirmPassword', val)}
        onBlur={() => touch('confirmPassword')}
        placeholder="Nhập lại mật khẩu"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        error={errorFor('confirmPassword')}
        prefix={<Lock size={20} color={appColors.textMuted} />}
        isPassword
      />

      <Banner message={formError} />

      <ButtonComponent
        text="Tiếp tục"
        type="primary"
        size="lg"
        onPress={handleRegister}
        isLoading={isLoading}
      />
    </AuthLayout>
  );
};

export default SignUpScreen;
