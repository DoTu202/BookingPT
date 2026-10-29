import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Messages2} from 'iconsax-react-native';
import {AppRefreshControl, AsyncView, Screen, ScreenHeader, StateView} from '../../components';
import ChatRoomItem from './components/ChatRoomItem';
import {useAsync} from '../../hooks';
import chatApi from '../../apis/chatApi';
import {useSocketEvent} from '../../apis/socketClient';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const fetchRooms = () => chatApi.getChatRooms().then(response => response.data || []);

const ChatListScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const isTab = navigation.getState?.()?.type === 'tab';
  const isPt = auth.role === 'pt';

  // New messages arrive while away, so reload whenever the list is shown.
  const {data: rooms, setData: setRooms, status, error, reload, refresh, refreshing} = useAsync(fetchRooms, {
    trigger: 'focus',
    initialData: [],
  });

  // Live preview: move the room to the top with its new last message. A room
  // we don't have yet (first message from someone new) needs a reload.
  useSocketEvent('chat:message', ({chatRoomId, message}) => {
    if (!rooms.some(r => r._id === chatRoomId)) {
      reload();
      return;
    }
    setRooms(prev => {
      const room = prev.find(r => r._id === chatRoomId);
      if (!room) {
        return prev;
      }
      const updated = {
        ...room,
        lastMessage: {content: message.content, sender: message.sender, timestamp: message.createdAt},
      };
      return [updated, ...prev.filter(r => r._id !== chatRoomId)];
    });
  });

  const otherUserOf = room => (isPt ? room.clientUser : room.ptUser);

  return (
    <Screen>
      <ScreenHeader title="Tin nhắn" onBack={isTab ? undefined : () => navigation.goBack()} />
      <View style={styles.flex}>
        <AsyncView status={status} error={error} onRetry={reload} loadingTitle="Đang tải tin nhắn...">
          <FlatList
            data={rooms}
            keyExtractor={item => item._id}
            renderItem={({item}) => {
              const other = otherUserOf(item);
              return other ? (
                <ChatRoomItem
                  room={item}
                  otherUser={other}
                  myId={auth.id}
                  onPress={() => navigation.navigate('ChatScreen', {chatRoomId: item._id, otherUser: other})}
                />
              ) : null;
            }}
            contentContainerStyle={styles.list}
            refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={refresh} />}
            ListEmptyComponent={
              <StateView
                icon={<Messages2 size={30} color={appColors.primary} />}
                title="Chưa có tin nhắn"
                message={
                  isPt
                    ? 'Học viên có thể nhắn tin cho bạn từ trang hồ sơ hoặc lịch đặt.'
                    : 'Mở hồ sơ một huấn luyện viên và bấm "Nhắn tin" để bắt đầu.'
                }
                actionText={isPt ? undefined : 'Tìm huấn luyện viên'}
                onAction={isPt ? undefined : () => navigation.navigate('SearchPtScreen')}
              />
            }
          />
        </AsyncView>
      </View>
    </Screen>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
});
