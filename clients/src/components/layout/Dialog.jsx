import React from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import Banner from '../ui/Banner';
import ButtonComponent from '../ui/ButtonComponent';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// Centered modal card with a title, optional message, custom content, an
// error line and "cancel / confirm" buttons. Cross-platform replacement for
// Alert.prompt-style dialogs.
//   <Dialog visible title="Hủy lịch" message="..." confirmLabel="Hủy lịch" confirmType="danger"
//           onConfirm={submit} onClose={close} loading={saving} error={error}>
//     <InputComponent ... />
//   </Dialog>
const Dialog = ({
  visible,
  title,
  message,
  children,
  error,
  cancelLabel = 'Quay lại',
  confirmLabel = 'Xác nhận',
  confirmType = 'primary',
  confirmDisabled,
  loading,
  onConfirm,
  onClose,
}) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.card} accessibilityViewIsModal>
        {title ? <TextComponent text={title} size={18} font={fontFamilies.bold} /> : null}
        {message ? <TextComponent text={message} color={appColors.textMuted} /> : null}
        {children}
        <Banner message={error} />
        <View style={styles.actions}>
          <ButtonComponent text={cancelLabel} type="ghost" onPress={onClose} styles={styles.button} />
          <ButtonComponent
            text={confirmLabel}
            type={confirmType}
            onPress={onConfirm}
            disable={confirmDisabled}
            isLoading={loading}
            styles={styles.button}
          />
        </View>
      </View>
    </View>
  </Modal>
);

export default Dialog;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: appColors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl - 4,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    minWidth: 96,
  },
});
