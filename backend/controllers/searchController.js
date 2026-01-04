const Business = require("../models/Business");
const Service = require("../models/Service");

/**
 * @route   GET /api/search
 * @desc    Search for businesses and services
 * @access  Public
 */
const searchDiscovery = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        businesses: [],
        services: [],
      });
    }

    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, "i"); // Case-insensitive regex

    // parallel execution
    const [businesses, services] = await Promise.all([
      // 1. Search Businesses
      Business.find({
        $or: [{ name: regex }, { category: regex }, { "address.city": regex }],
        onboardingCompleted: true,
      })
        .select(
          "name category logo coverPhoto address verification rating slug"
        )
        .limit(10),

      // 2. Search Services
      Service.find({
        $or: [{ name: regex }, { category: regex }, { description: regex }],
        isActive: true,
      })
        .populate("businessId", "name logo verification slug")
        .limit(10),
    ]);

    res.json({
      success: true,
      businesses,
      services,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDiscovery,
};
