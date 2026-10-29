import React, {useState} from 'react';
import {Dialog, InputComponent} from '../components';

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
    <Dialog
      visible={visible}
      title={title}
      message={message}
      error={error}
      confirmLabel={confirmLabel}
      confirmType="danger"
      confirmDisabled={required && reason.trim().length === 0}
      loading={isLoading}
      onConfirm={handleSubmit}
      onClose={close}>
      <InputComponent
        value={reason}
        onChange={setReason}
        placeholder={required ? placeholder : `${placeholder} (không bắt buộc)`}
        maxLength={REASON_MAX_LENGTH}
        multiline
        numberOfLines={3}
      />
    </Dialog>
  );
};

export default ReasonModal;
