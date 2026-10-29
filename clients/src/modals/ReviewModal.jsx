import React, {useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Star1} from 'iconsax-react-native';
import {Dialog, InputComponent, TextComponent} from '../components';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {spacing} from '../constants/theme';

const RATING_LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];
// Must match the server's Review comment maxlength.
const COMMENT_MAX = 1000;

// Rate a completed session. `onSubmit({rating, comment})` may throw; its
// message is shown inside the modal.
const ReviewModal = ({visible, trainerName, onSubmit, onClose}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const close = () => {
    setRating(0);
    setComment('');
    setError('');
    onClose();
  };

  const submit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onSubmit({rating, comment: comment.trim()});
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
      title="Đánh giá buổi tập"
      message={`Buổi tập với ${trainerName || 'huấn luyện viên'} thế nào?`}
      error={error}
      cancelLabel="Để sau"
      confirmLabel="Gửi đánh giá"
      confirmDisabled={!rating}
      loading={isLoading}
      onConfirm={submit}
      onClose={close}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(value => (
          <TouchableOpacity
            key={value}
            onPress={() => setRating(value)}
            hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
            accessibilityRole="button"
            accessibilityLabel={`${value} sao`}
            accessibilityState={{selected: rating === value}}>
            <Star1 size={36} color={value <= rating ? appColors.yellow : appColors.border} variant="Bold" />
          </TouchableOpacity>
        ))}
      </View>
      <TextComponent
        text={RATING_LABELS[rating] || 'Chạm để chọn số sao'}
        size={13}
        font={fontFamilies.medium}
        color={rating ? appColors.text : appColors.textMuted}
        styles={styles.center}
      />
      <InputComponent
        value={comment}
        onChange={setComment}
        placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)"
        maxLength={COMMENT_MAX}
        multiline
        autoCapitalize="sentences"
      />
    </Dialog>
  );
};

export default ReviewModal;

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
