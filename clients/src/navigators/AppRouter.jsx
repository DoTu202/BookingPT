import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {addAuth, authSelector} from '../redux/reducers/authReducer';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import {SplashScreen} from '../screens';

const AppRouter = () => {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore the "Remember me" session, if any.
    AsyncStorage.getItem('auth')
      .then(saved => {
        if (saved) {
          dispatch(addAuth(JSON.parse(saved)));
        }
      })
      .catch(() => {
        // Unreadable copy: start signed out.
      });
    const timeout = setTimeout(() => setIsShowSplash(false), 1500);
    return () => clearTimeout(timeout);
  }, [dispatch]);

  if (isShowSplash) {
    return <SplashScreen />;
  }
  return auth.accesstoken ? <MainNavigator /> : <AuthNavigator />;
};

export default AppRouter;
