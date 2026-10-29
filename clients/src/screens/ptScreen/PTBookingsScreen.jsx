import React, {useMemo, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {Calendar} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  BookingCard,
  ChipBar,
  Screen,
  ScreenHeader,
  StateView,
} from '../../components';
import {BOOKING_GROUPS, PtBookingActions, REASON_ACTIONS, groupBookings} from './components/bookings';
import {ReasonModal} from '../../modals';
import {useAsync, useOpenChat} from '../../hooks';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const fetchBookings = () => ptApi.getBookings().then(res => res.data?.data || []);

const PTBookingsScreen = () => {
  const [group, setGroup] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // {type: 'reject' | 'cancel', bookingId} while the reason modal is open.
  const [reasonAction, setReasonAction] = useState(null);

  const {data: bookings, status, error, reload, refresh, refreshing} = useAsync(fetchBookings, {
    trigger: 'focus',
    initialData: [],
  });
  const {openChat} = useOpenChat();

  const grouped = useMemo(() => groupBookings(bookings), [bookings]);

  // Open on what needs attention first.
  const activeGroup =
    group || (grouped.pending?.length ? 'pending' : grouped.toComplete?.length ? 'toComplete' : 'upcoming');
  const activeConfig = BOOKING_GROUPS.find(item => item.key === activeGroup);

  const runAction = async (bookingId, action, successMessage) => {
    setBusyId(bookingId);
    try {
      await action(bookingId);
      await reload();
      Alert.alert('Thành công', successMessage);
    } catch (err) {
      Alert.alert('Không thực hiện được', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmBooking = booking =>
    Alert.alert('Xác nhận buổi tập', `Nhận buổi tập với ${booking.client?.username || 'học viên'}?`, [
      {text: 'Để sau', style: 'cancel'},
      {text: 'Xác nhận', onPress: () => runAction(booking._id, ptApi.confirmBooking, 'Đã xác nhận buổi tập.')},
    ]);

  const completeBooking = booking =>
    Alert.alert('Hoàn thành buổi tập', 'Đánh dấu buổi tập này là đã hoàn thành?', [
      {text: 'Để sau', style: 'cancel'},
      {
        text: 'Hoàn thành',
        onPress: () => runAction(booking._id, ptApi.markBookingAsCompleted, 'Đã đánh dấu hoàn thành.'),
      },
    ]);

  const activeReasonAction = reasonAction && REASON_ACTIONS[reasonAction.type];

  // Errors are shown inside the modal, so they are not caught here.
  const submitReasonAction = async reason => {
    await activeReasonAction.run(reasonAction.bookingId, reason);
    reload();
  };

  return (
    <Screen>
      <ScreenHeader title="Lịch đặt" />
      <ChipBar
        options={BOOKING_GROUPS.map(item => ({
          key: item.key,
          label: `${item.label} (${grouped[item.key]?.length || 0})`,
        }))}
        value={activeGroup}
        onChange={setGroup}
      />
      <View style={styles.flex}>
        <AsyncView status={status} error={error} onRetry={reload} loadingTitle="Đang tải lịch đặt...">
          <FlatList
            data={grouped[activeGroup]}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <BookingCard
                booking={item}
                person={item.client}
                personSubtitle={item.client?.email}
                reasonLabel={item.status === 'cancelled_by_client' ? 'Lý do học viên hủy' : 'Lý do của bạn'}
                actions={
                  <PtBookingActions
                    booking={item}
                    busy={busyId === item._id}
                    onReject={booking => setReasonAction({type: 'reject', bookingId: booking._id})}
                    onConfirm={confirmBooking}
                    onComplete={completeBooking}
                    onCancel={booking => setReasonAction({type: 'cancel', bookingId: booking._id})}
                    onChat={client => openChat(client._id)}
                  />
                }
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={refresh} />}
            ListEmptyComponent={
              <StateView
                icon={<Calendar size={30} color={appColors.primary} />}
                title="Trống"
                message={activeConfig?.empty}
              />
            }
          />
        </AsyncView>
      </View>

      <ReasonModal
        visible={!!activeReasonAction}
        title={activeReasonAction?.title}
        message={activeReasonAction?.message}
        confirmLabel={activeReasonAction?.confirmLabel}
        required={activeReasonAction?.required}
        onSubmit={submitReasonAction}
        onClose={() => setReasonAction(null)}
      />
    </Screen>
  );
};

export default PTBookingsScreen;

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
