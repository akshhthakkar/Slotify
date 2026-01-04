/**
 * Appointment Constants - Frontend
 * Must match backend constants/appointmentStatus.js
 */

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};

/**
 * Status display configuration
 */
export const STATUS_CONFIG = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    label: "Scheduled",
    color: "blue",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    label: "Completed",
    color: "green",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    label: "Cancelled",
    color: "red",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    label: "No Show",
    color: "yellow",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-700",
  },
};

/**
 * Check if appointment can be cancelled by customer
 * @param {Object} appointment - Appointment object
 * @param {number} cancellationWindowHours - Business cancellation window in hours
 * @returns {{ canCancel: boolean, reason?: string }}
 */
export const canCustomerCancel = (appointment, cancellationWindowHours = 2) => {
  if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) {
    return {
      canCancel: false,
      reason: "Only scheduled appointments can be cancelled",
    };
  }

  const now = new Date();
  const aptDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = (appointment.startTime || "00:00")
    .split(":")
    .map(Number);
  aptDate.setHours(hours, minutes, 0, 0);

  const hoursUntil = (aptDate - now) / (1000 * 60 * 60);

  if (hoursUntil < 0) {
    return { canCancel: false, reason: "Appointment has already started" };
  }

  if (hoursUntil < cancellationWindowHours) {
    return {
      canCancel: false,
      reason: `Appointments must be cancelled at least ${cancellationWindowHours} hours in advance`,
    };
  }

  return { canCancel: true };
};

/**
 * Check if appointment was completed early
 * @param {Object} appointment - Appointment object
 * @returns {boolean}
 */
export const isCompletedEarly = (appointment) => {
  if (
    appointment.status !== APPOINTMENT_STATUS.COMPLETED ||
    !appointment.completedAt
  ) {
    return false;
  }

  const completedAt = new Date(appointment.completedAt);
  const aptDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = (appointment.endTime || "23:59")
    .split(":")
    .map(Number);
  aptDate.setHours(hours, minutes, 0, 0);

  return completedAt < aptDate;
};
