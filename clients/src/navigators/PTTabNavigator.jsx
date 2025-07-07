import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {Home2, Calendar, Clock, Messages2, User} from 'iconsax-react-native';
import appColors from '../constants/appColors';
import {StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fontFamilies} from '../constants/fontFamilies';
import {
  PTAvailabilityScreen,
  PTBookingsScreen,
  PTHomeScreen,
  PTProfileScreen,
  PTProfileViewScreen,
  ProfileTabScreen
} from '../screens/ptScreen';
import { ChatListScreen } from '../screens/commonScreen';


const Tab = createBottomTabNavigator();

const PTTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let IconComponent;

          switch (route.name) {
            case 'PTHome':
              IconComponent = Home2;
              break;
            case 'PTBookings':
              IconComponent = Calendar;
              break;
            case 'PTAvailability':
              IconComponent = Clock;
              break;
            case 'PTMessages':
              IconComponent = Messages2;
              break;
            case 'PTProfile':
              IconComponent = User;
              break;
            default:
              IconComponent = Home2;
          }

          return (
            <IconComponent
              size={size}
              color={color}
              variant={focused ? 'Bold' : 'Outline'}
            />
          );
        },
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.gray2,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fontFamilies.medium,
          marginBottom: Platform.OS === 'ios' ? 0 : 3,
          marginTop: -2,
        },
        tabBarStyle: [
          styles.tabBarStyle,
          {
            paddingBottom: Platform.OS === 'ios' 
              ? Math.max(insets.bottom - 5, 8) 
              : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' 
              ? 75 + Math.max(insets.bottom - 15, 0)
              : 65,
          },
        ],
        tabBarItemStyle: styles.tabBarItemStyle,
      })}>
      <Tab.Screen
        name="PTHome"
        component={PTHomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="PTBookings"
        component={PTBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen
        name="PTAvailability"
        component={PTAvailabilityScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="PTMessages"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen
        name="PTProfile"
        component={ProfileTabScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default PTTabNavigator;

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: appColors.white,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
  },
  tabBarItemStyle: {
    paddingTop: 6,
    paddingHorizontal: 4,
  },
});