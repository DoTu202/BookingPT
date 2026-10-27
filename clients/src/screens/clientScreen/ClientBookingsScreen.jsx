import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Calendar, CloseCircle, MessageText1, Star1} from 'iconsax-react-native';
import {
  BookingCard,
  ButtonComponent,
  ChipComponent,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import {ReasonModal, ReviewModal} from '../../modals';
import clientApi from '../../apis/clientApi';
import chatApi from '../../apis/chatApi';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const PAGE_SIZE = 10;
const CANCEL_NOTICE_HOURS = 24; // Same rule as the server.

const TABS = [
  {key: 'upcoming', label: 'Sắp tới'},
  {key: 'history', label: 'Đã qua'},
];

const hoursUntil = iso => (new Date(iso).getTime() - Date.now()) / 3600000;

const ClientBookingsScreen = ({navigation}) => {
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingToReview, setBookingToReview] = useState(null);
  const requestId = useRef(0);
  // Shown inside the drawer's tabs and as a stack screen; only the latter
  // needs a back button.
  const isTab = navigation.getState?.()?.type === 'tab';

  const fetchPage = useCallback(
    pageNumber =>
      clientApi.getMyBookings({
        upcoming: tab === 'upcoming' ? 'true' : 'false',
        pageNumber,
        pageSize: PAGE_SIZE,
      }),
    [tab],
  );

  const load = useCallback(
    async ({refresh = false} = {}) => {
      const id = ++requestId.current;
      if (refresh) {
        setRefreshing(true);
      } else {
        setStatus('loading');
      }
      try {
        const res = await fetchPage(1);
        if (id !== requestId.current) {
          return;
        }
        setBookings(res.data?.data || []);
        setPage(1);
        setPages(res.data?.pages || 1);
        setStatus('ready');
      } catch (err) {
        if (id === requestId.current) {
          setError(err.message);
          setStatus('error');
        }
      } finally {
        if (id === requestId.current) {
          setRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  // Reload whenever the screen comes back into view (e.g. after booking).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const loadMore = async () => {
    if (loadingMore || status !== 'ready' || page >= pages) {
      return;
    }
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await fetchPage(page + 1);
      if (id === requestId.current) {
        setBookings(prev => [...prev, ...(res.data?.data || [])]);
        setPage(page + 1);
      }
    } catch {
      // Scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  };

  const openChat = async pt => {
    try {
      const res = await chatApi.startChat(null, pt._id);
      navigation.navigate('ChatScreen', {chatRoomId: res.data._id, otherUser: res.data.ptUser});
    } catch (err) {
      Alert.alert('Không mở được cuộc trò chuyện', err.message);
    }
  };

  // Errors are shown inside the modals, so they are not caught here.
  const submitCancel = async reason => {
    await clientApi.cancelBooking(bookingToCancel._id, reason);
    load();
  };

  const submitReview = async data => {
    await clientApi.createReview(bookingToReview._id, data);
    setBookings(prev =>
      prev.map(b => (b._id === bookingToReview._id ? {...b, reviewed: true} : b)),
    );
    Alert.alert('Cảm ơn bạn!', 'Đánh giá của bạn giúp các học viên khác chọn được PT phù hợp.');
  };

  const renderActions = booking => {
    const isActive = ['pending_confirmation', 'confirmed'].includes(booking.status);
    const tooLateToCancel =
      booking.status === 'confirmed' &&
      hoursUntil(booking.bookingTime?.startTime) < CANCEL_NOTICE_HOURS;
    const buttons = [];

    if (isActive && tooLateToCancel) {
      buttons.push(
        <TextComponent
          key="hint"
          text={`Không thể hủy trong vòng ${CANCEL_NOTICE_HOURS} giờ trước buổi tập`}
          size={12}
          color={appColors.textMuted}
          styles={styles.hint}
        />,
      );
    } else if (isActive) {
      buttons.push(
        <ButtonComponent
          key="cancel"
          text="Hủy lịch"
          type="ghost"
          size="sm"
          textColor={appColors.danger}
          icon={<CloseCircle size={16} color={appColors.danger} />}
          onPress={() => setBookingToCancel(booking)}
        />,
      );
    }
    if (booking.status === 'completed' && !booking.reviewed) {
      buttons.push(
        <ButtonComponent
          key="review"
          text="Đánh giá"
          type="secondary"
          size="sm"
          icon={<Star1 size={16} color={appColors.primaryDark} variant="Bold" />}
          onPress={() => setBookingToReview(booking)}
        />,
      );
    }
    if (booking.pt?._id) {
      buttons.push(
        <ButtonComponent
          key="chat"
          text="Nhắn tin"
          type="outline"
          size="sm"
          icon={<MessageText1 size={16} color={appColors.primary} />}
          onPress={() => openChat(booking.pt)}
        />,
      );
    }
    return buttons.length ? buttons : null;
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <StateView type="loading" title="Đang tải lịch tập..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={() => load()} />;
    }
    return (
      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <BookingCard
            booking={item}
            person={item.pt}
            personSubtitle="Huấn luyện viên"
            reasonLabel={
              item.status === 'cancelled_by_client' ? 'Lý do bạn hủy' : 'Lý do từ huấn luyện viên'
            }
            actions={renderActions(item)}
          />
        )}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({refresh: true})}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={appColors.primary} style={styles.footer} /> : null
        }
        ListEmptyComponent={
          tab === 'upcoming' ? (
            <StateView
              icon={<Calendar size={30} color={appColors.primary} />}
              title="Bạn chưa có lịch tập sắp tới"
              message="Tìm một huấn luyện viên phù hợp và đặt buổi tập đầu tiên."
              actionText="Tìm huấn luyện viên"
              onAction={() => navigation.navigate('SearchPtScreen')}
            />
          ) : (
            <StateView
              icon={<Calendar size={30} color={appColors.primary} />}
              title="Chưa có lịch sử buổi tập"
              message="Các buổi tập đã qua hoặc đã hủy sẽ hiện ở đây."
            />
          )
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Lịch tập của tôi"
        onBack={isTab ? undefined : () => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {TABS.map(item => (
          <ChipComponent
            key={item.key}
            label={item.label}
            selected={tab === item.key}
            onPress={() => setTab(item.key)}
            styles={styles.tab}
          />
        ))}
      </View>
      <View style={styles.flex}>{renderContent()}</View>

      <ReasonModal
        visible={!!bookingToCancel}
        title="Hủy lịch tập"
        message={`Lịch đã xác nhận chỉ có thể hủy trước giờ tập ít nhất ${CANCEL_NOTICE_HOURS} giờ. Huấn luyện viên sẽ nhận được thông báo.`}
        confirmLabel="Hủy lịch"
        onSubmit={submitCancel}
        onClose={() => setBookingToCancel(null)}
      />
      <ReviewModal
        visible={!!bookingToReview}
        trainerName={bookingToReview?.pt?.username}
        onSubmit={submitReview}
        onClose={() => setBookingToReview(null)}
      />
    </View>
  );
};

export default ClientBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  hint: {
    flex: 1,
  },
});
