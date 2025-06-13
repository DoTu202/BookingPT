import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import { createDrawerNavigator} from '@react-navigation/drawer';
import DrawerCustom from '../components/DrawerCustom';
import {ClientHomeScreen} from '../screens/clientScreen';
import ClientTabNavigator from './ClientTabNavigator';

const DrawerNavigator = () => {
  const Drawer = createDrawerNavigator();
  return (
    <Drawer.Navigator
      screenOptions={{headerShown: false, drawerPosition: 'left'}}
      drawerContent={props => <DrawerCustom {...props} />}>
      <Drawer.Screen name="ClientTabNavigator" component={ClientTabNavigator} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({});
