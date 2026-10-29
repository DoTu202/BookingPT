import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ArrowRight2, Calendar, Clock} from 'iconsax-react-native';
import {Avatar, ButtonComponent, Card, IconText, StatusBadge, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {spacing} from '../../../constants/theme';
import {formatBookingDate} from '../../../utils/format';
import {timeUtils} from '../../../utils/timeUtils';

// The client's next session, or a call to action when there is none.
const NextSessionCard = ({booking, onPress, onBook}) => {
  if (!booking) {
    return (
      <Card variant="floating" style={styles.cta}>
        <View style={styles.flex}>
          <TextComponent text="Bắt đầu hành trình" size={16} font={fontFamilies.semiBold} />
          <TextComponent
            text="Đặt buổi tập đầu tiên với huấn luyện viên phù hợp."
            size={13}
            color={appColors.textMuted}
          />
        </View>
        <ButtonComponent text="Đặt lịch" type="primary" size="sm" onPress={onBook} />
      </Card>
    );
  }

  const {startTime, endTime} = booking.bookingTime;
  return (
    <Card variant="floating" onPress={onPress}>
      <View style={styles.header}>
        <TextComponent
          text="BUỔI TẬP SẮP TỚI"
          size={11}
          font={fontFamilies.semiBold}
          color={appColors.textMuted}
          styles={styles.overline}
        />
        <StatusBadge status={booking.status} />
      </View>
      <View style={styles.body}>
        <Avatar uri={booking.pt?.photoUrl} name={booking.pt?.username} size={52} />
        <View style={[styles.flex, styles.details]}>
          <TextComponent
            text={booking.pt?.username || 'Huấn luyện viên'}
            size={16}
            font={fontFamilies.semiBold}
            numberOfLines={1}
          />
          <IconText icon={<Calendar size={14} color={appColors.primary} />} text={formatBookingDate(startTime)} />
          <IconText
            icon={<Clock size={14} color={appColors.primary} />}
            text={timeUtils.formatTimeRange(startTime, endTime)}
          />
        </View>
        <ArrowRight2 size={18} color={appColors.placeholder} />
      </View>
    </Card>
  );
};

export default NextSessionCard;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: {
    letterSpacing: 0.8,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  details: {
    gap: 2,
  },
});
