import React from 'react';
import {StyleSheet, View} from 'react-native';
import {CalendarTick} from 'iconsax-react-native';
import {Avatar, ButtonComponent, Card, ListItem, StateView, StatusBadge, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';
import {timeUtils} from '../../../../utils/timeUtils';

// Today's sessions in order, or a prompt to open more slots.
const TodayScheduleCard = ({bookings, onSeeAll, onAddSlots}) => (
  <Card title="Lịch hôm nay" right={<ButtonComponent type="link" size="sm" text="Xem tất cả" onPress={onSeeAll} />}>
    {bookings.length === 0 ? (
      <StateView
        compact
        icon={<CalendarTick size={28} color={appColors.primary} />}
        title="Hôm nay chưa có buổi tập"
        message="Mở thêm khung giờ rảnh để học viên đặt lịch."
        actionText="Thêm lịch rảnh"
        onAction={onAddSlots}
      />
    ) : (
      bookings.map((booking, index) => (
        <ListItem
          key={booking._id}
          divider={index > 0}
          leading={
            <View style={styles.leading}>
              <View style={styles.time}>
                <TextComponent
                  text={timeUtils.formatTo24HourTime(booking.bookingTime.startTime)}
                  size={14}
                  font={fontFamilies.bold}
                  color={appColors.primary}
                />
                <TextComponent
                  text={timeUtils.formatTo24HourTime(booking.bookingTime.endTime)}
                  size={11}
                  color={appColors.textMuted}
                />
              </View>
              <Avatar uri={booking.client?.photoUrl} name={booking.client?.username} size={38} />
            </View>
          }
          title={booking.client?.username || 'Học viên'}
          trailing={<StatusBadge status={booking.status} />}
        />
      ))
    )}
  </Card>
);

export default TodayScheduleCard;

const styles = StyleSheet.create({
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  time: {
    width: 48,
    alignItems: 'center',
  },
});
