// Analytics Routes Index
const express = require("express");
const { protect } = require("@middleware/authMiddleware");
const analyticsRoutes = require("./analytics");

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Mount analytics routes
router.use("/", analyticsRoutes);

module.exports = router;
