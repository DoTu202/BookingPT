import {
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import React from 'react';
import {StatusBar} from 'react-native';
import {ButtonComponent, RowComponent, TextComponent} from './';
import appColors from '../constants/appColors';
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {authSelector} from '../redux/reducers/authReducer';
import {removeAuth} from '../redux/reducers/authReducer';
import {
  Bookmark2,
  Calendar,
  Logout,
  Message2,
  MessageQuestion,
  Setting2,
  Sms,
  User,
} from 'iconsax-react-native';
import {useDispatch} from 'react-redux';  

const defaultAvatar = require('../../assets/images/default.png');

const DrawerCustom = ({navigation}) => {
  const user = useSelector(authSelector);
  const size = 24;
  const color = appColors.gray;
  const dispatch = useDispatch();

  const profileMenu = [
    {
      key: 'MyProfile',
      title: 'My Profile',
      icon: <User size={size} color={color} />,
    },
    {
      key: 'Message',
      title: 'Message',
      icon: <Message2 size={size} color={color} />,
    },
    {
      key: 'Calendar',
      title: 'Calendar',
      icon: <Calendar size={size} color={color} />,
    },
    {
      key: 'Bookmark',
      title: 'Bookmark',
      icon: <Bookmark2 size={size} color={color} />,
    },
    {
      key: 'ContactUs',
      title: 'Contact Us',
      icon: <Sms size={size} color={color} />,
    },
    {
      key: 'Settings',
      title: 'Settings',
      icon: <Setting2 size={size} color={color} />,
    },
    {
      key: 'HelpAndFAQs',
      title: 'Help & FAQs',
      icon: <MessageQuestion size={size} color={color} />,
    },
    {
      key: 'SignOut',
      title: 'Sign Out',
      icon: <Logout size={size} color={color} />,
    },
  ];

  const handleSignOut = async () => {
    dispatch(removeAuth({}));

  }

  return (
    <View style={[localStyles.container]}>
      <TouchableOpacity
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('ClientProfile');
        }}>
        <Image
          source={user.photoUrl ? {uri: user.photoUrl} : defaultAvatar}
          style={localStyles.avatar}
        />
        <TextComponent text={user.username} title size={18} />
      </TouchableOpacity>
      <FlatList showsVerticalScrollIndicator={false}
        style={{flex: 1, marginVertical: 24}}
        data={profileMenu}
        renderItem={({item, index}) => (
          <RowComponent styles={[localStyles.listItem]} onPress={
            item.key === 'SignOut' ? () => handleSignOut() : () => {
              navigation.closeDrawer();
              console.log(item.key);
            }
          }>
            {item.icon}
            <TextComponent text={item.title} />
          </RowComponent>
        )}
      />

      <RowComponent>
        <ButtonComponent
          text="Upgrade Pro"
          color={appColors.primary}
          type="primary"
          textColor={appColors.white}
          icon={
            <MaterialCommunity name="crown" size={20} color={appColors.white} />
          }
          iconFlex="left"
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

  listItem: {
    paddingVertical: 16,
    justifyContent: 'flex-start',
  },
});
