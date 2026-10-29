import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Notification, TickSquare} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  HeaderIconButton,
  LoadingFooter,
  Screen,
  ScreenHeader,
  StateView,
} from '../../components';
import NotificationItem from './components/NotificationItem';
import {usePaginatedList} from '../../hooks';
import notificationApi from '../../apis/notificationApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const PAGE_SIZE = 20;

const NotificationScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [unread, setUnread] = useState(0);

  const fetchPage = useCallback(async page => {
    const response = await notificationApi.getNotifications(null, page, PAGE_SIZE);
    if (page === 1) {
      setUnread(response.data.unreadCount || 0);
    }
    return {
      items: response.data.notifications || [],
      hasMore: Boolean(response.data.pagination?.hasMore),
    };
  }, []);
  const list = usePaginatedList(fetchPage);
  const {reload, setItems} = list;

  useEffect(() => {
    reload();
  }, [reload]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setItems(prev => prev.map(n => ({...n, isRead: true})));
      setUnread(0);
    } catch (err) {
      Alert.alert('Không thực hiện được', err.message);
    }
  };

  // Where a notification leads depends on who is reading it.
  const openTarget = item => {
    if (auth.role === 'pt') {
      const screen = item.type === 'new_review_on_pt_profile' ? 'PTProfile' : 'PTBookings';
      navigation.navigate('PTMain', {screen});
    } else if (item.relatedBooking) {
      navigation.navigate('ClientBookings');
    }
  };

  const handlePress = item => {
    if (!item.isRead) {
      setItems(prev => prev.map(n => (n._id === item._id ? {...n, isRead: true} : n)));
      setUnread(count => Math.max(count - 1, 0));
      notificationApi.markAsRead(null, item._id).catch(() => {});
    }
    openTarget(item);
  };

  const handleLongPress = item =>
    Alert.alert('Xóa thông báo', 'Bạn có muốn xóa thông báo này?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationApi.deleteNotification(null, item._id);
            setItems(prev => prev.filter(n => n._id !== item._id));
            if (!item.isRead) {
              setUnread(count => Math.max(count - 1, 0));
            }
          } catch (err) {
            Alert.alert('Không xóa được', err.message);
          }
        },
      },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title="Thông báo"
        subtitle={unread > 0 ? `${unread} chưa đọc` : undefined}
        onBack={() => navigation.goBack()}
        right={
          unread > 0 ? (
            <HeaderIconButton
              icon={<TickSquare size={20} color={appColors.white} />}
              onPress={markAllRead}
              accessibilityLabel="Đánh dấu tất cả đã đọc"
            />
          ) : null
        }
      />
      <View style={styles.flex}>
        <AsyncView status={list.status} error={list.error} onRetry={reload} loadingTitle="Đang tải thông báo...">
          <FlatList
            data={list.items}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <NotificationItem item={item} onPress={handlePress} onLongPress={handleLongPress} />
            )}
            contentContainerStyle={styles.list}
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={<AppRefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
            ListFooterComponent={<LoadingFooter visible={list.loadingMore} />}
            ListEmptyComponent={
              <StateView
                icon={<Notification size={30} color={appColors.primary} />}
                title="Bạn đã xem hết thông báo"
                message="Thông báo về lịch tập, tin nhắn và đánh giá sẽ hiện ở đây."
              />
            }
          />
        </AsyncView>
      </View>
    </Screen>
  );
};

export default NotificationScreen;

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
