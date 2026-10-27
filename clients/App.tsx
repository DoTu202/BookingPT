import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppRouter from './src/navigators/AppRouter';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import store from './src/redux/store';
import {navigationRef} from './src/navigators/navigationRef';


const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <NavigationContainer ref={navigationRef}>
          <AppRouter />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
