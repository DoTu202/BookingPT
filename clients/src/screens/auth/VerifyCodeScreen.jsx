import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {TextComponent, InputComponent, ButtonComponent} from '../../components';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {useState} from 'react';

import {ArrowLeft} from 'iconsax-react-native';

const VerifyCodeScreen = ({navigation}) => {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [code3, setCode3] = useState('');
  const [code4, setCode4] = useState('');
  const [code5, setCode5] = useState('');
  const [code6, setCode6] = useState('');

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
          text="Send code"
          styles={{
            color: appColors.white,
            fontSize: 24,
            fontFamily: fontFamilies.bold,
            padding: 20,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <TextComponent
          text="Enter the code sent to your email"
          styles={{
            color: appColors.white,
            fontSize: 14,
            fontFamily: fontFamilies.medium,
            padding: 20,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {/* Text và button Resend code */}
        <Text
          style={{
            textAlign: 'center',
            color: appColors.white,
            fontSize: 14,
            fontFamily: fontFamilies.medium,
            marginBottom: 20,
          }}>
          If you didn't receive the code?{' '}
          <Text
            style={{
              color: appColors.primary,
              textDecorationLine: 'underline',
            }}
            onPress={() => navigation.navigate('ForgotPasswordScreen')}>
            Resend code
          </Text>
        </Text>

        {/* OTP Input Boxes - 6 ô vuông */}
        <View style={styles.otpContainer}>
          <View style={styles.otpBox}>
            <InputComponent
              value={code1}
              onChange={setCode1}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>

          <View style={styles.otpBox}>
            <InputComponent
              value={code2}
              onChange={setCode2}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>

          <View style={styles.otpBox}>
            <InputComponent
              value={code3}
              onChange={setCode3}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>

          <View style={styles.otpBox}>
            <InputComponent
              value={code4}
              onChange={setCode4}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>

          <View style={styles.otpBox}>
            <InputComponent
              value={code5}
              onChange={setCode5}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>

          <View style={styles.otpBox}>
            <InputComponent
              value={code6}
              onChange={setCode6}
              placeholder=""
              keyboardType="number-pad"
              maxLength={1}
              type="numeric"
              isOtp={true}
            />
          </View>
        </View>

        {/* Verify Button */}
        <ButtonComponent
          text="Verify"
          type="primary"
          onPress={() => {
            // Combine all codes
            const fullCode = code1 + code2 + code3 + code4 + code5 + code6;
            console.log('Verification code:', fullCode);
            // Add your verification logic here
            // navigation.navigate('NextScreen');
          }}
          styles={{width: '100%', marginTop: 30}}
        />
      </View>
    </SafeAreaView>
  );
};

export default VerifyCodeScreen;

const styles = StyleSheet.create({
  otpContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  otpBox: {
    width: '15%', // Giảm kích thước để vừa 6 ô
    aspectRatio: 1, // Tỉ lệ 1:1 để tạo hình vuông
    borderRadius: 8,
    overflow: 'hidden',
  },
});
