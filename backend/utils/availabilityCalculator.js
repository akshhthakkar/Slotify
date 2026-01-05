const Business = require("../models/Business");
const Service = require("../models/Service");
const Staff = require("../models/Staff");
const Appointment = require("../models/Appointment");
const { createSlotError, getErrorCodeFromStatus } = require("./slotErrors");

// Maximum staff to consider for "Any Available" to prevent performance issues
const MAX_STAFF_FOR_ANY_AVAILABLE = 10;

/**
 * Calculate ALL time slots for a service with status (available, booked, past, unavailable)
 * @param {String} businessId - Business ID
 * @param {String} serviceId - Service ID
 * @param {Date} date - Date to check availability
 * @param {String} staffId - Optional specific staff ID (Staff._id)
 * @returns {Array} Array of all time slots with status
 */
const calculateAvailableSlots = async (
  businessId,
  serviceId,
  date,
  staffId = null
) => {
  try {
    // Get business details
    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error("Service not found");
    }

    // Parse date as local date (YYYY-MM-DD) to match server's local time perspective
    let dateObj;
    if (typeof date === "string" && date.includes("-")) {
      const [year, month, day] = date.split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }

    // Check if date is a holiday
    const isHoliday = business.holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === dateObj.toDateString();
    });

    if (isHoliday) {
      return { slots: [], isHoliday: true };
    }

    // Get day of week
    const dayOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][dateObj.getDay()];

    // Get business working hours for this day
    const businessHours = business.workingHours[dayOfWeek];
    if (!businessHours || !businessHours.isOpen) {
      return { slots: [], isClosed: true };
    }

    // Check if business has working hour slots defined
    if (!businessHours.slots || businessHours.slots.length === 0) {
      return { slots: [], isClosed: true };
    }

    // Current time for determining past slots and advance booking window
    // Convert server time to business timezone
    const timeZone = business.timeZone || "UTC";
    const nowServer = new Date();

    // Create a date object that represents the time in the business timezone
    const nowInBusinessTz = new Date(
      nowServer.toLocaleString("en-US", { timeZone })
    );

    // Compare dates using face values
    const isToday = dateObj.toDateString() === nowInBusinessTz.toDateString();
    const currentMinutes = isToday
      ? nowInBusinessTz.getHours() * 60 + nowInBusinessTz.getMinutes()
      : 0;

    // Calculate advance booking window in minutes
    const minAdvanceMinutes =
      (business.bookingSettings?.minAdvanceTime || 1) * 60;

    // Calculate max advance booking window in days
    const maxAdvanceDays = business.bookingSettings?.maxAdvanceTime || 90;

    // Check if date is too far in the future
    const todayStart = new Date(nowInBusinessTz);
    todayStart.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((dateObj - todayStart) / (1000 * 60 * 60 * 24));
    const isTooFar = daysDiff > maxAdvanceDays;

    // Generate all possible slots with status
    const allSlots = [];
    const serviceDuration = service.duration;
    const bufferTime = service.bufferTime || 0;

    // Get Staff records for staff-specific scheduling
    let staffMembers = [];
    if (staffId) {
      // Find staff by _id (the Staff document's primary key)
      const specificStaff = await Staff.findOne({
        _id: staffId,
        businessId,
        isActive: true,
      });
      if (specificStaff) {
        staffMembers = [specificStaff];
      }
    } else {
      // Get all active staff that can provide this service
      // Limit to MAX_STAFF_FOR_ANY_AVAILABLE to prevent N×slot explosion
      staffMembers = await Staff.find({
        businessId,
        isActive: true,
        serviceIds: serviceId, // Only staff assigned to this service
      }).limit(MAX_STAFF_FOR_ANY_AVAILABLE);
    }

    // If we have Staff records, use staff-specific scheduling
    if (staffMembers.length > 0) {
      for (const staff of staffMembers) {
        // Check if staff is unavailable on this date
        const isUnavailable = staff.unavailableDates?.some((unavailable) => {
          const unavailableDate = new Date(unavailable.date);
          return unavailableDate.toDateString() === dateObj.toDateString();
        });

        if (isUnavailable) {
          continue;
        }

        // Get staff working hours (default to business hours)
        const staffHours = staff.workingHours?.[dayOfWeek]?.isOpen
          ? staff.workingHours[dayOfWeek]
          : businessHours;

        if (!staffHours.isOpen) {
          continue;
        }

        // Get existing appointments for this staff on this date (ALL services)
        // Staff availability is TIME-BASED, not service-based
        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
          staffId: staff._id, // Use staff._id for consistency
          appointmentDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status: "scheduled",
        }).sort({ startTime: 1 });

        // Generate slots for this staff
        generateSlotsFromHours(
          staffHours,
          staff._id, // Use staff._id as the staffId in slots
          serviceDuration,
          bufferTime,
          existingAppointments,
          isToday,
          currentMinutes,
          minAdvanceMinutes,
          isTooFar,
          allSlots
        );
      }
    } else {
      // No Staff records for this service - use business hours directly
      // This allows booking even without Staff model records
      const staffIdsToUse =
        service.staffIds && service.staffIds.length > 0
          ? service.staffIds
          : [null]; // Use null as placeholder if no staff assigned

      // Get all existing appointments for this business on this date
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await Appointment.find({
        businessId,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: "scheduled",
      }).sort({ startTime: 1 });

      // Generate slots using business hours
      for (const sId of staffIdsToUse) {
        generateSlotsFromHours(
          businessHours,
          sId,
          serviceDuration,
          bufferTime,
          existingAppointments,
          isToday,
          currentMinutes,
          minAdvanceMinutes,
          isTooFar,
          allSlots
        );
      }
    }

    // Remove duplicates (keep first occurrence) and sort
    // When deduplicating, prefer "available" > "too-soon" > "too-far" > "booked" > "past"
    const uniqueSlots = [];
    const seenTimes = new Set();
    const statusPriority = {
      available: 5,
      "too-soon": 4,
      "too-far": 3,
      booked: 2,
      past: 1,
    };

    for (const slot of allSlots) {
      const key = slot.startTime;
      if (!seenTimes.has(key)) {
        seenTimes.add(key);
        uniqueSlots.push(slot);
      } else {
        // If we've seen this time before, keep the better status
        const existingIndex = uniqueSlots.findIndex(
          (s) => s.startTime === slot.startTime
        );
        if (existingIndex !== -1) {
          const existingPriority =
            statusPriority[uniqueSlots[existingIndex].status] || 0;
          const newPriority = statusPriority[slot.status] || 0;
          if (newPriority > existingPriority) {
            uniqueSlots[existingIndex] = slot;
          }
        }
      }
    }

    // Sort by time
    uniqueSlots.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    return { slots: uniqueSlots, serviceDuration };
  } catch (error) {
    console.error("Error calculating availability:", error);
    throw error;
  }
};

/**
 * Helper function to generate slots from working hours
 * @param {Object} hours - Working hours configuration
 * @param {String} staffId - Staff ID (Staff._id)
 * @param {Number} serviceDuration - Duration in minutes
 * @param {Number} bufferTime - Buffer time between appointments
 * @param {Array} existingAppointments - Already booked appointments
 * @param {Boolean} isToday - Whether this is today's date
 * @param {Number} currentMinutes - Current time in minutes since midnight
 * @param {Number} minAdvanceMinutes - Minimum advance booking time in minutes
 * @param {Boolean} isTooFar - Whether date is beyond max advance booking window
 * @param {Array} allSlots - Output array to push slots into
 */
const generateSlotsFromHours = (
  hours,
  staffId,
  serviceDuration,
  bufferTime,
  existingAppointments,
  isToday,
  currentMinutes,
  minAdvanceMinutes,
  isTooFar,
  allSlots
) => {
  if (!hours.slots || hours.slots.length === 0) return;

  for (const slot of hours.slots) {
    const [startHour, startMinute] = slot.start.split(":").map(Number);
    const [endHour, endMinute] = slot.end.split(":").map(Number);

    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    while (currentTime + serviceDuration <= endTime) {
      const slotStartTime = `${Math.floor(currentTime / 60)
        .toString()
        .padStart(2, "0")}:${(currentTime % 60).toString().padStart(2, "0")}`;
      const slotEndTime = `${Math.floor((currentTime + serviceDuration) / 60)
        .toString()
        .padStart(2, "0")}:${((currentTime + serviceDuration) % 60)
        .toString()
        .padStart(2, "0")}`;

      // Check if slot is during a break
      const isInBreak = hours.breaks?.some((breakTime) => {
        const breakStartMinutes = timeToMinutes(breakTime.start);
        const breakEndMinutes = timeToMinutes(breakTime.end);
        return (
          currentTime < breakEndMinutes &&
          currentTime + serviceDuration > breakStartMinutes
        );
      });

      if (isInBreak) {
        currentTime += serviceDuration;
        continue;
      }

      // Determine slot status using priority order:
      // too-soon > past > too-far > booked > available
      // This ensures time-based states override booking state
      const status = determineSlotStatus({
        slotTime: currentTime,
        isToday,
        currentMinutes,
        minAdvanceMinutes,
        isTooFar,
        existingAppointments,
        serviceDuration,
        bufferTime,
      });

      allSlots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        staffId: staffId,
        status,
      });

      currentTime += serviceDuration;
    }
  }
};

/**
 * Convert time string (HH:MM) to minutes
 * @param {String} time - Time in HH:MM format
 * @returns {Number} Minutes
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Determine slot status with correct priority order.
 * Priority: too-soon > past > too-far > booked > available
 * Time-based states override booking state.
 *
 * @param {Object} config - Configuration object
 * @param {Number} config.slotTime - Slot start time in minutes
 * @param {Boolean} config.isToday - Whether date is today
 * @param {Number} config.currentMinutes - Current time in minutes
 * @param {Number} config.minAdvanceMinutes - Minimum advance booking time in minutes
 * @param {Boolean} config.isTooFar - Whether date exceeds max advance days
 * @param {Array} config.existingAppointments - Existing appointments for conflict check
 * @param {Number} config.serviceDuration - Service duration in minutes
 * @param {Number} config.bufferTime - Buffer time after appointments
 * @returns {String} Slot status: available|booked|past|too-soon|too-far
 */
const determineSlotStatus = (config) => {
  const {
    slotTime,
    isToday,
    currentMinutes,
    minAdvanceMinutes,
    isTooFar,
    existingAppointments,
    serviceDuration,
    bufferTime,
  } = config;

  // Priority 1: TOO-SOON (within minimum advance window)
  // Must be checked first - even if slot isn't "past" yet, it might be too soon
  if (isToday && slotTime < currentMinutes + minAdvanceMinutes) {
    // But if it's also past, return past instead
    if (slotTime < currentMinutes) {
      return "past";
    }
    return "too-soon";
  }

  // Priority 2: PAST (time has passed)
  if (isToday && slotTime < currentMinutes) {
    return "past";
  }

  // Priority 3: TOO-FAR (beyond max advance days)
  if (isTooFar) {
    return "too-far";
  }

  // Priority 4: BOOKED (conflicts with existing appointment)
  const hasConflict = existingAppointments.some((apt) => {
    const aptStart = timeToMinutes(apt.startTime);
    const aptEnd = timeToMinutes(apt.endTime);
    // Buffer-aware conflict detection
    const aptEndWithBuffer = aptEnd + bufferTime;
    return slotTime < aptEndWithBuffer && slotTime + serviceDuration > aptStart;
  });

  if (hasConflict) {
    return "booked";
  }

  // Priority 5: AVAILABLE (default)
  return "available";
};

/**
 * Check if specific time slot is available
 * @param {String} businessId - Business ID
 * @param {String} staffId - Staff ID (Staff._id)
 * @param {Date} date - Date
 * @param {String} startTime - Start time (HH:MM)
 * @param {Number} duration - Duration in minutes
 * @returns {Boolean} Is available
 */
const isSlotAvailable = async (
  businessId,
  staffId,
  date,
  startTime,
  duration
) => {
  try {
    const dateObj = new Date(date);

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // Build query - check by staffId if provided, otherwise by businessId
    const query = {
      appointmentDate: {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(dateObj.setHours(23, 59, 59, 999)),
      },
      status: "scheduled",
      $or: [
        {
          // New slot starts during existing appointment
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } },
          ],
        },
        {
          // New slot ends during existing appointment
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } },
          ],
        },
        {
          // New slot completely contains existing appointment
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } },
          ],
        },
      ],
    };

    if (staffId) {
      query.staffId = staffId;
    } else {
      query.businessId = businessId;
    }

    // Check for existing appointments
    const conflictingAppointment = await Appointment.findOne(query);

    return !conflictingAppointment;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
};

/**
 * Validate that a requested slot is a valid system-generated slot
 * This ensures customers cannot book arbitrary times
 * @param {String} businessId - Business ID
 * @param {String} serviceId - Service ID
 * @param {Date} date - Date
 * @param {String} startTime - Start time (HH:MM)
 * @returns {Object} { valid: boolean, error?: string, staffId?: string }
 */
const validateSlotExists = async (businessId, serviceId, date, startTime) => {
  try {
    // Generate all valid slots for this date/service
    const result = await calculateAvailableSlots(businessId, serviceId, date);

    if (result.isHoliday) {
      return createSlotError("SLOT_HOLIDAY");
    }

    if (result.isClosed) {
      return createSlotError("SLOT_CLOSED");
    }

    if (result.noStaff) {
      return createSlotError("SLOT_NO_STAFF");
    }

    // Find the requested slot in generated slots
    const requestedSlot = result.slots.find(
      (slot) => slot.startTime === startTime
    );

    if (!requestedSlot) {
      return createSlotError("SLOT_NOT_FOUND");
    }

    // Check slot status - only "available" can be booked
    if (requestedSlot.status !== "available") {
      const errorKey = getErrorCodeFromStatus(requestedSlot.status);
      return createSlotError(errorKey);
    }

    return {
      valid: true,
      staffId: requestedSlot.staffId,
      endTime: requestedSlot.endTime,
    };
  } catch (error) {
    console.error("Error validating slot:", error);
    return {
      valid: false,
      errorCode: "VALIDATION_ERROR",
      error: "Unable to validate time slot",
    };
  }
};

module.exports = {
  calculateAvailableSlots,
  isSlotAvailable,
  validateSlotExists,
  timeToMinutes,
};
