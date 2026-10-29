import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import {useRealtimeConnection} from '../apis/socketClient';
import {usePushNotifications} from '../utils/pushNotifications';

import PTTabNavigator from './PTTabNavigator';
import DrawerNavigator from './DrawerNavigator';

import {
  EditProfileScreen,
  NotificationScreen,
  ChatScreen,
  ChatListScreen,
  ChangePasswordScreen,
} from '../screens/commonScreen';

import {
  PTDetailScreen,
  SearchPtScreen,
  ClientBookingsScreen,
} from '../screens/clientScreen';

import {PTDashboardScreen} from '../screens/ptScreen';

// Created once: creating the navigator inside the component made React
// remount every screen on each render of MainNavigator.
const Stack = createStackNavigator();

const MainNavigator = () => {
  const auth = useSelector(authSelector);
  // Mounted only while signed in, so the socket lives exactly as long as the session.
  useRealtimeConnection(auth.accesstoken);
  usePushNotifications(auth.accesstoken);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({current}) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}>
      {auth.role === 'pt' ? (
        <>
          <Stack.Screen
            name="PTMain"
            component={PTTabNavigator}
            options={{gestureEnabled: false}}
          />

          <Stack.Screen name="PTDashboard" component={PTDashboardScreen} />

          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ChatListScreen"
            component={ChatListScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ChangePasswordScreen"
            component={ChangePasswordScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="ClientMainWithDrawerAndTabs"
            component={DrawerNavigator}
            options={{gestureEnabled: false}}
          />

          <Stack.Screen
            name="SearchPtScreen"
            component={SearchPtScreen}
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />

          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{headerShown: false}}
          />

          <Stack.Screen
            name="PTDetailScreen"
            component={PTDetailScreen}
            options={{
              headerShown: false,
            }}
          />


          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ClientBookings"
            component={ClientBookingsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ChangePasswordScreen"
            component={ChangePasswordScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ChatListScreen"
            component={ChatListScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
