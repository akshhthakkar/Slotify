const express = require("express");
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  completeAppointment,
  markNoShow,
  createWalkInAppointment,
} = require("../controllers/appointmentController");
const {
  authenticate,
  requireRole,
  requireEmailVerified,
} = require("../middleware/auth");

const router = express.Router();

// Slot viewing requires authentication (logged in users only)
router.get("/available-slots", authenticate, getAvailableSlots);

// Walk-in route (Admin only)
router.post(
  "/walk-in",
  authenticate,
  requireRole("admin"),
  createWalkInAppointment
);

// Protected routes - require authentication AND email verification for booking actions
router.post("/", authenticate, requireEmailVerified, createAppointment);
router.get("/", authenticate, getAppointments);
router.get("/:id", authenticate, getAppointmentById);
router.post(
  "/:id/cancel",
  authenticate,
  requireEmailVerified,
  cancelAppointment
);
router.post(
  "/:id/reschedule",
  authenticate,
  requireEmailVerified,
  rescheduleAppointment
);
router.post(
  "/:id/complete",
  authenticate,
  requireRole("admin", "staff"),
  completeAppointment
);
router.post("/:id/no-show", authenticate, requireRole("admin"), markNoShow);

module.exports = router;
