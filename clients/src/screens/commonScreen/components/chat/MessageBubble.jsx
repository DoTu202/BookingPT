import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Warning2} from 'iconsax-react-native';
import {TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {timeUtils} from '../../../../utils/timeUtils';

// "Hôm nay" / "Hôm qua" / date pill between days.
export const DaySeparator = ({label}) => (
  <View style={styles.dayRow}>
    <TextComponent text={label} size={11} font={fontFamilies.medium} color={appColors.textMuted} />
  </View>
);

// One message. Ours are on the right; a pending one is faded and a failed one
// can be tapped to send again.
const MessageBubble = ({message, mine, onRetry}) => {
  const isPending = Boolean(message.tempId);
  return (
    <View style={[styles.row, mine ? styles.mineRow : styles.theirRow]}>
      <TouchableOpacity
        activeOpacity={message.failed ? 0.7 : 1}
        disabled={!message.failed}
        onPress={() => onRetry(message)}
        style={[
          styles.bubble,
          mine ? styles.mineBubble : styles.theirBubble,
          isPending && !message.failed && styles.pendingBubble,
        ]}
        accessibilityLabel={message.failed ? 'Gửi thất bại, chạm để gửi lại' : undefined}>
        <TextComponent
          text={message.content}
          size={15}
          color={mine ? appColors.white : appColors.text}
          styles={styles.text}
        />
        <TextComponent
          text={
            message.failed
              ? 'Chưa gửi được • Chạm để thử lại'
              : isPending
              ? 'Đang gửi...'
              : timeUtils.formatTo24HourTime(message.createdAt)
          }
          size={10}
          color={mine ? 'rgba(255,255,255,0.8)' : appColors.textMuted}
          styles={mine ? styles.timeRight : null}
        />
      </TouchableOpacity>
      {message.failed ? <Warning2 size={16} color={appColors.danger} style={styles.failedIcon} /> : null}
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  dayRow: {
    alignSelf: 'center',
    backgroundColor: appColors.gray6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  mineBubble: {
    backgroundColor: appColors.primary,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: appColors.surface,
    borderBottomLeftRadius: 6,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  text: {
    lineHeight: 21,
  },
  timeRight: {
    textAlign: 'right',
  },
  failedIcon: {
    marginLeft: spacing.xs,
  },
});
