// screens/MessagesScreen.jsx

import {
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import React from 'react';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {
  RowComponent,
  TextComponent,
  CircleComponent,
  SpaceComponent,
  EvolveULogo,
} from '../../components';
import {HambergerMenu, More} from 'iconsax-react-native';
import {fontFamilies} from '../../constants/fontFamilies';

// Dữ liệu mẫu cho cuộc trò chuyện
const conversations = [
  {
    id: '1',
    userName: 'FitApp Team',
    avatar: require('../../../assets/images/Main.png'), // Giả sử bạn có logo ở đây
    lastMessage:
      'Welcome to FitApp! We are excited to have you on board. Feel free to explore...',
    timestamp: '1m ago',
    isRead: false,
  },
];

// Component cho mỗi dòng tin nhắn
const ConversationItem = ({item, navigation}) => (
  <TouchableOpacity
    style={styles.conversationItem}
    onPress={() =>
      navigation.navigate('ChatScreen', {
        userName: item.userName,
        avatar: item.avatar,
      })
    }>
    <RowComponent>
      <CircleComponent size={50} color={`${appColors.primary}20`}>
        {/* Cho kích thước logo nhỏ lại một chút để có viền đẹp */}
        <EvolveULogo width={28} height={28} />
      </CircleComponent>
      <View style={{flex: 1, marginLeft: 12}}>
        <TextComponent text={item.userName} font={fontFamilies.bold} />
        <TextComponent
          text={item.lastMessage}
          color={item.isRead ? appColors.gray : appColors.black}
          numberOfLines={1}
          size={14}
        />
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <TextComponent text={item.timestamp} size={12} color={appColors.gray} />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </RowComponent>
  </TouchableOpacity>
);

const MessagesScreen = ({navigation}) => {
  return (
    <View style={{flex: 1, backgroundColor: appColors.white}}>
      <StatusBar barStyle={'light-content'} />
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <RowComponent>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <HambergerMenu color={appColors.white} size={24} />
          </TouchableOpacity>
          <View style={{flex: 1, alignItems: 'center'}}>
            <TextComponent
              text="Messages"
              font={fontFamilies.bold}
              color={appColors.white}
              size={18}
            />
          </View>
          <CircleComponent size={40} color="transparent">
            <More size={24} color={appColors.white} />
          </CircleComponent>
        </RowComponent>
      </View>

      {/* --- NỘI DUNG CHÍNH --- */}
      <ScrollView style={{flex: 1}}>
        {conversations.map(item => (
          <ConversationItem item={item} key={item.id} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  header: {
    backgroundColor: appColors.primary,
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: appColors.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: appColors.primary,
    marginTop: 8,
  },
});
