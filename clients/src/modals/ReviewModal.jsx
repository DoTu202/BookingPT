import React, {useState} from 'react';
import {ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Star1} from 'iconsax-react-native';
import {InputComponent, TextComponent} from '../components';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {radius, spacing} from '../constants/theme';

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
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TextComponent text="Đánh giá buổi tập" size={18} font={fontFamilies.bold} />
          <TextComponent
            text={`Buổi tập với ${trainerName || 'huấn luyện viên'} thế nào?`}
            color={appColors.textMuted}
          />
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(value => (
              <TouchableOpacity
                key={value}
                onPress={() => setRating(value)}
                hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
                accessibilityRole="button"
                accessibilityLabel={`${value} sao`}
                accessibilityState={{selected: rating === value}}>
                <Star1
                  size={36}
                  color={value <= rating ? appColors.yellow : appColors.border}
                  variant="Bold"
                />
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
          {error ? <TextComponent text={error} size={13} color={appColors.danger} /> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={close}>
              <TextComponent text="Để sau" font={fontFamilies.medium} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submit, (!rating || isLoading) && styles.disabled]}
              disabled={!rating || isLoading}
              onPress={submit}>
              {isLoading ? (
                <ActivityIndicator color={appColors.white} />
              ) : (
                <TextComponent text="Gửi đánh giá" font={fontFamilies.semiBold} color={appColors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewModal;

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
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    backgroundColor: appColors.primary,
  },
  disabled: {
    opacity: 0.45,
  },
});
