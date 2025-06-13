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
              size={size}
              color={color}
              variant={focused ? 'Bold' : 'Outline'}
            />
          );
        },
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.gray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamilies.medium,
          marginBottom: Platform.OS === 'ios' ? 0 : 5, // ✅ Adjust for Android
        },
        tabBarStyle: [
          styles.tabBarStyle,
          {
            paddingBottom:
              Platform.OS === 'ios'
                ? Math.max(insets.bottom - 10, 10) // ✅ Dynamic safe area
                : 10,
            height:
              Platform.OS === 'ios'
                ? 85 + Math.max(insets.bottom - 20, 0) // ✅ Dynamic height
                : 70,
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
    borderTopWidth: 0.5,
    borderTopColor: appColors.gray4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarItemStyle: {
    paddingTop: 8, 
    marginBottom: 4,
  },
});
