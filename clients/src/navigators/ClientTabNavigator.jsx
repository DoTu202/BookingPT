import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Calendar, Chart, Home2, Messages2, User} from 'iconsax-react-native';
import {ModernTabBar} from '../components';
import {tabIcon} from './tabIcon';
import {
  ClientBookingsScreen,
  ClientHomeScreen,
  ClientProfileScreen,
  ProgressScreen,
} from '../screens/clientScreen';
import {ChatListScreen} from '../screens/commonScreen';

const Tab = createBottomTabNavigator();
const renderTabBar = props => <ModernTabBar {...props} />;

const ClientTabNavigator = () => (
  <Tab.Navigator tabBar={renderTabBar} screenOptions={{headerShown: false}}>
    <Tab.Screen
      name="ClientHome"
      component={ClientHomeScreen}
      options={{tabBarLabel: 'Trang chủ', tabBarIcon: tabIcon(Home2)}}
    />
    <Tab.Screen
      name="ClientBookings"
      component={ClientBookingsScreen}
      options={{tabBarLabel: 'Lịch tập', tabBarIcon: tabIcon(Calendar)}}
    />
    <Tab.Screen
      name="Progress"
      component={ProgressScreen}
      options={{tabBarLabel: 'Tiến độ', tabBarIcon: tabIcon(Chart)}}
    />
    <Tab.Screen
      name="Messages"
      component={ChatListScreen}
      options={{tabBarLabel: 'Tin nhắn', tabBarIcon: tabIcon(Messages2)}}
    />
    <Tab.Screen
      name="ClientProfile"
      component={ClientProfileScreen}
      options={{tabBarLabel: 'Tài khoản', tabBarIcon: tabIcon(User)}}
    />
  </Tab.Navigator>
);

export default ClientTabNavigator;
