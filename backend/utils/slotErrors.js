/**
 * Slot Error Codes
 * Used for explicit backend error responses for slot validation failures.
 * Frontend uses these codes to show specific messages and trigger slot refresh.
 */

const SLOT_ERRORS = {
  SLOT_PAST: {
    code: "SLOT_PAST",
    message: "This time slot is in the past",
    httpStatus: 400,
  },
  SLOT_TOO_SOON: {
    code: "SLOT_TOO_SOON",
    message: "This slot is too soon. Please book at least 1 hour in advance.",
    httpStatus: 400,
  },
  SLOT_TOO_FAR: {
    code: "SLOT_TOO_FAR",
    message: "This date is too far in advance. Please select a closer date.",
    httpStatus: 400,
  },
  SLOT_BOOKED: {
    code: "SLOT_BOOKED",
    message: "This time slot is already booked",
    httpStatus: 409, // Conflict
  },
  SLOT_NOT_FOUND: {
    code: "SLOT_NOT_FOUND",
    message: "Invalid time slot. Please select from available slots.",
    httpStatus: 400,
  },
  SLOT_HOLIDAY: {
    code: "SLOT_HOLIDAY",
    message: "Business is closed on this date (holiday)",
    httpStatus: 400,
  },
  SLOT_CLOSED: {
    code: "SLOT_CLOSED",
    message: "Business is closed on this day",
    httpStatus: 400,
  },
  SLOT_NO_STAFF: {
    code: "SLOT_NO_STAFF",
    message: "No staff available for this service",
    httpStatus: 400,
  },
};

/**
 * Create a slot validation error response
 * @param {string} errorKey - Key from SLOT_ERRORS
 * @param {string} customMessage - Optional custom message override
 * @returns {Object} Error object with code, message, valid flag
 */
const createSlotError = (errorKey, customMessage = null) => {
  const error = SLOT_ERRORS[errorKey];
  if (!error) {
    return {
      valid: false,
      errorCode: "UNKNOWN_ERROR",
      error: customMessage || "An unknown error occurred",
    };
  }
  return {
    valid: false,
    errorCode: error.code,
    error: customMessage || error.message,
  };
};

/**
 * Get error code from slot status
 * @param {string} status - Slot status (past, too-soon, too-far, booked)
 * @returns {string} Error key for SLOT_ERRORS
 */
const getErrorCodeFromStatus = (status) => {
  const statusToErrorMap = {
    past: "SLOT_PAST",
    "too-soon": "SLOT_TOO_SOON",
    "too-far": "SLOT_TOO_FAR",
    booked: "SLOT_BOOKED",
  };
  return statusToErrorMap[status] || "SLOT_NOT_FOUND";
};

module.exports = {
  SLOT_ERRORS,
  createSlotError,
  getErrorCodeFromStatus,
};
