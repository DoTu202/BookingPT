import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import dayjs from '../../utils/dayjs';
import {Calendar, Location, MessageText1, Star1, Warning2} from 'iconsax-react-native';
import {
  ButtonComponent,
  ChipComponent,
  DateStrip,
  InputComponent,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import clientApi from '../../apis/clientApi';
import chatApi from '../../apis/chatApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {getSpecializationLabel} from '../../constants/labels';
import {radius, shadow, spacing} from '../../constants/theme';
import {formatCurrency, formatHours, formatLocation} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';
import {todayKey} from '../../components/DateStrip';


const TZ = 'Asia/Ho_Chi_Minh';
const DAYS_AHEAD = 14;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const NOTES_MAX = 500;

const slotLabel = slot =>
  `${timeUtils.formatTo24HourTime(slot.startTime)} – ${timeUtils.formatTo24HourTime(slot.endTime)}`;

const slotHours = slot => dayjs(slot.endTime).diff(dayjs(slot.startTime), 'hour', true);

const PTDetailScreen = ({navigation, route}) => {
  const initial = route.params?.item?.ptData || route.params?.item || {};
  const ptUserId = initial.user?._id;
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(initial);
  const [reviews, setReviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState('loading'); // loading | ready | error
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

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

  const loadSlots = useCallback(async () => {
    if (!ptUserId) {
      return;
    }
    setSlotsStatus('loading');
    setSelectedSlot(null);
    try {
      const res = await clientApi.getPTAvailability(ptUserId, {
        startDate: selectedDate,
        endDate: selectedDate,
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setSlots(list.filter(slot => slot.status === 'available'));
      setSlotsStatus('ready');
    } catch (error) {
      setSlotsError(error.message);
      setSlotsStatus('error');
    }
  }, [ptUserId, selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

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
      loadSlots();
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

  const startChat = async () => {
    setStartingChat(true);
    try {
      const res = await chatApi.startChat(null, ptUserId);
      navigation.navigate('ChatScreen', {chatRoomId: res.data._id, otherUser: res.data.ptUser});
    } catch (error) {
      Alert.alert('Không mở được cuộc trò chuyện', error.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (!ptUserId) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Huấn luyện viên" onBack={() => navigation.goBack()} />
        <StateView
          type="error"
          message="Không tìm thấy thông tin huấn luyện viên."
          actionText="Quay lại"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const name = profile.user?.username || 'Huấn luyện viên';
  const photoUrl = profile.user?.photoUrl;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Huấn luyện viên" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <View style={styles.card}>
            <View style={styles.profileRow}>
              {photoUrl ? (
                <Image source={{uri: photoUrl}} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <TextComponent
                    text={name.charAt(0).toUpperCase()}
                    size={30}
                    font={fontFamilies.bold}
                    color={appColors.primary}
                  />
                </View>
              )}
              <View style={styles.flex}>
                <TextComponent text={name} size={20} font={fontFamilies.bold} numberOfLines={2} />
                <View style={styles.inline}>
                  <Star1 size={15} color={appColors.yellow} variant="Bold" />
                  <TextComponent
                    text={
                      profile.numReviews > 0
                        ? ` ${Number(profile.rating).toFixed(1)} • ${profile.numReviews} đánh giá`
                        : ' Chưa có đánh giá'
                    }
                    size={13}
                    color={appColors.textMuted}
                  />
                </View>
                <View style={styles.inline}>
                  <Location size={15} color={appColors.textMuted} />
                  <TextComponent
                    text={` ${formatLocation(profile.location)}`}
                    size={13}
                    color={appColors.textMuted}
                    numberOfLines={1}
                    styles={styles.flex}
                  />
                </View>
              </View>
            </View>

            <View style={styles.stats}>
              <Stat value={`${profile.experienceYears || 0} năm`} label="Kinh nghiệm" />
              <View style={styles.statDivider} />
              <Stat value={String(profile.totalSessions || 0)} label="Buổi đã dạy" />
              <View style={styles.statDivider} />
              <Stat
                value={hasPricing ? formatCurrency(profile.hourlyRate) : '—'}
                label="Mỗi giờ"
                highlight
              />
            </View>

            {!acceptingClients || !hasPricing ? (
              <View style={styles.notice}>
                <Warning2 size={18} color={appColors.warning} />
                <TextComponent
                  text={
                    !acceptingClients
                      ? 'Huấn luyện viên này hiện không nhận học viên mới.'
                      : 'Huấn luyện viên chưa cập nhật giá nên chưa thể đặt lịch.'
                  }
                  size={13}
                  styles={styles.noticeText}
                />
              </View>
            ) : null}

            {profile.bio ? (
              <View style={styles.block}>
                <TextComponent text="Giới thiệu" font={fontFamilies.semiBold} size={15} />
                <TextComponent
                  text={profile.bio}
                  size={14}
                  color={appColors.textMuted}
                  styles={styles.bio}
                />
              </View>
            ) : null}

            {profile.specializations?.length ? (
              <View style={styles.block}>
                <TextComponent text="Chuyên môn" font={fontFamilies.semiBold} size={15} />
                <View style={styles.wrap}>
                  {profile.specializations.map(spec => (
                    <View key={spec} style={styles.tag}>
                      <TextComponent
                        text={getSpecializationLabel(spec)}
                        size={12}
                        font={fontFamilies.medium}
                        color={appColors.primaryDark}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Booking */}
          {canBook ? (
            <View style={styles.card}>
              <TextComponent text="Chọn ngày" font={fontFamilies.semiBold} size={16} />
              <DateStrip value={selectedDate} onChange={setSelectedDate} days={DAYS_AHEAD} />

              <TextComponent text="Khung giờ trống" font={fontFamilies.semiBold} size={16} />
              {slotsStatus === 'loading' ? (
                <ActivityIndicator color={appColors.primary} style={styles.slotsLoading} />
              ) : slotsStatus === 'error' ? (
                <StateView type="error" message={slotsError} onAction={loadSlots} compact />
              ) : slots.length === 0 ? (
                <StateView
                  compact
                  icon={<Calendar size={28} color={appColors.primary} />}
                  title="Không có khung giờ trống"
                  message="Hãy chọn một ngày khác."
                />
              ) : (
                <View style={styles.wrap}>
                  {slots.map(slot => (
                    <ChipComponent
                      key={slot._id}
                      label={slotLabel(slot)}
                      selected={selectedSlot?._id === slot._id}
                      onPress={() =>
                        setSelectedSlot(selectedSlot?._id === slot._id ? null : slot)
                      }
                      styles={styles.slotChip}
                    />
                  ))}
                </View>
              )}

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
            </View>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <View style={styles.card}>
              <TextComponent text="Đánh giá gần đây" font={fontFamilies.semiBold} size={16} />
              {reviews.map(review => (
                <View key={review._id} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <TextComponent
                      text={review.client?.username || 'Học viên'}
                      font={fontFamilies.medium}
                      size={14}
                    />
                    <View style={styles.inline}>
                      {Array.from({length: 5}, (_, i) => (
                        <Star1
                          key={i}
                          size={12}
                          color={i < review.rating ? appColors.yellow : appColors.border}
                          variant="Bold"
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <TextComponent text={review.comment} size={13} color={appColors.textMuted} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky action bar */}
        <View style={[styles.bottomBar, {paddingBottom: insets.bottom + spacing.md}]}>
          <ButtonComponent
            type="outline"
            icon={<MessageText1 size={20} color={appColors.primary} />}
            onPress={startChat}
            isLoading={startingChat}
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const Stat = ({value, label, highlight}) => (
  <View style={styles.stat}>
    <TextComponent
      text={value}
      size={15}
      font={fontFamilies.semiBold}
      color={highlight ? appColors.primary : appColors.text}
      numberOfLines={1}
    />
    <TextComponent text={label} size={12} color={appColors.textMuted} />
  </View>
);

export default PTDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  profileRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarFallback: {
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: appColors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: appColors.border,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: appColors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
  },
  block: {
    gap: spacing.sm,
  },
  bio: {
    lineHeight: 21,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  slotsLoading: {
    paddingVertical: spacing.xl,
  },
  slotChip: {
    minWidth: 130,
  },
  review: {
    gap: 4,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: appColors.surface,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },
  chatButton: {
    width: 52,
    paddingHorizontal: 0,
  },
});
