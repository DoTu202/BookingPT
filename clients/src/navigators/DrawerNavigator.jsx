import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import DrawerCustom from '../components/DrawerCustom';
import ClientTabNavigator from './ClientTabNavigator';

const Drawer = createDrawerNavigator();
const renderDrawer = props => <DrawerCustom {...props} />;

const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{headerShown: false, drawerPosition: 'left', drawerStyle: {width: '82%', maxWidth: 320}}}
    drawerContent={renderDrawer}>
    <Drawer.Screen name="ClientTabNavigator" component={ClientTabNavigator} />
  </Drawer.Navigator>
);

export default DrawerNavigator;
