import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  Alarm,
  CalendarAdd,
  CalendarRemove,
  CalendarTick,
  Notification,
  Star1,
  TickCircle,
  TickSquare,
} from 'iconsax-react-native';
import {ScreenHeader, HeaderIconButton, StateView, TextComponent} from '../../components';
import notificationApi from '../../apis/notificationApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';
import {formatRelativeTime} from '../../utils/format';

const PAGE_SIZE = 20;

// Title, icon and colours per notification type (types from the server's
// Notification model).
const TYPES = {
  new_booking_request: {title: 'Yêu cầu đặt lịch mới', Icon: CalendarAdd, color: appColors.primary, soft: appColors.primarySoft},
  booking_confirmed: {title: 'Lịch đã được xác nhận', Icon: CalendarTick, color: appColors.success, soft: appColors.successSoft},
  booking_rejected: {title: 'Lịch bị từ chối', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_cancelled_by_client: {title: 'Học viên đã hủy lịch', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_cancelled_by_pt: {title: 'Huấn luyện viên đã hủy buổi tập', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_system_rejected: {title: 'Yêu cầu đặt lịch đã hết hạn', Icon: CalendarRemove, color: appColors.textMuted, soft: appColors.gray6},
  booking_completed_pt: {title: 'Buổi tập đã hoàn thành', Icon: TickCircle, color: appColors.info, soft: appColors.infoSoft},
  booking_completed_client: {title: 'Buổi tập đã hoàn thành', Icon: TickCircle, color: appColors.info, soft: appColors.infoSoft},
  booking_reminder: {title: 'Sắp đến giờ tập', Icon: Alarm, color: appColors.warning, soft: appColors.warningSoft},
  new_review_on_pt_profile: {title: 'Bạn có đánh giá mới', Icon: Star1, color: appColors.yellow, soft: appColors.warningSoft},
};
const DEFAULT_TYPE = {title: 'Thông báo', Icon: Notification, color: appColors.primary, soft: appColors.primarySoft};

const NotificationScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications(null, 1, PAGE_SIZE);
      setItems(response.data.notifications || []);
      setHasMore(Boolean(response.data.pagination?.hasMore));
      setUnread(response.data.unreadCount || 0);
      setPage(1);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const response = await notificationApi.getNotifications(null, page + 1, PAGE_SIZE);
      setItems(prev => [...prev, ...(response.data.notifications || [])]);
      setHasMore(Boolean(response.data.pagination?.hasMore));
      setPage(page + 1);
    } catch {
      // Scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  };

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

  const renderItem = ({item}) => {
    const type = TYPES[item.type] || DEFAULT_TYPE;
    const {Icon} = type;
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.unreadItem]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityHint="Nhấn giữ để xóa">
        <View style={[styles.icon, {backgroundColor: type.soft}]}>
          <Icon size={20} color={type.color} variant="Bold" />
        </View>
        <View style={styles.flex}>
          <View style={styles.itemTop}>
            <TextComponent
              text={type.title}
              size={14}
              font={item.isRead ? fontFamilies.medium : fontFamilies.semiBold}
              numberOfLines={1}
              styles={styles.flex}
            />
            <TextComponent text={formatRelativeTime(item.createdAt)} size={11} color={appColors.textMuted} />
          </View>
          <TextComponent text={item.message} size={13} color={appColors.textMuted} styles={styles.message} />
        </View>
        {!item.isRead ? <View style={styles.dot} /> : null}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <StateView type="loading" title="Đang tải thông báo..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={load} />;
    }
    return (
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
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
        ListFooterComponent={loadingMore ? <ActivityIndicator color={appColors.primary} style={styles.footer} /> : null}
        ListEmptyComponent={
          <StateView
            icon={<Notification size={30} color={appColors.primary} />}
            title="Bạn đã xem hết thông báo"
            message="Thông báo về lịch tập, tin nhắn và đánh giá sẽ hiện ở đây."
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
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
      <View style={styles.flex}>{renderContent()}</View>
    </View>
  );
};

export default NotificationScreen;

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
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md + 2,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  unreadItem: {
    backgroundColor: '#FFF8F2',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    marginTop: 2,
    lineHeight: 19,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.primary,
    marginTop: 6,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
