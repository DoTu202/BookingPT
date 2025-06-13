import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppRouter from './src/navigators/AppRouter';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import store from './src/redux/store';


const App = () => {
  return (
    <>
      <Provider store={store}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
      
        <NavigationContainer>
          <AppRouter />
        </NavigationContainer>
      </Provider>
    </>
  );
};

export default App;
