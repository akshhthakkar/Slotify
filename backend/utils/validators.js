/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Must be at least 8 characters with uppercase, lowercase, and number
 */
const isValidPassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

/**
 * Validate phone number (basic validation)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate date is not in the past
 */
const isValidFutureDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

/**
 * Validate time format (HH:MM)
 */
const isValidTimeFormat = (time) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

/**
 * Validate business hours
 */
const isValidBusinessHours = (workingHours) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    if (workingHours[day] && workingHours[day].isOpen) {
      const slots = workingHours[day].slots;
      
      if (!slots || slots.length === 0) {
        return { valid: false, message: `${day} is marked as open but has no time slots` };
      }
      
      for (const slot of slots) {
        if (!isValidTimeFormat(slot.start) || !isValidTimeFormat(slot.end)) {
          return { valid: false, message: `Invalid time format for ${day}` };
        }
        
        if (slot.start >= slot.end) {
          return { valid: false, message: `End time must be after start time for ${day}` };
        }
      }
    }
  }
  
  return { valid: true };
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sanitize user input (remove HTML tags)
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidFutureDate,
  isValidTimeFormat,
  isValidBusinessHours,
  isValidUrl,
  sanitizeInput
};