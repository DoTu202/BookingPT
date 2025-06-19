/**
 * Time formatting utilities to handle timezone-safe time display
 * Ensures consistent time display regardless of timezone differences
 */

/**
 * Format time to display format (12-hour format with AM/PM)
 * Handles Date objects, ISO strings and time strings without timezone conversion issues
 * @param {string|Date} timeInput - Either Date object, ISO string (2025-06-19T19:40:00.000Z) or time string (19:40)
 * @returns {string} - Formatted time (7:40 PM)
 */
export const formatTime = (timeInput) => {
  if (!timeInput) return '';
  
  let date;
  
  // If it's already a Date object, use it directly
  if (timeInput instanceof Date) {
    date = timeInput;
  } else if (typeof timeInput === 'string') {
    // Check if it's an ISO date string (from backend)
    if (timeInput.includes('T') || timeInput.includes('Z')) {
      // For ISO strings, extract hours/minutes directly without timezone conversion
      const isoDate = new Date(timeInput);
      // Get UTC hours and minutes to avoid timezone conversion
      const utcHours = isoDate.getUTCHours();
      const utcMinutes = isoDate.getUTCMinutes();
      
      // Create a new date object with local timezone but same hours/minutes
      date = new Date();
      date.setHours(utcHours, utcMinutes, 0, 0);
    } else {
      // It's a time string like "19:00"
      const [hours, minutes] = timeInput.split(':');
      date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
  } else {
    // Fallback for unexpected input types
    return '';
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Extract 24-hour time string from ISO datetime or Date object
 * @param {string|Date} input - ISO datetime string or Date object
 * @returns {string} - Time in HH:MM format (19:40)
 */
export const extractTimeFromISO = (input) => {
  if (!input) return '';
  
  let date;
  
  // If it's a Date object, use it directly
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // If it's already a time string, return as is
    if (!input.includes('T') && !input.includes('Z')) {
      return input;
    }
    // Extract time from ISO string
    date = new Date(input);
  } else {
    return '';
  }
  
  // Extract time using UTC to avoid timezone conversion
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
