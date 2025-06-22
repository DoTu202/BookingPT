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
