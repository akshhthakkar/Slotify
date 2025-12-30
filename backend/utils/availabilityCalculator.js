const Business = require('../models/Business');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');

/**
 * Calculate available time slots for a service
 * @param {String} businessId - Business ID
 * @param {String} serviceId - Service ID
 * @param {Date} date - Date to check availability
 * @param {String} staffId - Optional specific staff ID
 * @returns {Array} Array of available time slots
 */
const calculateAvailableSlots = async (businessId, serviceId, date, staffId = null) => {
  try {
    // Get business details
    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Check if date is a holiday
    const dateObj = new Date(date);
    const isHoliday = business.holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === dateObj.toDateString();
    });

    if (isHoliday) {
      return [];
    }

    // Get day of week
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

    // Get business working hours for this day
    const businessHours = business.workingHours[dayOfWeek];
    if (!businessHours || !businessHours.isOpen) {
      return [];
    }

    // Get staff members who can provide this service
    let staffMembers;
    if (staffId) {
      const specificStaff = await Staff.findOne({
        userId: staffId,
        businessId,
        isActive: true,
        serviceIds: serviceId
      });
      if (!specificStaff) {
        return [];
      }
      staffMembers = [specificStaff];
    } else {
      staffMembers = await Staff.find({
        businessId,
        isActive: true,
        serviceIds: serviceId
      });
    }

    if (staffMembers.length === 0) {
      return [];
    }

    // Generate all possible slots
    const allSlots = [];
    const slotDuration = 15; // 15-minute increments
    const serviceDuration = service.duration;
    const bufferTime = service.bufferTime || 0;

    for (const staff of staffMembers) {
      // Check if staff is unavailable on this date
      const isUnavailable = staff.unavailableDates.some(unavailable => {
        const unavailableDate = new Date(unavailable.date);
        return unavailableDate.toDateString() === dateObj.toDateString();
      });

      if (isUnavailable) {
        continue;
      }

      // Get staff working hours (default to business hours)
      const staffHours = staff.workingHours[dayOfWeek]?.isOpen ? 
        staff.workingHours[dayOfWeek] : businessHours;

      if (!staffHours.isOpen) {
        continue;
      }

      // Get existing appointments for this staff on this date
      const existingAppointments = await Appointment.find({
        staffId: staff.userId,
        appointmentDate: {
          $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          $lte: new Date(dateObj.setHours(23, 59, 59, 999))
        },
        status: 'scheduled'
      }).sort({ startTime: 1 });

      // Process each time slot
      for (const slot of staffHours.slots) {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);

        let currentTime = startHour * 60 + startMinute; // Convert to minutes
        const endTime = endHour * 60 + endMinute;

        while (currentTime + serviceDuration <= endTime) {
          const slotStartTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
          const slotEndTime = `${Math.floor((currentTime + serviceDuration) / 60).toString().padStart(2, '0')}:${((currentTime + serviceDuration) % 60).toString().padStart(2, '0')}`;

          // Check if slot overlaps with breaks
          const isInBreak = staffHours.breaks?.some(breakTime => {
            const [breakStart] = breakTime.start.split(':').map(Number);
            const [breakEnd] = breakTime.end.split(':').map(Number);
            const breakStartMinutes = breakStart * 60 + parseInt(breakTime.start.split(':')[1]);
            const breakEndMinutes = breakEnd * 60 + parseInt(breakTime.end.split(':')[1]);

            return (currentTime < breakEndMinutes && (currentTime + serviceDuration) > breakStartMinutes);
          });

          if (isInBreak) {
            currentTime += slotDuration;
            continue;
          }

          // Check if slot overlaps with existing appointments
          const hasConflict = existingAppointments.some(apt => {
            const aptStart = timeToMinutes(apt.startTime);
            const aptEnd = timeToMinutes(apt.endTime);
            
            // Add buffer time to existing appointments
            const aptEndWithBuffer = aptEnd + bufferTime;

            return (currentTime < aptEndWithBuffer && (currentTime + serviceDuration) > aptStart);
          });

          if (!hasConflict) {
            allSlots.push({
              startTime: slotStartTime,
              endTime: slotEndTime,
              staffId: staff.userId,
              staffName: null // Will be populated later if needed
            });
          }

          currentTime += slotDuration;
        }
      }
    }

    // Remove duplicates and sort
    const uniqueSlots = [];
    const seenTimes = new Set();

    for (const slot of allSlots) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!seenTimes.has(key)) {
        seenTimes.add(key);
        uniqueSlots.push(slot);
      }
    }

    // Sort by time
    uniqueSlots.sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    return uniqueSlots;
  } catch (error) {
    console.error('Error calculating availability:', error);
    throw error;
  }
};

/**
 * Convert time string (HH:MM) to minutes
 * @param {String} time - Time in HH:MM format
 * @returns {Number} Minutes
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if specific time slot is available
 * @param {String} businessId - Business ID
 * @param {String} staffId - Staff ID
 * @param {Date} date - Date
 * @param {String} startTime - Start time (HH:MM)
 * @param {Number} duration - Duration in minutes
 * @returns {Boolean} Is available
 */
const isSlotAvailable = async (businessId, staffId, date, startTime, duration) => {
  try {
    const dateObj = new Date(date);
    
    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check for existing appointments
    const conflictingAppointment = await Appointment.findOne({
      businessId,
      staffId,
      appointmentDate: {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(dateObj.setHours(23, 59, 59, 999))
      },
      status: 'scheduled',
      $or: [
        {
          // New slot starts during existing appointment
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } }
          ]
        },
        {
          // New slot ends during existing appointment
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } }
          ]
        },
        {
          // New slot completely contains existing appointment
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } }
          ]
        }
      ]
    });

    return !conflictingAppointment;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
};

module.exports = {
  calculateAvailableSlots,
  isSlotAvailable,
  timeToMinutes
};