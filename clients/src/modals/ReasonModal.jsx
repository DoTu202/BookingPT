import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {InputComponent, TextComponent} from '../components';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';

// Must match REASON_MAX_LENGTH in server/src/services/bookingService.js.
export const REASON_MAX_LENGTH = 500;

// Asks for a reason before a destructive booking action (reject / cancel).
// `onSubmit(reason)` may throw; its message is shown inside the modal. Works
// on both iOS and Android (Alert.prompt is iOS-only).
const ReasonModal = ({
  visible,
  title,
  message,
  placeholder = 'Lý do',
  confirmLabel = 'Xác nhận',
  required = false,
  onSubmit,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = (!required || reason.trim().length > 0) && !isLoading;

  const close = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onSubmit(reason.trim());
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TextComponent text={title} styles={styles.title} />
          {message ? <TextComponent text={message} styles={styles.body} /> : null}
          <InputComponent
            value={reason}
            onChange={setReason}
            placeholder={required ? placeholder : `${placeholder} (không bắt buộc)`}
            maxLength={REASON_MAX_LENGTH}
            multiline
            numberOfLines={3}
          />
          {error ? <TextComponent text={error} styles={styles.error} /> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={close}>
              <TextComponent text="Quay lại" styles={styles.backText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !canSubmit && styles.disabled,
              ]}
              disabled={!canSubmit}
              onPress={handleSubmit}>
              {isLoading ? (
                <ActivityIndicator color={appColors.white} />
              ) : (
                <TextComponent text={confirmLabel} styles={styles.confirmText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReasonModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: appColors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: appColors.text2,
    marginBottom: 16,
  },
  error: {
    color: appColors.danger,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: appColors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  backText: {
    color: appColors.text,
    fontFamily: fontFamilies.medium,
  },
  confirmText: {
    color: appColors.white,
    fontFamily: fontFamilies.semiBold,
  },
});
