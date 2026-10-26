import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {TextComponent, InputComponent, ButtonComponent} from '../../components';
import {fontFamilies} from '../../constants/fontFamilies';
import {ArrowLeft} from 'iconsax-react-native';
import {Validate, MIN_PASSWORD_LENGTH} from '../../utils/validate';
import {LoadingModal} from '../../modals';
import authApi from '../../apis/authApi';

// Two steps: request a code by email, then submit code + new password.
const ForgotPasswordScreen = ({navigation}) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequestCode = async () => {
    if (!Validate.email(email)) {
      setErrorMessage('Invalid email format');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await authApi.HandleAuthentication('/forgotPassword', {email}, 'post');
      setStep('reset');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/^\d{4}$/.test(code)) {
      setErrorMessage('Please enter the 4-digit code from your email');
      return;
    }
    if (!Validate.password(newPassword)) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await authApi.HandleAuthentication(
        '/resetPassword',
        {email, code, newPassword},
        'post',
      );
      Alert.alert('Success', 'Your password has been reset. Please sign in.', [
        {text: 'OK', onPress: () => navigation.replace('LoginScreen')},
      ]);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        {backgroundColor: appColors.black, height: '100%'},
      ]}>
      <TouchableOpacity
        onPress={() => (step === 'reset' ? setStep('email') : navigation.goBack())}
        style={styles.backButton}>
        <ArrowLeft size={22} color={appColors.white} />
      </TouchableOpacity>
      <View style={styles.content}>
        <TextComponent text="Reset Password" styles={styles.title} />
        <TextComponent
          text={
            step === 'email'
              ? 'Enter your email and we will send you a code to reset your password'
              : `If an account exists for ${email}, a 4-digit code has been sent to it`
          }
          styles={styles.subtitle}
        />

        {step === 'email' ? (
          <InputComponent
            value={email}
            onChange={setEmail}
            placeholder="Email"
            type="email-address"
            allowClear
          />
        ) : (
          <>
            <InputComponent
              value={code}
              onChange={val => setCode(val.replace(/[^0-9]/g, ''))}
              placeholder="4-digit code"
              type="number-pad"
              maxLength={4}
              allowClear
            />
            <InputComponent
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
              isPassword
            />
          </>
        )}

        {errorMessage ? (
          <TextComponent text={errorMessage} styles={styles.error} />
        ) : null}

        <ButtonComponent
          disable={step === 'email' ? !email : !code || !newPassword}
          text={step === 'email' ? 'Send Code' : 'Reset Password'}
          type="primary"
          onPress={step === 'email' ? handleRequestCode : handleResetPassword}
          styles={{width: '100%', marginTop: 30}}
        />
        {step === 'reset' && (
          <ButtonComponent
            type="link"
            text="Resend code"
            onPress={handleRequestCode}
          />
        )}
      </View>
      <LoadingModal visible={isLoading} />
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    color: appColors.primary,
    fontSize: 24,
    fontFamily: fontFamilies.bold,
    padding: 20,
    alignSelf: 'center',
  },
  subtitle: {
    color: appColors.white,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    padding: 20,
    textAlign: 'center',
  },
  error: {
    color: appColors.danger,
    marginTop: 10,
    textAlign: 'center',
  },
});
