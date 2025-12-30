const Service = require('../models/Service');
const Business = require('../models/Business');
const Staff = require('../models/Staff');

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Admin only)
 */
const createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      duration,
      price,
      bufferTime,
      staffIds
    } = req.body;

    // Validate required fields
    if (!name || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, duration, and price'
      });
    }

    // Get admin's business
    const business = await Business.findOne({ adminId: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found. Please create a business first.'
      });
    }

    // Create service
    const service = await Service.create({
      businessId: business._id,
      name,
      description,
      category,
      duration,
      price,
      bufferTime: bufferTime || 0,
      staffIds: staffIds || []
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/services
 * @desc    Get services (with optional filters)
 * @access  Public (with optional auth)
 */
const getServices = async (req, res, next) => {
  try {
    const { businessId, category, isActive, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};

    if (businessId) {
      query.businessId = businessId;
    } else if (req.user?.businessId) {
      // If authenticated user with business, show their services
      query.businessId = req.user.businessId;
    }

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // By default, only show active services for public queries
      if (!req.user || req.user.role === 'customer') {
        query.isActive = true;
      }
    }

    const services = await Service.find(query)
      .populate('staffIds', 'name email profilePicture')
      .populate('businessId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Service.countDocuments(query);

    res.json({
      success: true,
      services,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('staffIds', 'name email profilePicture')
      .populate('businessId', 'name slug logo');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Admin only)
 */
const updateService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      duration,
      price,
      bufferTime,
      staffIds
    } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify admin owns this business
    if (service.businessId.toString() !== req.user.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own services.'
      });
    }

    // Update fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (category !== undefined) service.category = category;
    if (duration) service.duration = duration;
    if (price !== undefined) service.price = price;
    if (bufferTime !== undefined) service.bufferTime = bufferTime;
    if (staffIds) service.staffIds = staffIds;

    await service.save();

    const updatedService = await Service.findById(service._id)
      .populate('staffIds', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/services/:id/toggle
 * @desc    Toggle service active status
 * @access  Private (Admin only)
 */
const toggleServiceStatus = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify admin owns this business
    if (service.businessId.toString() !== req.user.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own services.'
      });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (soft delete by deactivating)
 * @access  Private (Admin only)
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify admin owns this business
    if (service.businessId.toString() !== req.user.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own services.'
      });
    }

    // Soft delete by deactivating
    service.isActive = false;
    await service.save();

    // Alternatively, hard delete:
    // await service.deleteOne();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService
};