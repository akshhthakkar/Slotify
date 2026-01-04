const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const Business = require("../models/Business");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Notification = require("../models/Notification");
const {
  APPOINTMENT_STATUS,
  validateStateTransition,
} = require("../constants/appointmentStatus");
const {
  calculateAvailableSlots,
  isSlotAvailable,
  validateSlotExists,
  timeToMinutes,
} = require("../utils/availabilityCalculator");
const {
  sendAppointmentConfirmation,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendCustomerBookingConfirmationEmail,
  sendProviderBookingNotificationEmail,
  sendProviderCancellationEmail,
} = require("../utils/emailService");
const { format } = require("date-fns");

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
const createAppointment = async (req, res, next) => {
  try {
    const {
      businessId,
      serviceId,
      staffId,
      appointmentDate,
      startTime,
      notes,
    } = req.body;

    // Validate required fields
    if (!businessId || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Get business details
    const business = await Business.findById(businessId);
    if (!business || !business.isActive) {
      return res.status(404).json({
        success: false,
        message: "Business not found or inactive",
      });
    }

    // Get service details
    const service = await Service.findOne({
      _id: serviceId,
      businessId,
      isActive: true,
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // Verify staff exists and can provide this service (if specific staff selected)
    let staffMember = null;
    if (staffId) {
      staffMember = await Staff.findOne({
        _id: staffId,
        businessId,
        isActive: true,
      });
      if (!staffMember) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found or inactive",
        });
      }

      // Verify staff is assigned to this service
      const isAssignedToService = staffMember.serviceIds?.some(
        (svcId) => svcId.toString() === serviceId.toString()
      );
      if (!isAssignedToService) {
        return res.status(400).json({
          success: false,
          message: "Selected staff member is not assigned to this service",
        });
      }
    }

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + service.duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // Check if date is in the past (timezone-safe comparison)
    // We convert everything to "Face Value" in the Business Timezone for comparison
    const timeZone = business.timeZone || "UTC";
    const nowServer = new Date();
    const nowInBusinessTz = new Date(
      nowServer.toLocaleString("en-US", { timeZone })
    );

    // Parse appointment request date
    const [year, month, day] = appointmentDate.split("-").map(Number);
    const aptDateFaceValue = new Date(year, month - 1, day); // treated as 00:00:00

    const todayFaceValue = new Date(nowInBusinessTz);
    todayFaceValue.setHours(0, 0, 0, 0);

    if (aptDateFaceValue < todayFaceValue) {
      return res.status(400).json({
        success: false,
        message: "Cannot book appointments in the past",
      });
    }

    // Check minimum advance time
    const [aptHours, aptMinutes] = startTime.split(":").map(Number);
    const aptDateTimeFaceValue = new Date(aptDateFaceValue);
    aptDateTimeFaceValue.setHours(aptHours, aptMinutes, 0, 0);

    const hoursUntilAppointment =
      (aptDateTimeFaceValue - nowInBusinessTz) / (1000 * 60 * 60);
    if (hoursUntilAppointment < business.bookingSettings.minAdvanceTime) {
      return res.status(400).json({
        success: false,
        message: `Appointments must be booked at least ${business.bookingSettings.minAdvanceTime} hours in advance`,
      });
    }

    // Check maximum advance time
    const daysUntilAppointment =
      (aptDateTimeFaceValue - nowInBusinessTz) / (1000 * 60 * 60 * 24);
    if (daysUntilAppointment > business.bookingSettings.maxAdvanceTime) {
      return res.status(400).json({
        success: false,
        message: `Appointments can only be booked up to ${business.bookingSettings.maxAdvanceTime} days in advance`,
      });
    }

    // Check if date is a holiday
    const isHoliday = business.holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === aptDateFaceValue.toDateString();
    });

    if (isHoliday) {
      return res.status(400).json({
        success: false,
        message: "Business is closed on this date",
      });
    }

    // STRICT SLOT VALIDATION: Ensure the requested slot is a valid system-generated slot
    const slotValidation = await validateSlotExists(
      businessId,
      serviceId,
      appointmentDate,
      startTime
    );
    if (!slotValidation.valid) {
      return res.status(400).json({
        success: false,
        message: slotValidation.error,
      });
    }

    // Determine final staff ID (use selected or assigned from slot)
    const finalStaffId = staffId || slotValidation.staffId;
    // NOTE: finalStaffId can be null if the service has no staff assigned (business-level booking)

    const available = await isSlotAvailable(
      businessId,
      finalStaffId,
      appointmentDate,
      startTime,
      service.duration
    );
    if (!available) {
      return res.status(400).json({
        success: false,
        message: "This time slot is no longer available",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      businessId,
      customerId: req.user._id,
      serviceId,
      staffId: finalStaffId,
      appointmentDate: aptDateFaceValue,
      startTime,
      endTime,
      notes,
      status: business.bookingSettings.requiresCustomerApproval
        ? "pending"
        : "scheduled",
      createdBy: "customer",
    });

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("businessId", "name logo contactEmail contactPhone")
      .populate("customerId", "name email phone")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name specialization");

    // Format date for emails
    const formattedDate = format(
      new Date(aptDateFaceValue),
      "EEEE, MMMM d, yyyy"
    );
    const businessAddress =
      business.address?.fullAddress || business.address?.street || "";
    const cancellationHours =
      business.bookingSettings?.cancellationWindow || 24;
    const staffName = staffMember?.name || "Staff";

    // Send confirmation email to CUSTOMER (non-blocking)
    try {
      await sendCustomerBookingConfirmationEmail(req.user.email, {
        customerName: req.user.name,
        businessName: business.name,
        serviceName: service.name,
        date: formattedDate,
        startTime,
        endTime,
        duration: service.duration,
        staffName,
        bookingId: appointment._id.toString(),
        businessAddress,
        cancellationPolicy: `Please cancel or reschedule at least ${cancellationHours} hours in advance.`,
      });
    } catch (emailError) {
      console.error("Customer confirmation email failed:", emailError);
    }

    // Send notification email to PROVIDER/BUSINESS (non-blocking)
    try {
      if (business.contactEmail) {
        await sendProviderBookingNotificationEmail(business.contactEmail, {
          customerName: req.user.name,
          customerEmail: req.user.email,
          customerPhone: req.user.phone || "",
          businessName: business.name,
          serviceName: service.name,
          date: formattedDate,
          startTime,
          endTime,
          duration: service.duration,
          staffName,
          bookingId: appointment._id.toString(),
          customerNotes: notes || "",
        });
      }
    } catch (emailError) {
      console.error("Provider notification email failed:", emailError);
    }

    // Create notification for customer
    await Notification.create({
      userId: req.user._id,
      type: "appointment_confirmed",
      title: "Appointment Confirmed",
      message: `Your appointment with ${business.name} on ${format(
        new Date(aptDateFaceValue),
        "MMM d"
      )} at ${startTime} has been confirmed.`,
      appointmentId: appointment._id,
    });

    // Create notification for staff (only if staff assigned)
    if (finalStaffId) {
      await Notification.create({
        userId: finalStaffId,
        type: "appointment_confirmed",
        title: "New Appointment",
        message: `New appointment with ${req.user.name} on ${format(
          new Date(aptDateFaceValue),
          "MMM d"
        )} at ${startTime}.`,
        appointmentId: appointment._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments
 * @desc    Get appointments with filters
 * @access  Private
 */
const getAppointments = async (req, res, next) => {
  try {
    const {
      businessId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      query.customerId = req.user._id;
    } else if (req.user.role === "staff") {
      query.staffId = req.user._id;
      if (businessId) query.businessId = businessId;
    } else if (req.user.role === "admin") {
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "businessId is required for admin",
        });
      }
      query.businessId = businessId;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const appointments = await Appointment.find(query)
      .populate("businessId", "name logo contactEmail contactPhone")
      .populate("customerId", "name email phone profilePicture")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name specialization")
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Appointment.countDocuments(query);

    // Debug logging
    console.log("📅 getAppointments called:", {
      userRole: req.user.role,
      userId: req.user._id,
      query,
      foundCount: appointments.length,
      totalCount: count,
    });

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("businessId", "name logo contactEmail contactPhone address")
      .populate("customerId", "name email phone profilePicture")
      .populate("serviceId", "name description duration price")
      .populate("staffId", "name email phone profilePicture")
      .populate("cancelledBy", "name");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify access
    const hasAccess =
      appointment.customerId._id.toString() === req.user._id.toString() ||
      appointment.staffId._id.toString() === req.user._id.toString() ||
      (req.user.role === "admin" &&
        req.user.businessId?.toString() ===
          appointment.businessId._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private (Customer or Admin)
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate("businessId", "name bookingSettings")
      .populate("customerId", "name email")
      .populate("serviceId", "name")
      .populate("staffId", "name");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify access
    const isCustomer =
      appointment.customerId._id.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" &&
      req.user.businessId?.toString() === appointment.businessId._id.toString();

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Validate state transition
    const transition = validateStateTransition(
      appointment.status,
      APPOINTMENT_STATUS.CANCELLED
    );
    if (!transition.valid) {
      return res.status(400).json({
        success: false,
        message: transition.error,
      });
    }

    // Check cancellation window (only for customers)
    if (isCustomer && !isAdmin) {
      const aptDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.startTime.split(":").map(Number);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);

      if (
        hoursUntilAppointment <
        appointment.businessId.bookingSettings.cancellationWindow
      ) {
        return res.status(400).json({
          success: false,
          message: `Appointments must be cancelled at least ${appointment.businessId.bookingSettings.cancellationWindow} hours in advance`,
        });
      }
    }

    // Update appointment
    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = isAdmin ? "admin" : "customer";

    // Add audit log entry
    appointment.actionLog.push({
      action: "cancelled",
      performedBy: isAdmin ? "admin" : "customer",
      performedAt: new Date(),
      reason: cancellationReason,
    });

    await appointment.save();

    // Format date for emails
    const formattedDate = format(
      new Date(appointment.appointmentDate),
      "EEEE, MMMM d, yyyy"
    );

    // Determine who cancelled
    const cancelledByName = req.user._id.equals(appointment.customerId._id)
      ? "Customer"
      : "Business Admin";

    // Send cancellation email to CUSTOMER
    try {
      await sendCancellationEmail(appointment.customerId.email, {
        customerName: appointment.customerId.name,
        businessName: appointment.businessId.name,
        serviceName: appointment.serviceId.name,
        date: formattedDate,
        time: appointment.startTime,
      });
    } catch (emailError) {
      console.error("Customer cancellation email failed:", emailError);
    }

    // Send cancellation email to PROVIDER/BUSINESS
    try {
      if (appointment.businessId.contactEmail) {
        await sendProviderCancellationEmail(
          appointment.businessId.contactEmail,
          {
            customerName: appointment.customerId.name,
            customerEmail: appointment.customerId.email,
            businessName: appointment.businessId.name,
            serviceName: appointment.serviceId.name,
            date: formattedDate,
            time: appointment.startTime,
            staffName: appointment.staffId?.name || "",
            bookingId: appointment._id.toString(),
            cancellationReason: cancellationReason || "",
            cancelledBy: cancelledByName,
          }
        );
      }
    } catch (emailError) {
      console.error("Provider cancellation email failed:", emailError);
    }

    // Create notifications
    await Notification.create({
      userId: appointment.customerId._id,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Your appointment on ${format(
        new Date(appointment.appointmentDate),
        "MMM d"
      )} at ${appointment.startTime} has been cancelled.`,
      appointmentId: appointment._id,
    });

    await Notification.create({
      userId: appointment.staffId._id,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Appointment with ${appointment.customerId.name} on ${format(
        new Date(appointment.appointmentDate),
        "MMM d"
      )} at ${appointment.startTime} has been cancelled.`,
      appointmentId: appointment._id,
    });

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/:id/reschedule
 * @desc    Reschedule appointment
 * @access  Private (Customer or Admin)
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newStartTime, newStaffId } = req.body;

    if (!newDate || !newStartTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide new date and time",
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate("businessId", "name bookingSettings")
      .populate("customerId", "name email")
      .populate("serviceId", "name duration")
      .populate("staffId", "name");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify access
    const isCustomer =
      appointment.customerId._id.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" &&
      req.user.businessId?.toString() === appointment.businessId._id.toString();

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if can reschedule
    if (appointment.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled appointments can be rescheduled",
      });
    }

    // Check reschedule window
    if (isCustomer && !isAdmin) {
      const aptDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.startTime.split(":").map(Number);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);

      if (
        hoursUntilAppointment <
        appointment.businessId.bookingSettings.rescheduleWindow
      ) {
        return res.status(400).json({
          success: false,
          message: `Appointments must be rescheduled at least ${appointment.businessId.bookingSettings.rescheduleWindow} hours in advance`,
        });
      }
    }

    // Check reschedule count limit
    if (
      appointment.rescheduleCount >=
      appointment.businessId.bookingSettings.maxReschedulesPerAppointment
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum reschedule limit (${appointment.businessId.bookingSettings.maxReschedulesPerAppointment}) reached`,
      });
    }

    // Use new staff or keep existing
    const targetStaffId = newStaffId || appointment.staffId._id;

    // Calculate end time
    const startMinutes = timeToMinutes(newStartTime);
    const endMinutes = startMinutes + appointment.serviceId.duration;
    const newEndTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // STRICT SLOT VALIDATION: Ensure the new slot is a valid system-generated slot
    const slotValidation = await validateSlotExists(
      appointment.businessId._id,
      appointment.serviceId._id,
      new Date(newDate),
      newStartTime
    );
    if (!slotValidation.valid) {
      return res.status(400).json({
        success: false,
        message: slotValidation.error,
      });
    }

    // Check if new slot is available with specific staff
    const available = await isSlotAvailable(
      appointment.businessId._id,
      targetStaffId,
      new Date(newDate),
      newStartTime,
      appointment.serviceId.duration
    );

    if (!available) {
      return res.status(400).json({
        success: false,
        message: "New time slot is not available",
      });
    }

    // Save old details for email
    const oldDate = format(
      new Date(appointment.appointmentDate),
      "EEEE, MMMM d, yyyy"
    );
    const oldTime = appointment.startTime;

    // Mark old appointment as rescheduled
    appointment.status = "rescheduled";
    appointment.rescheduledAt = new Date();

    // Create new appointment
    const newAppointment = await Appointment.create({
      businessId: appointment.businessId._id,
      customerId: appointment.customerId._id,
      serviceId: appointment.serviceId._id,
      staffId: targetStaffId,
      appointmentDate: new Date(newDate),
      startTime: newStartTime,
      endTime: newEndTime,
      notes: appointment.notes,
      status: "scheduled",
      isRescheduled: true,
      rescheduledFrom: appointment._id,
      rescheduleCount: appointment.rescheduleCount + 1,
      createdBy: "customer",
    });

    // Link appointments
    appointment.rescheduledTo = newAppointment._id;
    await appointment.save();

    // Send reschedule email
    const newStaff = await User.findById(targetStaffId);
    try {
      await sendRescheduleEmail(appointment.customerId.email, {
        customerName: appointment.customerId.name,
        businessName: appointment.businessId.name,
        serviceName: appointment.serviceId.name,
        oldDate,
        oldTime,
        newDate: format(new Date(newDate), "EEEE, MMMM d, yyyy"),
        newTime: newStartTime,
        staffName: newStaff.name,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // Create notifications
    await Notification.create({
      userId: appointment.customerId._id,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled to ${format(
        new Date(newDate),
        "MMM d"
      )} at ${newStartTime}.`,
      appointmentId: newAppointment._id,
    });

    await Notification.create({
      userId: targetStaffId,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Appointment with ${
        appointment.customerId.name
      } has been rescheduled to ${format(
        new Date(newDate),
        "MMM d"
      )} at ${newStartTime}.`,
      appointmentId: newAppointment._id,
    });

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("businessId", "name logo")
      .populate("customerId", "name email phone")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name email profilePicture");

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available time slots with status (available, booked, past)
 * @access  Private (requires authentication to view slots)
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { businessId, serviceId, date, staffId } = req.query;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide businessId, serviceId, and date",
      });
    }

    const result = await calculateAvailableSlots(
      businessId,
      serviceId,
      date,
      staffId
    );

    // Handle special cases
    if (result.isHoliday) {
      return res.json({
        success: true,
        date,
        isHoliday: true,
        message: "Business is closed on this date",
        slots: [],
      });
    }

    if (result.isClosed) {
      return res.json({
        success: true,
        date,
        isClosed: true,
        message: "Business is closed on this day",
        slots: [],
      });
    }

    res.json({
      success: true,
      date,
      serviceDuration: result.serviceDuration,
      count: result.slots.length,
      availableCount: result.slots.filter((s) => s.status === "available")
        .length,
      slots: result.slots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private (Staff or Admin)
 */
const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify access
    const isStaff =
      appointment.staffId &&
      req.user._id.toString() === appointment.staffId.toString();
    const isAdmin =
      req.user.role === "admin" &&
      req.user.businessId?.toString() === appointment.businessId.toString();

    if (!isStaff && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate state transition
    const transition = validateStateTransition(
      appointment.status,
      APPOINTMENT_STATUS.COMPLETED
    );
    if (!transition.valid) {
      return res.status(400).json({
        success: false,
        message: transition.error,
      });
    }

    appointment.status = APPOINTMENT_STATUS.COMPLETED;
    appointment.completedAt = new Date();
    appointment.completedBy = isAdmin ? "admin" : "staff";

    // Add audit log entry
    appointment.actionLog.push({
      action: "completed",
      performedBy: isAdmin ? "admin" : "staff",
      performedAt: new Date(),
    });

    await appointment.save();

    // Create notification
    await Notification.create({
      userId: appointment.customerId,
      type: "appointment_completed",
      title: "Appointment Completed",
      message: "Thank you for your visit!",
      appointmentId: appointment._id,
    });

    res.json({
      success: true,
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/:id/no-show
 * @desc    Mark appointment as no-show
 * @access  Private (Admin only)
 */
const markNoShow = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify admin access
    if (
      req.user.role !== "admin" ||
      req.user.businessId?.toString() !== appointment.businessId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only business admin can mark no-show",
      });
    }

    // Validate state transition
    const transition = validateStateTransition(
      appointment.status,
      APPOINTMENT_STATUS.NO_SHOW
    );
    if (!transition.valid) {
      return res.status(400).json({
        success: false,
        message: transition.error,
      });
    }

    // Validate no-show can only be marked after appointment end time
    const aptDateTime = new Date(appointment.appointmentDate);
    const [endHours, endMinutes] = (appointment.endTime || "23:59")
      .split(":")
      .map(Number);
    aptDateTime.setHours(endHours, endMinutes, 0, 0);

    if (new Date() < aptDateTime) {
      return res.status(400).json({
        success: false,
        message: "No-show can only be marked after the appointment end time",
      });
    }

    appointment.status = APPOINTMENT_STATUS.NO_SHOW;

    // Add audit log entry
    appointment.actionLog.push({
      action: "no-show",
      performedBy: "admin",
      performedAt: new Date(),
    });

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment marked as no-show",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/walk-in
 * @desc    Create walk-in appointment (Admin only)
 * @access  Private (Admin)
 */
const createWalkInAppointment = async (req, res, next) => {
  try {
    const { serviceId, staffId, walkInNotes } = req.body;
    let businessId = req.user.businessId;
    if (typeof businessId === "object" && businessId?._id) {
      businessId = businessId._id;
    }

    if (!businessId || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Please provide service ID",
      });
    }

    // Verify service exists
    const service = await Service.findOne({
      _id: serviceId,
      businessId,
      isActive: true,
    });
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found or inactive" });
    }

    // Get current time details
    const now = new Date();
    // Use server time as "appointmentDate" (face value)
    const appointmentDate = new Date(now);
    appointmentDate.setHours(0, 0, 0, 0);

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const startTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    // Calculate end time
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + service.duration;

    // Simple minutes to HH:MM helper
    const toTimeStr = (totalMins) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}`;
    };

    const endTime = toTimeStr(endTotalMinutes);

    // Create completed appointment
    const appointment = await Appointment.create({
      businessId,
      customerId: null, // Walk-ins have no customer account
      serviceId,
      staffId: staffId || undefined,
      appointmentDate,
      startTime,
      endTime,
      status: APPOINTMENT_STATUS.COMPLETED,
      completedAt: now,
      completedBy: "admin",
      isWalkIn: true,
      walkInNotes,
      createdBy: "admin",
      // Add fake action log
      actionLog: [
        {
          action: "created",
          performedBy: "admin",
          performedAt: now,
          reason: "Walk-In Appointment",
        },
        {
          action: "completed",
          performedBy: "admin",
          performedAt: now,
          reason: "Walk-In Instant Completion",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Walk-in added successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { createAppointment, getAppointments, getAppointmentById, cancelAppointment, rescheduleAppointment, getAvailableSlots, completeAppointment, markNoShow, createWalkInAppointment };
