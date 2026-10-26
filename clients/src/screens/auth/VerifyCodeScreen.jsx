import {StyleSheet, Text, View, TextInput, SafeAreaView} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useRef} from 'react';

import appColors from '../../constants/appColors';

import {LoadingModal} from '../../modals';
import {
  SectionComponent,
  RowComponent,
  SpaceComponent,
  TextComponent,
  ButtonComponent,
} from '../../components';
import authApi from '../../apis/authApi';
import {useDispatch} from 'react-redux';
import {addAuth} from '../../redux/reducers/authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerifyCodeScreen = ({navigation, route}) => {
  const {email, password, username, dob, phoneNumber, role} = route.params;

  const [codeValues, setCodeValues] = useState(['']);
  const [newCode, setNewCode] = useState(['']);
  const [limit, setLimit] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const dispatch = useDispatch();

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);

  useEffect(() => {
    ref1.current.focus();
  }, []);

  useEffect(() => {
    if (limit > 0) {
      const interval = setInterval(() => {
        setLimit(limit => limit - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [limit]);

  useEffect(() => {
    let item = '';
    codeValues.forEach(val => (item += val));
    setNewCode(item);
  }, [codeValues]);

  const handleChangeCode = (val, index) => {
    const data = [...codeValues];
    data[index] = val;
    setCodeValues(data);
  };

  const handleResendVerifaction = async () => {
    setCodeValues(['', '', '', '']);
    setNewCode('');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await authApi.HandleAuthentication('/verification', {email}, 'post');
      setLimit(60);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // The code is checked by the server as part of registration; the app never
  // sees the real code.
  const handleVerification = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await authApi.HandleAuthentication(
        '/register',
        {email, password, username, dob, phoneNumber, role, code: newCode},
        'post',
      );

      const authData = res.data.data || res.data;
      await AsyncStorage.setItem('auth', JSON.stringify(authData));
      dispatch(addAuth(authData));
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={[styles.content]}>
        <SectionComponent>
          <TextComponent text="Verify Code" title color={appColors.primary} />
          <TextComponent
            text={`Please enter the code sent to ${email.replace(/.{1,5}/, m =>
              '*'.repeat(m.length),
            )}`}
            color={appColors.white}
            style={styles.subtitle}
            fontSize={16}
          />
          <SpaceComponent height={20} />
          <RowComponent justify="space-around">
            <TextInput
              ref={ref1}
              style={[styles.input]}
              maxLength={1}
              onChangeText={val => {
                val.length > 0 && ref2.current.focus();
                handleChangeCode(val, 0);
              }}
              keyboardType="number-pad"
              value={codeValues[0]}
            />
            <TextInput
              ref={ref2}
              onChangeText={val => {
                handleChangeCode(val, 1);
                val.length > 0 && val && ref3.current.focus();
              }}
              style={[styles.input]}
              keyboardType="number-pad"
              maxLength={1}
              value={codeValues[1]}
            />
            <TextInput
              ref={ref3}
              onChangeText={val => {
                handleChangeCode(val, 2);
                val.length > 0 && val && ref4.current.focus();
              }}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
              value={codeValues[2]}
            />
            <TextInput
              ref={ref4}
              onChangeText={val => {
                handleChangeCode(val, 3);
                // Remove immediate console.log since newCode hasn't updated yet
                // The actual newCode will be logged in useEffect
              }}
              style={[styles.input]}
              keyboardType="number-pad"
              maxLength={1}
              value={codeValues[3]}
            />
          </RowComponent>
        </SectionComponent>

        <SectionComponent>
          <ButtonComponent
            disable={newCode.length < 4}
            onPress={handleVerification}
            text="Continue"
            type="primary"
          />
        </SectionComponent>
        {errorMessage && (
          <TextComponent
            flex={0}
            text={errorMessage}
            color={appColors.danger}
            styles={{textAlign: 'center'}}
          />
        )}
        <SectionComponent>
          {limit > 0 ? (
            <RowComponent>
              <TextComponent
                text="Re-send code in "
                flex={0}
                color={appColors.white}
              />
              <TextComponent
                text={`${Math.floor(limit / 60)
                  .toString()
                  .padStart(2, '0')}:${(limit % 60)
                  .toString()
                  .padStart(2, '0')}`}
                flex={0}
                color={appColors.primary}
              />
            </RowComponent>
          ) : (
            <ButtonComponent
              type="link"
              text="Resend email verification"
              onPress={handleResendVerifaction}
            />
          )}
        </SectionComponent>
      </View>
      <LoadingModal visible={isLoading} />
    </SafeAreaView>
  );
};

export default VerifyCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  input: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.gray2,
    backgroundColor: appColors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: appColors.primary,
  },
});
