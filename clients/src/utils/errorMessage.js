// Turns API/network errors into Vietnamese messages for the UI. axiosClient
// already runs server messages through translateServerMessage, so screens can
// usually just show `error.message`; use getErrorMessage when a fallback is
// needed.

export const NETWORK_ERROR = 'Không thể kết nối máy chủ. Kiểm tra kết nối mạng và thử lại.';
export const GENERIC_ERROR = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

const EXACT = {
  // Auth & account
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'All fields are required': 'Vui lòng điền đầy đủ thông tin.',
  'User already exists': 'Email này đã được đăng ký.',
  'Please provide a valid email address.': 'Email không hợp lệ.',
  'Phone number is not valid': 'Số điện thoại không hợp lệ (9–12 chữ số).',
  'Date of birth is not valid': 'Ngày sinh không hợp lệ.',
  'Role is not valid': 'Vai trò không hợp lệ.',
  'Username is already in use': 'Tên người dùng đã có người sử dụng.',
  'Email is already in use': 'Email này đã được sử dụng.',
  'Email, code and new password are required': 'Vui lòng nhập email, mã xác minh và mật khẩu mới.',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng.',
  'Incorrect password': 'Mật khẩu không đúng.',
  'New password and confirm password do not match': 'Mật khẩu xác nhận không khớp.',
  'Token expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Invalid token': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  Unauthorized: 'Vui lòng đăng nhập lại.',
  Forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  'Access denied': 'Bạn không có quyền truy cập.',

  // OTP
  'Code is invalid or has expired. Please request a new one.':
    'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.',
  'Code is not correct.': 'Mã xác minh không đúng.',
  'Too many wrong attempts. Please request a new code.':
    'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
  'Please wait a minute before requesting a new code.':
    'Vui lòng đợi 1 phút trước khi yêu cầu mã mới.',
  'Verification code is required.': 'Vui lòng nhập mã xác minh.',

  // Rate limits
  'Too many login attempts, please try again in 15 minutes.':
    'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  'Too many email requests, please try again in 15 minutes.':
    'Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  'Too many requests, please try again later.': 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',

  // Booking
  'Booking not found.': 'Không tìm thấy lịch đặt.',
  'Booking not found': 'Không tìm thấy lịch đặt.',
  'Personal Trainer not found.': 'Không tìm thấy huấn luyện viên.',
  'Can not find this Personal Trainer.': 'Không tìm thấy huấn luyện viên.',
  'Selected time slot does not exist.': 'Khung giờ này không còn tồn tại.',
  'Time slot is no longer available.': 'Khung giờ này vừa có người đặt. Vui lòng chọn giờ khác.',
  'Cannot book past time slots.': 'Không thể đặt khung giờ đã qua.',
  'You already have another booking that conflicts with this time slot.':
    'Bạn đã có lịch khác trùng với khung giờ này.',
  'This PT is not accepting new clients at the moment.':
    'Huấn luyện viên này hiện không nhận học viên mới.',
  'PT has not updated pricing information or profile is incomplete.':
    'Huấn luyện viên chưa cập nhật giá, chưa thể đặt lịch.',
  'You are not authorized to cancel this booking.': 'Bạn không thể hủy lịch đặt này.',
  'You are not authorized to modify this booking.': 'Bạn không thể thay đổi lịch đặt này.',
  'This session has already started and can no longer be confirmed.':
    'Buổi tập đã bắt đầu, không thể xác nhận nữa.',
  'This session has already started and can no longer be cancelled.':
    'Buổi tập đã bắt đầu, không thể hủy nữa.',
  'Cannot mark session as completed before it ends.':
    'Chỉ có thể hoàn thành buổi tập sau khi buổi tập kết thúc.',
  'This request has not been confirmed yet. Reject it instead.':
    'Yêu cầu này chưa được xác nhận — hãy dùng "Từ chối".',
  'Please tell your client why you are cancelling this session.':
    'Vui lòng nhập lý do hủy để báo cho học viên.',
  'This booking was just changed by another request. Please refresh and try again.':
    'Lịch đặt vừa được cập nhật ở nơi khác. Vui lòng tải lại và thử lần nữa.',
  'Only completed sessions can be reviewed.': 'Chỉ có thể đánh giá buổi tập đã hoàn thành.',
  'You have already reviewed this session.': 'Bạn đã đánh giá buổi tập này rồi.',

  // Availability
  'This time slot overlaps with an existing one': 'Khung giờ bị trùng với khung giờ đã có.',
  'Updated time slot overlaps with an existing one': 'Khung giờ bị trùng với khung giờ đã có.',
  'Start time must be in the future': 'Giờ bắt đầu phải ở tương lai.',
  'End time must be after start time': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'Cannot change a slot that already has a booking': 'Không thể sửa khung giờ đã có người đặt.',
  'Cannot delete a booked time slot': 'Không thể xóa khung giờ đã có người đặt.',

  // Generic
  'Malformed JSON body.': GENERIC_ERROR,
  'Internal server error': 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
  'Request body is too large.': 'Dữ liệu gửi lên quá lớn.',
  'File is too large (max 5MB).': 'Ảnh quá lớn (tối đa 5MB).',
  'The uploaded file is not a valid image': 'Tệp đã chọn không phải ảnh hợp lệ.',
};

const PATTERNS = [
  [/must be (\d+)-(\d+) characters long/, (_m, min, max) => `Mật khẩu phải dài ${min}–${max} ký tự.`],
  [/^Reason cannot be longer than (\d+) characters\.$/, (_m, max) => `Lý do không được dài quá ${max} ký tự.`],
  [/^Booking is currently in "(\w+)" status, cannot (\w+)\.$/, () => 'Trạng thái lịch đặt đã thay đổi, không thể thực hiện thao tác này.'],
  [/^Cannot cancel booking in "(\w+)" status\.$/, () => 'Lịch đặt này không thể hủy nữa.'],
  [/too close to the appointment time.*?(\d+) hours/, (_m, hours) => `Chỉ có thể hủy lịch đã xác nhận trước giờ tập ít nhất ${hours} giờ.`],
  [/^Only confirmed bookings can be marked as completed/, () => 'Chỉ lịch đã xác nhận mới có thể hoàn thành.'],
  [/^Invalid .+\.$/, () => 'Dữ liệu không hợp lệ.'],
  [/^Not found - /, () => 'Không tìm thấy dữ liệu yêu cầu.'],
];

export const translateServerMessage = message => {
  if (!message || typeof message !== 'string') {
    return message;
  }
  if (EXACT[message]) {
    return EXACT[message];
  }
  for (const [pattern, build] of PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return build(...match);
    }
  }
  return message;
};

export const getErrorMessage = (error, fallback = GENERIC_ERROR) => {
  if (!error) {
    return fallback;
  }
  if (error.status >= 500) {
    return translateServerMessage(error.message) === error.message
      ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
      : translateServerMessage(error.message);
  }
  return error.message || fallback;
};
