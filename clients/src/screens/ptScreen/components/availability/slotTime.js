import dayjs from '../../../../utils/dayjs';

// "HH:mm" helpers for the availability time pickers (values are Vietnam
// local time).

export const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = total => {
  const clamped = Math.min(Math.max(total, 0), 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

export const toPickerDate = hhmm => {
  const date = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};

export const fromPickerDate = date =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// Vietnam calendar day ('YYYY-MM-DD') of a UTC instant.
export const dayOf = iso => dayjs(iso).utcOffset(7 * 60).format('YYYY-MM-DD');

export const hhmm = hour => `${String(hour).padStart(2, '0')}:00`;
