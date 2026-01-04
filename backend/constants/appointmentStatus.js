/**
 * Appointment Status Constants
 * Single source of truth for appointment statuses
 */

const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};

/**
 * Valid state transitions
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS = {
  [APPOINTMENT_STATUS.SCHEDULED]: [
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ],
  [APPOINTMENT_STATUS.COMPLETED]: [], // Terminal state
  [APPOINTMENT_STATUS.CANCELLED]: [], // Terminal state
  [APPOINTMENT_STATUS.NO_SHOW]: [], // Terminal state
};

/**
 * Validate if a state transition is allowed
 * @param {string} currentStatus - Current appointment status
 * @param {string} newStatus - Target status
 * @returns {{ valid: boolean, error?: string }}
 */
const validateStateTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: false, error: `Appointment is already ${currentStatus}` };
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return { valid: false, error: `Invalid current status: ${currentStatus}` };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot change appointment from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
};

/**
 * Get all valid status values
 */
const getAllStatuses = () => Object.values(APPOINTMENT_STATUS);

module.exports = {
  APPOINTMENT_STATUS,
  VALID_TRANSITIONS,
  validateStateTransition,
  getAllStatuses,
};
