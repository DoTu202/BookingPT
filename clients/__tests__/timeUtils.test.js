import {timeUtils, todayKey} from '../src/utils/timeUtils';

describe('timeUtils (Vietnam time <-> UTC)', () => {
  it('converts a Vietnam local date/time to a UTC ISO string', () => {
    expect(timeUtils.createUtcIsoString('2030-01-02', '06:30')).toBe(
      '2030-01-01T23:30:00.000Z',
    );
  });

  it('formats a UTC instant in Vietnam time', () => {
    expect(timeUtils.formatTo24HourTime('2030-01-01T23:30:00.000Z')).toBe('06:30');
  });

  it('round-trips user input', () => {
    const iso = timeUtils.createUtcIsoString('2030-06-15', '18:45');
    expect(timeUtils.formatTo24HourTime(iso)).toBe('18:45');
  });

  it('handles missing input safely', () => {
    expect(timeUtils.createUtcIsoString('', '10:00')).toBeNull();
    expect(timeUtils.formatTo24HourTime(null)).toBe('');
  });
});

describe('timeUtils display helpers', () => {
  it('formats a time range in Vietnam time', () => {
    expect(timeUtils.formatTimeRange('2030-01-01T23:00:00.000Z', '2030-01-02T00:30:00.000Z')).toBe(
      '06:00 – 07:30',
    );
  });

  it('greets by part of the day', () => {
    expect(timeUtils.greeting(7)).toBe('Chào buổi sáng');
    expect(timeUtils.greeting(12)).toBe('Chào buổi trưa');
    expect(timeUtils.greeting(15)).toBe('Chào buổi chiều');
    expect(timeUtils.greeting(21)).toBe('Chào buổi tối');
  });

  it('builds today key as YYYY-MM-DD', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
