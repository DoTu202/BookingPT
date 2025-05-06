import React, {useEffect, useState} from 'react';
import {SplashScreen} from './src/screens';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import AuthNavigator from './src/navigators/AuthNavigator';
import {NavigationContainer} from '@react-navigation/native';
import AppRouter from './src/navigators/AppRouter';
import {StatusBar} from 'react-native';
import { Provider } from 'react-redux';
import store from './src/redux/store';


const App = () => {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsShowSplash(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Provider store={store}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {isShowSplash ? (
        <SplashScreen />
      ) : (
        <NavigationContainer>
          <AppRouter /> 
        </NavigationContainer>
      )}
      </Provider>
    </>
  );
};

export default App;
