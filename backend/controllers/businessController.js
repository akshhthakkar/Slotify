const Business = require("../models/Business");
const User = require("../models/User");
const { uploadImage, deleteImage } = require("../config/cloudinary");
const { isValidBusinessHours, isValidUrl } = require("../utils/validators");

/**
 * @route   GET /api/business
 * @desc    Get all businesses (public)
 * @access  Public
 */
const getAllBusinesses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 12,
      isActive = true,
    } = req.query;

    const query = {};

    // Only show active businesses publicly
    if (isActive === "true" || isActive === true) {
      query.isActive = true;
    }

    // Search by name or tagline
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tagline: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    const businesses = await Business.find(query)
      .select(
        "name slug tagline logo coverPhoto category subcategory address isActive"
      )
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const count = await Business.countDocuments(query);

    res.json({
      success: true,
      businesses,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/business
 * @desc    Create new business
 * @access  Private
 */
const createBusiness = async (req, res, next) => {
  try {
    const {
      name,
      tagline,
      description,
      category,
      subcategory,
      contactEmail,
      contactPhone,
      contactCountryCode,
    } = req.body;

    // Validate required fields
    if (!name || !category || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, category, and contact email",
      });
    }

    // Check if user already has a business
    const existingBusiness = await Business.findOne({ adminId: req.user._id });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a business. Each user can only create one business.",
      });
    }

    // Create business
    const business = await Business.create({
      name,
      tagline,
      description,
      category,
      subcategory,
      contactEmail,
      contactPhone,
      contactCountryCode,
      adminId: req.user._id,
      onboardingStep: 1,
    });

    // Update user role to admin
    await User.findByIdAndUpdate(req.user._id, {
      role: "admin",
      businessId: business._id,
    });

    res.status(201).json({
      success: true,
      message: "Business created successfully",
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/business/:id
 * @desc    Get business by ID
 * @access  Private (with business access check)
 */
const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate(
      "adminId",
      "name email profilePicture"
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Check access (admin or staff of this business)
    if (req.user.role === "admin" || req.user.role === "staff") {
      if (req.user.businessId?.toString() !== business._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/business/slug/:slug
 * @desc    Get business by slug (public)
 * @access  Public
 */
const getBusinessBySlug = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("adminId", "name");

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.json({
      success: true,
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/business/:id
 * @desc    Update business
 * @access  Private (Admin only)
 */
const updateBusiness = async (req, res, next) => {
  try {
    const {
      name,
      tagline,
      description,
      subcategory,
      contactEmail,
      contactPhone,
      contactCountryCode,
      website,
      address,
      tags,
    } = req.body;

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update fields
    if (name) business.name = name;
    if (tagline !== undefined) business.tagline = tagline;
    if (description !== undefined) business.description = description;
    if (subcategory !== undefined) business.subcategory = subcategory;
    if (contactEmail) business.contactEmail = contactEmail;
    if (contactPhone !== undefined) business.contactPhone = contactPhone;
    if (contactCountryCode !== undefined)
      business.contactCountryCode = contactCountryCode;
    if (website && isValidUrl(website)) business.website = website;
    if (address) business.address = { ...business.address, ...address };
    if (tags) business.tags = tags;

    await business.save();

    res.json({
      success: true,
      message: "Business updated successfully",
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/business/:id/images
 * @desc    Upload business images
 * @access  Private (Admin only)
 */
const uploadBusinessImages = async (req, res, next) => {
  try {
    const { type, image, caption } = req.body; // type: 'logo', 'cover', 'gallery'

    if (!image || !type) {
      return res.status(400).json({
        success: false,
        message: "Image and type are required",
      });
    }

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    let uploadResult;

    if (type === "logo") {
      uploadResult = await uploadImage(
        image,
        `slotify/businesses/${business._id}/logo`,
        "logo"
      );
      business.logo = uploadResult.url;
    } else if (type === "cover") {
      uploadResult = await uploadImage(
        image,
        `slotify/businesses/${business._id}/cover`,
        "cover"
      );
      business.coverPhoto = uploadResult.url;
    } else if (type === "gallery") {
      uploadResult = await uploadImage(
        image,
        `slotify/businesses/${business._id}/gallery`
      );
      business.photos.push({
        url: uploadResult.url,
        caption: caption || "",
        isPrimary: business.photos.length === 0,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    await business.save();

    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: uploadResult.url,
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/business/:id/hours
 * @desc    Update working hours
 * @access  Private (Admin only)
 */
const updateWorkingHours = async (req, res, next) => {
  try {
    const { workingHours, timeZone } = req.body;

    if (!workingHours) {
      return res.status(400).json({
        success: false,
        message: "Working hours are required",
      });
    }

    // Validate working hours
    const validation = isValidBusinessHours(workingHours);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    business.workingHours = workingHours;
    if (timeZone) business.timeZone = timeZone;

    await business.save();

    res.json({
      success: true,
      message: "Working hours updated successfully",
      workingHours: business.workingHours,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/business/:id/holidays
 * @desc    Update holidays
 * @access  Private (Admin only)
 */
const updateHolidays = async (req, res, next) => {
  try {
    const { holidays } = req.body;

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    business.holidays = holidays;
    await business.save();

    res.json({
      success: true,
      message: "Holidays updated successfully",
      holidays: business.holidays,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/business/:id/settings
 * @desc    Update booking settings
 * @access  Private (Admin only)
 */
const updateBookingSettings = async (req, res, next) => {
  try {
    const { bookingSettings } = req.body;

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    business.bookingSettings = {
      ...business.bookingSettings,
      ...bookingSettings,
    };

    await business.save();

    res.json({
      success: true,
      message: "Booking settings updated successfully",
      bookingSettings: business.bookingSettings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/business/:id/onboarding
 * @desc    Update onboarding step
 * @access  Private (Admin only)
 */
const updateOnboardingStep = async (req, res, next) => {
  try {
    const { step, data } = req.body;

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Verify admin ownership
    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update based on step
    if (data) {
      Object.assign(business, data);
    }

    business.onboardingStep = step;

    if (step >= 6) {
      business.onboardingCompleted = true;
    }

    await business.save();

    res.json({
      success: true,
      message: "Onboarding step updated successfully",
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/business/category/:category
 * @desc    Get businesses by category
 * @access  Public
 */
const getBusinessesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { subcategory, page = 1, limit = 12 } = req.query;

    const query = {
      category,
      isActive: true,
      onboardingCompleted: true,
    };

    if (subcategory) {
      query.subcategory = subcategory;
    }

    const businesses = await Business.find(query)
      .select(
        "name slug tagline logo category subcategory verificationStatus stats"
      )
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Business.countDocuments(query);

    res.json({
      success: true,
      businesses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBusinesses,
  createBusiness,
  getBusinessById,
  getBusinessBySlug,
  updateBusiness,
  uploadBusinessImages,
  updateWorkingHours,
  updateHolidays,
  updateBookingSettings,
  updateOnboardingStep,
  getBusinessesByCategory,
};
