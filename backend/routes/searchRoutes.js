const express = require("express");
const router = express.Router();
const { searchDiscovery } = require("../controllers/searchController");

// @route   GET /api/search
// @desc    Unified search for businesses and services
// @access  Public
router.get("/", searchDiscovery);

module.exports = router;
