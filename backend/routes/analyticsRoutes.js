const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const {
  getOverviewStats,
  getServicePerformance,
  getRevenueBreakdown,
} = require("../controllers/analyticsController");

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole("admin"));

// @route   GET /api/analytics/overview
router.get("/overview", getOverviewStats);

// @route   GET /api/analytics/services
router.get("/services", getServicePerformance);

// @route   GET /api/analytics/revenue
router.get("/revenue", getRevenueBreakdown);

module.exports = router;
