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
import authenticationAPI from '../../apis/authApi';


const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRemember, setIsRemember] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await authenticationAPI.HandleAuthentication('/hello')
      console.log(res);
    } catch (error) {
      console.log('error', error);
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
          <RowComponent gap={8} align justify="space-between">
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
              onPress={() => navigation.navigate('ForgotPasswordScreen')}
              type="text"
              color={appColors.white}
              textStyles={{textDecorationLine: 'underline', fontSize: 12}}

            />
          </RowComponent>
        </SectionComponent>
        <ButtonComponent
          text="Sign In"
          onPress={handleLogin}
          styles={styles.button}
          type="primary"
          textFont={fontFamilies.semiBold}   
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
    fontSize: 24,
    color: appColors.white,
    alignSelf: 'center',
    fontFamily: fontFamilies.bold,
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
