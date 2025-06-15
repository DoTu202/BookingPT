import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Home2, Messages2, Calendar, Chart, User } from 'iconsax-react-native';
import appColors from '../constants/appColors';
import { StyleSheet, Platform } from 'react-native';
import { fontFamilies } from '../constants/fontFamilies';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Client Screens
import { ClientHomeScreen, MessagesScreen, ClientBookingsScreen, ProgressScreen, ClientProfileScreen } from '../screens/clientScreen';

const Tab = createBottomTabNavigator();

const ClientTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'ClientBookings', // Show header only for ClientBookings
        headerTitle: route.name === 'ClientBookings' ? 'My Bookings' : '',
        headerTintColor: appColors.white,
        headerStyle: {
          backgroundColor: appColors.primary,
        },
        headerBackTitleVisible: false,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          
          switch (route.name) {
            case 'ClientHome':
              IconComponent = Home2;
              break;
            case 'ClientBookings':
              IconComponent = Calendar;
              break;
            case 'Progress':
              IconComponent = Chart;
              break;
            case 'Messages':
              IconComponent = Messages2;
              break;
            case 'ClientProfile':
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
            height: Platform.OS === 'ios' 
              ? 75 + Math.max(insets.bottom - 15, 0)
              : 65,
          }
        ],
        tabBarItemStyle: styles.tabBarItemStyle,
      })}>
      
      <Tab.Screen 
        name="ClientHome" 
        component={ClientHomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen 
        name="ClientBookings" 
        component={ClientBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          headerShown: false, 
        }}
      />
      
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
        }}
      />
      
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      
      <Tab.Screen 
        name="ClientProfile" 
        component={ClientProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default ClientTabNavigator;

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