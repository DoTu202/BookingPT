import {timeUtils} from '../src/utils/timeUtils';

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
