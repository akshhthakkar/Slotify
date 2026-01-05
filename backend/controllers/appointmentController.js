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
  sendProviderBookingNotificationEmail,
  sendProviderCancellationEmail,
  sendCustomerBookingConfirmationEmail,
  sendRescheduleEmail,
  sendProviderRescheduleEmail,
  sendCancellationEmail,
} = require("../utils/emailService");
const { format } = require("date-fns");
const { getNowInBusinessTZ } = require("../utils/timeUtils");
const {
  createSlotError,
  getErrorCodeFromStatus,
} = require("../utils/slotErrors");

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
        errorCode: slotValidation.errorCode || "SLOT_VALIDATION_FAILED",
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
        errorCode: "SLOT_BOOKED",
        message: "This time slot is no longer available",
      });
    }

    // Calculate blockedUntil (endTime + bufferTime)
    const bufferMinutes = service.bufferTime || 0;
    const [endHours, endM] = endTime.split(":").map(Number);
    const blockedUntilDate = new Date(aptDateFaceValue);
    blockedUntilDate.setHours(endHours, endM + bufferMinutes, 0, 0);

    // Create appointment
    const appointment = await Appointment.create({
      businessId,
      customerId: req.user._id,
      serviceId,
      staffId: finalStaffId,
      appointmentDate: aptDateFaceValue,
      startTime,
      endTime,
      blockedUntil: blockedUntilDate,
      notes,
      status: business.bookingSettings.requiresCustomerApproval
        ? "pending"
        : APPOINTMENT_STATUS.SCHEDULED,
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
      .populate(
        "businessId",
        "name logo contactEmail contactPhone bookingSettings"
      )
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
      .populate(
        "businessId",
        "name logo contactEmail contactPhone address bookingSettings"
      )
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
    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
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

      const now = getNowInBusinessTZ(appointment.businessId.timeZone);
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
 * @desc    Reschedule appointment (update in-place, NOT create new)
 * @access  Private (Customer or Admin)
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newStartTime, newStaffId } = req.body;

    // 1. Basic input validation
    if (!newDate || !newStartTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide new date and time",
      });
    }

    // 2. Fetch appointment with all necessary data
    const appointment = await Appointment.findById(req.params.id)
      .populate("businessId", "name bookingSettings contactEmail")
      .populate("customerId", "name email")
      .populate("serviceId", "name duration price")
      .populate("staffId", "name");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // 3. Walk-in check (MOVED UP) - walk-ins cannot be rescheduled via this API
    if (appointment.isWalkIn) {
      return res.status(400).json({
        success: false,
        message: "Walk-in appointments cannot be rescheduled",
      });
    }

    // 4. Verify access (ownership & role check)
    // Safe to access customerId now as it's not a walk-in
    if (!appointment.customerId) {
      console.error("Reschedule Error: Appointment has no customerId");
      return res.status(500).json({
        success: false,
        message: "Data integrity error: No customer attached",
      });
    }

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

    // 4c. Reschedule count limit
    const maxReschedules =
      appointment.businessId.bookingSettings?.maxReschedulesPerAppointment || 2;
    if (appointment.rescheduleCount >= maxReschedules) {
      return res.status(400).json({
        success: false,
        message: `Maximum reschedule limit (${maxReschedules}) reached`,
      });
    }

    // 5. Time-based validation
    const aptDateTime = new Date(appointment.appointmentDate);
    const [aptHours, aptMinutes] = appointment.startTime.split(":").map(Number);
    aptDateTime.setHours(aptHours, aptMinutes, 0, 0);

    const now = getNowInBusinessTZ(appointment.businessId.timeZone);

    // 5a. Cannot reschedule past appointments
    if (aptDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule past or ongoing appointments",
      });
    }

    // 5b. Reschedule window check (only for customers, admins can override)
    if (isCustomer && !isAdmin) {
      const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);
      const rescheduleWindow =
        appointment.businessId.bookingSettings?.rescheduleWindow || 1;

      if (hoursUntilAppointment < rescheduleWindow) {
        return res.status(400).json({
          success: false,
          errorCode: "RESCHEDULE_WINDOW_VIOLATION",
          message: `Appointments must be rescheduled at least ${rescheduleWindow} hours in advance`,
        });
      }
    }

    // 6. Determine target staff
    // 6. Determine target staff (Safe fallback: New -> Original -> Assigned by Slot)
    const targetStaffId =
      newStaffId ?? appointment.staffId?._id ?? slotValidation.staffId;

    // 7. SLOT VALIDATION (CRITICAL)
    // 7a. Validate the slot exists and is a valid system-generated slot
    const slotValidation = await validateSlotExists(
      appointment.businessId._id,
      appointment.serviceId._id,
      new Date(newDate),
      newStartTime
    );

    if (!slotValidation.valid) {
      return res.status(400).json({
        success: false,
        errorCode: slotValidation.errorCode || "SLOT_VALIDATION_FAILED",
        message: slotValidation.error || "Invalid time slot",
      });
    }

    // 7b. Check if slot is available (Buffer-Aware Check)
    const isAvailable = await isSlotAvailable(
      appointment.businessId._id,
      targetStaffId,
      new Date(newDate),
      newStartTime,
      appointment.serviceId.duration
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        errorCode: "SLOT_BOOKED",
        message: "This time slot is no longer available",
      });
    }

    // Calculate new blockedUntil
    const serviceDuration = appointment.serviceId.duration;
    const bufferTime = appointment.serviceId.bufferTime || 0;
    const [startH, startM] = newStartTime.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = startTotal + serviceDuration;

    // safe calculation for endTime string
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const newEndTime = `${String(endH).padStart(2, "0")}:${String(
      endM
    ).padStart(2, "0")}`;

    // valid blockedUntil date
    const blockedUntilDate = new Date(newDate);
    blockedUntilDate.setHours(Math.floor((endTotal + bufferTime) / 60));
    blockedUntilDate.setMinutes((endTotal + bufferTime) % 60);

    // 9. Save old details for email and audit
    const oldDate = format(
      new Date(appointment.appointmentDate),
      "EEEE, MMMM d, yyyy"
    );
    const oldTime = appointment.startTime;
    const oldStaffId = appointment.staffId._id;

    // 10. ATOMIC UPDATE - Update the same appointment document
    appointment.appointmentDate = new Date(newDate);
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.blockedUntil = blockedUntilDate;
    appointment.staffId = targetStaffId;
    appointment.rescheduleCount += 1;
    appointment.rescheduledAt = new Date();
    appointment.rescheduledBy = isAdmin ? "admin" : "customer";
    appointment.isRescheduled = true;

    // Reset reminder flags since date/time changed
    appointment.reminderSent = {
      day: false,
      hours: false,
    };

    // Add audit log entry
    appointment.actionLog.push({
      action: "rescheduled",
      performedBy: isAdmin ? "admin" : "customer",
      performedAt: new Date(),
      metadata: {
        oldDate: oldDate,
        oldTime: oldTime,
        newDate: format(new Date(newDate), "EEEE, MMMM d, yyyy"),
        newTime: newStartTime,
        oldStaffId: oldStaffId.toString(),
        newStaffId: targetStaffId.toString(),
      },
    });

    // Prepare email details BEFORE saving (to avoid potential depopulation)
    const emailDetails = {
      customerEmail: appointment.customerId?.email,
      customerName: appointment.customerId?.name,
      businessName: appointment.businessId?.name,
      contactEmail: appointment.businessId?.contactEmail,
      serviceName: appointment.serviceId?.name,
      location:
        appointment.businessId?.address?.fullAddress || "Business Location",
    };

    // FALLBACK: If customer email missing from population but requester IS the customer, use their current profile
    if (!emailDetails.customerEmail && isCustomer && req.user?.email) {
      console.log("Reschedule Email: Fallback to req.user email details");
      emailDetails.customerEmail = req.user.email;
      emailDetails.customerName = req.user.name;
    }

    await appointment.save();

    // 11. Send notifications
    // Get staff name for email
    const targetStaff = await Staff.findById(targetStaffId);
    const staffName = targetStaff?.name || "Staff";

    // Send email to customer
    let emailStatus = "not_attempted";

    if (emailDetails.customerEmail) {
      try {
        console.log(
          `Attempting to send reschedule email to: ${emailDetails.customerEmail}`
        );
        await sendRescheduleEmail(emailDetails.customerEmail, {
          customerName: emailDetails.customerName,
          businessName: emailDetails.businessName,
          serviceName: emailDetails.serviceName,
          oldDate,
          oldTime,
          newDate: format(new Date(newDate), "EEEE, MMMM d, yyyy"),
          newTime: newStartTime,
          staffName,
          location: emailDetails.location,
        });
        emailStatus = "sent";
        console.log("Reschedule email sent successfully");
      } catch (emailError) {
        console.error("Customer reschedule email failed:", emailError);
        emailStatus = "failed: " + emailError.message;
      }
    } else {
      console.warn(
        "Reschedule Email Skipped: No customer email found in details",
        emailDetails
      );
      emailStatus = "skipped_no_email";
    }

    // Send email to business/provider
    try {
      if (emailDetails.contactEmail) {
        await sendProviderRescheduleEmail(emailDetails.contactEmail, {
          customerName: emailDetails.customerName,
          customerEmail: emailDetails.customerEmail,
          businessName: emailDetails.businessName,
          serviceName: emailDetails.serviceName,
          oldDate,
          oldTime,
          newDate: format(new Date(newDate), "EEEE, MMMM d, yyyy"),
          newTime: newStartTime,
          staffName,
          bookingId: appointment._id.toString(),
          rescheduledBy: isAdmin ? "Business Admin" : "Customer",
        });
      }
    } catch (emailError) {
      console.error("Provider reschedule email failed:", emailError);
    }

    // Create in-app notifications
    // Use robust ID access in case appointment was depopulated by save()
    const customerId = appointment.customerId?._id || appointment.customerId;

    await Notification.create({
      userId: customerId,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled to ${format(
        new Date(newDate),
        "MMM d"
      )} at ${newStartTime}.`,
      appointmentId: appointment._id,
    });

    if (targetStaffId) {
      await Notification.create({
        userId: targetStaffId,
        type: "appointment_rescheduled",
        title: "Appointment Rescheduled",
        message: `Appointment with ${
          emailDetails.customerName || "Customer"
        } has been rescheduled to ${format(
          new Date(newDate),
          "MMM d"
        )} at ${newStartTime}.`,
        appointmentId: appointment._id,
      });
    }

    // 12. Return updated appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("businessId", "name logo bookingSettings")
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
    // Validate no-show can only be marked after appointment end time + buffer
    const now = getNowInBusinessTZ(appointment.businessId.timeZone);

    // Use blockedUntil if available, otherwise calculate from endTime + buffer (if any)
    let blockedUntil = appointment.blockedUntil;
    if (!blockedUntil) {
      const aptDate = new Date(appointment.appointmentDate);
      const [endHours, endMinutes] = (appointment.endTime || "23:59")
        .split(":")
        .map(Number);
      const bufferMins = appointment.serviceId.bufferTime || 0;
      blockedUntil = new Date(aptDate);
      blockedUntil.setHours(endHours, endMinutes + bufferMins, 0, 0);
    }

    if (now < blockedUntil) {
      return res.status(400).json({
        success: false,
        message:
          "No-show can only be marked after the appointment (plus buffer) has ended",
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
    // Get current time details in Business Timezone
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    const now = getNowInBusinessTZ(business.timeZone);
    const appointmentDate = new Date(now);
    appointmentDate.setHours(0, 0, 0, 0);

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const startTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    // Calculate end time and blockedUntil
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + service.duration;
    const bufferMins = service.bufferTime || 0;

    // Simple minutes to HH:MM helper
    const toTimeStr = (totalMins) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}`;
    };

    const endTime = toTimeStr(endTotalMinutes);

    // Calculate blockedUntil
    const blockedUntilDate = new Date(appointmentDate);
    blockedUntilDate.setHours(Math.floor((endTotalMinutes + bufferMins) / 60));
    blockedUntilDate.setMinutes((endTotalMinutes + bufferMins) % 60);

    // Create completed appointment
    const appointment = await Appointment.create({
      businessId,
      customerId: null, // Walk-ins have no customer account
      serviceId,
      staffId: staffId || undefined,
      appointmentDate,
      startTime,
      endTime,
      blockedUntil: blockedUntilDate,
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
module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  completeAppointment,
  markNoShow,
  createWalkInAppointment,
};
