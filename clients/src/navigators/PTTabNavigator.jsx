import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Calendar, Clock, Home2, Messages2, User} from 'iconsax-react-native';
import {ModernTabBar} from '../components';
import {tabIcon} from './tabIcon';
import {
  PTAvailabilityScreen,
  PTBookingsScreen,
  PTHomeScreen,
  ProfileTabScreen,
} from '../screens/ptScreen';
import {ChatListScreen} from '../screens/commonScreen';

const Tab = createBottomTabNavigator();
const renderTabBar = props => <ModernTabBar {...props} />;

const PTTabNavigator = () => (
  <Tab.Navigator tabBar={renderTabBar} screenOptions={{headerShown: false}}>
    <Tab.Screen
      name="PTHome"
      component={PTHomeScreen}
      options={{tabBarLabel: 'Trang chủ', tabBarIcon: tabIcon(Home2)}}
    />
    <Tab.Screen
      name="PTBookings"
      component={PTBookingsScreen}
      options={{tabBarLabel: 'Lịch đặt', tabBarIcon: tabIcon(Calendar)}}
    />
    <Tab.Screen
      name="PTAvailability"
      component={PTAvailabilityScreen}
      options={{tabBarLabel: 'Lịch rảnh', tabBarIcon: tabIcon(Clock)}}
    />
    <Tab.Screen
      name="PTMessages"
      component={ChatListScreen}
      options={{tabBarLabel: 'Tin nhắn', tabBarIcon: tabIcon(Messages2)}}
    />
    <Tab.Screen
      name="PTProfile"
      component={ProfileTabScreen}
      options={{tabBarLabel: 'Tài khoản', tabBarIcon: tabIcon(User)}}
    />
  </Tab.Navigator>
);

export default PTTabNavigator;
