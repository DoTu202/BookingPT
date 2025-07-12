import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React from 'react';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {TextComponent, InputComponent, ButtonComponent} from '../../components';
import {fontFamilies} from '../../constants/fontFamilies';
import {ArrowLeft} from 'iconsax-react-native';
import {useState} from 'react';
import {Validate} from '../../utils/validate';
import {LoadingModal} from '../../modals';
import authApi from '../../apis/authApi';

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [isDisable, setIsDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckEmail = () => {
    const isValidEmail = Validate.email(email);
    setIsDisable(!isValidEmail);
    setErrorMessage(isValidEmail ? '' : 'Invalid email format');
  };

  const handleForgotPassword = async () => {
    const api = '/forgotPassword';
    setIsLoading(true);
    try {
      const res = await authApi.HandleAuthentication(
        api,
        {email},
        'post',
      );
      console.log(res);
      Alert.alert('Success', 'Please check your email for the new password', [
        {text: 'OK', onPress: () => navigation.replace('LoginScreen')},
      ]);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      Alert.alert('Can not create new password', error.message);
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
        onPress={() => navigation.goBack()}
        style={{
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
        }}>
        <ArrowLeft size={22} color={appColors.white} />
      </TouchableOpacity>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
        }}>
        <TextComponent
          text="Reset Password"
          styles={{
            color: appColors.primary,
            fontSize: 24,
            fontFamily: fontFamilies.bold,
            padding: 20,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <TextComponent
          text="Enter your email to reset your password"
          styles={{
            color: appColors.white,
            fontSize: 14,
            fontFamily: fontFamilies.regular,
            padding: 20,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <InputComponent
          value={email}
          onChange={setEmail}
          placeholder="Email"
          secureTextEntry
          allowClear
          onEnd={handleCheckEmail}
        />
        <ButtonComponent
          disabled={!email}
          text="Reset Password"
          type="primary"
          onPress={handleForgotPassword}
          styles={{width: '100%', marginTop: 30}}
        />
      </View>
      <LoadingModal visible={isLoading} />
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({});
