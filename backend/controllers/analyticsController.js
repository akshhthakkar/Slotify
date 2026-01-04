const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const { APPOINTMENT_STATUS } = require("../constants/appointmentStatus");

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overview stats for admin dashboard
 * @access  Private (Admin only)
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let businessId = req.user.businessId;
    if (typeof businessId === "object" && businessId?._id) {
      businessId = businessId._id;
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const baseQuery = { businessId, ...dateFilter };
    console.log("Analytics baseQuery:", {
      businessId: String(businessId),
      dateFilter,
    });

    // Parallel aggregation queries
    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      uniqueCustomers,
      revenueResult,
    ] = await Promise.all([
      Appointment.countDocuments(baseQuery),
      Appointment.countDocuments({
        ...baseQuery,
        status: APPOINTMENT_STATUS.COMPLETED,
      }),
      Appointment.countDocuments({
        ...baseQuery,
        status: APPOINTMENT_STATUS.CANCELLED,
      }),
      Appointment.countDocuments({
        ...baseQuery,
        status: APPOINTMENT_STATUS.NO_SHOW,
      }),
      Appointment.distinct("customerId", baseQuery).then((ids) => ids.length),
      Appointment.aggregate([
        { $match: { ...baseQuery, status: APPOINTMENT_STATUS.COMPLETED } },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: "$service" },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$service.price" },
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      success: true,
      stats: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        uniqueCustomers,
        totalRevenue, // In INR (₹)
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/services
 * @desc    Get service performance stats
 * @access  Private (Admin only)
 */
const getServicePerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let businessId = req.user.businessId;
    if (typeof businessId === "object" && businessId?._id) {
      businessId = businessId._id;
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    // Build date filter
    const dateMatch = { businessId };
    if (startDate && endDate) {
      dateMatch.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const serviceStats = await Appointment.aggregate([
      { $match: dateMatch },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $group: {
          _id: "$serviceId",
          serviceName: { $first: "$service.name" },
          servicePrice: { $first: "$service.price" },
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ["$status", APPOINTMENT_STATUS.COMPLETED] }, 1, 0],
            },
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ["$status", APPOINTMENT_STATUS.CANCELLED] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          revenue: { $multiply: ["$completedBookings", "$servicePrice"] },
        },
      },
      { $sort: { revenue: -1, completedBookings: -1 } },
    ]);

    res.json({
      success: true,
      services: serviceStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue breakdown (daily/monthly)
 * @access  Private (Admin only)
 */
const getRevenueBreakdown = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    let businessId = req.user.businessId;
    if (typeof businessId === "object" && businessId?._id) {
      businessId = businessId._id;
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
    }

    // Build date filter
    const dateMatch = { businessId, status: APPOINTMENT_STATUS.COMPLETED };
    if (startDate && endDate) {
      dateMatch.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Date grouping format
    const dateFormat =
      groupBy === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$appointmentDate" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } };

    const revenueData = await Appointment.aggregate([
      { $match: dateMatch },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: "$service.price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      breakdown: revenueData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getServicePerformance,
  getRevenueBreakdown,
};
