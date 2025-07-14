import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Cài đặt các plugin cần thiết cho dayjs
dayjs.extend(utc);
dayjs.extend(customParseFormat);

// Vietnam timezone offset (UTC+7)
const VIETNAM_OFFSET_HOURS = 7;

export const timeUtils = {
  /**
   * function #1: Create UTC ISO String for Server.
   * This function takes user input (always considered Vietnam time)
   * and converts it to a standard UTC ISO string.
   * @param {string} dateString
   * @param {string} timeString
   * @returns {string} ISO UTC string, e.g., '2025-07-11T14:30:00.000Z'
   */
  createUtcIsoString(dateString, timeString) {
    if (!dateString || !timeString) return null;
    // 1. Parse date and time as if it's UTC (we'll treat this as Vietnam time)
    const dateTimeAsUtc = dayjs.utc(
      `${dateString} ${timeString}`,
      'YYYY-MM-DD HH:mm',
    );
    // 2. Subtract Vietnam offset to get actual UTC time
    const utcTime = dateTimeAsUtc.subtract(VIETNAM_OFFSET_HOURS, 'hour');
    // 3. Return ISO string
    return utcTime.toISOString();
  },

  /**
   * function #2: Format time from Server for Display.
   * This function takes a UTC string from the server and displays it in Vietnam time.
   * @param {string} isoString - ISO string from server
   * @returns {string} - e.g., '9:30 PM'
   */
  formatToVietnameseTime(isoString) {
    if (!isoString) return '';

    // Parse as UTC and add Vietnam offset
    const parsed = dayjs.utc(isoString);

    if (!parsed.isValid()) {
      console.warn('Invalid date string:', isoString);
      return '';
    }

    const vietnamTime = parsed.add(VIETNAM_OFFSET_HOURS, 'hour');
    return vietnamTime.format('h:mm A');
  },

  /**
   * function #3: Format time for 24-hour input.
   * This function takes a UTC string from the server and displays it in 24-hour format (HH:mm).
   * @param {string} isoString - ISO string from server
   * @returns {string} - e.g., '21:30'
   */
  formatTo24HourTime(isoString) {
    if (!isoString) return '';
    // Parse as UTC and add Vietnam offset
    const parsed = dayjs.utc(isoString);
    if (!parsed.isValid()) {
      console.warn('Invalid date string:', isoString);
      return '';
    }
    return parsed.add(VIETNAM_OFFSET_HOURS, 'hour').format('HH:mm');
  },

  /**
   * Format full date for display.
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., 'Thứ Sáu, 11 tháng 7, 2025'
   */
  formatToVietnameseDate(dateValue) {
    if (!dateValue) return '';
    // Parse UTC time and add Vietnam offset
    return dayjs
      .utc(dateValue)
      .add(VIETNAM_OFFSET_HOURS, 'hour')
      .format('dddd, DD [tháng] M, YYYY');
  },

  /**
   * Format short date for display.
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., '11/07/2025'
   */
  formatToShortDate(dateValue) {
    if (!dateValue) return '';
    // Parse UTC time and add Vietnam offset
    return dayjs
      .utc(dateValue)
      .add(VIETNAM_OFFSET_HOURS, 'hour')
      .format('DD/MM/YYYY');
  },

  /**
   * Get current hour in Vietnam timezone for greeting
   * @returns {number} - hour in Vietnam timezone (0-23)
   */
  getCurrentVietnamHour() {
    return dayjs.utc().add(VIETNAM_OFFSET_HOURS, 'hour').hour();
  },

  /**
   * Format date for earnings display
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., 'Jul 11, 2:30 PM'
   */
  formatEarningsDate(dateValue) {
    if (!dateValue) return '';
    const vietnamTime = dayjs.utc(dateValue).add(VIETNAM_OFFSET_HOURS, 'hour');
    return vietnamTime.format('MMM D, h:mm A');
  },

  /**
   * Format message time for chat
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., '14:30' or 'Yesterday' or 'Jul 11'
   */
  formatMessageTime(dateValue) {
    if (!dateValue) return '';

    const messageTime = dayjs.utc(dateValue).add(VIETNAM_OFFSET_HOURS, 'hour');
    const now = dayjs.utc().add(VIETNAM_OFFSET_HOURS, 'hour');
    const diffInDays = now.diff(messageTime, 'day');

    if (diffInDays === 0) {
      // Today: only show hour
      return messageTime.format('HH:mm');
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else {
      // Other days
      return messageTime.format('MMM D');
    }
  },

  /**
   * Format relative time for notifications and chat list
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., 'Now', '5m', '2h', '3d'
   */
  formatRelativeTime(dateValue) {
    if (!dateValue) return '';

    const targetTime = dayjs.utc(dateValue).add(VIETNAM_OFFSET_HOURS, 'hour');
    const now = dayjs.utc().add(VIETNAM_OFFSET_HOURS, 'hour');

    const diffInMinutes = now.diff(targetTime, 'minute');

    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return targetTime.format('MMM D');
  },

  /**
   * Format join date for profile display
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., 'January 2025'
   */
  formatJoinDate(dateValue) {
    if (!dateValue) return '';
    return dayjs
      .utc(dateValue)
      .add(VIETNAM_OFFSET_HOURS, 'hour')
      .format('MMMM YYYY');
  },

  /**
   * Format date for date picker display
   * @param {Date} date - Date object
   * @returns {string} - e.g., '11/7/2025'
   */
  formatDatePickerDate(date) {
    if (!date) return '';
    // For date picker, we don't need timezone conversion as it's just date
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  },

   /**
   * Format full date for display (English).
   * @param {string | Date} dateValue - ISO string or Date object
   * @returns {string} - e.g., 'Friday, July 11, 2025'
   */
  formatToEnglishDate(dateValue) {
    if (!dateValue) return '';
    // Parse UTC time and add Vietnam offset
    return dayjs
      .utc(dateValue)
      .add(VIETNAM_OFFSET_HOURS, 'hour')
      .format('dddd, MMMM D, YYYY');
  },
};
