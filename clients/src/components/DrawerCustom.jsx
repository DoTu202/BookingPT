import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {StatusBar} from 'react-native';
import {RowComponent, TextComponent} from './';
import appColors from '../constants/appColors';
import {useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import {removeAuth} from '../redux/reducers/authReducer';
import {
  Calendar,
  Lock,
  Logout,
  Message2,
  SearchNormal1,
  User,
} from 'iconsax-react-native';
import {useDispatch} from 'react-redux';  

const defaultAvatar = require('../../assets/images/default.png');

const DrawerCustom = ({navigation}) => {
  const user = useSelector(authSelector);
  const size = 24;
  const color = appColors.gray;
  const dispatch = useDispatch();

  // Every entry leads somewhere real; placeholder items (Bookmark, Settings,
  // Upgrade Pro...) that did nothing have been removed.
  const goToTab = screen => () =>
    navigation.navigate('ClientTabNavigator', {screen});

  const profileMenu = [
    {
      key: 'MyProfile',
      title: 'My Profile',
      icon: <User size={size} color={color} />,
      onPress: goToTab('ClientProfile'),
    },
    {
      key: 'Bookings',
      title: 'My Bookings',
      icon: <Calendar size={size} color={color} />,
      onPress: goToTab('ClientBookings'),
    },
    {
      key: 'Messages',
      title: 'Messages',
      icon: <Message2 size={size} color={color} />,
      onPress: goToTab('Messages'),
    },
    {
      key: 'FindTrainer',
      title: 'Find a Trainer',
      icon: <SearchNormal1 size={size} color={color} />,
      onPress: () => navigation.navigate('SearchPtScreen'),
    },
    {
      key: 'ChangePassword',
      title: 'Change Password',
      icon: <Lock size={size} color={color} />,
      onPress: () => navigation.navigate('ChangePasswordScreen'),
    },
  ];

  // Also clear persisted credentials; otherwise "Remember me" users were
  // signed straight back in on the next app launch.
  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('auth');
          dispatch(removeAuth());
        },
      },
    ]);
  };

  return (
    <View style={[localStyles.container]}>
      <TouchableOpacity onPress={goToTab('ClientProfile')}>
        <Image
          source={user.photoUrl ? {uri: user.photoUrl} : defaultAvatar}
          style={localStyles.avatar}
        />
        <TextComponent text={user.username} title size={18} />
      </TouchableOpacity>
      <FlatList
        showsVerticalScrollIndicator={false}
        style={localStyles.list}
        data={profileMenu}
        keyExtractor={item => item.key}
        renderItem={({item}) => (
          <RowComponent
            styles={[localStyles.listItem]}
            onPress={() => {
              navigation.closeDrawer();
              item.onPress();
            }}>
            {item.icon}
            <TextComponent text={item.title} styles={localStyles.itemText} />
          </RowComponent>
        )}
      />

      <RowComponent
        styles={[localStyles.listItem, localStyles.signOut]}
        onPress={handleSignOut}>
        <Logout size={size} color={appColors.danger} />
        <TextComponent
          text="Sign Out"
          color={appColors.danger}
          styles={localStyles.itemText}
        />
      </RowComponent>
    </View>
  );
};

export default DrawerCustom;

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 70,
  },

  avatar: {
    height: 80,
    width: 80,
    borderRadius: 27,
    marginBottom: 20,
  },

  list: {
    flex: 1,
    marginVertical: 24,
  },
  listItem: {
    paddingVertical: 16,
    justifyContent: 'flex-start',
  },
  itemText: {
    marginLeft: 12,
  },
  signOut: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.gray4,
  },
});
