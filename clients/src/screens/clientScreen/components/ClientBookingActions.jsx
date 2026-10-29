import React from 'react';
import {StyleSheet} from 'react-native';
import {CloseCircle, MessageText1, Star1} from 'iconsax-react-native';
import {BookingActions, ButtonComponent, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {hoursUntil} from '../../../utils/booking';

export const CANCEL_NOTICE_HOURS = 24; // Same rule as the server.

// Buttons under a booking in the client's list: cancel (or why it can't be
// cancelled any more), review once completed, chat with the trainer.
const ClientBookingActions = ({booking, onCancel, onReview, onChat}) => {
  const isActive = ['pending_confirmation', 'confirmed'].includes(booking.status);
  const tooLateToCancel =
    booking.status === 'confirmed' && hoursUntil(booking.bookingTime?.startTime) < CANCEL_NOTICE_HOURS;
  const canReview = booking.status === 'completed' && !booking.reviewed;
  const canChat = Boolean(booking.pt?._id);

  if (!isActive && !canReview && !canChat) {
    return null;
  }
  return (
    <BookingActions>
      {isActive && tooLateToCancel ? (
        <TextComponent
          text={`Không thể hủy trong vòng ${CANCEL_NOTICE_HOURS} giờ trước buổi tập`}
          size={12}
          color={appColors.textMuted}
          styles={styles.hint}
        />
      ) : null}
      {isActive && !tooLateToCancel ? (
        <ButtonComponent
          text="Hủy lịch"
          type="ghost"
          size="sm"
          textColor={appColors.danger}
          icon={<CloseCircle size={16} color={appColors.danger} />}
          onPress={() => onCancel(booking)}
        />
      ) : null}
      {canReview ? (
        <ButtonComponent
          text="Đánh giá"
          type="secondary"
          size="sm"
          icon={<Star1 size={16} color={appColors.primaryDark} variant="Bold" />}
          onPress={() => onReview(booking)}
        />
      ) : null}
      {canChat ? (
        <ButtonComponent
          text="Nhắn tin"
          type="outline"
          size="sm"
          icon={<MessageText1 size={16} color={appColors.primary} />}
          onPress={() => onChat(booking.pt)}
        />
      ) : null}
    </BookingActions>
  );
};

export default ClientBookingActions;

const styles = StyleSheet.create({
  hint: {
    flex: 1,
  },
});
