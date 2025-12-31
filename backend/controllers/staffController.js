const Staff = require("../models/Staff");
const User = require("../models/User");
const Business = require("../models/Business");
const Appointment = require("../models/Appointment");
const { generateRandomToken } = require("../utils/tokenService");
const { sendVerificationEmail } = require("../utils/emailService");
const { isValidEmail, isValidBusinessHours } = require("../utils/validators");

/**
 * @route   POST /api/staff
 * @desc    Add staff member (invite)
 * @access  Private (Admin only)
 */
const addStaff = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      countryCode,
      specialization,
      serviceIds,
      workingHours,
      password, // Accept password
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and email",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
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

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Check if already a staff member of this business
      if (user.businessId?.toString() === business._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "This user is already a staff member of your business",
        });
      }

      // Check if user is admin of another business
      if (user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "This user is already an admin of another business",
        });
      }

      // Update existing customer to staff
      if (user.role === "customer") {
        user.role = "staff";
        user.businessId = business._id;
        // Verify email if it wasn't already? Maybe not, safety first.
        await user.save();
      }
    } else {
      // Create new user account
      const verificationToken = generateRandomToken();
      const verificationExpires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ); // 7 days

      const userData = {
        name,
        email: email.toLowerCase(),
        phone,
        countryCode,
        role: "staff",
        businessId: business._id,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      };

      if (password) {
        userData.password = password;
        userData.emailVerified = true;
      }

      user = await User.create(userData);

      // Send invitation email ONLY if no password provided
      if (!password) {
        try {
          await sendVerificationEmail(user.email, user.name, verificationToken);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
        }
      }
    }

    // Create staff record
    const staff = await Staff.create({
      userId: user._id,
      businessId: business._id,
      specialization,
      serviceIds: serviceIds || [],
      workingHours: workingHours || business.workingHours,
    });

    const populatedStaff = await Staff.findById(staff._id)
      .populate("userId", "name email phone profilePicture")
      .populate("serviceIds", "name duration price");

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
    const { businessId, isActive } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "businessId is required",
      });
    }

    // Verify access
    if (req.user.businessId?.toString() !== businessId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
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
    const { specialization, serviceIds } = req.body;

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
    if (specialization !== undefined) staff.specialization = specialization;
    if (serviceIds) staff.serviceIds = serviceIds;

    await staff.save();

    const updatedStaff = await Staff.findById(staff._id)
      .populate("userId", "name email phone profilePicture")
      .populate("serviceIds", "name duration price");

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

module.exports = {
  addStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  updateStaffAvailability,
  assignServices,
  removeStaff,
  getStaffSchedule,
};
