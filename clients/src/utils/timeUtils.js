import dayjs from './dayjs';

// Vietnam timezone offset (UTC+7)
const VIETNAM_OFFSET_HOURS = 7;

// Conversions between what the user picks / sees (Vietnam time) and what the
// server stores (UTC ISO strings). Date labels live in utils/format.js.
export const timeUtils = {
  /**
   * Vietnam date + time typed by the user -> UTC ISO string for the server.
   * @param {string} dateString 'YYYY-MM-DD'
   * @param {string} timeString 'HH:mm'
   * @returns {string | null}
   */
  createUtcIsoString(dateString, timeString) {
    if (!dateString || !timeString) {return null;}
    // Parse as if it were UTC, then shift by the Vietnam offset.
    const dateTimeAsUtc = dayjs.utc(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm');
    return dateTimeAsUtc.subtract(VIETNAM_OFFSET_HOURS, 'hour').toISOString();
  },

  /**
   * UTC ISO string from the server -> 'HH:mm' in Vietnam time.
   * @param {string} isoString
   * @returns {string}
   */
  formatTo24HourTime(isoString) {
    if (!isoString) {return '';}
    const parsed = dayjs.utc(isoString);
    if (!parsed.isValid()) {
      return '';
    }
    return parsed.add(VIETNAM_OFFSET_HOURS, 'hour').format('HH:mm');
  },

  /** Current hour in Vietnam (for greetings). */
  getCurrentVietnamHour() {
    return dayjs.utc().add(VIETNAM_OFFSET_HOURS, 'hour').hour();
  },
};
