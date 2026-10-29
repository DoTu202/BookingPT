import ptApi from '../../../../apis/ptApi';
import {isPast} from '../../../../utils/booking';

// Groups are computed on the client from one request, so every count is right
// whichever group is selected.
export const BOOKING_GROUPS = [
  {
    key: 'pending',
    label: 'Chờ xác nhận',
    match: b => b.status === 'pending_confirmation',
    ascending: true,
    empty: 'Không có yêu cầu nào đang chờ bạn xác nhận.',
  },
  {
    key: 'upcoming',
    label: 'Sắp tới',
    match: b => b.status === 'confirmed' && !isPast(b.bookingTime?.endTime),
    ascending: true,
    empty: 'Chưa có buổi tập nào sắp tới.',
  },
  {
    key: 'toComplete',
    label: 'Chờ hoàn thành',
    match: b => b.status === 'confirmed' && isPast(b.bookingTime?.endTime),
    empty: 'Không có buổi tập nào cần đánh dấu hoàn thành.',
  },
  {
    key: 'history',
    label: 'Lịch sử',
    match: b => !['pending_confirmation', 'confirmed'].includes(b.status),
    empty: 'Các buổi đã hoàn thành, đã hủy hoặc bị từ chối sẽ hiện ở đây.',
  },
];

export const groupBookings = bookings => {
  const result = {};
  for (const group of BOOKING_GROUPS) {
    const list = bookings.filter(group.match);
    if (group.ascending) {
      list.sort((a, b) => new Date(a.bookingTime.startTime) - new Date(b.bookingTime.startTime));
    }
    result[group.key] = list;
  }
  return result;
};

// Reject (pending request, reason optional) and cancel (confirmed session,
// reason required) both ask for a reason in a modal.
export const REASON_ACTIONS = {
  reject: {
    title: 'Từ chối yêu cầu',
    message: 'Cho học viên biết lý do bạn không nhận được buổi này.',
    confirmLabel: 'Từ chối',
    required: false,
    run: ptApi.rejectBooking,
  },
  cancel: {
    title: 'Hủy buổi tập',
    message:
      'Học viên sẽ được thông báo kèm lý do. Khung giờ này sẽ bị khóa; bạn có thể sửa lại trong mục Lịch rảnh để mở lại.',
    confirmLabel: 'Hủy buổi tập',
    required: true,
    run: ptApi.cancelBooking,
  },
};
