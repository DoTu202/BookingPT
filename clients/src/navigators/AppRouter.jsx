import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import { useAsyncStorage} from '@react-native-async-storage/async-storage';
import { addAuth, authSelector } from '../redux/reducers/authReducer';
import { useDispatch, useSelector } from 'react-redux';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';


const AppRouter = () => {
  const {getItem} = useAsyncStorage('auth');

  const auth =  useSelector(authSelector)
  const dispatch = useDispatch();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const res = await getItem();

    res && dispatch(addAuth(JSON.parse(res)));
  };

  return <>{auth.accesstoken ? <MainNavigator /> : <AuthNavigator />}</>;
};

export default AppRouter;
