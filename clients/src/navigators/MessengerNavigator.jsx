import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {MessengerScreen} from '../screens';

const MessengerNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="MessengerScreen" component={MessengerScreen} />

    </Stack.Navigator>
  );
};

export default MessengerNavigator;