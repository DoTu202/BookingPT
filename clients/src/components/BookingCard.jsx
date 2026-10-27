import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import dayjs from '../utils/dayjs';
import {Calendar, Clock, InfoCircle, Note} from 'iconsax-react-native';
import TextComponent from './TextComponent';
import StatusBadge from './StatusBadge';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {radius, shadow, spacing} from '../constants/theme';
import {formatCurrency} from '../utils/format';
import {timeUtils} from '../utils/timeUtils';

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Vietnam calendar date of a UTC instant, e.g. "Thứ 5, 30/10/2026".
export const formatBookingDate = iso => {
  const date = dayjs(iso).utcOffset(7 * 60);
  return `${WEEKDAYS[date.day()]}, ${date.format('DD/MM/YYYY')}`;
};

// Shared booking summary for the client's and the PT's lists. `person` is the
// other party; `actions` is rendered at the bottom (buttons or a hint).
const BookingCard = ({booking, person, personSubtitle, reasonLabel, actions}) => {
  const {bookingTime = {}} = booking;
  const name = person?.username || 'Người dùng đã xóa';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {person?.photoUrl ? (
          <Image source={{uri: person.photoUrl}} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <TextComponent
              text={name.charAt(0).toUpperCase()}
              size={16}
              font={fontFamilies.bold}
              color={appColors.primary}
            />
          </View>
        )}
        <View style={styles.flex}>
          <TextComponent text={name} size={15} font={fontFamilies.semiBold} numberOfLines={1} />
          {personSubtitle ? (
            <TextComponent text={personSubtitle} size={12} color={appColors.textMuted} numberOfLines={1} />
          ) : null}
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Calendar size={16} color={appColors.primary} />
          <TextComponent text={formatBookingDate(bookingTime.startTime)} size={14} styles={styles.rowText} />
        </View>
        <View style={styles.row}>
          <Clock size={16} color={appColors.primary} />
          <TextComponent
            text={`${timeUtils.formatTo24HourTime(bookingTime.startTime)} – ${timeUtils.formatTo24HourTime(
              bookingTime.endTime,
            )}`}
            size={14}
            styles={styles.rowText}
          />
          <TextComponent
            text={formatCurrency(booking.priceAtBooking)}
            size={14}
            font={fontFamilies.semiBold}
            color={appColors.primary}
          />
        </View>
        {booking.notesFromClient ? (
          <View style={styles.row}>
            <Note size={16} color={appColors.textMuted} />
            <TextComponent
              text={booking.notesFromClient}
              size={13}
              color={appColors.textMuted}
              styles={styles.rowText}
            />
          </View>
        ) : null}
      </View>

      {booking.cancellationReason ? (
        <View style={styles.reason}>
          <InfoCircle size={16} color={appColors.danger} />
          <View style={styles.flex}>
            <TextComponent
              text={reasonLabel || 'Lý do'}
              size={12}
              font={fontFamilies.medium}
              color={appColors.danger}
            />
            <TextComponent text={booking.cancellationReason} size={13} />
          </View>
        </View>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
};

export default BookingCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    gap: spacing.sm,
    backgroundColor: appColors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  reason: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: appColors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
