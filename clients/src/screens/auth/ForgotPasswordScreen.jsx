import React, {useState} from 'react';
import {Alert} from 'react-native';
import {Key, Lock, Sms} from 'iconsax-react-native';
import {Banner, ButtonComponent, InputComponent, RowComponent} from '../../components';
import AuthLayout from './components/AuthLayout';
import authApi from '../../apis/authApi';
import {MIN_PASSWORD_LENGTH, Validate} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';

// Two steps: request a code by email, then submit code + new password.
const ForgotPasswordScreen = ({navigation}) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const trimmedEmail = email.trim();
  const passwordError =
    newPassword && !Validate.password(newPassword)
      ? `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự`
      : '';
  const confirmError =
    confirmPassword && confirmPassword !== newPassword ? 'Mật khẩu xác nhận không khớp' : '';
  const canReset =
    /^\d{4}$/.test(code) &&
    Validate.password(newPassword) &&
    confirmPassword === newPassword;

  const handleRequestCode = async () => {
    if (!Validate.email(trimmedEmail)) {
      setErrorMessage('Email không hợp lệ');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await authApi.HandleAuthentication('/forgotPassword', {email: trimmedEmail}, 'post');
      setStep('reset');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await authApi.HandleAuthentication(
        '/resetPassword',
        {email: trimmedEmail, code, newPassword},
        'post',
      );
      Alert.alert('Đổi mật khẩu thành công', 'Hãy đăng nhập bằng mật khẩu mới.', [
        {text: 'Đăng nhập', onPress: () => navigation.navigate('LoginScreen')},
      ]);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailStep = step === 'email';

  return (
    <AuthLayout
      title={isEmailStep ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}
      subtitle={
        isEmailStep
          ? 'Nhập email đã đăng ký, chúng tôi sẽ gửi mã để đặt lại mật khẩu.'
          : `Nếu ${trimmedEmail} đã đăng ký, mã 4 số đã được gửi tới email này.`
      }
      onBack={() => {
        setErrorMessage('');
        if (isEmailStep) {
          navigation.goBack();
        } else {
          setStep('email');
        }
      }}>
      {isEmailStep ? (
        <InputComponent
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="ban@email.com"
          type="email-address"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleRequestCode}
          prefix={<Sms size={20} color={appColors.textMuted} />}
          allowClear
        />
      ) : (
        <>
          <InputComponent
            label="Mã xác minh"
            value={code}
            onChange={val => setCode(val.replace(/[^0-9]/g, ''))}
            placeholder="4 chữ số"
            type="number-pad"
            textContentType="oneTimeCode"
            maxLength={4}
            prefix={<Key size={20} color={appColors.textMuted} />}
          />
          <InputComponent
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Mật khẩu mới"
            textContentType="newPassword"
            helperText={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
            error={passwordError}
            prefix={<Lock size={20} color={appColors.textMuted} />}
            isPassword
          />
          <InputComponent
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu"
            textContentType="newPassword"
            error={confirmError}
            prefix={<Lock size={20} color={appColors.textMuted} />}
            isPassword
          />
        </>
      )}

      <Banner message={errorMessage} />

      <ButtonComponent
        text={isEmailStep ? 'Gửi mã' : 'Đổi mật khẩu'}
        type="primary"
        size="lg"
        disable={isEmailStep ? !trimmedEmail : !canReset}
        isLoading={isLoading}
        onPress={isEmailStep ? handleRequestCode : handleResetPassword}
      />
      {!isEmailStep ? (
        <RowComponent justify="center">
          <ButtonComponent
            type="link"
            text="Gửi lại mã"
            textFont={fontFamilies.semiBold}
            disable={isLoading}
            onPress={handleRequestCode}
          />
        </RowComponent>
      ) : null}
    </AuthLayout>
  );
};

export default ForgotPasswordScreen;
