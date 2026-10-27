import dayjs from './dayjs';


// Labels and numbers for the PT dashboard (GET /api/pt/dashboard). Period
// ranges come from the server as UTC instants; they are shown in Vietnam time.

const vn = iso => dayjs(iso).utcOffset(7 * 60);

export const PERIOD_OPTIONS = [
  {key: 'week', label: 'Tuần'},
  {key: 'month', label: 'Tháng'},
  {key: 'year', label: 'Năm'},
];

const UNIT = {week: 'Tuần', month: 'Tháng', year: 'Năm'};
const CURRENT = {week: 'Tuần này', month: 'Tháng này', year: 'Năm nay'};
const PREVIOUS = {week: 'Tuần trước', month: 'Tháng trước', year: 'Năm trước'};

// Monday first, like the server's `weekdays`.
export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAY_LONG = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const weekdayIndex = date => (date.day() + 6) % 7;

// "12/10 – 18/10/2026", "Tháng 10/2026", "Năm 2026".
export const rangeLabel = (period, range) => {
  const start = vn(range.start);
  if (period === 'week') {
    const end = vn(range.end).subtract(1, 'day');
    return `${start.format('DD/MM')} – ${end.format('DD/MM/YYYY')}`;
  }
  return period === 'month' ? `Tháng ${start.format('M/YYYY')}` : `Năm ${start.format('YYYY')}`;
};

// Title of the period picker: relative for the two latest periods.
export const periodTitle = (period, offset, range) => {
  if (offset === 0) {
    return CURRENT[period];
  }
  if (offset === 1) {
    return PREVIOUS[period];
  }
  return rangeLabel(period, range);
};

export const comparisonLabel = period => `so với ${UNIT[period].toLowerCase()} trước đó`;

// Under each bar: "T2", "12", "T10".
export const bucketLabel = (period, key) => {
  if (period === 'year') {
    return `T${Number(key.slice(5, 7))}`;
  }
  const day = dayjs(key);
  return period === 'week' ? WEEKDAY_SHORT[weekdayIndex(day)] : String(day.date());
};

// Above the chart when a bar is selected.
export const bucketTitle = (period, key) => {
  if (period === 'year') {
    return `Tháng ${Number(key.slice(5, 7))}/${key.slice(0, 4)}`;
  }
  const day = dayjs(key);
  return `${WEEKDAY_LONG[weekdayIndex(day)]}, ${day.format('DD/MM')}`;
};

// Change vs the previous period in percent; null when there is nothing to
// compare with.
export const percentChange = (current, previous) => {
  if (!previous) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
};

// 0.667 -> "67%"; null -> "—".
export const formatRate = value => (value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`);
