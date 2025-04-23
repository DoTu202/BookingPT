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
import {RowComponent} from '../../components';
import {LoadingModal} from '../../modals'

const initValue = {
  email: '',
  password: '',
  username: '',
  phoneNumber: '',
  confirmPassword: '',
};

const SignUpScreen = ({navigation}) => {
  const [values, setValues] = useState(initValue);

  const handleChangeValue = (key, value) => {
    const data = {...values};
    data[`${key}`] = value;
    setValues(data);
  };


  const [show, setShow] = useState(false);
  const [dob, setDob] = useState(new Date());
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try{
    console.log(values);
    }catch (error) {
      console.log('Error:', error);
      setIsLoading(false);
      Alert.alert('Error', 'An error occurred during registration.');
    }finally{
      setIsLoading(false);
    }
  }

  const formatDate = date => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Sửa lại hàm onChange này
  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const closeDatePicker = () => {
    setIsDateFocused(false);
    setShow(false);
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
        allowClear
      />

      {/* phone number */}
      <TextComponent
        text="Phone Number"
        styles={{
          color: appColors.white,
          alignSelf: 'flex-start',
          marginBottom:5,
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
            color: appColors.placeholder,
            fontSize: 14,
            fontFamily: fontFamilies.medium,
          }}>
          {formatDate(dob)}
        </Text>
        <Calendar size={22} color={appColors.placeholder} />
      </TouchableOpacity>

      {/* DateTimePicker */}
      {show && (
        <View style={{width: '100%'}}>
          <DateTimePicker
            testID="dateTimePicker"
            value={dob}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            textColor={appColors.primary}
            themVariant="light"
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
