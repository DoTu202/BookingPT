// Booking/slot helpers shared by the client and PT screens.

export const durationHours = (startIso, endIso) => (new Date(endIso) - new Date(startIso)) / 3600000;

// Length of a booking in hours (1.5 for 90 minutes).
export const bookingHours = booking =>
  durationHours(booking.bookingTime.startTime, booking.bookingTime.endTime);

export const isPast = (iso, now = Date.now()) => new Date(iso).getTime() <= now;

export const hoursUntil = (iso, now = Date.now()) => (new Date(iso).getTime() - now) / 3600000;
