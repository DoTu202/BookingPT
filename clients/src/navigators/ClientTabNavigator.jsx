import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Home, MessageCircle, Calendar, Activity, User } from 'lucide-react-native';
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
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          
          switch (route.name) {
            case 'ClientHome':
              IconComponent = Home;
              break;
            case 'Messages':
              IconComponent = MessageCircle;
              break;
            case 'ClientBookings':
              IconComponent = Calendar;
              break;
            case 'Progress':
              IconComponent = Activity;
              break;
            case 'ClientProfile':
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
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarStyle: [
          styles.tabBarStyle,
          {
            paddingBottom: Platform.OS === 'ios' 
              ? Math.max(insets.bottom - 10, 10) 
              : 10,
            height: Platform.OS === 'ios' 
              ? 85 + Math.max(insets.bottom - 20, 0)
              : 70,
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
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen 
        name="ClientBookings" 
        component={ClientBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
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