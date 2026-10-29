import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Send2} from 'iconsax-react-native';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';

const MAX_LENGTH = 2000; // Same limit as the server's Message model.

// Multiline input + send button pinned above the home indicator.
const MessageComposer = ({value, onChangeText, onSend}) => {
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length > 0;
  return (
    <View style={[styles.bar, {paddingBottom: insets.bottom + spacing.sm}]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor={appColors.placeholder}
        multiline
        maxLength={MAX_LENGTH}
        accessibilityLabel="Nội dung tin nhắn"
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        style={[styles.send, !canSend && styles.sendDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Gửi">
        <Send2 size={20} color={appColors.white} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
};

export default MessageComposer;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: appColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    backgroundColor: appColors.background,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
  },
  sendDisabled: {
    backgroundColor: appColors.border,
  },
});
