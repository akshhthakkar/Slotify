const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Business = require('../models/Business');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateAvailableSlots, isSlotAvailable, timeToMinutes } = require('../utils/availabilityCalculator');
const { sendAppointmentConfirmation, sendCancellationEmail, sendRescheduleEmail } = require('../utils/emailService');
const { format } = require('date-fns');

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
      notes
    } = req.body;

    // Validate required fields
    if (!businessId || !serviceId || !staffId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get business details
    const business = await Business.findById(businessId);
    if (!business || !business.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or inactive'
      });
    }

    // Get service details
    const service = await Service.findOne({ _id: serviceId, businessId, isActive: true });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Verify staff can provide this service
    if (!service.staffIds.includes(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Selected staff member cannot provide this service'
      });
    }

    // Verify staff exists and is active
    const staffMember = await User.findOne({
      _id: staffId,
      businessId,
      role: 'staff',
      isActive: true
    });
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found or inactive'
      });
    }

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + service.duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check if date is in the past
    const aptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (aptDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments in the past'
      });
    }

    // Check minimum advance time
    const now = new Date();
    const aptDateTime = new Date(aptDate);
    const [hours, minutes] = startTime.split(':').map(Number);
    aptDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);
    if (hoursUntilAppointment < business.bookingSettings.minAdvanceTime) {
      return res.status(400).json({
        success: false,
        message: `Appointments must be booked at least ${business.bookingSettings.minAdvanceTime} hours in advance`
      });
    }

    // Check maximum advance time
    const daysUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60 * 24);
    if (daysUntilAppointment > business.bookingSettings.maxAdvanceTime) {
      return res.status(400).json({
        success: false,
        message: `Appointments can only be booked up to ${business.bookingSettings.maxAdvanceTime} days in advance`
      });
    }

    // Check if date is a holiday
    const isHoliday = business.holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === aptDate.toDateString();
    });

    if (isHoliday) {
      return res.status(400).json({
        success: false,
        message: 'Business is closed on this date'
      });
    }

    // Check if slot is available
    const available = await isSlotAvailable(businessId, staffId, aptDate, startTime, service.duration);
    if (!available) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is no longer available'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      businessId,
      customerId: req.user._id,
      serviceId,
      staffId,
      appointmentDate: aptDate,
      startTime,
      endTime,
      notes,
      status: business.bookingSettings.requiresCustomerApproval ? 'pending' : 'scheduled',
      createdBy: 'customer'
    });

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('businessId', 'name logo contactEmail contactPhone')
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name email profilePicture');

    // Send confirmation email
    try {
      await sendAppointmentConfirmation(req.user.email, {
        customerName: req.user.name,
        businessName: business.name,
        serviceName: service.name,
        date: format(new Date(aptDate), 'EEEE, MMMM d, yyyy'),
        time: startTime,
        staffName: staffMember.name
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Create notification for customer
    await Notification.create({
      userId: req.user._id,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment with ${business.name} on ${format(new Date(aptDate), 'MMM d')} at ${startTime} has been confirmed.`,
      appointmentId: appointment._id
    });

    // Create notification for staff
    await Notification.create({
      userId: staffId,
      type: 'appointment_confirmed',
      title: 'New Appointment',
      message: `New appointment with ${req.user.name} on ${format(new Date(aptDate), 'MMM d')} at ${startTime}.`,
      appointmentId: appointment._id
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: populatedAppointment
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
    const { businessId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'staff') {
      query.staffId = req.user._id;
      if (businessId) query.businessId = businessId;
    } else if (req.user.role === 'admin') {
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'businessId is required for admin'
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
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('businessId', 'name logo contactEmail contactPhone')
      .populate('customerId', 'name email phone profilePicture')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name email profilePicture')
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
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
      .populate('businessId', 'name logo contactEmail contactPhone address')
      .populate('customerId', 'name email phone profilePicture')
      .populate('serviceId', 'name description duration price')
      .populate('staffId', 'name email phone profilePicture')
      .populate('cancelledBy', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify access
    const hasAccess = 
      appointment.customerId._id.toString() === req.user._id.toString() ||
      appointment.staffId._id.toString() === req.user._id.toString() ||
      (req.user.role === 'admin' && req.user.businessId?.toString() === appointment.businessId._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      appointment
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
      .populate('businessId', 'name bookingSettings')
      .populate('customerId', 'name email')
      .populate('serviceId', 'name')
      .populate('staffId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify access
    const isCustomer = appointment.customerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' && req.user.businessId?.toString() === appointment.businessId._id.toString();

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Check if already completed
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    // Check cancellation window (only for customers)
    if (isCustomer && !isAdmin) {
      const aptDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < appointment.businessId.bookingSettings.cancellationWindow) {
        return res.status(400).json({
          success: false,
          message: `Appointments must be cancelled at least ${appointment.businessId.bookingSettings.cancellationWindow} hours in advance`
        });
      }
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user._id;
    await appointment.save();

    // Send cancellation email
    try {
      await sendCancellationEmail(appointment.customerId.email, {
        customerName: appointment.customerId.name,
        businessName: appointment.businessId.name,
        serviceName: appointment.serviceId.name,
        date: format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy'),
        time: appointment.startTime
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Create notifications
    await Notification.create({
      userId: appointment.customerId._id,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment on ${format(new Date(appointment.appointmentDate), 'MMM d')} at ${appointment.startTime} has been cancelled.`,
      appointmentId: appointment._id
    });

    await Notification.create({
      userId: appointment.staffId._id,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Appointment with ${appointment.customerId.name} on ${format(new Date(appointment.appointmentDate), 'MMM d')} at ${appointment.startTime} has been cancelled.`,
      appointmentId: appointment._id
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
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
        message: 'Please provide new date and time'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId', 'name bookingSettings')
      .populate('customerId', 'name email')
      .populate('serviceId', 'name duration')
      .populate('staffId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify access
    const isCustomer = appointment.customerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' && req.user.businessId?.toString() === appointment.businessId._id.toString();

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if can reschedule
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be rescheduled'
      });
    }

    // Check reschedule window
    if (isCustomer && !isAdmin) {
      const aptDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const hoursUntilAppointment = (aptDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < appointment.businessId.bookingSettings.rescheduleWindow) {
        return res.status(400).json({
          success: false,
          message: `Appointments must be rescheduled at least ${appointment.businessId.bookingSettings.rescheduleWindow} hours in advance`
        });
      }
    }

    // Check reschedule count limit
    if (appointment.rescheduleCount >= appointment.businessId.bookingSettings.maxReschedulesPerAppointment) {
      return res.status(400).json({
        success: false,
        message: `Maximum reschedule limit (${appointment.businessId.bookingSettings.maxReschedulesPerAppointment}) reached`
      });
    }

    // Use new staff or keep existing
    const targetStaffId = newStaffId || appointment.staffId._id;

    // Calculate end time
    const startMinutes = timeToMinutes(newStartTime);
    const endMinutes = startMinutes + appointment.serviceId.duration;
    const newEndTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check if new slot is available
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
        message: 'New time slot is not available'
      });
    }

    // Save old details for email
    const oldDate = format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy');
    const oldTime = appointment.startTime;

    // Mark old appointment as rescheduled
    appointment.status = 'rescheduled';
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
      status: 'scheduled',
      isRescheduled: true,
      rescheduledFrom: appointment._id,
      rescheduleCount: appointment.rescheduleCount + 1,
      createdBy: 'customer'
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
        newDate: format(new Date(newDate), 'EEEE, MMMM d, yyyy'),
        newTime: newStartTime,
        staffName: newStaff.name
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Create notifications
    await Notification.create({
      userId: appointment.customerId._id,
      type: 'appointment_rescheduled',
      title: 'Appointment Rescheduled',
      message: `Your appointment has been rescheduled to ${format(new Date(newDate), 'MMM d')} at ${newStartTime}.`,
      appointmentId: newAppointment._id
    });

    await Notification.create({
      userId: targetStaffId,
      type: 'appointment_rescheduled',
      title: 'Appointment Rescheduled',
      message: `Appointment with ${appointment.customerId.name} has been rescheduled to ${format(new Date(newDate), 'MMM d')} at ${newStartTime}.`,
      appointmentId: newAppointment._id
    });

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('businessId', 'name logo')
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available time slots
 * @access  Public
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { businessId, serviceId, date, staffId } = req.query;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId, serviceId, and date'
      });
    }

    const slots = await calculateAvailableSlots(businessId, serviceId, date, staffId);

    res.json({
      success: true,
      date,
      count: slots.length,
      slots
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
        message: 'Appointment not found'
      });
    }

    // Verify access
    const isStaff = appointment.staffId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' && req.user.businessId?.toString() === appointment.businessId.toString();

    if (!isStaff && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be marked as completed'
      });
    }

    appointment.status = 'completed';
    await appointment.save();

    // Create notification
    await Notification.create({
      userId: appointment.customerId,
      type: 'appointment_completed',
      title: 'Appointment Completed',
      message: 'Thank you for your visit!',
      appointmentId: appointment._id
    });

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      appointment
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
        message: 'Appointment not found'
      });
    }

    // Verify admin access
    if (req.user.role !== 'admin' || req.user.businessId?.toString() !== appointment.businessId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only business admin can mark no-show'
      });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be marked as no-show'
      });
    }

    appointment.status = 'no-show';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment marked as no-show',
      appointment
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
  markNoShow
};