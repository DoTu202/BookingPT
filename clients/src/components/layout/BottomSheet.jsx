import React from 'react';
import {KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// Modal sheet that slides up from the bottom, closes on backdrop tap / back
// button and stays above the keyboard.
//   <BottomSheet visible={open} onClose={close} title="Bộ lọc" headerRight={...}
//                footer={<ButtonComponent ... />} scrollable>
//     ...
//   </BottomSheet>
const BottomSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  footer,
  scrollable,
  closeLabel = 'Đóng',
}) => {
  const insets = useSafeAreaInsets();
  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {keyboardShouldPersistTaps: 'handled', contentContainerStyle: styles.body}
    : {style: styles.body};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel={closeLabel} />
        <View style={[styles.sheet, {paddingBottom: insets.bottom + spacing.lg}]}>
          <View style={styles.handle} />
          {title || headerRight ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                {title ? <TextComponent text={title} size={18} font={fontFamilies.bold} /> : null}
                {subtitle ? <TextComponent text={subtitle} size={13} color={appColors.textMuted} /> : null}
              </View>
              {headerRight}
            </View>
          ) : null}
          <Body {...bodyProps}>{children}</Body>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: appColors.overlay,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: appColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg + 4,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: appColors.border,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    gap: spacing.md,
  },
});
