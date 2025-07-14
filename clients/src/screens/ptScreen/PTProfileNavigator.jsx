import React, {useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import PTProfileDisplayScreen from './PTProfileDisplayScreen';
import PTProfileEditScreen from './PTProfileEditScreen';
import LoadingModal from '../../modals/LoadingModal';
import ptApi from '../../apis/ptApi';

const Stack = createStackNavigator();

const PTProfileNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkProfile();
    }, []),
  );

  const checkProfile = async () => {
    try {
      setLoading(true);
      const response = await ptApi.getProfile();

      let profileExists = false;

      if (response.data) {
        // Case 1: Profile data is in response.data.data (when profile exists)
        if (response.data.data && response.data.data._id) {
          profileExists = true;
          console.log(
            'PTProfileNavigator: Profile found in data.data with _id:',
            response.data.data._id,
          );
        }
        // Case 2: Profile data is directly in response.data (alternative structure)
        else if (response.data._id) {
          profileExists = true;
          console.log(
            'PTProfileNavigator: Profile found in data with _id:',
            response.data._id,
          );
        }
        // Case 3: Check for success message indicating profile exists
        else if (
          response.data.message &&
          response.data.message.includes('successfully')
        ) {
          if (
            response.data.specializations ||
            response.data.bio ||
            response.data.hourlyRate
          ) {
            profileExists = true;
            console.log(
              'PTProfileNavigator: Profile found via success message with profile fields',
            );
          }
        }
      }
      console.log('PTProfileNavigator: Profile exists:', profileExists);
      setHasProfile(profileExists);
    } catch (error) {
      console.error('PTProfileNavigator: Error checking profile:', error);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingModal visible={true} />;
  }

  console.log('PTProfileNavigator: Rendering with hasProfile:', hasProfile);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      // Set initial route based on profile status
      initialRouteName={hasProfile ? 'PTProfileDisplay' : 'PTProfileEdit'}>
      {hasProfile ? (
        <>
          <Stack.Screen
            name="PTProfileDisplay"
            component={PTProfileDisplayScreen}
          />
          <Stack.Screen
            name="PTProfileEdit"
            component={PTProfileEditScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="PTProfileEdit" component={PTProfileEditScreen} />
          <Stack.Screen
            name="PTProfileDisplay"
            component={PTProfileDisplayScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default PTProfileNavigator;
