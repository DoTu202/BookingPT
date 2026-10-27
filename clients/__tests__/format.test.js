import {formatCurrency, formatCompactCurrency, formatLocation, formatHours} from '../src/utils/format';

describe('format', () => {
  it('formats VND with dot separators', () => {
    expect(formatCurrency(350000)).toBe('350.000 ₫');
    expect(formatCurrency(1250000)).toBe('1.250.000 ₫');
    expect(formatCurrency(undefined)).toBe('0 ₫');
  });

  it('formats compact prices', () => {
    expect(formatCompactCurrency(350000)).toBe('350k');
    expect(formatCompactCurrency(1500000)).toBe('1.5tr');
  });

  it('formats locations from the API sub-document', () => {
    expect(formatLocation({city: 'Ha Noi', district: 'Cau Giay'})).toBe('Cau Giay, Ha Noi');
    expect(formatLocation({city: 'Ha Noi'})).toBe('Ha Noi');
    expect(formatLocation(null)).toBe('Chưa cập nhật khu vực');
  });

  it('formats durations in Vietnamese', () => {
    expect(formatHours(1)).toBe('1 giờ');
    expect(formatHours(1.5)).toBe('1,5 giờ');
  });
});
