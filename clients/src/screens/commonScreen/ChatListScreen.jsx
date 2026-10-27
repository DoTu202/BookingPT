import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Messages2} from 'iconsax-react-native';
import {Avatar, ScreenHeader, StateView, TextComponent} from '../../components';
import chatApi from '../../apis/chatApi';
import {useSocketEvent} from '../../apis/socketClient';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';
import {formatRelativeTime} from '../../utils/format';

const ChatListScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isTab = navigation.getState?.()?.type === 'tab';

  const load = useCallback(async () => {
    try {
      const response = await chatApi.getChatRooms();
      setRooms(response.data || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // New messages arrive while away, so reload whenever the list is shown.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Live preview: move the room to the top with its new last message. A room
  // we don't have yet (first message from someone new) needs a reload.
  useSocketEvent('chat:message', ({chatRoomId, message}) => {
    if (!rooms.some(r => r._id === chatRoomId)) {
      load();
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

  const otherUserOf = room => (auth.role === 'pt' ? room.clientUser : room.ptUser);

  const renderRoom = ({item}) => {
    const other = otherUserOf(item);
    if (!other) {
      return null;
    }
    const fromMe = item.lastMessage?.sender?._id === auth.id || item.lastMessage?.sender === auth.id;
    const preview = item.lastMessage?.content
      ? `${fromMe ? 'Bạn: ' : ''}${item.lastMessage.content}`
      : 'Bắt đầu cuộc trò chuyện';
    return (
      <TouchableOpacity
        style={styles.room}
        onPress={() => navigation.navigate('ChatScreen', {chatRoomId: item._id, otherUser: other})}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Trò chuyện với ${other.username}`}>
        <Avatar uri={other.photoUrl} name={other.username} size={52} />
        <View style={styles.flex}>
          <View style={styles.roomTop}>
            <TextComponent
              text={other.username}
              size={15}
              font={fontFamilies.semiBold}
              numberOfLines={1}
              styles={styles.flex}
            />
            <TextComponent
              text={item.lastMessage?.content ? formatRelativeTime(item.lastMessage.timestamp) : ''}
              size={12}
              color={appColors.textMuted}
            />
          </View>
          <TextComponent
            text={other.role === 'pt' ? 'Huấn luyện viên' : 'Học viên'}
            size={11}
            font={fontFamilies.medium}
            color={appColors.primary}
          />
          <TextComponent text={preview} size={13} color={appColors.textMuted} numberOfLines={1} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <StateView type="loading" title="Đang tải tin nhắn..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={load} />;
    }
    return (
      <FlatList
        data={rooms}
        keyExtractor={item => item._id}
        renderItem={renderRoom}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
        ListEmptyComponent={
          <StateView
            icon={<Messages2 size={30} color={appColors.primary} />}
            title="Chưa có tin nhắn"
            message={
              auth.role === 'pt'
                ? 'Học viên có thể nhắn tin cho bạn từ trang hồ sơ hoặc lịch đặt.'
                : 'Mở hồ sơ một huấn luyện viên và bấm "Nhắn tin" để bắt đầu.'
            }
            actionText={auth.role === 'pt' ? undefined : 'Tìm huấn luyện viên'}
            onAction={auth.role === 'pt' ? undefined : () => navigation.navigate('SearchPtScreen')}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Tin nhắn" onBack={isTab ? undefined : () => navigation.goBack()} />
      <View style={styles.flex}>{renderContent()}</View>
    </View>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  room: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  roomTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
