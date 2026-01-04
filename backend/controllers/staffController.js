const Staff = require("../models/Staff");
const User = require("../models/User");
const Business = require("../models/Business");
const Appointment = require("../models/Appointment");
const { generateRandomToken } = require("../utils/tokenService");
const { sendVerificationEmail } = require("../utils/emailService");
const { isValidEmail, isValidBusinessHours } = require("../utils/validators");

/**
 * @route   POST /api/staff
 * @desc    Add staff member (simplified - no user account required)
 * @access  Private (Admin only)
 */
const addStaff = async (req, res, next) => {
  try {
    const { name, phone, specialization, serviceIds } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Please provide staff name",
      });
    }

    // Get admin's business
    const business = await Business.findOne({ adminId: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Create staff record directly
    const staff = await Staff.create({
      name,
      phone: phone || "",
      businessId: business._id,
      specialization: specialization || "",
      serviceIds: serviceIds || [],
      workingHours: business.workingHours, // Default to business hours
    });

    const populatedStaff = await Staff.findById(staff._id).populate(
      "serviceIds",
      "name duration price"
    );

    res.status(201).json({
      success: true,
      message: "Staff member added successfully",
      staff: populatedStaff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/staff
 * @desc    Get all staff members
 * @access  Private (Admin/Staff of business)
 */
const getStaffMembers = async (req, res, next) => {
  try {
    let { businessId, isActive } = req.query;

    // If no businessId provided, auto-detect from user
    if (!businessId) {
      if (req.user.businessId) {
        businessId = req.user.businessId.toString();
      } else if (req.user.role === "admin") {
        // For admin users, find their business
        const adminBusiness = await Business.findOne({ adminId: req.user._id });
        if (adminBusiness) {
          businessId = adminBusiness._id.toString();
        }
      }
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "No business found for this user",
      });
    }

    const query = { businessId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const staffMembers = await Staff.find(query)
      .populate("userId", "name email phone profilePicture emailVerified")
      .populate("serviceIds", "name duration price")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: staffMembers.length,
      staff: staffMembers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/staff/:id
 * @desc    Get staff member by ID
 * @access  Private (Admin/Staff of business)
 */
const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate("userId", "name email phone profilePicture")
      .populate("serviceIds", "name duration price")
      .populate("businessId", "name logo");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify access
    if (req.user.businessId?.toString() !== staff.businessId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/staff/:id
 * @desc    Update staff details
 * @access  Private (Admin only)
 */
const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, specialization, serviceIds } = req.body;

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify admin ownership
    const business = await Business.findById(staff.businessId);
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only business admin can update staff",
      });
    }

    // Update fields
    if (name !== undefined) staff.name = name;
    if (phone !== undefined) staff.phone = phone;
    if (specialization !== undefined) staff.specialization = specialization;
    if (serviceIds) staff.serviceIds = serviceIds;

    await staff.save();

    const updatedStaff = await Staff.findById(staff._id).populate(
      "serviceIds",
      "name duration price"
    );

    res.json({
      success: true,
      message: "Staff updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/staff/:id/availability
 * @desc    Update staff availability
 * @access  Private (Staff owner or Admin)
 */
const updateStaffAvailability = async (req, res, next) => {
  try {
    const { workingHours, unavailableDates } = req.body;

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify access (staff can update their own, admin can update any)
    const isOwnProfile = staff.userId.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" &&
      req.user.businessId?.toString() === staff.businessId.toString();

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate working hours if provided
    if (workingHours) {
      const validation = isValidBusinessHours(workingHours);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      staff.workingHours = workingHours;
    }

    if (unavailableDates) {
      staff.unavailableDates = unavailableDates;
    }

    await staff.save();

    res.json({
      success: true,
      message: "Availability updated successfully",
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/staff/:id/services
 * @desc    Assign services to staff
 * @access  Private (Admin only)
 */
const assignServices = async (req, res, next) => {
  try {
    const { serviceIds } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of service IDs",
      });
    }

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify admin ownership
    const business = await Business.findById(staff.businessId);
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only business admin can assign services",
      });
    }

    staff.serviceIds = serviceIds;
    await staff.save();

    const updatedStaff = await Staff.findById(staff._id).populate(
      "serviceIds",
      "name duration price"
    );

    res.json({
      success: true,
      message: "Services assigned successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/staff/:id
 * @desc    Remove staff member (soft delete)
 * @access  Private (Admin only)
 */
const removeStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify admin ownership
    const business = await Business.findById(staff.businessId);
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only business admin can remove staff",
      });
    }

    // Check for upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({
      staffId: staff.userId,
      appointmentDate: { $gte: new Date() },
      status: "scheduled",
    });

    if (upcomingAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove staff member with ${upcomingAppointments} upcoming appointments. Please reassign or cancel appointments first.`,
      });
    }

    // Soft delete
    staff.isActive = false;
    await staff.save();

    // Update user role back to customer
    await User.findByIdAndUpdate(staff.userId, {
      role: "customer",
      businessId: null,
    });

    res.json({
      success: true,
      message: "Staff member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/staff/:id/schedule
 * @desc    Get staff schedule with appointments
 * @access  Private (Staff owner or Admin)
 */
const getStaffSchedule = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Verify access
    const isOwnProfile = staff.userId.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" &&
      req.user.businessId?.toString() === staff.businessId.toString();

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Build query for appointments
    const query = {
      staffId: staff.userId,
      status: { $in: ["scheduled", "completed"] },
    };

    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to current week
      const today = new Date();
      const weekStart = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const weekEnd = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );
      query.appointmentDate = { $gte: weekStart, $lte: weekEnd };
    }

    const appointments = await Appointment.find(query)
      .populate("customerId", "name email phone profilePicture")
      .populate("serviceId", "name duration")
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({
      success: true,
      staff: {
        _id: staff._id,
        workingHours: staff.workingHours,
        unavailableDates: staff.unavailableDates,
      },
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/staff/public/:businessId
 * @desc    Get staff members for public booking
 * @access  Public (for customer booking)
 */
const getPublicStaffForBooking = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { serviceId } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    // Query: active staff for this business
    const query = { businessId, isActive: true };

    // If serviceId provided, filter by staff who can provide this service
    const staffMembers = await Staff.find(query)
      .select("name specialization serviceIds")
      .populate("serviceIds", "_id")
      .sort({ name: 1 });

    // If serviceId filter, only return staff assigned to that service
    let filteredStaff = staffMembers;
    if (serviceId) {
      filteredStaff = staffMembers.filter((s) =>
        s.serviceIds?.some((svc) => svc._id.toString() === serviceId)
      );
    }

    res.json({
      success: true,
      count: filteredStaff.length,
      staff: filteredStaff,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  updateStaffAvailability,
  assignServices,
  removeStaff,
  getStaffSchedule,
  getPublicStaffForBooking,
};
