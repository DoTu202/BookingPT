import {
  StyleSheet,
  Text,
  View,
  Button,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import React from 'react';
import {useEffect} from 'react';
import {ButtonComponent} from '../../components';
import {globalStyles} from '../../styles/globalStyles';
import {InputComponent} from '../../components';
import {useState} from 'react';
import {fontFamilies} from '../../constants/fontFamilies';
import appColors from '../../constants/appColors';
import {LockCircle, Sms} from 'iconsax-react-native';
import TextComponent from '../../components/TextComponent';
import {SectionComponent} from '../../components';
import {RowComponent} from '../../components';
import SocialLogin from './components/SocialLogin';
import authApi from '../../apis/authApi';
import {useDispatch} from 'react-redux';
import {addAuth} from '../../redux/reducers/authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Validate} from '../../utils/validate';
import {useFocusEffect} from '@react-navigation/native';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRemember, setIsRemember] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [isForgotPressed, setIsForgotPressed] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const emailValidation = Validate.email(email);

    if (!email || !password || !emailValidation) {
      setIsDisable(true);
    } else {
      setIsDisable(false);
    }
  }, [email, password]);

  useFocusEffect(
    React.useCallback(() => {
      setIsForgotPressed(false);
    }, []),
  );

  const handleLogin = async () => {
    const emailValidation = Validate.email(email);

    if (emailValidation) {
      try {
        const res = await authApi.HandleAuthentication(
          '/login',
          {email, password},
          'post',
        );

        const authData = res.data.data || res.data;
        dispatch(addAuth(authData));
        if (isRemember) {
          await AsyncStorage.setItem('auth', JSON.stringify(authData));
        } else {
          await AsyncStorage.removeItem('auth');
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/Main.png')}
      style={[
        {justifyContent: 'center', alignItems: 'center', padding: 30},
        globalStyles.container,
      ]}>
      <TextComponent text="Sign In" title styles={styles.textLogin} />
      <View style={styles.wrap}>
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
          value={email}
          onChange={val => setEmail(val)}
          placeholder="Email"
          allowClear
        />
        <TextComponent
          text="Password"
          styles={{
            color: appColors.white,
            alignSelf: 'flex-start',
            marginBottom: 5,
            padding: 5,
            marginTop: 10,
          }}
        />
        <InputComponent
          value={password}
          onChange={val => setPassword(val)}
          placeholder="Password"
          secureTextEntry
          allowClear
          isPassword
          affix={<LockCircle size={22} color={appColors.gray} />}
        />

        <SectionComponent>
          <RowComponent align justify="space-between">
            <RowComponent>
              <Switch
                value={isRemember}
                onChange={() => setIsRemember(!isRemember)}
                trackColor={{
                  true: appColors.primary,
                  false: 'rgba(120, 120, 128, 0.16)',
                }}
                thumbColor={'white'}
                style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
              />
              <TextComponent text="Remember me" styles={styles.rememberMe} />
            </RowComponent>

            <ButtonComponent
              text="Forgot Password?"
              onPress={() => {
                setIsForgotPressed(true);
                navigation.navigate('ForgotPasswordScreen');
                setTimeout(() => setIsForgotPressed(false), 500);
              }}
              type="text"
              textStyles={{
                textDecorationLine: 'underline',
                fontSize: 12,
                color: isForgotPressed ? appColors.primary : appColors.white,
              }}
            />
          </RowComponent>
        </SectionComponent>
        <ButtonComponent
          text="Sign In"
          onPress={handleLogin}
          styles={styles.button}
          type="primary"
          textFont={fontFamilies.semiBold}
          disable={isDisable}
        />
      </View>

      <RowComponent>
        <TextComponent text="Don't have an account?" color={appColors.white} />
        <ButtonComponent
          text="Sign Up"
          onPress={() => navigation.navigate('SignUpScreen')}
          type="link"
          textStyles={{textDecorationLine: 'underline', fontSize: 14}}
          styles={{paddingHorizontal: 0}}
        />
      </RowComponent>

      <SocialLogin />
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  textLogin: {
    marginBottom: 20,
    fontSize: 28,
    color: appColors.white,
    alignSelf: 'center',
    fontFamily: fontFamilies.extraBold,
  },
  wrap: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.2,
    borderColor: '#FFF',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  rememberMe: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    padding: 8,
  },
});
