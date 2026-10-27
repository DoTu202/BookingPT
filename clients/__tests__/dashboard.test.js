import {
  bucketLabel,
  bucketTitle,
  formatRate,
  percentChange,
  periodTitle,
  rangeLabel,
} from '../src/utils/dashboard';

// What the server returns for the week of Mon 12/10/2026 (Vietnam time).
const week = {start: '2026-10-11T17:00:00.000Z', end: '2026-10-18T17:00:00.000Z'};
const month = {start: '2026-09-30T17:00:00.000Z', end: '2026-10-31T17:00:00.000Z'};

describe('dashboard labels', () => {
  it('labels ranges in Vietnam time', () => {
    expect(rangeLabel('week', week)).toBe('12/10 – 18/10/2026');
    expect(rangeLabel('month', month)).toBe('Tháng 10/2026');
    expect(rangeLabel('year', {start: '2025-12-31T17:00:00.000Z'})).toBe('Năm 2026');
  });

  it('uses relative titles for the latest periods', () => {
    expect(periodTitle('week', 0, week)).toBe('Tuần này');
    expect(periodTitle('month', 1, month)).toBe('Tháng trước');
    expect(periodTitle('month', 2, month)).toBe('Tháng 10/2026');
  });

  it('labels chart buckets', () => {
    expect(bucketLabel('week', '2026-10-12')).toBe('T2');
    expect(bucketLabel('week', '2026-10-18')).toBe('CN');
    expect(bucketLabel('month', '2026-10-05')).toBe('5');
    expect(bucketLabel('year', '2026-03')).toBe('T3');
    expect(bucketTitle('week', '2026-10-15')).toBe('Thứ Năm, 15/10');
    expect(bucketTitle('year', '2026-10')).toBe('Tháng 10/2026');
  });

  it('computes changes and rates', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(100, 0)).toBeNull();
    expect(formatRate(0.667)).toBe('67%');
    expect(formatRate(null)).toBe('—');
  });
});
