const express = require("express");
const {
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
  getPublicBusinessById,
} = require("../controllers/businessController");
const {
  authenticate,
  requireRole,
  optionalAuth,
} = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getAllBusinesses);
router.get("/public/:id", getPublicBusinessById);
router.get("/slug/:slug", getBusinessBySlug);
router.get("/category/:category", getBusinessesByCategory);

// Protected routes
router.post("/", authenticate, createBusiness);
router.get("/:id", authenticate, getBusinessById);
router.put("/:id", authenticate, requireRole("admin"), updateBusiness);
router.post(
  "/:id/images",
  authenticate,
  requireRole("admin"),
  uploadBusinessImages
);
router.put(
  "/:id/hours",
  authenticate,
  requireRole("admin"),
  updateWorkingHours
);
router.put("/:id/holidays", authenticate, requireRole("admin"), updateHolidays);
router.put(
  "/:id/settings",
  authenticate,
  requireRole("admin"),
  updateBookingSettings
);
router.put(
  "/:id/onboarding",
  authenticate,
  requireRole("admin"),
  updateOnboardingStep
);

module.exports = router;
