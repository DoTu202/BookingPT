import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {
  Alarm,
  CalendarAdd,
  CalendarRemove,
  CalendarTick,
  Notification,
  Star1,
  TickCircle,
} from 'iconsax-react-native';
import {IconBox, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../../constants/theme';
import {formatRelativeTime} from '../../../utils/format';

// Title, icon and colours per notification type (types from the server's
// Notification model).
const TYPES = {
  new_booking_request: {title: 'Yêu cầu đặt lịch mới', Icon: CalendarAdd, color: appColors.primary, soft: appColors.primarySoft},
  booking_confirmed: {title: 'Lịch đã được xác nhận', Icon: CalendarTick, color: appColors.success, soft: appColors.successSoft},
  booking_rejected: {title: 'Lịch bị từ chối', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_cancelled_by_client: {title: 'Học viên đã hủy lịch', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_cancelled_by_pt: {title: 'Huấn luyện viên đã hủy buổi tập', Icon: CalendarRemove, color: appColors.danger, soft: appColors.dangerSoft},
  booking_system_rejected: {title: 'Yêu cầu đặt lịch đã hết hạn', Icon: CalendarRemove, color: appColors.textMuted, soft: appColors.gray6},
  booking_completed_pt: {title: 'Buổi tập đã hoàn thành', Icon: TickCircle, color: appColors.info, soft: appColors.infoSoft},
  booking_completed_client: {title: 'Buổi tập đã hoàn thành', Icon: TickCircle, color: appColors.info, soft: appColors.infoSoft},
  booking_reminder: {title: 'Sắp đến giờ tập', Icon: Alarm, color: appColors.warning, soft: appColors.warningSoft},
  new_review_on_pt_profile: {title: 'Bạn có đánh giá mới', Icon: Star1, color: appColors.yellow, soft: appColors.warningSoft},
};
const DEFAULT_TYPE = {title: 'Thông báo', Icon: Notification, color: appColors.primary, soft: appColors.primarySoft};

// One notification: type icon, title, message, time and an unread dot.
const NotificationItem = ({item, onPress, onLongPress}) => {
  const type = TYPES[item.type] || DEFAULT_TYPE;
  const {Icon} = type;
  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.unread]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityHint="Nhấn giữ để xóa">
      <IconBox size={40} color={type.soft}>
        <Icon size={20} color={type.color} variant="Bold" />
      </IconBox>
      <View style={styles.flex}>
        <View style={styles.top}>
          <TextComponent
            text={type.title}
            size={14}
            font={item.isRead ? fontFamilies.medium : fontFamilies.semiBold}
            numberOfLines={1}
            styles={styles.flex}
          />
          <TextComponent text={formatRelativeTime(item.createdAt)} size={11} color={appColors.textMuted} />
        </View>
        <TextComponent text={item.message} size={13} color={appColors.textMuted} styles={styles.message} />
      </View>
      {!item.isRead ? <View style={styles.dot} /> : null}
    </TouchableOpacity>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md + 2,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  unread: {
    backgroundColor: '#FFF8F2',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    marginTop: 2,
    lineHeight: 19,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.primary,
    marginTop: 6,
  },
});
