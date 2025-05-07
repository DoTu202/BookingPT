import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {addAuth, authSelector} from '../redux/reducers/authReducer';
import {useDispatch, useSelector} from 'react-redux';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import {useState} from 'react';
import { SplashScreen } from '../screens' 

const AppRouter = () => {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    checkLogin();
    const timeout = setTimeout(() => {
      setIsShowSplash(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  const {getItem} = useAsyncStorage('auth');

  const checkLogin = async () => {
    const res = await getItem();

    res && dispatch(addAuth(JSON.parse(res)));
  };

  return <>{isShowSplash ? <SplashScreen /> : auth.accesstoken ? <MainNavigator /> : <AuthNavigator />}</>;
};

export default AppRouter;
