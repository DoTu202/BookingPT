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
import React, {useEffect} from 'react';
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
import authApi from '../../apis/authApi';
import {Validate} from '../../utils/validate';
import {useDispatch} from 'react-redux';
import {SectionComponent} from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setLoggedInUser} from '../../redux/reducers/authReducer';

const initValue = {
  email: '',
  password: '',
  username: '',
  phoneNumber: '',
  confirmPassword: '',
  dob: null,
  role: 'client',
};

const SignUpScreen = ({navigation}) => {
  const [values, setValues] = useState(initValue);
  const [errorMessage, setErrorMessage] = useState({});
  const [isDisable, setIsDisable] = useState(true);
  const [show, setShow] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !values.username ||
      !values.email ||
      !values.password ||
      !values.confirmPassword ||
      !values.phoneNumber ||
      (errorMessage &&
        (errorMessage.email ||
          errorMessage.password ||
          errorMessage.confirmPassword))
    ) {
      setIsDisable(true);
    } else {
      setIsDisable(false);
    }
  }, [errorMessage, values]);

  const handleChangeValue = (key, value) => {
    const data = {...values};
    data[`${key}`] = value;
    setValues(data);
  };

  const formValidator = key => {
    const data = {...errorMessage};
    let message = '';

    switch (key) {
      case 'email':
        if (!values.email) {
          message = 'Email is required!';
        } else if (!Validate.email(values.email)) {
          message = 'Email is not valid!';
        } else {
          message = '';
        }
        break;

      case 'password':
        message = !values.password ? 'Password is required!' : '';
        break;

      case 'confirmPassword':
        if (!values.confirmPassword) {
          message = 'Please type confirm password!';
        } else if (values.confirmPassword !== values.password) {
          message = 'Password is not match!';
        } else {
          message = '';
        }
        break;
    }

    data[key] = message;
    setErrorMessage(data);
  };

  const formatDate = date => {
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
    if (
      !values.username ||
      !values.phoneNumber ||
      !values.email ||
      !values.password
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    const api = '/verification';
    setIsLoading(true);
    try {
      const res = await authApi.HandleAuthentication(
        api,
        {email: values.email},
        'post',
      );
      navigation.navigate('VerifyCodeScreen', {
        code: res.data.data.verificationCode,
        ...values,
        dob: values.dob.toISOString(),
        role: values.role,
      });
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message || 'Failed to send verification code';
      Alert.alert('Error', message);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollViewFlex}
        contentContainerStyle={styles.scrollContentContainer}>
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
          onEnd={() => formValidator('email')}
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
          onChange={val =>
            handleChangeValue('phoneNumber', val.replace(/[^0-9]/g, ''))
          }
          placeholder="Phone Number"
          allowClear
          keyboradType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
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
          onEnd={() => formValidator('password')}
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
          onEnd={() => formValidator('confirmPassword')}
        />
        {errorMessage && (
          <SectionComponent>
            {Object.keys(errorMessage).map((error, index) =>
              errorMessage[error] ? (
                <TextComponent
                  text={errorMessage[error]}
                  key={`error${index}`}
                  color={appColors.danger}
                />
              ) : null,
            )}
          </SectionComponent>
        )}
        <TextComponent text="You are :" styles={styles.inputLabel} />
        <View style={styles.roleSelectionContainer}>
          <ButtonComponent
            text="Client"
            onPress={() => handleChangeValue('role', 'client')}
            type={values.role === 'client' ? 'primary' : 'outline'}
            styles={styles.roleButton}
            textStyles={{fontSize: 14}}
          />
          <ButtonComponent
            text="Personal Trainer"
            onPress={() => handleChangeValue('role', 'pt')}
            type={values.role === 'pt' ? 'primary' : 'outline'}
            styles={styles.roleButton}
            textStyles={{fontSize: 14}}
          />
        </View>

        <ButtonComponent
          text={isLoading ? 'Creating account...' : 'Sign Up'}
          onPress={handleRegister}
          styles={styles.button}
          type="primary"
          textFont={fontFamilies.semiBold}
          disable={isDisable}
        />
        <SocialLogin />
      </ScrollView>
      <LoadingModal visible={isLoading} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  textSignUp: {
    marginBottom: 20,
    fontSize: 28,
    color: appColors.white,
    alignSelf: 'center',
    fontFamily: fontFamilies.extraBold,
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
  inputLabel: {
    color: appColors.white,
    alignSelf: 'flex-start',
    padding: 5,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
  roleSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
    marginBottom: 5,
    width: '100%',
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 8,
  },
  scrollViewFlex: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 120, // Khoảng trống ở cuối ScrollView, cần lớn hơn chiều cao của SocialLogin + margin
    width: '100%',
    alignItems: 'center',
  },
});

export default SignUpScreen;
