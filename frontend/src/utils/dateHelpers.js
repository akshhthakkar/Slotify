import { format, parseISO, isToday, isTomorrow, isPast, isFuture, addDays, startOfDay } from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date, formatString = 'MMM d, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

/**
 * Format time for display
 */
export const formatTime = (time) => {
  if (!time) return '';
  return time; // Already in HH:MM format
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date, time) => {
  const dateStr = formatDate(date, 'EEEE, MMMM d, yyyy');
  return `${dateStr} at ${formatTime(time)}`;
};

/**
 * Get relative date (Today, Tomorrow, or date)
 */
export const getRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  return formatDate(dateObj, 'MMM d');
};

/**
 * Check if date is in the past
 */
export const isDatePast = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isPast(startOfDay(dateObj));
};

/**
 * Check if date is in the future
 */
export const isDateFuture = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(startOfDay(dateObj));
};

/**
 * Get date range (next N days)
 */
export const getDateRange = (days = 30) => {
  const dates = [];
  const today = startOfDay(new Date());
  
  for (let i = 0; i < days; i++) {
    dates.push(addDays(today, i));
  }
  
  return dates;
};

/**
 * Convert date to ISO string for API
 */
export const toISODate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Parse time to minutes (for comparison)
 */
export const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Compare two times
 */
export const isTimeBefore = (time1, time2) => {
  return timeToMinutes(time1) < timeToMinutes(time2);
};

/**
 * Format duration
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};