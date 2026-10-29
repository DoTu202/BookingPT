import {bookingHours, durationHours, hoursUntil, isPast} from '../src/utils/booking';

describe('booking helpers', () => {
  const booking = {
    bookingTime: {startTime: '2030-01-01T00:00:00.000Z', endTime: '2030-01-01T01:30:00.000Z'},
  };

  it('measures durations in hours', () => {
    expect(durationHours(booking.bookingTime.startTime, booking.bookingTime.endTime)).toBe(1.5);
    expect(bookingHours(booking)).toBe(1.5);
  });

  it('compares against now', () => {
    const now = new Date('2030-01-01T00:00:00.000Z').getTime();
    expect(isPast('2030-01-01T00:00:00.000Z', now)).toBe(true);
    expect(isPast('2030-01-01T00:00:01.000Z', now)).toBe(false);
    expect(hoursUntil('2030-01-02T00:00:00.000Z', now)).toBe(24);
  });
});
