import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Avatar, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../../constants/theme';
import {formatRelativeTime} from '../../../utils/format';

// A conversation in the chat list: the other person, their role and the last
// message ("Bạn: ..." when it was ours).
const ChatRoomItem = ({room, otherUser, myId, onPress}) => {
  const last = room.lastMessage;
  const fromMe = last?.sender?._id === myId || last?.sender === myId;
  const preview = last?.content ? `${fromMe ? 'Bạn: ' : ''}${last.content}` : 'Bắt đầu cuộc trò chuyện';

  return (
    <TouchableOpacity
      style={styles.room}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Trò chuyện với ${otherUser.username}`}>
      <Avatar uri={otherUser.photoUrl} name={otherUser.username} size={52} />
      <View style={styles.flex}>
        <View style={styles.top}>
          <TextComponent
            text={otherUser.username}
            size={15}
            font={fontFamilies.semiBold}
            numberOfLines={1}
            styles={styles.flex}
          />
          <TextComponent
            text={last?.content ? formatRelativeTime(last.timestamp) : ''}
            size={12}
            color={appColors.textMuted}
          />
        </View>
        <TextComponent
          text={otherUser.role === 'pt' ? 'Huấn luyện viên' : 'Học viên'}
          size={11}
          font={fontFamilies.medium}
          color={appColors.primary}
        />
        <TextComponent text={preview} size={13} color={appColors.textMuted} numberOfLines={1} />
      </View>
    </TouchableOpacity>
  );
};

export default ChatRoomItem;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  room: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
