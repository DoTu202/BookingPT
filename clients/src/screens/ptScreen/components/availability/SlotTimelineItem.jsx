import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Edit2, Lock1, Trash} from 'iconsax-react-native';
import {IconButton, Tag, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {durationHours, isPast} from '../../../../utils/booking';
import {formatHours} from '../../../../utils/format';
import {timeUtils} from '../../../../utils/timeUtils';
import {SLOT_STATUS} from './constants';

// One slot on the day's timeline: times, rail dot, status card and edit /
// delete buttons. The server only accepts future start times and never
// touches booked slots, so those have no actions.
const SlotTimelineItem = ({slot, isLast, onEdit, onDelete}) => {
  const info = SLOT_STATUS[slot.status] || SLOT_STATUS.available;
  const past = isPast(slot.startTime);
  const editable = slot.status !== 'booked' && !past;

  return (
    <View style={[styles.row, past && styles.past]}>
      <View style={styles.timeColumn}>
        <TextComponent text={timeUtils.formatTo24HourTime(slot.startTime)} size={15} font={fontFamilies.bold} />
        <TextComponent text={timeUtils.formatTo24HourTime(slot.endTime)} size={12} color={appColors.textMuted} />
      </View>
      <View style={styles.rail}>
        <View style={[styles.railDot, {borderColor: info.color}]} />
        {!isLast ? <View style={styles.railLine} /> : null}
      </View>
      <View style={[styles.card, {borderLeftColor: info.color}]}>
        <View style={styles.flex}>
          <Tag
            size="sm"
            label={past && slot.status !== 'booked' ? 'Đã qua' : info.label}
            color={info.color}
            backgroundColor={info.soft}
            icon={slot.status === 'booked' ? <Lock1 size={12} color={info.color} variant="Bold" /> : null}
          />
          <TextComponent
            text={formatHours(durationHours(slot.startTime, slot.endTime))}
            size={12}
            color={appColors.textMuted}
            styles={styles.duration}
          />
        </View>
        {editable ? (
          <View style={styles.actions}>
            <IconButton
              icon={<Edit2 size={17} color={appColors.primary} />}
              onPress={() => onEdit(slot)}
              accessibilityLabel="Sửa khung giờ"
            />
            <IconButton
              tone="danger"
              icon={<Trash size={17} color={appColors.danger} />}
              onPress={() => onDelete(slot)}
              accessibilityLabel="Xóa khung giờ"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default SlotTimelineItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  past: {
    opacity: 0.5,
  },
  flex: {
    flex: 1,
  },
  timeColumn: {
    width: 46,
    paddingTop: spacing.sm,
  },
  rail: {
    width: 14,
    alignItems: 'center',
    paddingTop: spacing.sm + 4,
  },
  railDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: appColors.surface,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    marginBottom: -spacing.md - spacing.sm,
    backgroundColor: appColors.border,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    backgroundColor: appColors.background,
  },
  duration: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
