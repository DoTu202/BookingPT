import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {Home, Calendar, Clock, DollarSign, User} from 'lucide-react-native';
import appColors from '../constants/appColors';
import {StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fontFamilies} from '../constants/fontFamilies';
import {
  PTAvailabilityScreen,
  PTBookingsScreen,
  PTHomeScreen,
  PTEarningScreen,
  PTProfileScreen,
} from '../screens/ptScreen';

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
              IconComponent = Home;
              break;
            case 'PTBookings':
              IconComponent = Calendar;
              break;
            case 'PTAvailability':
              IconComponent = Clock;
              break;
            case 'PTEarnings':
              IconComponent = DollarSign;
              break;
            case 'PTProfile':
              IconComponent = User;
              break;
            default:
              IconComponent = Home;
          }

          return (
            <IconComponent
              size={focused ? 24 : 22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          );
        },
        tabBarItemStyle: ({focused}) => ({
          ...styles.tabBarItemStyle,
          backgroundColor: focused ? appColors.primary + '15' : 'transparent',
        }),
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.gray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamilies.medium,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
          marginTop: 4,
        },
        tabBarStyle: [
          styles.tabBarStyle,
          {
            paddingBottom:
              Platform.OS === 'ios'
                ? Math.max(insets.bottom - 5, 8)
                : 8,
            paddingTop: 8,
            height:
              Platform.OS === 'ios'
                ? 90 + Math.max(insets.bottom - 15, 0)
                : 75,
          },
        ],
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
        name="PTEarnings"
        component={PTEarningScreen}
        options={{
          tabBarLabel: 'Earnings',
        }}
      />
      <Tab.Screen
        name="PTProfile"
        component={PTProfileScreen}
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
      height: -4,
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
    paddingTop: 4,
    paddingBottom: 4,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
});
