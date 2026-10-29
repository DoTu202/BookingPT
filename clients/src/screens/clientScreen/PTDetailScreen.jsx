import React, {useCallback, useEffect, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {MessageText1} from 'iconsax-react-native';
import {
  BottomBar,
  ButtonComponent,
  Card,
  FormScrollView,
  InputComponent,
  ReviewItem,
  Screen,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import SlotPickerCard from './components/SlotPickerCard';
import TrainerProfileCard from './components/TrainerProfileCard';
import {useAsync, useOpenChat} from '../../hooks';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import dayjs from '../../utils/dayjs';
import {durationHours} from '../../utils/booking';
import {formatCurrency, formatHours} from '../../utils/format';
import {timeUtils, todayKey} from '../../utils/timeUtils';

const TZ = 'Asia/Ho_Chi_Minh';
const DAYS_AHEAD = 14;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const NOTES_MAX = 500;

const slotHours = slot => durationHours(slot.startTime, slot.endTime);
const slotLabel = slot => timeUtils.formatTimeRange(slot.startTime, slot.endTime);

const PTDetailScreen = ({navigation, route}) => {
  const initial = route.params?.item?.ptData || route.params?.item || {};
  const ptUserId = initial.user?._id;

  const [profile, setProfile] = useState(initial);
  const [reviews, setReviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const {openChat, opening} = useOpenChat();

  // Fresh profile + latest reviews; the list item passed in is shown meanwhile.
  useEffect(() => {
    if (!ptUserId) {
      return;
    }
    clientApi
      .getPTProfile(ptUserId)
      .then(res => res.data?.user && setProfile(prev => ({...prev, ...res.data})))
      .catch(() => {});
    clientApi
      .getPTReviews(ptUserId, {limit: 3})
      .then(res => setReviews(res.data?.data || []))
      .catch(() => {});
  }, [ptUserId]);

  const fetchSlots = useCallback(async () => {
    if (!ptUserId) {
      return [];
    }
    const res = await clientApi.getPTAvailability(ptUserId, {startDate: selectedDate, endDate: selectedDate});
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return list.filter(slot => slot.status === 'available');
  }, [ptUserId, selectedDate]);
  const slots = useAsync(fetchSlots, {initialData: [], resetOnChange: true});

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const acceptingClients = profile.isAcceptingClients !== false;
  const hasPricing = Number(profile.hourlyRate) > 0;
  const canBook = acceptingClients && hasPricing;
  const total = selectedSlot ? Math.round(slotHours(selectedSlot) * profile.hourlyRate) : 0;

  const submitBooking = async () => {
    setBooking(true);
    try {
      await clientApi.createBooking({
        ptId: ptUserId,
        availabilitySlotId: selectedSlot._id,
        notesFromClient: notes.trim(),
      });
      setNotes('');
      Alert.alert(
        'Đã gửi yêu cầu đặt lịch',
        `${profile.user?.username} sẽ xác nhận sớm. Bạn sẽ nhận được thông báo khi có phản hồi.`,
        [
          {text: 'Đóng', style: 'cancel'},
          {text: 'Xem lịch của tôi', onPress: () => navigation.navigate('ClientBookings')},
        ],
      );
    } catch (error) {
      Alert.alert('Chưa đặt được lịch', error.message);
    } finally {
      setBooking(false);
      setSelectedSlot(null);
      slots.reload();
    }
  };

  const confirmBooking = () => {
    const date = dayjs(selectedSlot.startTime).tz(TZ);
    Alert.alert(
      'Xác nhận đặt lịch',
      `${profile.user?.username}\n${WEEKDAYS[date.day()]}, ${date.format('DD/MM/YYYY')} • ${slotLabel(
        selectedSlot,
      )}\nTổng: ${formatCurrency(total)}`,
      [
        {text: 'Hủy', style: 'cancel'},
        {text: 'Đặt lịch', onPress: submitBooking},
      ],
    );
  };

  if (!ptUserId) {
    return (
      <Screen>
        <ScreenHeader title="Huấn luyện viên" onBack={() => navigation.goBack()} />
        <StateView
          type="error"
          message="Không tìm thấy thông tin huấn luyện viên."
          actionText="Quay lại"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Huấn luyện viên" onBack={() => navigation.goBack()} />
      <FormScrollView
        showsVerticalScrollIndicator={false}
        footer={
          <BottomBar>
            <ButtonComponent
              type="outline"
              icon={<MessageText1 size={20} color={appColors.primary} />}
              onPress={() => openChat(ptUserId)}
              isLoading={opening}
              accessibilityLabel="Nhắn tin với huấn luyện viên"
              styles={styles.chatButton}
            />
            <View style={styles.flex}>
              {selectedSlot ? (
                <TextComponent
                  text={`${slotLabel(selectedSlot)} • ${formatHours(slotHours(selectedSlot))}`}
                  size={12}
                  color={appColors.textMuted}
                />
              ) : null}
              <ButtonComponent
                text={
                  selectedSlot
                    ? `Đặt lịch • ${formatCurrency(total)}`
                    : canBook
                    ? 'Chọn khung giờ để đặt'
                    : 'Chưa thể đặt lịch'
                }
                type="primary"
                onPress={confirmBooking}
                disable={!selectedSlot || !canBook}
                isLoading={booking}
              />
            </View>
          </BottomBar>
        }>
        <TrainerProfileCard profile={profile} acceptingClients={acceptingClients} hasPricing={hasPricing} />

        {canBook ? (
          <SlotPickerCard
            days={DAYS_AHEAD}
            date={selectedDate}
            onChangeDate={setSelectedDate}
            slots={slots.data}
            status={slots.status}
            error={slots.error}
            onRetry={slots.reload}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}>
            {selectedSlot ? (
              <InputComponent
                label="Ghi chú cho huấn luyện viên (không bắt buộc)"
                value={notes}
                onChange={setNotes}
                placeholder="VD: Mình muốn tập trung vào phần thân trên"
                maxLength={NOTES_MAX}
                multiline
                autoCapitalize="sentences"
              />
            ) : null}
          </SlotPickerCard>
        ) : null}

        {reviews.length > 0 ? (
          <Card title="Đánh giá gần đây">
            {reviews.map(review => (
              <ReviewItem key={review._id} review={review} />
            ))}
          </Card>
        ) : null}
      </FormScrollView>
    </Screen>
  );
};

export default PTDetailScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatButton: {
    width: 52,
    paddingHorizontal: 0,
  },
});
