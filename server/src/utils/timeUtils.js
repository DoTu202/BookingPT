const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Vietnam timezone
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Time utilities using Day.js
 * Centralized time operations for the application
 */
const timeUtils = {
  /**
   * Parse date and time string to dayjs object
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {string} time - Time string (HH:mm)
   * @returns {dayjs.Dayjs} - Day.js object in Vietnam timezone
   */
  parseDateTime(date, time) {
    return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
  },

  /**
   * Get start of day (00:00:00) for given date
   * @param {string|Date} date - Date input
   * @returns {Date} - Start of day as Date object
   */
  getStartOfDay(date) {
    return dayjs.tz(date, TIMEZONE).startOf('day').toDate();
  },

  /**
   * Get end of day (23:59:59.999) for given date
   * @param {string|Date} date - Date input
   * @returns {Date} - End of day as Date object
   */
  getEndOfDay(date) {
    return dayjs.tz(date, TIMEZONE).endOf('day').toDate();
  },

  /**
   * Validate time format (HH:mm)
   * @param {string} time - Time string to validate
   * @returns {boolean} - True if valid format
   */
  isValidTimeFormat(time) {
    return dayjs(time, 'HH:mm', true).isValid();
  },

  /**
   * Check if given datetime is in the future
   * @param {string|Date} dateTime - DateTime to check
   * @returns {boolean} - True if in future
   */
  isInFuture(dateTime) {
    return dayjs(dateTime).isAfter(dayjs());
  },

  /**
   * Check if given datetime is in the past
   * @param {string|Date} dateTime - DateTime to check
   * @returns {boolean} - True if in past
   */
  isInPast(dateTime) {
    return dayjs(dateTime).isBefore(dayjs());
  },

  /**
   * Get current time in Vietnam timezone
   * @returns {dayjs.Dayjs} - Current time in Vietnam timezone
   */
  now() {
    return dayjs().tz(TIMEZONE);
  },

  /**
   * Format datetime for display
   * @param {string|Date} dateTime - DateTime to format
   * @param {string} format - Format string (default: 'YYYY-MM-DD HH:mm')
   * @returns {string} - Formatted datetime string
   */
  formatDateTime(dateTime, format = 'YYYY-MM-DD HH:mm') {
    return dayjs(dateTime).tz(TIMEZONE).format(format);
  },

  /**
   * Check if two time periods overlap
   * @param {Date} start1 - Start time of first period
   * @param {Date} end1 - End time of first period
   * @param {Date} start2 - Start time of second period
   * @param {Date} end2 - End time of second period
   * @returns {boolean} - True if periods overlap
   */
  hasOverlap(start1, end1, start2, end2) {
    const s1 = dayjs(start1);
    const e1 = dayjs(end1);
    const s2 = dayjs(start2);
    const e2 = dayjs(end2);
    
    return s1.isBefore(e2) && e1.isAfter(s2);
  },

  /**
   * Create date from date string and time string
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {string} time - Time string (HH:mm)
   * @returns {Date} - Combined Date object
   */
  createDateTime(date, time) {
    return this.parseDateTime(date, time).toDate();
  },

  /**
   * Get date range for a specific date (start and end of day)
   * @param {string|Date} date - Date input
   * @returns {Object} - Object with startOfDay and endOfDay properties
   */
  getDateRange(date) {
    return {
      startOfDay: this.getStartOfDay(date),
      endOfDay: this.getEndOfDay(date)
    };
  },

  /**
   * Compare two dates/times
   * @param {string|Date} dateTime1 - First datetime
   * @param {string|Date} dateTime2 - Second datetime
   * @returns {number} - -1 if first is before, 0 if equal, 1 if after
   */
  compare(dateTime1, dateTime2) {
    const d1 = dayjs(dateTime1);
    const d2 = dayjs(dateTime2);
    
    if (d1.isBefore(d2)) return -1;
    if (d1.isAfter(d2)) return 1;
    return 0;
  },

  /**
   * Add time to a date
   * @param {string|Date} date - Base date
   * @param {number} amount - Amount to add
   * @param {string} unit - Unit (day, hour, minute, etc.)
   * @returns {Date} - New date with time added
   */
  addTime(date, amount, unit) {
    return dayjs(date).add(amount, unit).toDate();
  },

  /**
   * Get timezone name
   * @returns {string} - Timezone string
   */
  getTimezone() {
    return TIMEZONE;
  },

  /**
   * Convert date to Vietnam timezone
   * @param {string|Date} date - Date to convert
   * @returns {Date} - Date in Vietnam timezone
   */
  toVietnamTime(date) {
    return dayjs(date).tz(TIMEZONE).toDate();
  }
};

module.exports = timeUtils;
