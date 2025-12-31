const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  updateSettings,
  deleteAccount,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile/photo", uploadProfilePicture);
router.put("/settings", updateSettings);
router.delete("/account", deleteAccount);

module.exports = router;
