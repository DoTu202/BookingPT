import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {Dialog, InputComponent} from '../components';
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

  const canSubmit = password.length > 0 && confirmText === 'DELETE';

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
    <Dialog
      visible={visible}
      title="Xóa tài khoản"
      message="Hồ sơ, lịch rảnh và thông báo của bạn sẽ bị xóa vĩnh viễn. Các lịch đặt cũ được giữ ở dạng ẩn danh. Không thể hoàn tác."
      error={error}
      cancelLabel="Hủy"
      confirmLabel="Xóa"
      confirmType="danger"
      confirmDisabled={!canSubmit}
      loading={isLoading}
      onConfirm={handleDelete}
      onClose={close}>
      <InputComponent value={password} onChange={setPassword} placeholder="Mật khẩu hiện tại" isPassword />
      <InputComponent
        value={confirmText}
        onChange={setConfirmText}
        placeholder='Gõ "DELETE" để xác nhận'
        allowClear
      />
    </Dialog>
  );
};

export default DeleteAccountModal;
