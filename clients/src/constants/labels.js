import appColors from './appColors';

// Vietnamese labels for values that come from the API as codes.

export const BOOKING_STATUS = {
  pending_confirmation: {
    label: 'Chờ xác nhận',
    color: appColors.warning,
    soft: appColors.warningSoft,
  },
  confirmed: {label: 'Đã xác nhận', color: appColors.success, soft: appColors.successSoft},
  completed: {label: 'Hoàn thành', color: appColors.info, soft: appColors.infoSoft},
  cancelled_by_client: {label: 'Khách đã hủy', color: appColors.danger, soft: appColors.dangerSoft},
  cancelled_by_pt: {label: 'PT đã hủy', color: appColors.danger, soft: appColors.dangerSoft},
  rejected_by_pt: {label: 'Bị từ chối', color: appColors.danger, soft: appColors.dangerSoft},
  rejected_by_system: {label: 'Hết hạn', color: appColors.textMuted, soft: appColors.gray6},
};

export const getBookingStatus = status =>
  BOOKING_STATUS[status] || {label: status, color: appColors.textMuted, soft: appColors.gray6};

// Keys must match the server's PTProfile specializations enum.
export const SPECIALIZATIONS = {
  weight_loss: 'Giảm cân',
  muscle_building: 'Tăng cơ',
  cardio: 'Cardio',
  yoga: 'Yoga',
  strength: 'Sức mạnh',
  general: 'Thể hình tổng quát',
  functional_training: 'Functional',
  rehabilitation: 'Phục hồi chức năng',
  nutrition: 'Dinh dưỡng',
  pilates: 'Pilates',
};

export const getSpecializationLabel = key =>
  SPECIALIZATIONS[key] || String(key || '').replace(/_/g, ' ');
