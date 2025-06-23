const express = require("express");
const blogRoutes = require("./blog");
const docsRoutes = require("./docs");
const notificationRoutes = require("./notifications");

const router = express.Router();

// External service routes
router.use("/blogs", blogRoutes);
router.use("/docs", docsRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
