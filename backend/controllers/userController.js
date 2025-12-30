const User = require("../models/User");
const { isValidEmail, isValidPassword } = require("../utils/validators");

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "businessId",
      "name slug logo coverPhoto"
    );

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, countryCode, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (countryCode) user.countryCode = countryCode;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/profile/photo
 * @desc    Upload profile picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const { uploadImage } = require("../config/cloudinary");

    const uploadResult = await uploadImage(
      image,
      `slotify/users/${req.user._id}/profile`,
      "profile"
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResult.url },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: uploadResult.url,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/settings
 * @desc    Update notification preferences
 * @access  Private
 */
const updateSettings = async (req, res, next) => {
  try {
    const { email, inApp } = req.body.notificationPreferences || {};

    const user = await User.findById(req.user._id);

    if (email !== undefined) {
      user.notificationPreferences.email = email;
    }
    if (inApp !== undefined) {
      user.notificationPreferences.inApp = inApp;
    }

    await user.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
      notificationPreferences: user.notificationPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Verify password
    const user = await User.findById(req.user._id).select("+password");

    if (user.authProvider === "local") {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account",
        });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }

    // Soft delete
    user.isActive = false;
    user.email = `deleted_${user._id}@deleted.com`; // Anonymize
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  updateSettings,
  deleteAccount,
};
