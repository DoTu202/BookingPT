import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import appColors from '../constants/appColors';

import PTTabNavigator from './PTTabNavigator';
import DrawerNavigator from './DrawerNavigator';

import {
  BookingDetailScreen,
  NotificationScreen,
  ReviewScreen,
  ChatScreen,
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

          {/* PT Specific Screens */}
          <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={{
              headerShown: true,
              title: 'Booking Details',
              headerBackTitleVisible: false,
            }}
          />

          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
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
              cardStyleInterpolator: ({current}) => ({
                cardStyle: {
                  opacity: current.progress,
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                },
              }),
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

          <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={{
              headerShown: true,
              title: 'Booking Details',
              backgroundColor: appColors.primary,
            }}
          />

          {/* client common screen  */}
          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
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
            name="Review"
            component={ReviewScreen}
            options={{
              headerShown: true,
              title: 'Write Review',
            }}
          />

          <Stack.Screen
            name="ClientBookings"
            component={ClientBookingsScreen}
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
