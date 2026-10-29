import React, {useCallback, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Calendar} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  BookingCard,
  ChipBar,
  LoadingFooter,
  Screen,
  ScreenHeader,
  StateView,
} from '../../components';
import ClientBookingActions, {CANCEL_NOTICE_HOURS} from './components/ClientBookingActions';
import {ReasonModal, ReviewModal} from '../../modals';
import {useOpenChat, usePaginatedList} from '../../hooks';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const PAGE_SIZE = 10;

const TABS = [
  {key: 'upcoming', label: 'Sắp tới'},
  {key: 'history', label: 'Đã qua'},
];

const ClientBookingsScreen = ({navigation}) => {
  const [tab, setTab] = useState('upcoming');
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingToReview, setBookingToReview] = useState(null);
  const {openChat} = useOpenChat();
  // Shown inside the drawer's tabs and as a stack screen; only the latter
  // needs a back button.
  const isTab = navigation.getState?.()?.type === 'tab';

  const fetchPage = useCallback(
    async pageNumber => {
      const res = await clientApi.getMyBookings({
        upcoming: tab === 'upcoming' ? 'true' : 'false',
        pageNumber,
        pageSize: PAGE_SIZE,
      });
      return {items: res.data?.data || [], hasMore: pageNumber < (res.data?.pages || 1)};
    },
    [tab],
  );
  const list = usePaginatedList(fetchPage);
  const {reload, setItems} = list;

  // Reload whenever the screen comes back into view (e.g. after booking).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Errors are shown inside the modals, so they are not caught here.
  const submitCancel = async reason => {
    await clientApi.cancelBooking(bookingToCancel._id, reason);
    reload();
  };

  const submitReview = async data => {
    await clientApi.createReview(bookingToReview._id, data);
    setItems(prev => prev.map(b => (b._id === bookingToReview._id ? {...b, reviewed: true} : b)));
    Alert.alert('Cảm ơn bạn!', 'Đánh giá của bạn giúp các học viên khác chọn được PT phù hợp.');
  };

  return (
    <Screen>
      <ScreenHeader title="Lịch tập của tôi" onBack={isTab ? undefined : () => navigation.goBack()} />
      <ChipBar options={TABS} value={tab} onChange={setTab} stretch />
      <View style={styles.flex}>
        <AsyncView status={list.status} error={list.error} onRetry={reload} loadingTitle="Đang tải lịch tập...">
          <FlatList
            data={list.items}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <BookingCard
                booking={item}
                person={item.pt}
                personSubtitle="Huấn luyện viên"
                reasonLabel={item.status === 'cancelled_by_client' ? 'Lý do bạn hủy' : 'Lý do từ huấn luyện viên'}
                actions={
                  <ClientBookingActions
                    booking={item}
                    onCancel={setBookingToCancel}
                    onReview={setBookingToReview}
                    onChat={pt => openChat(pt._id)}
                  />
                }
              />
            )}
            contentContainerStyle={styles.list}
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={<AppRefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
            ListFooterComponent={<LoadingFooter visible={list.loadingMore} />}
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
        </AsyncView>
      </View>

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
    </Screen>
  );
};

export default ClientBookingsScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
