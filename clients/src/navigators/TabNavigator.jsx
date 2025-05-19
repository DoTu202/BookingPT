import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  HomeScreen,
  SessionScreen,
  ProfileScreen,
  MessengerScreen,
  ProgressScreen,
} from '../screens';
import appColors from '../constants/appColors';
import {appInfo} from '../constants/appInfos';
import { Home, Calendar, BarChart2, MessageSquare, User } from 'lucide-react-native';


const TabNavigator = () => {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator 
    screenOptions = {({route}) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarStyle:{
        justifyContent: 'center',
        alignItems: 'center',
      },
      tabBarIcon: ({focused, color, size}) => {
        color = focused ? appColors.primary : appColors.gray;
        let icon;
        switch (route.name) {
          case 'Home':
            icon = <Home color={color} size={size} />;
            break;
          case 'Session':
            icon = <Calendar color={color} size={size} />;
            break;
          case 'Progress':
            icon = <BarChart2 color={color} size={size} />;
            break;
          case 'Messenger':
            icon = <MessageSquare color={color} size={size} />;
            break;
          case 'Profile':
            icon = <User color={color} size={size} />;
            break;
        }
        return icon;
      },
      tabBarLabel: ({focused}) => {
        const color = focused ? appColors.primary : appColors.gray;
        return (
          <Text style={{color: color, fontSize: 12}}>
            {route.name}
          </Text>
        )
      }
    })} 
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Session" component={SessionScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Messenger" component={MessengerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({});
