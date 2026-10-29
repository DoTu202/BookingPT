import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Calendar, Clock, InfoCircle, Note} from 'iconsax-react-native';
import Avatar from '../ui/Avatar';
import Banner from '../ui/Banner';
import Card from '../ui/Card';
import IconText from '../ui/IconText';
import TextComponent from '../ui/TextComponent';
import StatusBadge from './StatusBadge';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';
import {formatBookingDate, formatCurrency} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';

// Shared booking summary for the client's and the PT's lists. `person` is the
// other party; `actions` is rendered at the bottom — wrap buttons in
// <BookingActions> (a component that renders null leaves no gap).
const BookingCard = ({booking, person, personSubtitle, reasonLabel, actions}) => {
  const {bookingTime = {}} = booking;
  const name = person?.username || 'Người dùng đã xóa';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={person?.photoUrl} name={name} size={44} />
        <View style={styles.flex}>
          <TextComponent text={name} size={15} font={fontFamilies.semiBold} numberOfLines={1} />
          {personSubtitle ? (
            <TextComponent text={personSubtitle} size={12} color={appColors.textMuted} numberOfLines={1} />
          ) : null}
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <Card variant="inset" gap={spacing.sm}>
        <IconText
          icon={<Calendar size={16} color={appColors.primary} />}
          text={formatBookingDate(bookingTime.startTime)}
          size={14}
          color={appColors.text}
          style={styles.detail}
        />
        <View style={styles.header}>
          <IconText
            icon={<Clock size={16} color={appColors.primary} />}
            text={timeUtils.formatTimeRange(bookingTime.startTime, bookingTime.endTime)}
            size={14}
            color={appColors.text}
            style={[styles.detail, styles.flex]}
          />
          <TextComponent
            text={formatCurrency(booking.priceAtBooking)}
            size={14}
            font={fontFamilies.semiBold}
            color={appColors.primary}
          />
        </View>
        {booking.notesFromClient ? (
          <IconText
            icon={<Note size={16} color={appColors.textMuted} />}
            text={booking.notesFromClient}
            numberOfLines={0}
            style={styles.detail}
          />
        ) : null}
      </Card>

      <Banner
        icon={<InfoCircle size={16} color={appColors.danger} />}
        title={booking.cancellationReason ? reasonLabel || 'Lý do' : null}
        message={booking.cancellationReason}
      />

      {actions}
    </Card>
  );
};

// Right-aligned, wrapping row for the buttons under a BookingCard.
export const BookingActions = ({children}) => <View style={styles.actions}>{children}</View>;

export default BookingCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detail: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
