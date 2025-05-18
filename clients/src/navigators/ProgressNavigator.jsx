import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {ProgressScreen} from '../screens';

const ProgressNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} />

    </Stack.Navigator>
  );
};

export default ProgressNavigator;