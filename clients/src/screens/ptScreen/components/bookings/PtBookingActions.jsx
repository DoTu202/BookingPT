import React from 'react';
import {CloseCircle, MessageText1, TickCircle} from 'iconsax-react-native';
import {BookingActions, ButtonComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {isPast} from '../../../../utils/booking';

// Buttons under a booking in the PT's list, depending on its status:
// pending → reject / confirm; ended → complete; upcoming → cancel; plus chat.
const PtBookingActions = ({booking, busy, onReject, onConfirm, onComplete, onCancel, onChat}) => {
  const {status, bookingTime} = booking;
  const pending = status === 'pending_confirmation';
  const ended = status === 'confirmed' && isPast(bookingTime?.endTime);
  const upcoming = status === 'confirmed' && !isPast(bookingTime?.startTime);
  const canChat = booking.client?._id && ['pending_confirmation', 'confirmed'].includes(status);

  if (!pending && !ended && !upcoming && !canChat) {
    return null;
  }
  return (
    <BookingActions>
      {pending ? (
        <>
          <ButtonComponent
            text="Từ chối"
            type="ghost"
            size="sm"
            textColor={appColors.danger}
            icon={<CloseCircle size={16} color={appColors.danger} />}
            disable={busy}
            onPress={() => onReject(booking)}
          />
          <ButtonComponent
            text="Xác nhận"
            type="primary"
            size="sm"
            icon={<TickCircle size={16} color={appColors.white} />}
            isLoading={busy}
            onPress={() => onConfirm(booking)}
          />
        </>
      ) : null}
      {ended ? (
        <ButtonComponent
          text="Hoàn thành"
          type="primary"
          size="sm"
          icon={<TickCircle size={16} color={appColors.white} />}
          isLoading={busy}
          onPress={() => onComplete(booking)}
        />
      ) : null}
      {upcoming ? (
        <ButtonComponent
          text="Hủy buổi"
          type="ghost"
          size="sm"
          textColor={appColors.danger}
          icon={<CloseCircle size={16} color={appColors.danger} />}
          onPress={() => onCancel(booking)}
        />
      ) : null}
      {canChat ? (
        <ButtonComponent
          text="Nhắn tin"
          type="outline"
          size="sm"
          icon={<MessageText1 size={16} color={appColors.primary} />}
          onPress={() => onChat(booking.client)}
        />
      ) : null}
    </BookingActions>
  );
};

export default PtBookingActions;
