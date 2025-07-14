import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import appColors from '../constants/appColors';

import PTTabNavigator from './PTTabNavigator';
import DrawerNavigator from './DrawerNavigator';

import {
  EditProfileScreen,
  NotificationScreen,
  ChatScreen,
  ChatListScreen,
  ChangePasswordScreen
} from '../screens/commonScreen';

import {
  PTDetailScreen,
  PaymentScreen,
  ClientProfileScreen,
  SearchPtScreen,
  ClientBookingsScreen,
} from '../screens/clientScreen';

const MainNavigator = () => {
  const Stack = createStackNavigator();
  const auth = useSelector(authSelector);

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
        //PT FLOW
        <>
          <Stack.Screen
            name="PTMain"
            component={PTTabNavigator}
            options={{gestureEnabled: false}}
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
        
        
        //CLIENT FLOW
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
            name="ClientProfile"
            component={ClientProfileScreen}
            options={{
              headerShown: true,
              title: 'My Profile',
              headerTintColor: appColors.primary,
              headerBackTitleVisible: false,
            }}
          />

          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{headerShown: false}}
          />

          {/* Client Booking Flow */}
          <Stack.Screen
            name="PTDetailScreen"
            component={PTDetailScreen}
            options={{
              headerShown: true,
              title: 'Trainer Profile',
              headerTintColor: appColors.white,
              headerStyle: {
                backgroundColor: appColors.primary,
              },
            }}
          />

          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{
              headerShown: true,
              title: 'Payment',
            }}
          />

          {/* client common screen  */}
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
              headerShown: true,
              title: 'Chat',
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
