import appColors from '../../../../constants/appColors';

// Days shown in the strip (and loaded at once).
export const DAYS = 14;
export const DURATIONS = [60, 90, 120];
// One-tap 1-hour slots offered under the day's list.
export const PRESET_HOURS = [6, 7, 8, 9, 10, 16, 17, 18, 19, 20];

export const SLOT_STATUS = {
  available: {label: 'Còn trống', color: appColors.success, soft: appColors.successSoft},
  booked: {label: 'Đã có người đặt', color: appColors.info, soft: appColors.infoSoft},
  unavailable_by_pt: {label: 'Đã khóa', color: appColors.textMuted, soft: appColors.gray6},
};
