import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Vietnam timezone
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Time utilities using Day.js for React Native
 * Centralized time operations for the frontend
 */
export const timeUtils = {
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
   * Format date for display
   * @param {string|Date} date - Date to format
   * @param {string} format - Format string (default: 'YYYY-MM-DD')
   * @returns {string} - Formatted date string
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    return dayjs(date).tz(TIMEZONE).format(format);
  },

  /**
   * Format time for display
   * @param {string|Date} time - Time to format
   * @param {string} format - Format string (default: 'HH:mm')
   * @returns {string} - Formatted time string
   */
  formatTime(time, format = 'HH:mm') {
    // If time is already a formatted string from backend, extract time part directly
    if (typeof time === 'string' && time.includes(' ')) {
      // Extract just the time part (HH:mm) from 'YYYY-MM-DD HH:mm'
      const timePart = time.split(' ')[1];
      return timePart;
    }
    return dayjs(time).tz(TIMEZONE).format(format);
  },

  /**
   * Format date with day name
   * @param {string|Date} date - Date to format
   * @param {string} format - Format string (default: 'dddd, MMM DD')
   * @returns {string} - Formatted date string with day name
   */
  formatDateWithDay(date, format = 'dddd, MMM DD') {
    return dayjs(date).tz(TIMEZONE).format(format);
  },

  /**
   * Add time to a date
   * @param {string|Date} date - Base date
   * @param {number} amount - Amount to add
   * @param {string} unit - Unit (day, hour, minute, etc.)
   * @returns {dayjs.Dayjs} - New dayjs object with time added
   */
  addTime(date, amount, unit) {
    return dayjs(date).add(amount, unit);
  },

  /**
   * Check if date is today
   * @param {string|Date} date - Date to check
   * @returns {boolean} - True if date is today
   */
  isToday(date) {
    return dayjs(date).isSame(dayjs(), 'day');
  },

  /**
   * Check if date is in the past
   * @param {string|Date} date - Date to check
   * @returns {boolean} - True if date is in the past
   */
  isInPast(date) {
    return dayjs(date).isBefore(dayjs());
  },

  /**
   * Check if date is in the future
   * @param {string|Date} date - Date to check
   * @returns {boolean} - True if date is in the future
   */
  isInFuture(date) {
    return dayjs(date).isAfter(dayjs());
  },

  /**
   * Get start of day
   * @param {string|Date} date - Date input
   * @returns {dayjs.Dayjs} - Start of day
   */
  startOfDay(date) {
    return dayjs(date).startOf('day');
  },

  /**
   * Get end of day
   * @param {string|Date} date - Date input
   * @returns {dayjs.Dayjs} - End of day
   */
  endOfDay(date) {
    return dayjs(date).endOf('day');
  },

  /**
   * Compare two dates
   * @param {string|Date} date1 - First date
   * @param {string|Date} date2 - Second date
   * @returns {number} - -1 if first is before, 0 if equal, 1 if after
   */
  compare(date1, date2) {
    const d1 = dayjs(date1);
    const d2 = dayjs(date2);
    
    if (d1.isBefore(d2)) return -1;
    if (d1.isAfter(d2)) return 1;
    return 0;
  },

  /**
   * Check if two dates are the same
   * @param {string|Date} date1 - First date
   * @param {string|Date} date2 - Second date
   * @param {string} unit - Unit to compare (day, hour, minute, etc.)
   * @returns {boolean} - True if dates are the same
   */
  isSame(date1, date2, unit = 'day') {
    return dayjs(date1).isSame(dayjs(date2), unit);
  },

  /**
   * Get difference between two dates
   * @param {string|Date} date1 - First date
   * @param {string|Date} date2 - Second date
   * @param {string} unit - Unit for difference (day, hour, minute, etc.)
   * @returns {number} - Difference in specified unit
   */
  diff(date1, date2, unit = 'day') {
    return dayjs(date1).diff(dayjs(date2), unit);
  },

  /**
   * Parse date string
   * @param {string} dateString - Date string to parse
   * @param {string} format - Format of the input string
   * @returns {dayjs.Dayjs} - Parsed dayjs object
   */
  parse(dateString, format) {
    return dayjs(dateString, format);
  },

  /**
   * Parse datetime string from backend
   * @param {string} dateTimeString - DateTime string (YYYY-MM-DD HH:mm)
   * @returns {dayjs.Dayjs} - Day.js object
   */
  parseDateTime(dateTimeString) {
    // Parse as VN timezone
    return dayjs.tz(dateTimeString, 'YYYY-MM-DD HH:mm', TIMEZONE);
  },

  /**
   * Get timezone name
   * @returns {string} - Timezone string
   */
  getTimezone() {
    return TIMEZONE;
  },

  /**
   * Convert to Vietnam timezone
   * @param {string|Date} date - Date to convert
   * @returns {dayjs.Dayjs} - Date in Vietnam timezone
   */
  toVietnamTime(date) {
    return dayjs(date).tz(TIMEZONE);
  },

  /**
   * Create dayjs object from date
   * @param {string|Date} date - Date input
   * @returns {dayjs.Dayjs} - Dayjs object
   */
  dayjs(date) {
    return dayjs(date);
  }
};

// Legacy functions for backward compatibility
/**
 * Format time string to display format (12-hour format with AM/PM)
 * Handles both ISO strings and time strings without timezone conversion issues
 * @param {string} timeString - Either ISO string (2025-06-19T19:40:00.000Z) or time string (19:40)
 * @returns {string} - Formatted time (7:40 PM)
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';

  // Defensive: if input is a Date, convert to ISO string
  if (timeString instanceof Date) {
    timeString = timeString.toISOString();
  }
  // Defensive: ensure string
  if (typeof timeString !== 'string') {
    timeString = String(timeString);
  }

  let date;
  if (timeString.includes('T') || timeString.includes('Z')) {
    const isoDate = new Date(timeString);
    const utcHours = isoDate.getUTCHours();
    const utcMinutes = isoDate.getUTCMinutes();
    date = new Date();
    date.setHours(utcHours, utcMinutes, 0, 0);
  } else {
    const [hours, minutes] = timeString.split(':');
    date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Extract 24-hour time string from ISO datetime
 * @param {string} isoString - ISO datetime string
 * @returns {string} - Time in HH:MM format (19:40)
 */
export const extractTimeFromISO = (isoString) => {
  if (!isoString) return '';
  if (isoString instanceof Date) {
    isoString = isoString.toISOString();
  }
  if (typeof isoString !== 'string') {
    isoString = String(isoString);
  }
  if (!isoString.includes('T') && !isoString.includes('Z')) {
    return isoString;
  }
  const date = new Date(isoString);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format 24-hour time string to 12-hour display format
 * @param {string} time24 - Time in HH:MM format (19:40)
 * @returns {string} - Time in 12-hour format (7:40 PM)
 */
export const format24HourTo12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Create ISO datetime string from date and time components
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - ISO datetime string
 */
export const createISODateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const date = new Date(dateString);
  date.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return date.toISOString();
};

/**
 * Format date for display
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Check if two time slots overlap
 * @param {Object} slot1 - First time slot {startTime, endTime}
 * @param {Object} slot2 - Second time slot {startTime, endTime}
 * @returns {boolean} - True if slots overlap
 */
export const doTimeSlotsOverlap = (slot1, slot2) => {
  const start1 = new Date(slot1.startTime);
  const end1 = new Date(slot1.endTime);
  const start2 = new Date(slot2.startTime);
  const end2 = new Date(slot2.endTime);
  
  return start1 < end2 && start2 < end1;
};
