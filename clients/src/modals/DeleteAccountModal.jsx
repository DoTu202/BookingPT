import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {InputComponent, TextComponent} from '../components';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import profileApi from '../apis/profileApi';
import {signOut} from '../utils/session';

// Account deletion requires the current password and typing DELETE, which is
// what the API enforces. Works on both iOS and Android (Alert.prompt is
// iOS-only).
const DeleteAccountModal = ({visible, onClose}) => {
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = password.length > 0 && confirmText === 'DELETE' && !isLoading;

  const close = () => {
    setPassword('');
    setConfirmText('');
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setError('');
    setIsLoading(true);
    try {
      await profileApi.deleteAccount({password, confirmDelete: 'DELETE'});
      close();
      await signOut(dispatch);
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
          <TextComponent text="Xóa tài khoản" styles={styles.title} />
          <TextComponent
            text="Hồ sơ, lịch rảnh và thông báo của bạn sẽ bị xóa vĩnh viễn. Các lịch đặt cũ được giữ ở dạng ẩn danh. Không thể hoàn tác."
            styles={styles.body}
          />
          <InputComponent
            value={password}
            onChange={setPassword}
            placeholder="Mật khẩu hiện tại"
            isPassword
          />
          <InputComponent
            value={confirmText}
            onChange={setConfirmText}
            placeholder='Gõ "DELETE" để xác nhận'
            allowClear
          />
          {error ? <TextComponent text={error} styles={styles.error} /> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={close}>
              <TextComponent text="Hủy" styles={styles.cancelText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                !canSubmit && styles.disabled,
              ]}
              disabled={!canSubmit}
              onPress={handleDelete}>
              {isLoading ? (
                <ActivityIndicator color={appColors.white} />
              ) : (
                <TextComponent text="Xóa" styles={styles.deleteText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteAccountModal;

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
  deleteButton: {
    backgroundColor: appColors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  cancelText: {
    color: appColors.text,
    fontFamily: fontFamilies.medium,
  },
  deleteText: {
    color: appColors.white,
    fontFamily: fontFamilies.semiBold,
  },
});
