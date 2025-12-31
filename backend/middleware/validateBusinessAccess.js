const Business = require('../models/Business');

/**
 * Validate user has access to business data
 * Prevents cross-business data leakage
 */
const validateBusinessAccess = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.params.id || req.body.businessId || req.query.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    // Customers can view any business (public access)
    if (req.user.role === 'customer') {
      return next();
    }

    // Staff and admin must belong to the business
    if (req.user.role === 'staff' || req.user.role === 'admin') {
      if (!req.user.businessId) {
        return res.status(403).json({
          success: false,
          message: 'User is not associated with any business'
        });
      }

      if (req.user.businessId.toString() !== businessId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own business data.'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate user is admin of the business
 */
const requireBusinessAdmin = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.params.id || req.body.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only business admin can perform this action'
      });
    }

    // Attach business to request for use in controller
    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateBusinessAccess,
  requireBusinessAdmin
};