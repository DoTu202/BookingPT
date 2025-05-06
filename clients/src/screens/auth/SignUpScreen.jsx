import {
  StyleSheet,
  Text,
  View,
  Button,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import React from 'react';
import {ButtonComponent} from '../../components';
import {globalStyles} from '../../styles/globalStyles';
import {InputComponent} from '../../components';
import {useState} from 'react';
import {fontFamilies} from '../../constants/fontFamilies';
import appColors from '../../constants/appColors';
import {
  LockCircle,
  Sms,
  Calendar,
  ArrowLeft,
  CloseCircle,
} from 'iconsax-react-native';
import TextComponent from '../../components/TextComponent';
import SocialLogin from './components/SocialLogin';
import DateTimePicker from '@react-native-community/datetimepicker';
import {LoadingModal} from '../../modals';
import authenticationAPI from '../../apis/authApi';
import {Validate} from '../../utils/validate';
import {useDispatch} from 'react-redux';
import { addAuth } from '../../redux/reducers/authReducer'

import AsyncStorage from '@react-native-async-storage/async-storage';

const initValue = {
  email: '',
  password: '',
  username: '',
  phoneNumber: '',
  confirmPassword: '',
  dob: null,
};

const SignUpScreen = ({navigation}) => {
  const [values, setValues] = useState(initValue);

  const dispatch = useDispatch();

  const handleChangeValue = (key, value) => {
    const data = {...values};
    data[`${key}`] = value;
    setValues(data);
  };

  const [show, setShow] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Select your birthday'; 
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) { 
    handleChangeValue('dob', selectedDate);
    }  
    setShow(false);
  };
  
  const closeDatePicker = () => {
    setIsDateFocused(false);
    setShow(false);
  };


  //handle register
  const handleRegister = async () => {
    const {username, email, phoneNumber, password, confirmPassword, dob} = values;

    // Debugging input values
    console.log('Form values:', values);

    // 1. Check for empty fields
    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      console.log('Some fields are empty');
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // 2. Validate email
    const emailValidation = Validate.email(email);
    if (!emailValidation) {
      console.log('Invalid email format');
      Alert.alert('Error', 'Email is not valid');
      return;
    }

    const passwordValidation = Validate.Password(password);
    if (!passwordValidation) {
      console.log('At least 6 ');
      Alert.alert('Error', 'Password');
      return;
    }

    // 3. Check if passwords match
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticationAPI.HandleAuthentication(
        '/register',
        {
          username,
          email,
          phoneNumber,
          password,
          dob: dob.toISOString(),
        },
        'post',
      );    
 
      dispatch(addAuth(res.data));
      console.log('Auth payload:', res.data);
      await AsyncStorage.setItem('auth', JSON.stringify(res.data));
      setIsLoading(false);
    } catch (error) {
      console.log('API error:', error);
      Alert.alert('Error', 'Something went wrong during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/Main.png')}
      style={[
        {alignItems: 'center', padding: 50, justifyContent: 'center'},
        globalStyles.container,
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
      <TextComponent text="Sign Up" title styles={styles.textSignUp} />

      {/* username */}
      <TextComponent
        text="Username"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <InputComponent
        value={values.username}
        onChange={val => handleChangeValue('username', val)}
        placeholder="Username"
        autoCapitalize="none"
        allowClear
      />

      {/* email  */}
      <TextComponent
        text="Email"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <InputComponent
        value={values.email}
        onChange={val => handleChangeValue('email', val)}
        placeholder="Email"
        autoCapitalize="none"
        allowClear
      />

      {/* phone number */}
      <TextComponent
        text="Phone Number"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <InputComponent
        value={values.phoneNumber}
        onChange={val => handleChangeValue('phoneNumber', val)}
        placeholder="Phone Number"
        allowClear
        keyboardType="numeric"
      />

      {/* Date of Birth */}
      <TextComponent
        text="Date of Birth"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          borderRadius: 12,
          borderWidth: 2,
          borderColor: appColors.gray,
          width: '100%',
          height: 40,
          alignItems: 'center',
          paddingHorizontal: 10,
          backgroundColor: appColors.white,
          marginBottom: 10,
          justifyContent: 'space-between',
        }}
        onPress={() => {
          setIsDateFocused(true);
          setShow(true);
        }}>
        <Text
          style={{
            paddingLeft: 14,
            color: values.dob ? appColors.text : appColors.placeholder,
            fontSize: 14,
            fontFamily: fontFamilies.medium,
          }}>
          {formatDate(values.dob)}
        </Text>
        <Calendar size={22} color={appColors.placeholder} />
      </TouchableOpacity>

      {/* DateTimePicker */}
      {show && (
        <View style={{width: '100%'}}>
          <DateTimePicker
            testID="dateTimePicker"
            value={values.dob || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            textColor={appColors.primary}
          />

          <TouchableOpacity
            onPress={closeDatePicker}
            style={{
              padding: 10,
              alignItems: 'center',
              backgroundColor: 'rgba(249, 117, 22, 0.1)',
              borderRadius: 8,
              marginTop: 8,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              
            }}>
            <CloseCircle
              size={18}
              color={appColors.primary}
              style={{marginRight: 5}}
            />
            <Text
              style={{
                color: appColors.primary,
                fontWeight: 'bold',
                fontFamily: fontFamilies.medium,
              }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* password */}
      <TextComponent
        text="Password"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <InputComponent
        value={values.password}
        onChange={val => handleChangeValue('password', val)}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        allowClear
        isPassword
        affix={<LockCircle size={22} color={appColors.gray} />}
      />

      {/* confirmPassword */}
      <TextComponent
        text="Confirm Password"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom: 5,
          padding: 5,
        }}
      />
      <InputComponent
        value={values.confirmPassword}
        onChange={val => handleChangeValue('confirmPassword', val)}
        placeholder="Confirm Password"
        autoCapitalize="none"
        secureTextEntry
        allowClear
        isPassword
        affix={<LockCircle size={22} color={appColors.gray} />}
      />

      <ButtonComponent
        text="Sign Up"
        onPress={handleRegister}
        styles={styles.button}
        type="primary"
        textFont={fontFamilies.semiBold}
        disable={false}
      />
      <LoadingModal visible={isLoading} />
      <SocialLogin />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  textSignUp: {
    marginBottom: 20,
    fontSize: 24,
    color: appColors.white,
    alignSelf: 'center',
    fontFamily: fontFamilies.bold,
    justifyContent: 'flex-start',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    height: 40,
    marginTop: 40,
  },
  rememberMe: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    padding: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: appColors.gray,
    width: '100%',
    height: 40,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: appColors.white,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});

export default SignUpScreen;
