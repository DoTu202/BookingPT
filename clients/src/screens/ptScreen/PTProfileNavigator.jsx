import React, {useCallback, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import PTProfileDisplayScreen from './PTProfileDisplayScreen';
import PTProfileEditScreen from './PTProfileEditScreen';
import {StateView} from '../../components';
import ptApi from '../../apis/ptApi';

const Stack = createStackNavigator();

// Opens on the profile when the PT has one, otherwise straight on the form.
const PTProfileNavigator = () => {
  const [hasProfile, setHasProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      ptApi
        .getProfile()
        .then(res => setHasProfile(Boolean(res.data?.data?._id)))
        .catch(() => setHasProfile(false));
    }, []),
  );

  if (hasProfile === null) {
    return <StateView type="loading" />;
  }

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={hasProfile ? 'PTProfileDisplay' : 'PTProfileEdit'}>
      <Stack.Screen name="PTProfileDisplay" component={PTProfileDisplayScreen} />
      <Stack.Screen name="PTProfileEdit" component={PTProfileEditScreen} />
    </Stack.Navigator>
  );
};

export default PTProfileNavigator;
