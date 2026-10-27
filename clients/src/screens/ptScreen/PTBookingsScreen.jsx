import React, {useCallback, useMemo, useState} from 'react';
import {Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Calendar, CloseCircle, MessageText1, TickCircle} from 'iconsax-react-native';
import {
  BookingCard,
  ButtonComponent,
  ChipComponent,
  ScreenHeader,
  StateView,
} from '../../components';
import {ReasonModal} from '../../modals';
import ptApi from '../../apis/ptApi';
import chatApi from '../../apis/chatApi';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const isPast = iso => new Date(iso).getTime() <= Date.now();

// Groups are computed on the client from one request, so every count is right
// whichever group is selected.
const GROUPS = [
  {
    key: 'pending',
    label: 'Chờ xác nhận',
    match: b => b.status === 'pending_confirmation',
    ascending: true,
    empty: 'Không có yêu cầu nào đang chờ bạn xác nhận.',
  },
  {
    key: 'upcoming',
    label: 'Sắp tới',
    match: b => b.status === 'confirmed' && !isPast(b.bookingTime?.endTime),
    ascending: true,
    empty: 'Chưa có buổi tập nào sắp tới.',
  },
  {
    key: 'toComplete',
    label: 'Chờ hoàn thành',
    match: b => b.status === 'confirmed' && isPast(b.bookingTime?.endTime),
    empty: 'Không có buổi tập nào cần đánh dấu hoàn thành.',
  },
  {
    key: 'history',
    label: 'Lịch sử',
    match: b => !['pending_confirmation', 'confirmed'].includes(b.status),
    empty: 'Các buổi đã hoàn thành, đã hủy hoặc bị từ chối sẽ hiện ở đây.',
  },
];

// Reject (pending request, reason optional) and cancel (confirmed session,
// reason required) both ask for a reason in a modal.
const REASON_ACTIONS = {
  reject: {
    title: 'Từ chối yêu cầu',
    message: 'Cho học viên biết lý do bạn không nhận được buổi này.',
    confirmLabel: 'Từ chối',
    required: false,
    run: ptApi.rejectBooking,
  },
  cancel: {
    title: 'Hủy buổi tập',
    message:
      'Học viên sẽ được thông báo kèm lý do. Khung giờ này sẽ bị khóa; bạn có thể sửa lại trong mục Lịch rảnh để mở lại.',
    confirmLabel: 'Hủy buổi tập',
    required: true,
    run: ptApi.cancelBooking,
  },
};

const PTBookingsScreen = ({navigation}) => {
  const [bookings, setBookings] = useState([]);
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  // {type: 'reject' | 'cancel', bookingId} while the reason modal is open.
  const [reasonAction, setReasonAction] = useState(null);

  const load = useCallback(async ({refresh = false} = {}) => {
    if (refresh) {
      setRefreshing(true);
    }
    try {
      const res = await ptApi.getBookings();
      setBookings(res.data?.data || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const grouped = useMemo(() => {
    const result = {};
    for (const item of GROUPS) {
      const list = bookings.filter(item.match);
      if (item.ascending) {
        list.sort(
          (a, b) => new Date(a.bookingTime.startTime) - new Date(b.bookingTime.startTime),
        );
      }
      result[item.key] = list;
    }
    return result;
  }, [bookings]);

  // Open on what needs attention first.
  const activeGroup =
    group || (grouped.pending?.length ? 'pending' : grouped.toComplete?.length ? 'toComplete' : 'upcoming');
  const activeConfig = GROUPS.find(item => item.key === activeGroup);

  const runAction = async (bookingId, action, successMessage) => {
    setBusyId(bookingId);
    try {
      await action(bookingId);
      await load();
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
      {
        text: 'Xác nhận',
        onPress: () => runAction(booking._id, ptApi.confirmBooking, 'Đã xác nhận buổi tập.'),
      },
    ]);

  const completeBooking = booking =>
    Alert.alert('Hoàn thành buổi tập', 'Đánh dấu buổi tập này là đã hoàn thành?', [
      {text: 'Để sau', style: 'cancel'},
      {
        text: 'Hoàn thành',
        onPress: () =>
          runAction(booking._id, ptApi.markBookingAsCompleted, 'Đã đánh dấu hoàn thành.'),
      },
    ]);

  const activeReasonAction = reasonAction && REASON_ACTIONS[reasonAction.type];

  // Errors are shown inside the modal, so they are not caught here.
  const submitReasonAction = async reason => {
    await activeReasonAction.run(reasonAction.bookingId, reason);
    load();
  };

  const openChat = async client => {
    try {
      const res = await chatApi.startChat(null, client._id);
      navigation.navigate('ChatScreen', {chatRoomId: res.data._id, otherUser: res.data.clientUser});
    } catch (err) {
      Alert.alert('Không mở được cuộc trò chuyện', err.message);
    }
  };

  const renderActions = booking => {
    const busy = busyId === booking._id;
    const buttons = [];

    if (booking.status === 'pending_confirmation') {
      buttons.push(
        <ButtonComponent
          key="reject"
          text="Từ chối"
          type="ghost"
          size="sm"
          textColor={appColors.danger}
          icon={<CloseCircle size={16} color={appColors.danger} />}
          disable={busy}
          onPress={() => setReasonAction({type: 'reject', bookingId: booking._id})}
        />,
        <ButtonComponent
          key="confirm"
          text="Xác nhận"
          type="primary"
          size="sm"
          icon={<TickCircle size={16} color={appColors.white} />}
          isLoading={busy}
          onPress={() => confirmBooking(booking)}
        />,
      );
    } else if (booking.status === 'confirmed' && isPast(booking.bookingTime?.endTime)) {
      buttons.push(
        <ButtonComponent
          key="complete"
          text="Hoàn thành"
          type="primary"
          size="sm"
          icon={<TickCircle size={16} color={appColors.white} />}
          isLoading={busy}
          onPress={() => completeBooking(booking)}
        />,
      );
    } else if (booking.status === 'confirmed' && !isPast(booking.bookingTime?.startTime)) {
      buttons.push(
        <ButtonComponent
          key="cancel"
          text="Hủy buổi"
          type="ghost"
          size="sm"
          textColor={appColors.danger}
          icon={<CloseCircle size={16} color={appColors.danger} />}
          onPress={() => setReasonAction({type: 'cancel', bookingId: booking._id})}
        />,
      );
    }
    if (booking.client?._id && ['pending_confirmation', 'confirmed'].includes(booking.status)) {
      buttons.push(
        <ButtonComponent
          key="chat"
          text="Nhắn tin"
          type="outline"
          size="sm"
          icon={<MessageText1 size={16} color={appColors.primary} />}
          onPress={() => openChat(booking.client)}
        />,
      );
    }
    return buttons.length ? buttons : null;
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <StateView type="loading" title="Đang tải lịch đặt..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={() => load()} />;
    }
    return (
      <FlatList
        data={grouped[activeGroup]}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <BookingCard
            booking={item}
            person={item.client}
            personSubtitle={item.client?.email}
            reasonLabel={item.status === 'cancelled_by_client' ? 'Lý do học viên hủy' : 'Lý do của bạn'}
            actions={renderActions(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({refresh: true})}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
        ListEmptyComponent={
          <StateView
            icon={<Calendar size={30} color={appColors.primary} />}
            title="Trống"
            message={activeConfig?.empty}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Lịch đặt" />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groups}>
          {GROUPS.map(item => (
            <ChipComponent
              key={item.key}
              label={`${item.label} (${grouped[item.key]?.length || 0})`}
              selected={activeGroup === item.key}
              onPress={() => setGroup(item.key)}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.flex}>{renderContent()}</View>

      <ReasonModal
        visible={!!activeReasonAction}
        title={activeReasonAction?.title}
        message={activeReasonAction?.message}
        confirmLabel={activeReasonAction?.confirmLabel}
        required={activeReasonAction?.required}
        onSubmit={submitReasonAction}
        onClose={() => setReasonAction(null)}
      />
    </View>
  );
};

export default PTBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  groups: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
