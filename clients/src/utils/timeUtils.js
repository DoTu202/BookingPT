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

  /** Two UTC instants -> '06:00 – 07:30' in Vietnam time. */
  formatTimeRange(startIso, endIso) {
    return `${this.formatTo24HourTime(startIso)} – ${this.formatTo24HourTime(endIso)}`;
  },

  /** Greeting for the current part of the day in Vietnam. */
  greeting(hour = this.getCurrentVietnamHour()) {
    if (hour < 11) {
      return 'Chào buổi sáng';
    }
    if (hour < 14) {
      return 'Chào buổi trưa';
    }
    if (hour < 18) {
      return 'Chào buổi chiều';
    }
    return 'Chào buổi tối';
  },
};

// Today's calendar day in Vietnam as 'YYYY-MM-DD' (the key DateStrip uses).
export const todayKey = () => dayjs().utcOffset(VIETNAM_OFFSET_HOURS * 60).format('YYYY-MM-DD');
